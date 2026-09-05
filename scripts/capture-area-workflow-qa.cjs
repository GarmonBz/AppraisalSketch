const {chromium}=require('playwright');
const path=require('node:path');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const page=await browser.newPage({viewport:{width:1500,height:1050}});
 await page.goto(pathToFileURL());
 await page.waitForFunction(()=>window.app?.areaWorkflow);
 // seed: draw two rectangles, one defined
 await page.evaluate(()=>{app.setMode('draw-exterior');for(const p of [{x:0,y:0},{x:20,y:0},{x:20,y:15},{x:0,y:15},{x:0,y:0}])app.handleCanvasClick(p);});
 await page.evaluate(()=>{app.state.pendingShape={kind:'rectangle',width:10,depth:10,rotation:0,defineAsArea:true};app.placeShapeAt({x:30,y:0});app.centerAndFit();});
 await page.evaluate(()=>{app.state.pendingShape={kind:'rectangle',width:8,depth:12,rotation:0,defineAsArea:true};app.placeShapeAt({x:55,y:0});app.centerAndFit();});
 // define the first via the workflow so the list has a real row
 await page.evaluate(()=>{app.areaWorkflow.activate();});
 await clickPoly(0);
 await page.locator('#area-definition-code').selectOption('GLA1');
 await page.locator('#area-definition-name').fill('Main level');
 await page.locator('#area-definition-chooser [type=submit]').click();
 // dark chooser open
 await clickPoly(1);
 await page.waitForSelector('#area-definition-chooser');
 await page.screenshot({path:root('docs/qa-area-workflow-chooser-dark.png')});
 // light theme
 await page.evaluate(()=>document.body.classList.remove('dark-theme','light-theme','blue-theme'));
 await page.evaluate(()=>document.body.classList.add('light-theme'));
 await page.waitForTimeout(300);
 await page.screenshot({path:root('docs/qa-area-workflow-chooser-light.png')});
 await page.evaluate(()=>document.body.classList.remove('light-theme'));
 await page.evaluate(()=>document.body.classList.add('dark-theme'));
 // dismiss chooser, open area list state in sidebar
 await page.keyboard.press('Escape');
 await page.waitForTimeout(200);
 await page.locator('#sidebar-dock').screenshot({path:root('docs/qa-area-workflow-sidebar-list.png')});
 // narrow viewport (owner DPI case) — open via the area list row; canvas is too small to click
 await page.setViewportSize({width:500,height:850});
 await page.waitForTimeout(300);
 await page.locator('.area-workflow-row').first().click();
 await page.waitForSelector('#area-definition-chooser');
 await page.waitForTimeout(300);
 await page.screenshot({path:root('docs/qa-area-workflow-chooser-500.png')});
 await browser.close();
 console.log('CAPTURES DONE');

 async function clickPoly(i){
  const pos=await page.evaluate((i)=>{
    const poly=app.state.polygons[i];
    let sx=0,sy=0,n=0;
    for(const e of (poly.edges||[])){for(const pt of (e.points||e.pts||[e.start,e.end]).filter(Boolean)){sx+=pt.x;sy+=pt.y;n++;}}
    if(!n){const b=poly.bounds||poly;const cx=((b.minX??b.x??0)+(b.maxX??0))/2;const cy=((b.minY??b.y??0)+(b.maxY??0))/2;return toScreen(cx,cy);}
    return toScreen(sx/n,sy/n);
    function toScreen(x,y){const p=Geometry.toScreen({x,y},app.state.pan,app.state.zoom),r=document.getElementById('sketchCanvas').getBoundingClientRect();return{x:r.left+p.x,y:r.top+p.y};}
  },i);
  await page.mouse.click(pos.x,pos.y);
 }
 function pathToFileURL(){return 'file:///'+path.resolve(__dirname,'../sketch.bundle.html').replace(/\\/g,'/').replace(/ /g,'%20');}
 function root(p){return path.resolve(__dirname,'..',p);}
})().catch(e=>{console.error(e);process.exit(1)});
