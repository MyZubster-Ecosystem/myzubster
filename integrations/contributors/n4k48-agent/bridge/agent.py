"""Nicola-side opt-in outbound-only catalog agent. Do not run before consent."""
import json
import os
import time
from urllib import request, error

# Bounded pilot gallery: four current tables; detail returns one title.
GALLERY_LIMIT = 4
NETWORK_ERRORS = (error.HTTPError, error.URLError, TimeoutError, OSError)


def exchange(url, payload=None, token=None):
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = 'Bearer ' + token
    req = request.Request(url, headers=headers, data=json.dumps(payload).encode() if payload is not None else None)
    with request.urlopen(req, timeout=8) as response:
        return json.load(response)


def _identifier(value):
    return isinstance(value, str) and bool(value.strip())


def _payload(job):
    action = job.get('action')
    if action not in ('gallery', 'detail'):
        raise ValueError('unapproved action')
    payload = {'question': 'Read-only pilot catalog', 'action': action}
    if action == 'detail':
        comic_id = job.get('comic_id')
        if not isinstance(comic_id, str) or not comic_id.startswith('n4k48-comic-') or not comic_id.removeprefix('n4k48-comic-').isalnum():
            raise ValueError('invalid comic id')
        payload['comic_id'] = comic_id
    return payload


def _result(data, action):
    if not isinstance(data, dict) or not isinstance(data.get('sources'), list):
        raise ValueError('invalid catalog response')
    sources = data['sources']
    if any(not isinstance(entry, dict) or not isinstance(entry.get('title'), str) or not entry['title'].strip() for entry in sources):
        raise ValueError('invalid catalog source')
    limit = GALLERY_LIMIT if action == 'gallery' else 1
    return {'action': action, 'titles': [entry['title'][:140] for entry in sources[:limit]]}


def run_once(bridge, token, local='http://127.0.0.1:5000'):
    reply = exchange(bridge + '/node/next', token=token)
    if not isinstance(reply, dict):
        return False
    job = reply.get('request')
    # No catalog request without fields that safely correlate the broker result.
    if not isinstance(job, dict) or not _identifier(job.get('id')) or not _identifier(job.get('lease_id')):
        return False
    action = job.get('action')
    try:
        payload = _payload(job)
    except (ValueError, TypeError):
        result = {'error': 'invalid job'}
        if action in ('gallery', 'detail'):
            result['action'] = action
    else:
        try:
            result = _result(exchange(local + '/api/zorgax/ask', payload=payload), action)
        except NETWORK_ERRORS:
            result = {'action': action, 'error': 'local catalog unavailable'}
        except (ValueError, TypeError, KeyError):
            result = {'action': action, 'error': 'invalid catalog response'}
    exchange(bridge + '/node/result', {'id': job['id'], 'lease_id': job['lease_id'], 'result': result}, token)
    return True


def poll_once(bridge, token, local):
    """Keep transient transport/JSON failures from stopping the polling loop."""
    try:
        return run_once(bridge, token, local)
    except NETWORK_ERRORS + (ValueError, TypeError, KeyError):
        # Do not blindly retry a result. Lease expiry/reassignment and stale
        # result rejection belong to the broker and require a separate test.
        return False


if __name__ == '__main__':
    bridge = os.environ['BRIDGE_URL'].rstrip('/')
    if not bridge.startswith('https://') and not (os.environ.get('ALLOW_LOOPBACK_TEST') == 'true' and bridge.startswith('http://127.0.0.1:')):
        raise ValueError('HTTPS required except explicit local tests')
    token = os.environ['BRIDGE_NODE_TOKEN']
    if not token.strip():
        raise ValueError('node token required')
    while True:
        poll_once(bridge, token, os.environ.get('LOCAL_CATALOG_API', 'http://127.0.0.1:5000').rstrip('/'))
        time.sleep(5)
