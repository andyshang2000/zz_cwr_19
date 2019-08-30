import mitmproxy.http
from mitmproxy import ctx, http
import os
from urllib.parse import urlsplit

class Joker:
    downloadDir = 'null'
    
    def request(self, flow: mitmproxy.http.HTTPFlow):
        try:
            if os.path.exists('1.tmp'):
                with open('1.tmp', 'r') as f:
                    self.downloadDir = f.read()
                os.remove('1.tmp')
        except Exception as err:
            return
        if "wd" not in flow.request.query.keys():
            ctx.log.warn("can not get search word from %s" % flow.request.pretty_url)
            return


    def response(self, flow: mitmproxy.http.HTTPFlow):
        flow.response.decode(True)
        ctx.log.info("url:%s" % flow.request.url)
        if flow.response.status_code == 301:
            return
        url = urlsplit(flow.request.url)
        path = url.path[1:]
        try:
            dotIndex = path.rindex('.')
        except Exception as err:
            if path[:-1] == "/":
                path = path + "/index.html"
            else:
                path = path + "index.html"
        dirname = "../resource/" + self.downloadDir + "/" + os.path.dirname(path)
        name = "../resource/" + self.downloadDir + "/"+ path
        isExists = os.path.exists(dirname)        
        ctx.log.info("check:%s" % dirname)
        if not isExists:
            ctx.log.info("make:%s" % dirname)
            os.makedirs(dirname)
        ctx.log.info("saving:%s" % name)
        with open(name, 'wb') as f:
            f.write(flow.response.content)

addons = [
    Joker()
]