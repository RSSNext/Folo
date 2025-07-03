from mitmproxy import http

def request(flow: http.HTTPFlow) -> None:
    if flow.request.pretty_host == "app.folo.is":
        flow.request.host = "localhost"
        flow.request.port = 2233