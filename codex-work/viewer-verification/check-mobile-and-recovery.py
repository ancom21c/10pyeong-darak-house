from playwright.sync_api import sync_playwright
from pathlib import Path
import json,math

out=Path(__file__).resolve().parent;results=[];errors=[]
def check(name,condition,detail=None):
    results.append({'check':name,'passed':bool(condition),'detail':detail});(out/'qa-tail.json').write_text(json.dumps({'checks':results,'errors':errors},ensure_ascii=False,indent=2))
    print(('PASS ' if condition else 'FAIL ')+name+((' '+str(detail)) if detail is not None else ''),flush=True)
    if not condition:raise AssertionError(name+': '+str(detail))
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage'])
    ctx=browser.new_context(viewport={'width':1440,'height':1000},accept_downloads=True)
    site=ctx.new_page();site.on('pageerror',lambda e:errors.append(str(e)));site.goto('http://127.0.0.1:8774/codex-work/site-sim.html');site.wait_for_function('!!siteApp.app&&!!siteApp.app.model',timeout=45000)
    site.click('#cinematic');print('CINEMA START',site.evaluate('({playing:siteApp.playing,stage:siteApp.stage})'),flush=True)
    try:site.wait_for_function('siteApp.stage!==0',timeout=20000)
    except Exception as e:print('CINEMA TIMEOUT',site.evaluate('({playing:siteApp.playing,stage:siteApp.stage,elapsed:performance.now()-siteApp.app.cinematicTime})'),flush=True)
    state=site.evaluate('({playing:siteApp.playing,stage:siteApp.stage,elapsed:performance.now()-siteApp.app.cinematicTime})')
    check('순항에서 단계 자동 진행',state['playing'] and state['stage']>0,state)
    site.click('#cinematic');check('순항 멈춤',site.evaluate('!siteApp.playing'))
    site.click('#walk');pos=site.evaluate('siteApp.app.camera.position.toArray()');site.keyboard.down('w');site.wait_for_function('siteApp.app.camera.position.x<4.8',timeout=20000);site.keyboard.up('w');newpos=site.evaluate('siteApp.app.camera.position.toArray()');check('현장 1인칭 키보드 이동',math.dist(pos,newpos)>.1,(pos,newpos));site.keyboard.press('Escape');check('현장 1인칭 종료',site.evaluate('!siteApp.app.walk'))
    site.click('#currentStage');site.wait_for_timeout(1400);site.screenshot(path=str(out/'site-current.png'))
    page=ctx.new_page();page.on('pageerror',lambda e:errors.append(str(e)));page.goto('http://127.0.0.1:8774/codex-work/house-plan.html');page.click('[data-room-select="living"]');page.click('[data-finish="concrete"]');page.click('#save');page.wait_for_timeout(400);site.wait_for_function('siteApp.design.finishes.living==="concrete"');check('탭 간 실시간 저장안 반영',site.evaluate('siteApp.design.finishes.living==="concrete"'))
    page.click('[data-view="3d"]');page.wait_for_function('!!houseApp.three',timeout=45000);page.wait_for_timeout(600);page.screenshot(path=str(out/'house-3d.png'));page.click('[data-view="2d"]');page.screenshot(path=str(out/'house-2d.png'))
    check('데스크톱 가로 넘침 없음',page.evaluate('document.documentElement.scrollWidth<=innerWidth') and site.evaluate('document.documentElement.scrollWidth<=innerWidth'))
    page.close();site.close()
    mobile=browser.new_context(viewport={'width':390,'height':844},device_scale_factor=1,is_mobile=True,has_touch=True)
    mp=mobile.new_page();mp.on('pageerror',lambda e:errors.append(str(e)));mp.goto('http://127.0.0.1:8774/codex-work/house-plan.html');mp.wait_for_function('!!window.houseApp')
    check('390px 모바일 평면 가로 넘침 없음',mp.evaluate('document.documentElement.scrollWidth<=innerWidth'))
    mp.locator('[data-floor="attic"]').tap();check('모바일 층 전환',mp.evaluate('houseApp.floor==="attic"'));mp.locator('[data-floor="f1"]').tap()
    rect=mp.locator('#plan').bounding_box();y=min(750,rect['y']+rect['height']*.45);cdp=mobile.new_cdp_session(mp);before=mp.evaluate('document.getElementById("plan").viewBox.baseVal.width')
    cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':140,'y':y,'id':0},{'x':240,'y':y,'id':1}]})
    cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':80,'y':y,'id':0},{'x':300,'y':y,'id':1}]})
    cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]});after=mp.evaluate('document.getElementById("plan").viewBox.baseVal.width');check('모바일 두 손가락 확대',after<before,(before,after));mp.click('#fit');mp.screenshot(path=str(out/'house-mobile.png'),full_page=True)
    mp.goto('http://127.0.0.1:8774/codex-work/site-sim.html');mp.wait_for_function('!!siteApp.app&&!!siteApp.app.model',timeout=45000);check('390px 모바일 현장 가로 넘침 없음',mp.evaluate('document.documentElement.scrollWidth<=innerWidth'));mp.locator('[data-stage="6"]').tap();mp.wait_for_timeout(1500);check('모바일 단계 터치 전환',mp.evaluate('siteApp.stage===6'));mp.screenshot(path=str(out/'site-mobile.png'),full_page=True)
    mp.locator('#walk').tap();check('모바일 1인칭 이동 패드',mp.locator('#walkPad').is_visible());mp.locator('#orbit').tap();mobile.close()
    offline=browser.new_context(viewport={'width':1200,'height':900});offline.route('https://cdn.jsdelivr.net/**',lambda route:route.abort());op=offline.new_page();op.goto('http://127.0.0.1:8774/codex-work/house-plan.html');op.click('[data-view="3d"]');op.wait_for_function('!document.getElementById("threeError").hidden');op.click('#back2d');check('CDN 실패 후 2D 복구',op.evaluate('houseApp.view==="2d"&&document.getElementById("plan").childElementCount>0'));op.goto('http://127.0.0.1:8774/codex-work/site-sim.html');op.wait_for_function('!document.getElementById("siteError").hidden');check('CDN 실패 현장 안내',op.locator('#retry').is_visible());offline.close()
    check('최종 자바스크립트 실행 오류 없음',not errors,errors);browser.close()
print('TAIL ALL',len(results),'checks passed',flush=True)
