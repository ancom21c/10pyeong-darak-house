from http.server import ThreadingHTTPServer,BaseHTTPRequestHandler
from pathlib import Path
from urllib.parse import unquote,urlsplit
import mimetypes

base=Path(__file__).resolve().parent.parent
class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        rel=unquote(urlsplit(self.path).path).lstrip('/')
        if rel=='':
            self.send_response(302);self.send_header('Location','/codex-work/house-plan.html');self.end_headers();return
        if rel in ['codex-work/house-plan.html','codex-work/site-sim.html'] or rel.startswith('intels/'):
            p=(base/rel).resolve()
            if (rel.startswith('intels/') and not p.is_relative_to(base/'intels')) or not p.is_file():
                self.send_error(404);return
            data=p.read_bytes();self.send_response(200);self.send_header('Content-Type',mimetypes.guess_type(str(p))[0] or 'application/octet-stream');self.send_header('Content-Length',str(len(data)));self.end_headers();self.wfile.write(data)
        else:self.send_error(404)
    def log_message(self,*a):pass
ThreadingHTTPServer(('127.0.0.1',8774),Handler).serve_forever()
