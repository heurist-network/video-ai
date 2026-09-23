#!/usr/bin/env python3
"""Serve one study on localhost with video byte ranges and bounded file access."""
import argparse, re
from pathlib import Path
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

class StudyHandler(SimpleHTTPRequestHandler):
    def __init__(self,*args,root,**kwargs):
        self.root=Path(root).resolve();super().__init__(*args,directory=str(self.root),**kwargs)
    def allowed(self):
        p=Path(self.translate_path(self.path)).resolve()
        if not p.is_relative_to(self.root):self.send_error(403);return None
        return p
    def do_HEAD(self):
        if self.allowed() is not None:super().do_HEAD()
    def do_GET(self):
        p=self.allowed()
        if p is None:return
        header=self.headers.get('Range')
        if not header or not p.is_file():return super().do_GET()
        size=p.stat().st_size;m=re.fullmatch(r'bytes=(\d*)-(\d*)',header)
        if not m or not any(m.groups()):return self.bad_range(size)
        if m[1]:start=int(m[1]);end=min(int(m[2]),size-1) if m[2] else size-1
        else:start=max(0,size-int(m[2]));end=size-1
        if start>=size or start>end:return self.bad_range(size)
        self.send_response(206);self.send_header('Content-Type',self.guess_type(str(p)));self.send_header('Content-Range',f'bytes {start}-{end}/{size}');self.send_header('Content-Length',str(end-start+1));self.end_headers()
        try:
            with p.open('rb') as f:
                f.seek(start);left=end-start+1
                while left:
                    b=f.read(min(left,262144))
                    if not b:break
                    self.wfile.write(b);left-=len(b)
        except (BrokenPipeError,ConnectionResetError):pass
    def bad_range(self,size):
        self.send_response(416);self.send_header('Content-Range',f'bytes */{size}');self.send_header('Content-Length','0');self.end_headers()
    def end_headers(self):self.send_header('Accept-Ranges','bytes');super().end_headers()

def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('root',type=Path);p.add_argument('--port',type=int,default=8780);a=p.parse_args();root=a.root.resolve()
    if not (root/'index.html').is_file():p.error('Root must contain the generated study index.html')
    if (root/'.env').exists() or (root/'reference-lab').is_dir():p.error('Serve a study directory, not the repository root')
    server=ThreadingHTTPServer(('127.0.0.1',a.port),lambda *args,**kw:StudyHandler(*args,root=root,**kw))
    print(f'http://127.0.0.1:{a.port}/',flush=True)
    try:server.serve_forever()
    except KeyboardInterrupt:pass
    finally:server.server_close()
if __name__=='__main__':main()
