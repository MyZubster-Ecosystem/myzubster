import importlib.util
import pathlib
import unittest
from unittest.mock import patch
from urllib import error

spec = importlib.util.spec_from_file_location('agent', pathlib.Path(__file__).with_name('agent.py'))
agent = importlib.util.module_from_spec(spec)
spec.loader.exec_module(agent)
BRIDGE = 'https://bridge.example.test'
LOCAL = 'http://127.0.0.1:5000'
TOKEN = 'synthetic-test-token'

class AgentTests(unittest.TestCase):
    def job(self, **values):
        return dict({'id': 'job-1', 'lease_id': 'lease-1', 'action': 'gallery'}, **values)

    def execute(self, response, job=None):
        with patch.object(agent, 'exchange', side_effect=[{'request': job or self.job()}, response, {}]) as ex:
            self.assertTrue(agent.run_once(BRIDGE, TOKEN, LOCAL))
            self.assertNotIn('token', str(ex.call_args_list[1]))
            sent = ex.call_args_list[-1].args[1]
            self.assertEqual(sent['id'], 'job-1')
            self.assertEqual(sent['lease_id'], 'lease-1')
            self.assertEqual(ex.call_args_list[-1].args[2], TOKEN)
            return sent['result']

    def test_four_gallery_titles(self):
        data = {'sources': [{'title': str(i), 'private': 'do not forward'} for i in range(4)]}
        self.assertEqual(self.execute(data), {'action': 'gallery', 'titles': ['0', '1', '2', '3']})

    def test_gallery_bounded(self):
        self.assertEqual(len(self.execute({'sources': [{'title': str(i)} for i in range(10)]})['titles']), 4)

    def test_detail_fourth_and_filter(self):
        result = self.execute({'sources': [{'title': 'x' * 200, 'url': 'private'}]}, self.job(action='detail', comic_id='n4k48-comic-004'))
        self.assertEqual(result, {'action': 'detail', 'titles': ['x' * 140]})

    def test_empty_sources_is_valid(self):
        self.assertEqual(self.execute({'sources': []}), {'action': 'gallery', 'titles': []})

    def test_malformed_catalog(self):
        for data in [None, [], {}, {'sources': None}, {'sources': {}}, {'sources': [None]}, {'sources': [{}]}, {'sources': [{'title': 42}]}, {'sources': [{'title': ' '}]}, {'sources': [{'title': 'valid'}, {}]}]:
            with self.subTest(data=data):
                self.assertEqual(self.execute(data), {'action': 'gallery', 'error': 'invalid catalog response'})

    def test_local_network_errors_report_result(self):
        for exc in [TimeoutError('private'), error.URLError('private'), error.HTTPError(LOCAL, 500, 'private', {}, None), OSError('private')]:
            with self.subTest(exc=type(exc).__name__):
                self.assertEqual(self.execute(exc), {'action': 'gallery', 'error': 'local catalog unavailable'})

    def test_local_invalid_json_reports_result(self):
        self.assertEqual(self.execute(ValueError('private')), {'action': 'gallery', 'error': 'invalid catalog response'})

    def test_bad_jobs_never_query_catalog(self):
        for job in [None, [], {}, {'id': 'job-1', 'action': 'gallery'}, {'id': None, 'lease_id': 'lease-1'}, {'id': 'job-1', 'lease_id': ''}, {'id': 'job-1', 'lease_id': []}]:
            with self.subTest(job=job), patch.object(agent, 'exchange', return_value={'request': job}) as ex:
                self.assertFalse(agent.run_once(BRIDGE, TOKEN, LOCAL))
                self.assertEqual(ex.call_count, 1)

    def test_malformed_poll_envelope(self):
        for reply in [None, [], {}, {'request': 'wrong'}]:
            with self.subTest(reply=reply), patch.object(agent, 'exchange', return_value=reply):
                self.assertFalse(agent.run_once(BRIDGE, TOKEN, LOCAL))

    def test_disallowed_actions_report_without_catalog(self):
        for action in ['delete', None, [], {}]:
            with self.subTest(action=action), patch.object(agent, 'exchange', side_effect=[{'request': self.job(action=action)}, {}]) as ex:
                self.assertTrue(agent.run_once(BRIDGE, TOKEN, LOCAL))
                self.assertEqual(ex.call_count, 2)
                self.assertEqual(ex.call_args.args[1]['result'], {'error': 'invalid job'})

    def test_invalid_comic_ids_never_query_catalog(self):
        for comic_id in [None, [], 'other', 'n4k48-comic-', 'n4k48-comic-../secret']:
            with self.subTest(comic_id=comic_id), patch.object(agent, 'exchange', side_effect=[{'request': self.job(action='detail', comic_id=comic_id)}, {}]) as ex:
                self.assertTrue(agent.run_once(BRIDGE, TOKEN, LOCAL))
                self.assertEqual(ex.call_count, 2)
                self.assertEqual(ex.call_args.args[1]['result'], {'action': 'detail', 'error': 'invalid job'})

    def test_poll_recovers_after_transport_and_json_errors(self):
        for exc in [TimeoutError(), error.URLError('offline'), ValueError('bad json')]:
            with self.subTest(exc=type(exc).__name__), patch.object(agent, 'exchange', side_effect=[exc, {'request': None}]):
                self.assertFalse(agent.poll_once(BRIDGE, TOKEN, LOCAL))
                self.assertFalse(agent.poll_once(BRIDGE, TOKEN, LOCAL))

    def test_result_transport_failure_not_marked_success(self):
        with patch.object(agent, 'exchange', side_effect=[{'request': self.job()}, {'sources': []}, TimeoutError()]):
            self.assertFalse(agent.poll_once(BRIDGE, TOKEN, LOCAL))

if __name__ == '__main__':
    unittest.main()
