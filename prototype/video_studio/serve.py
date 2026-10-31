"""Serves ../dist with an SPA fallback on a non-localhost name (tv.test), so the app shows no design-study frame."""
import functools,http.server,os,sys,threading
class H(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a):pass
    def send_head(self):
        if not os.path.exists(self.translate_path(self.path.split('?')[0])):self.path='/index.html'
        return super().send_head()
def start(dist):
    srv=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(H,directory=dist));threading.Thread(target=srv.serve_forever,daemon=True).start()
    return srv.server_address[1]
