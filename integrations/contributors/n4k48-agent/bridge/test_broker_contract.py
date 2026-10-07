import importlib.util
import json
import pathlib
import threading
import urllib.error
import urllib.request
import unittest

spec = importlib.util.spec_from_file_location(
    "broker",
    pathlib.Path(__file__).with_name("broker.py")
)
broker = importlib.util.module_from_spec(spec)
spec.loader.exec_module(broker)

NODE_TOKEN = "n" * 40
ADMIN_TOKEN = "a" * 40


class BrokerContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = broker.create_server(
            "127.0.0.1", 0,
            node_token=NODE_TOKEN,
            admin_token=ADMIN_TOKEN
        )
        cls.port = cls.server.server_address[1]
        cls.base = f"http://127.0.0.1:{cls.port}"
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()

    def request(self, method, path, token=None, payload=None):
        data = None
        headers = {}
        if token:
            headers["Authorization"] = f"Bearer {token}"
        if payload is not None:
            data = json.dumps(payload).encode()
            headers["Content-Type"] = "application/json"
        req = urllib.request.Request(self.base + path, data=data, headers=headers, method=method)
        try:
            with urllib.request.urlopen(req, timeout=2) as r:
                return r.status, json.load(r)
        except urllib.error.HTTPError as e:
            return e.code, json.load(e)

    def create_gallery(self):
        status, body = self.request("POST", "/admin/request", ADMIN_TOKEN, {"action": "gallery"})
        self.assertEqual(status, 202)
        return body["id"]

    def lease(self):
        status, body = self.request("GET", "/node/next", NODE_TOKEN)
        self.assertEqual(status, 200)
        self.assertIsNotNone(body["request"])
        return body["request"]

    def submit(self, job_id, lease_id, result):
        return self.request(
            "POST", "/node/result", NODE_TOKEN,
            {"id": job_id, "lease_id": lease_id, "result": result}
        )

    def test_four_titles_contract(self):
        job_id = self.create_gallery()
        job = self.lease()
        status, body = self.submit(job_id, job["lease_id"], {
            "action": "gallery",
            "titles": ["one", "two", "three", "four"],
        })
        self.assertEqual(status, 200, f"{status} {body}")

    def test_five_titles_rejected(self):
        job_id = self.create_gallery()
        job = self.lease()
        status, body = self.submit(job_id, job["lease_id"], {
            "action": "gallery",
            "titles": ["1", "2", "3", "4", "5"],
        })
        self.assertEqual(status, 400)
        self.assertEqual(body, {"error": "invalid titles"})

    def test_invalid_catalog_error_contract(self):
        job_id = self.create_gallery()
        job = self.lease()
        status, body = self.submit(job_id, job["lease_id"], {
            "action": "gallery",
            "error": "invalid catalog response",
        })
        self.assertEqual(status, 200, f"{status} {body}")

    def test_local_catalog_unavailable_error_accepted(self):
        job_id = self.create_gallery()
        job = self.lease()
        status, body = self.submit(job_id, job["lease_id"], {
            "action": "gallery",
            "error": "local catalog unavailable",
        })
        self.assertEqual(status, 200)
        self.assertEqual(body, {"accepted": True})

    def test_invalid_job_error_accepted(self):
        job_id = self.create_gallery()
        job = self.lease()
        status, body = self.submit(job_id, job["lease_id"], {
            "action": "gallery",
            "error": "invalid job",
        })
        self.assertEqual(status, 200)
        self.assertEqual(body, {"accepted": True})

    def test_arbitrary_error_rejected(self):
        job_id = self.create_gallery()
        job = self.lease()
        status, body = self.submit(job_id, job["lease_id"], {
            "action": "gallery",
            "error": "private internal exception",
        })
        self.assertEqual(status, 400)
        self.assertEqual(body, {"error": "invalid error"})

    def test_action_mismatch_rejected(self):
        job_id = self.create_gallery()
        job = self.lease()
        status, body = self.submit(job_id, job["lease_id"], {
            "action": "detail",
            "titles": ["x"],
        })
        self.assertEqual(status, 400)
        self.assertEqual(body, {"error": "action mismatch"})

    def test_expired_job_rejected(self):
        job_id = self.create_gallery()
        job = self.lease()
        with self.server.state.lock:
            self.server.state.jobs[job_id]["expiry"] = 0
        status, body = self.submit(job_id, job["lease_id"], {
            "action": "gallery",
            "titles": [],
        })
        self.assertEqual(status, 409)
        self.assertEqual(body, {"error": "invalid or expired lease"})

    def test_node_next_requires_auth(self):
        status, body = self.request("GET", "/node/next")
        self.assertEqual(status, 401)
        self.assertEqual(body, {"error": "unauthorized"})

    def test_node_result_requires_auth(self):
        status, body = self.request(
            "POST", "/node/result",
            payload={
                "id": "fake",
                "lease_id": "0" * 32,
                "result": {"action": "gallery", "titles": []},
            },
        )
        self.assertEqual(status, 401)
        self.assertEqual(body, {"error": "unauthorized"})

    def test_reassignment_invalidates_old_lease(self):
        job_id = self.create_gallery()
        first = self.lease()
        with self.server.state.lock:
            self.server.state.jobs[job_id]["lease"] = 0
        second = self.lease()
        self.assertNotEqual(first["lease_id"], second["lease_id"])
        old_status, _ = self.submit(
            job_id, first["lease_id"], {"action": "gallery", "titles": []}
        )
        self.assertEqual(old_status, 409)
        new_status, body = self.submit(
            job_id, second["lease_id"], {"action": "gallery", "titles": []}
        )
        self.assertEqual(new_status, 200, f"{new_status} {body}")


if __name__ == "__main__":
    unittest.main(verbosity=2)
