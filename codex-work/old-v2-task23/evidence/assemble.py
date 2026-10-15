"""Authoring helper. Delivered HTML pages run directly, without this script."""
from pathlib import Path
import hashlib

root = Path(__file__).resolve().parent.parent
source = root / 'evidence/implementation'
model = (source / 'model.js').read_text()
css = (source / 'style.css').read_text()
engine = (source / 'engine.js').read_text()
for kind, filename, title in [('house', 'house-plan.html', '공간 설계'), ('site', 'site-sim.html', '대지 시뮬레이션')]:
    head = '<!doctype html>\n<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#285344"><title>청용의 집 · ' + title + '</title><style>' + css + '</style><script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/"}}</script></head>'
    body = (source / f'{kind}-body.html').read_text()
    app = (source / f'{kind}-app.js').read_text()
    document = head + ('<body class="site-body">' if kind == 'site' else '<body>') + body + '<script>' + model + '</script><script>' + app + '</script><script type="module">' + engine + '</script><noscript>이 뷰어를 사용하려면 JavaScript를 켜 주세요.</noscript></body></html>'
    (root / filename).write_text(document)
    print(filename, len(document.encode()), hashlib.sha256(document.encode()).hexdigest())
