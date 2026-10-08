"""In-memory, single-instance read-only pilot bridge; reverse-proxy HTTPS required."""
import hmac
import json
import os
import secrets
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse

TTL = 60


def valid_token(actual, expected):
    return bool(actual and expected and hmac.compare_digest(actual, expected))


class State:
    def __init__(self):
        self.lock = threading.RLock()
        self.jobs = {}
        self.last_seen = 0


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *_args):
        pass

    def reply(self, status, data):
        raw = json.dumps(data, separators=(',', ':')).encode()
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Cache-Control', 'no-store')
        self.send_header('Content-Length', str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def auth(self, role):
        expected = self.server.node_token if role == 'node' else self.server.admin_token
        value = self.headers.get('Authorization', '')
        return valid_token(value[7:] if value.startswith('Bearer ') else '', expected)

    def body(self):
        try:
            n = int(self.headers.get('Content-Length', '0'))
            if not 2 <= n <= 4096:
                return None
            obj = json.loads(self.rfile.read(n))
            return obj if isinstance(obj, dict) else None
        except (ValueError, UnicodeDecodeError):
            return None

    def do_GET(self):
        path = urlparse(self.path).path
        if path == '/healthz':
            return self.reply(200, {'status': 'ok', 'pilot': True})
        if path == '/node/next':
            if not self.auth('node'):
                return self.reply(401, {'error': 'unauthorized'})
            with self.server.state.lock:
                self.server.state.last_seen = time.time()
                now = time.time()
                for job in self.server.state.jobs.values():
                    if job['expiry'] > now and (job['state'] == 'queued' or job['state'] == 'leased' and job['lease'] < now):
                        job['state'] = 'leased'
                        job['lease'] = now + 15
                        job['lease_id'] = secrets.token_hex(16)
                        return self.reply(200, {'request': {'id': job['id'], 'action': job['action'], 'comic_id': job['comic_id'], 'lease_id': job['lease_id']}})
            return self.reply(200, {'request': None})
        if path == '/admin/status':
            if not self.auth('admin'):
                return self.reply(401, {'error': 'unauthorized'})
            with self.server.state.lock:
                now = time.time()
                pending = sum(job['expiry'] > now and job['state'] != 'done' for job in self.server.state.jobs.values())
                return self.reply(200, {'node_id': 'n4k48-pilot', 'online': now - self.server.state.last_seen < 45, 'pending': pending})
        if path.startswith('/admin/result/'):
            if not self.auth('admin'):
                return self.reply(401, {'error': 'unauthorized'})
            with self.server.state.lock:
                job = self.server.state.jobs.get(path.rsplit('/', 1)[-1])
                if not job:
                    return self.reply(404, {'error': 'unknown'})
                if job['expiry'] < time.time():
                    return self.reply(410, {'error': 'expired'})
                return self.reply(200, {'state': job['state'], 'result': job.get('result')})
        return self.reply(404, {'error': 'not found'})

    def do_POST(self):
        path = urlparse(self.path).path
        if path == '/admin/request':
            if not self.auth('admin'):
                return self.reply(401, {'error': 'unauthorized'})
            body = self.body()
            if not body or set(body) - {'action', 'comic_id'} or body.get('action') not in ('gallery', 'detail'):
                return self.reply(400, {'error': 'invalid request'})
            comic_id = body.get('comic_id')
            if body['action'] == 'gallery' and comic_id is not None:
                return self.reply(400, {'error': 'invalid comic_id'})
            if body['action'] == 'detail' and (not isinstance(comic_id, str) or not comic_id.startswith('n4k48-comic-') or len(comic_id) > 40 or not comic_id.removeprefix('n4k48-comic-').isalnum()):
                return self.reply(400, {'error': 'invalid comic_id'})
            with self.server.state.lock:
                now = time.time()
                if sum(j['expiry'] > now and j['state'] != 'done' for j in self.server.state.jobs.values()) >= 5:
                    return self.reply(429, {'error': 'queue full'})
                key = secrets.token_hex(12)
                self.server.state.jobs[key] = {'id': key, 'action': body['action'], 'comic_id': comic_id, 'state': 'queued', 'expiry': now + TTL}
            return self.reply(202, {'id': key, 'expires_in_seconds': TTL})
        if path == '/node/result':
            if not self.auth('node'):
                return self.reply(401, {'error': 'unauthorized'})
            body = self.body()
            if (not body or set(body) != {'id', 'lease_id', 'result'}
                    or not isinstance(body['id'], str)
                    or not isinstance(body['lease_id'], str)
                    or len(body['lease_id']) != 32
                    or any(c not in '0123456789abcdef' for c in body['lease_id'])):
                return self.reply(400, {'error': 'invalid result'})
            result = body['result']
            if not isinstance(result, dict) or set(result) - {'action', 'titles', 'error'}:
                return self.reply(400, {'error': 'invalid result'})
            if 'titles' in result and (
                    not isinstance(result['titles'], list)
                    or len(result['titles']) > 4
                    or any(not isinstance(t, str) or len(t) > 140 for t in result['titles'])):
                return self.reply(400, {'error': 'invalid titles'})
            if 'error' in result and (
                    not isinstance(result['error'], str)
                    or result['error'] not in (
                        'local catalog unavailable',
                        'invalid catalog response',
                        'invalid job',
                    )):
                return self.reply(400, {'error': 'invalid error'})
            with self.server.state.lock:
                job = self.server.state.jobs.get(body['id'])
                now = time.time()
                if (not job or job['expiry'] <= now
                        or job['state'] != 'leased'
                        or job.get('lease', 0) <= now
                        or not hmac.compare_digest(body['lease_id'], job.get('lease_id', ''))):
                    return self.reply(409, {'error': 'invalid or expired lease'})
                if result.get('action') != job['action']:
                    return self.reply(400, {'error': 'action mismatch'})
                job['state'] = 'done'
                job['result'] = result
            return self.reply(200, {'accepted': True})
        return self.reply(404, {'error': 'not found'})


def create_server(host='127.0.0.1', port=8092, node_token=None, admin_token=None):
    node = node_token or os.environ.get('BRIDGE_NODE_TOKEN')
    admin = admin_token or os.environ.get('BRIDGE_ADMIN_TOKEN')
    if not node or not admin or node == admin or min(len(node), len(admin)) < 32:
        raise ValueError('Two distinct random tokens of at least 32 characters are required')
    srv = ThreadingHTTPServer((host, port), Handler)
    srv.node_token = node
    srv.admin_token = admin
    srv.state = State()
    return srv


if __name__ == '__main__':
    create_server('0.0.0.0', int(os.environ.get('BRIDGE_PORT', '8092'))).serve_forever()
