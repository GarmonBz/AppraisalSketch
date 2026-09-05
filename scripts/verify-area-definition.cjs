const {chromium}=require('playwright');
const assert=require('node:assert/strict'),path=require('node:path');
const {pathToFileURL}=require('node:url');
(async()=>{const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'msedge',headless:true});try{
 const page=await browser.newPage({viewport:{width:1500,height:1050}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(path.resolve(__dirname,'../sketch.bundle.html')).href);await page.waitForFunction(()=>window.app?.areaWorkflow);
 assert.equal(await page.locator('#area-definition-chooser').count(),0);
 // Drawing uses the original pen/closure path and must never open a chooser.
 await page.evaluate(()=>{app.setMode('draw-exterior');for(const p of [{x:0,y:0},{x:20,y:0},{x:20,y:15},{x:0,y:15},{x:0,y:0}])app.handleCanvasClick(p);});
 assert.equal(await page.locator('#area-definition-chooser').count(),0);
 assert.equal(await page.evaluate(()=>app.state.polygons[0].type),'UND');
 await page.evaluate(()=>{app.state.pendingShape={kind:'rectangle',width:10,depth:10,rotation:0,defineAsArea:true};app.placeShapeAt({x:30,y:0});app.centerAndFit();});
 function differences(a,b,p=''){if(p==='.savedAt'||JSON.stringify(a)===JSON.stringify(b))return [];if(!a||!b||typeof a!=='object'||typeof b!=='object')return [p+': '+JSON.stringify(a)+' -> '+JSON.stringify(b)];return [...new Set([...Object.keys(a),...Object.keys(b)])].flatMap(k=>differences(a[k],b[k],p+'.'+k));}
 async function clickRegion(x=5,y=5){const pos=await page.evaluate(({x,y})=>{const p=Geometry.toScreen({x,y},app.state.pan,app.state.zoom),r=document.getElementById('sketchCanvas').getBoundingClientRect();return{x:r.left+p.x,y:r.top+p.y};},{x,y});await page.mouse.click(pos.x,pos.y);}
 await page.locator('#area-define-mode').click();const initial=await page.evaluate(()=>app.buildSaveModel());await clickRegion();await page.waitForSelector('#area-definition-chooser');
 await page.locator('#area-definition-name').fill('Canceled name');await page.locator('[data-cancel]').click();
 assert.deepEqual(differences(initial,await page.evaluate(()=>app.buildSaveModel())),[],'Cancel changed persisted data');
 await clickRegion();await page.locator('#area-definition-code').selectOption('GLA1');await page.locator('#area-definition-name').fill('Main level');await page.locator('[name=repeat]').check();await page.locator('#area-definition-chooser [type=submit]').click();
 assert.equal(await page.evaluate(()=>app.state.polygons[0].type),'GLA1');assert.equal(await page.evaluate(()=>app.state.polygons[1].type),'UND');
 assert.equal(await page.evaluate(()=>app.areaTotals.totalGLA),300);await page.waitForFunction(()=>document.querySelector('.area-workflow-list').textContent.includes('Main level'));
 await page.evaluate(()=>app.undo());assert.equal(await page.evaluate(()=>app.state.polygons[0].type),'UND');await page.evaluate(()=>app.redo());assert.equal(await page.evaluate(()=>app.state.polygons[0].type),'GLA1');
 await clickRegion(35,5);assert.equal(await page.locator('#area-definition-code').inputValue(),'GLA1');await page.locator('[data-cancel]').click();
 await page.evaluate(()=>{app.areaCodes.push({code:'TESTX',name:'Custom workshop',description:'Custom',group:'My group',multiplier:1,positive:true,includeInGLA:false});});
 await clickRegion(35,5);await page.locator('#area-definition-search').fill('TESTX');await page.locator('#area-definition-code').selectOption('TESTX');await page.locator('#area-definition-chooser [type=submit]').click();assert.equal(await page.evaluate(()=>app.state.polygons[1].type),'TESTX');assert.equal(await page.evaluate(()=>app.areaTotals.totalGLA),300);
 await page.locator('.area-workflow-row').first().click();await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>app.state.mode),'draw-exterior');assert.equal(await page.locator('#area-definition-chooser').count(),0);
 // Find is view-only and does not create polygons or history.
 const save=await page.evaluate(()=>app.buildSaveModel());await page.locator('#area-find-undefined').click();assert.deepEqual(differences(save,await page.evaluate(()=>app.buildSaveModel())),[]);
 // Moving/resizing the viewport and importing state dismiss stale dialogs.
 await page.locator('.area-workflow-row').first().click();await page.setViewportSize({width:500,height:850});await page.waitForFunction(()=>!document.getElementById('area-definition-chooser'));
 await page.locator('.area-workflow-row').first().click();const box=await page.locator('#area-definition-chooser').boundingBox();assert(box.x>=0&&box.x+box.width<=500);await page.locator('#sidebar-dock').screenshot({path:path.resolve(__dirname,'../docs/qa-area-workflow-sidebar.png')});
 await page.evaluate(async()=>{const data=app.buildSaveModel();await app.importState(data);});await page.waitForFunction(()=>!document.getElementById('area-definition-chooser'));
 await page.setViewportSize({width:1500,height:1050});await page.locator('.area-workflow-row').first().click();await page.screenshot({path:path.resolve(__dirname,'../docs/qa-area-workflow-chooser.png')});
 assert.deepEqual(errors,[]);console.log('PASS: unrestricted drawing, cancel purity, real canvas targeting, definitions/totals, undo/redo, repeat, custom codes, area list editing, Escape, view-only find, responsive chooser and import dismissal.');
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
