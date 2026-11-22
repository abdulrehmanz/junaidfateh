#!/usr/bin/env python3
"""Preview the built website without installing anything.

Usage (from the junaidfateh folder):
    python3 scripts/preview.py

Then open the address it prints. It serves the ready-made pages in _site/ under the
same path the live site uses (pathPrefix in src/_data/site.yml), so every link,
image and style works exactly as it will online.

To see edits you make in src/, rebuild first with:  npm run build
"""
import http.server
import os
import re
import socketserver
import sys
import webbrowser
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / "_site"
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8080

match = re.search(r'^pathPrefix:\s*"?([^"\n#]+)"?', (ROOT / "src/_data/site.yml").read_text(), re.M)
PREFIX = "/" + (match.group(1).strip().strip("/") if match else "") + "/"
PREFIX = PREFIX.replace("//", "/")


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(SITE), **kwargs)

    def do_GET(self):
        if PREFIX != "/":
            if self.path in ("/", ""):
                self.send_response(302)
                self.send_header("Location", PREFIX)
                self.end_headers()
                return
            if not self.path.startswith(PREFIX):
                self.send_error(404)
                return
            self.path = "/" + self.path[len(PREFIX):]
        super().do_GET()

    def send_error(self, code, message=None, explain=None):
        page = SITE / "404.html"
        if code == 404 and page.exists():
            body = page.read_bytes()
            self.send_response(404)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        super().send_error(code, message, explain)

    def log_message(self, *args):
        pass


if not SITE.exists():
    sys.exit("The _site folder is missing. Build the site first with:  npm install && npm run build")

url = f"http://localhost:{PORT}{PREFIX}"
socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"Website preview running at {url}  (press Ctrl+C to stop)")
    if os.environ.get("NO_BROWSER") != "1":
        try:
            webbrowser.open(url)
        except Exception:
            pass
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")
