const {chromium}=require('/tmp/cheongyong-viewer-qa/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const context=await browser.newContext({viewport:{width:1440,height:1000},ignoreHTTPSErrors:true});
 for(const name of ['house-plan','site-sim']){
  const page=await context.newPage();const errs=[];page.on('pageerror',e=>errs.push(e.message));page.on('console',msg=>{if(msg.type()==='error')errs.push(msg.text())});
  await page.goto('http://127.0.0.1:8768/codex-work/'+name+'.html');
  if(name==='house-plan'){
   await page.waitForFunction(()=>window.HouseApp);await page.screenshot({path:__dirname+'/house-2d-desktop.png',fullPage:true});
   await page.click('#mode3d');await page.waitForFunction(()=>window.HouseApp?.viewer?.house,{timeout:45000});
   await page.waitForTimeout(1200);await page.screenshot({path:__dirname+'/house-3d-desktop.png',fullPage:true});
   console.log('HOUSE',await page.evaluate(()=>({rooms:Design.roomGeometry(HouseApp.state,0).map(r=>[r.name,r.area]),attic:Design.roomGeometry(HouseApp.state,1).map(r=>[r.name,r.area]),info:HouseApp.viewer.renderer.info.render})));
  }else{await page.waitForFunction(()=>window.SiteApp?.viewer?.house,{timeout:45000});await page.waitForTimeout(1300);await page.screenshot({path:__dirname+'/site-current-desktop.png'});await page.click('[data-stage="6"]');await page.waitForTimeout(1000);await page.screenshot({path:__dirname+'/site-completed-desktop.png'});console.log('SITE',await page.evaluate(()=>({stage:SiteApp.stage,info:SiteApp.viewer.renderer.info.render})));}
  console.log('ERRORS',name,errs);await page.close();
 }
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
