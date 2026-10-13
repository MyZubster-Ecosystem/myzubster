#!/usr/bin/env python3
"""Lightweight mock upstream HTTP server for MyZubster Tor Onion Access PoC."""

import json
import sys
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, HTTPServer


class UpstreamHandler(BaseHTTPRequestHandler):
    """Handles health check, root, and header dumping requests."""

    def log_message(self, format, *args):
        sys.stdout.write(f"[{self.log_date_time_string()}] {self.address_string()} - {format % args}\n")
        sys.stdout.flush()

    def do_GET(self):
        parsed_path = self.path.split("?")[0]
        if parsed_path in ("/", "/health", "/healthz"):
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("X-Powered-By", "MockFramework/1.0")
            self.end_headers()
            payload = {
                "status": "ok",
                "service": "myzubster-upstream",
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
            self.wfile.write(json.dumps(payload, indent=2).encode("utf-8"))
        elif parsed_path == "/dump-headers":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            headers_dict = {k: v for k, v in self.headers.items()}
            self.wfile.write(json.dumps(headers_dict, indent=2).encode("utf-8"))
        else:
            self.send_response(404)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"error": "Not Found"}).encode("utf-8"))


def run(server_class=HTTPServer, handler_class=UpstreamHandler, port=8080):
    server_address = ("0.0.0.0", port)
    httpd = server_class(server_address, handler_class)
    print(f"Mock upstream server running on port {port}...")
    sys.stdout.flush()
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        httpd.server_close()


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
    run(port=port)
