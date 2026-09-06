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
 await page.evaluate(()=>app.areaWorkflow.activate());const initial=await page.evaluate(()=>app.buildSaveModel());await clickRegion();await page.waitForSelector('#area-definition-chooser');
 await page.locator('#area-definition-name').fill('Canceled name');await page.locator('[data-cancel]').click();
 assert.deepEqual(differences(initial,await page.evaluate(()=>app.buildSaveModel())),[],'Cancel changed persisted data');
 await clickRegion();await page.locator('#area-definition-code').selectOption('GLA1');await page.locator('#area-definition-name').fill('Main level');await page.locator('[name=repeat]').check();await page.locator('#area-definition-chooser [type=submit]').click();
 assert.equal(await page.evaluate(()=>app.state.polygons[0].type),'GLA1');assert.equal(await page.evaluate(()=>app.state.polygons[1].type),'UND');
 assert.equal(await page.evaluate(()=>app.areaTotals.totalGLA),300);assert.equal(await page.evaluate(()=>app.state.polygons[0].name),'Main level');
 await page.evaluate(()=>app.undo());assert.equal(await page.evaluate(()=>app.state.polygons[0].type),'UND');await page.evaluate(()=>app.redo());assert.equal(await page.evaluate(()=>app.state.polygons[0].type),'GLA1');
 await clickRegion(35,5);assert.equal(await page.locator('#area-definition-code').inputValue(),'GLA1');await page.locator('[data-cancel]').click();
 await page.evaluate(()=>{app.areaCodes.push({code:'TESTX',name:'Custom workshop',description:'Custom',group:'My group',multiplier:1,positive:true,includeInGLA:false});});
 await clickRegion(35,5);await page.locator('#area-definition-search').fill('TESTX');await page.locator('#area-definition-code').selectOption('TESTX');await page.locator('#area-definition-chooser [type=submit]').click();assert.equal(await page.evaluate(()=>app.state.polygons[1].type),'TESTX');assert.equal(await page.evaluate(()=>app.areaTotals.totalGLA),300);
 await page.evaluate(()=>{app.areaWorkflow.activate();app.areaWorkflow.open(app.state.polygons[0]);});await page.waitForSelector('#area-definition-chooser');await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>app.state.mode),'draw-exterior');assert.equal(await page.locator('#area-definition-chooser').count(),0);
 // Find is view-only and does not create polygons or history.
 const save=await page.evaluate(()=>app.buildSaveModel());await page.locator('#area-find-undefined').click();assert.deepEqual(differences(save,await page.evaluate(()=>app.buildSaveModel())),[]);
 // Moving/resizing the viewport and importing state dismiss stale dialogs.
 await page.evaluate(()=>{app.areaWorkflow.activate();app.areaWorkflow.open(app.state.polygons[0]);});await page.waitForSelector('#area-definition-chooser');await page.setViewportSize({width:500,height:850});await page.waitForFunction(()=>!document.getElementById('area-definition-chooser'));
 await page.evaluate(()=>{app.areaWorkflow.activate();app.areaWorkflow.open(app.state.polygons[0]);});await page.waitForSelector('#area-definition-chooser');const box=await page.locator('#area-definition-chooser').boundingBox();assert(box.x>=0&&box.x+box.width<=500);await page.locator('#sidebar-dock').screenshot({path:path.resolve(__dirname,'../docs/qa-area-workflow-sidebar.png')});
 await page.evaluate(async()=>{const data=app.buildSaveModel();await app.importState(data);});await page.waitForFunction(()=>!document.getElementById('area-definition-chooser'));
 await page.setViewportSize({width:1500,height:1050});await page.waitForTimeout(500);await page.evaluate(()=>{app.areaWorkflow.activate();app.areaWorkflow.open(app.state.polygons[0]);});await page.waitForSelector('#area-definition-chooser');await page.screenshot({path:path.resolve(__dirname,'../docs/qa-area-workflow-chooser.png')});
 // The area list is bounded: with many areas the LIST scrolls, not the panel, so
 // Find-undefined and the living-area total stay on screen (regression guard).
 await page.keyboard.press('Escape');
 await page.evaluate(()=>{for(let i=0;i<12;i++){app.state.pendingShape={kind:'rectangle',width:10+i,depth:8,rotation:0,defineAsArea:true};app.placeShapeAt({x:i*40,y:200});app.defineAreaTarget(app.state.polygons[app.state.polygons.length-1],'GLA1','Bulk area '+i);}app.centerAndFit();app.render();app.areaWorkflow.refresh();});
 await page.waitForFunction(()=>document.querySelectorAll('.area-tile').length>3);
 await page.setViewportSize({width:1500,height:700});await page.waitForTimeout(250);
 const bounded=await page.evaluate(()=>{
   const list=document.querySelector('.area-palette');
   const foot=document.querySelector('.area-workflow-foot');
   const body=document.querySelector('#panel-define-area > .panel-body');
   return {listScrolls:list.scrollHeight>list.clientHeight,
           bodyScrolls:body.scrollHeight>body.clientHeight+1,
           totalVisible:foot.getBoundingClientRect().bottom<=body.getBoundingClientRect().bottom+1};
 });
 assert.equal(bounded.listScrolls,true,'The palette should scroll inside itself');
 assert.equal(bounded.bodyScrolls,false,'Areas panel body should not scroll');
 assert.equal(bounded.totalVisible,true,'Panel foot scrolled out of view');
 await page.setViewportSize({width:1500,height:1050});await page.waitForTimeout(200);
 // One "Edit areas…" link opens a sheet of three flat sections over the panel.
 const sheet=await page.evaluate(()=>{
   const el=document.getElementById('area-advanced-tools');
   const before=el.hidden;
   document.getElementById('area-open-library').click();
   const sections=[...el.querySelectorAll('.area-edit-title')].map(e=>e.textContent).join('|');
   const zones=el.querySelectorAll('.area-edit-group').length;
   const opened=!el.hidden;
   document.querySelector('.area-advanced-close').click();
   return {before,opened,sections,zones,closed:el.hidden};
 });
 assert.deepEqual(sheet,{before:true,opened:true,sections:'Area operations|Label defaults',zones:2,closed:true},'Edit sheet did not open/close correctly');
 // The pin preference has exactly one reachable control and it round-trips.
 const pin=await page.evaluate(()=>{
   const btn=document.getElementById('sidebar-pin-toggle');
   const start=app.state.sidebar.pinned!==false;
   btn.click();const off=app.state.sidebar.pinned;
   btn.click();const back=app.state.sidebar.pinned;
   return {count:document.querySelectorAll('#sidebar-pin-toggle').length,start,off,back,
           legacy:document.querySelectorAll('.sidebar-pin').length};
 });
 assert.deepEqual(pin,{count:1,start:true,off:false,back:true,legacy:5},'Pin toggle missing or not bound to state.sidebar.pinned');

 // ---- Area-type palette: drag a swatch, arm a swatch, clear with Undefined ----
 await page.keyboard.press('Escape');
 const paletteShape = await page.evaluate(() => ({
   tiles: document.querySelectorAll('.area-tile').length,
   codes: app.areaCodes.length,
   chips: document.querySelectorAll('.area-chip').length,
   // areaCodes is not group-contiguous; each group must head exactly once
   headers: [...document.querySelectorAll('.area-tile-group')].map(e => e.textContent),
   clearLast: document.querySelector('.area-tile:last-child')?.dataset.code,
   swatch: document.querySelector('.area-tile[data-code="GLA1"] .area-tile-swatch').style.background,
   gba: app.areaCodes.filter(c => c.group === 'GBA').map(c => c.color)
 }));
 assert.equal(paletteShape.tiles, paletteShape.codes, 'every code needs a tile (plus Undefined as the clear tile)');
 assert.equal(paletteShape.clearLast, 'UND', 'Undefined belongs last, as the clear affordance');
 assert.equal(new Set(paletteShape.headers).size, paletteShape.headers.length, 'a group heading appeared twice');
 assert.ok(/43, *108, *176/.test(paletteShape.swatch), 'GLA1 swatch must use the code colour #2B6CB0');
 assert.equal(paletteShape.gba.length, 10, 'GBA should still have ten floors');
 assert.equal(new Set(paletteShape.gba).size, 10, 'every GBA floor needs its own colour (six used to share #38A169)');

 async function dragTile(code, dest) {
   // Filter to the code's group first: the tile then sits at a stable
   // position on screen, so the box we measure is still under the cursor
   // when the press lands, and nothing needs scrolling into view.
   const label = await page.evaluate(c => {
     const names = { GLA:'Living space', GBA:'Building area', GAR:'Garage / carport', BSMT:'Basement',
                     'P/P':'Outdoor', OTH:'Storage', LAND:'Land', SITE:'Site', NCA:'Non-calculated' };
     const entry = app.areaCodes.find(x => x.code === c);
     return entry && names[entry.group] ? names[entry.group] : 'Basement';
   }, code);
   await page.evaluate(name => {
     for (const head of document.querySelectorAll('.area-tile-group')) {
       const wanted = head.textContent.includes(name);
       if ((head.getAttribute('aria-expanded') === 'true') !== wanted) head.click();
     }
   }, label);
   await page.waitForTimeout(150);
   const tile = page.locator('.area-tile[data-code="' + code + '"]');
   await tile.waitFor({state:'visible'});
   await page.waitForTimeout(120);
   const box = await tile.boundingBox();
   await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
   await page.mouse.down();
   await page.mouse.move(box.x + box.width / 2 + 30, box.y + box.height / 2 + 12, { steps: 3 });
   await page.mouse.move(dest.x, dest.y, { steps: 6 });
   await page.mouse.up();
   await page.waitForTimeout(200);
   await page.evaluate(() => {
     for (const head of document.querySelectorAll('.area-tile-group')) {
       if (head.getAttribute('aria-expanded') !== 'true') head.click();
     }
   });
   await page.waitForTimeout(150);
 }
 async function polyCenter(index) {
   return page.evaluate(i => {
     const poly = app.state.polygons[i];
     const pts = Geometry.flattenRing(poly);
     let x = 0, y = 0; pts.forEach(pt => { x += pt.x; y += pt.y; });
     const s = Geometry.toScreen({ x: x / pts.length, y: y / pts.length }, app.state.pan, app.state.zoom);
     const r = document.getElementById('sketchCanvas').getBoundingClientRect();
     return { x: r.left + s.x, y: r.top + s.y };
   }, index);
 }

 // drag onto an outline defines it, in one undo step
 await page.evaluate(() => { app.state.polygons.forEach(p => { p.type = 'UND'; p.name = 'Undefined Area'; }); app.render(); app.areaWorkflow.refresh(); });
 await page.waitForTimeout(150);
 await dragTile('GAR', await polyCenter(0));
 assert.equal(await page.evaluate(() => app.state.polygons[0].type), 'GAR', 'drag onto an outline should define it');
 assert.equal(await page.evaluate(() => app.state.polygons[0].name), 'Garage', 'drag should name from the code record');
 await page.evaluate(() => app.undo());
 assert.equal(await page.evaluate(() => app.state.polygons[0].type), 'UND', 'a dropped definition must be one undo step');
 await page.evaluate(() => app.redo());

 // no ghost or drop-target class survives the gesture
 assert.equal(await page.locator('.area-drag-ghost').count(), 0, 'drag ghost left behind');
 assert.equal(await page.locator('.area-drop-target').count(), 0, 'drop-target highlight left behind');

 // click a tile to arm; armed canvas clicks assign directly, never opening the chooser
 await page.locator('.area-tile[data-code="GLA1"]').click();
 await page.waitForTimeout(150);
 assert.equal(await page.evaluate(() => app.state.mode), 'define-area', 'arming should enter define mode');
 assert.equal(await page.locator('#area-define-mode').count(), 0, 'the Define Areas / Draw pair should be gone from the panel');
 assert.equal(await page.locator('#area-return-draw').count(), 0, 'the Define Areas / Draw pair should be gone from the panel');
 assert.equal(await page.locator('.area-workflow-list').count(), 0, 'the area list belongs to Calcs, not the Areas tab');
 assert.equal(await page.locator('#area-workflow-total').count(), 0, 'the living-area total belongs to Calcs, not the Areas tab');
 assert.equal(await page.locator('#area-palette-search').count(), 0, 'the palette search box was removed in favour of the group chips');
 assert.equal(await page.locator('.area-palette-head').count(), 0, 'the "Assign a type" label was removed to give the palette the height');
 assert.equal(await page.locator('.area-palette-chips').count(), 0, 'the filter-chip jump list was replaced by collapsible sections');
 const sections = await page.evaluate(() => {
   const heads = [...document.querySelectorAll('.area-tile-group')];
   const before = document.querySelectorAll('.area-tile[data-code^="GBA"]').length;
   const building = heads.find(h => h.textContent.includes('Building area'));
   building.click();
   const after = document.querySelectorAll('.area-tile[data-code^="GBA"]').length;
   const heading = () => [...document.querySelectorAll('.area-tile-group')].find(h => h.textContent.includes('Building area'));
   const state = heading().getAttribute('aria-expanded');
   heading().click();
   return { heads: heads.length, before, after, collapsedState: state,
            reopened: document.querySelectorAll('.area-tile[data-code^="GBA"]').length };
 });
 assert.ok(sections.heads >= 8, 'every group needs a heading: ' + sections.heads);
 const icons = await page.evaluate(() => {
   const width = sel => { const e = document.querySelector(sel); return e ? Math.round(e.getBoundingClientRect().width) : -1; };
   return { caret: width('.area-tile-group i'), collapse: width('#sidebar-collapse i'),
            bold: document.querySelectorAll('.ph-bold').length };
 });
 assert.ok(icons.caret > 0, 'the section caret renders as nothing - is it using an icon weight this bundle does not ship?');
 assert.ok(icons.collapse > 0, 'the dock collapse chevron renders as nothing');
 assert.equal(icons.bold, 0, 'ph-bold has no font in this bundle; those icons would be invisible');
 assert.equal(sections.before, 10, 'Building area holds the ten GBA floors');
 assert.equal(sections.after, 0, 'collapsing a section should hide its types');
 assert.equal(sections.collapsedState, 'false', 'a collapsed heading reports aria-expanded=false');
 assert.equal(sections.reopened, 10, 'expanding again should bring the types back');
 assert.ok(await page.evaluate(() => document.getElementById('area-palette').getAttribute('aria-label')), 'the palette still needs an accessible name without a visible label');
 assert.ok(await page.evaluate(()=>document.getElementById('calcs-summary').textContent.includes('Gross Living Area')), 'Calcs must still report the totals the Areas tab dropped');
 assert.equal(await page.locator('.area-tile[aria-selected="true"]').count(), 1, 'exactly one tile is armed');
 await clickRegion(35, 5);
 await page.waitForTimeout(200);
 assert.equal(await page.locator('#area-definition-chooser').count(), 0, 'an armed click must not open the chooser');
 assert.equal(await page.evaluate(() => app.state.polygons[1].type), 'GLA1', 'armed click should assign');

 // Escape disarms and hands the tool back to drawing
 await page.keyboard.press('Escape');
 await page.waitForTimeout(150);
 assert.equal(await page.locator('.area-tile[aria-selected="true"]').count(), 0, 'Escape should disarm');
 assert.equal(await page.evaluate(() => app.state.mode), 'draw-exterior');

 // dropping Undefined clears; dropping onto a list row reclassifies
 await dragTile('UND', await polyCenter(1));
 assert.equal(await page.evaluate(() => app.state.polygons[1].type), 'UND', 'the Undefined tile should clear a classification');
 // dragging a second type over an already-defined outline reclassifies it
 await dragTile('BSMT', await polyCenter(0));
 assert.equal(await page.evaluate(() => app.state.polygons[0].type), 'BSMT', 'dragging onto a defined outline should reclassify it');

 // with nothing armed, a canvas click still opens the chooser.
 // Re-centre and aim at the polygon centroid: a fixed world point can end up
 // behind the dock or off-screen once earlier probes have panned and resized.
 await page.keyboard.press('Escape');
 await page.waitForTimeout(150);
 assert.equal(await page.locator('.area-tile[aria-selected="true"]').count(), 0,
   'a tile was still armed here - an earlier drag registered as a click, which would make this canvas click assign instead of opening the chooser');
 await page.evaluate(()=>{app.centerAndFit();app.areaWorkflow.activate();});
 await page.waitForTimeout(200);
 const aimPt = await polyCenter(0);
 const canvasBox = await page.locator('#sketchCanvas').boundingBox();
 assert.ok(aimPt.x>canvasBox.x && aimPt.x<canvasBox.x+canvasBox.width && aimPt.y>canvasBox.y && aimPt.y<canvasBox.y+canvasBox.height,
   'aim point fell outside the canvas: '+JSON.stringify({aimPt,canvasBox}));
 await page.mouse.click(aimPt.x, aimPt.y);
 await page.waitForSelector('#area-definition-chooser');
 await page.locator('[data-cancel]').click();

 // ---- "New area" starts the create-and-define flow ----
 await page.keyboard.press('Escape');
 await page.evaluate(() => { app.state.polygons.forEach(p => { p.type = 'UND'; p.name = 'Undefined Area'; }); app.render(); app.areaWorkflow.refresh(); });
 await page.waitForTimeout(200);
 await page.locator('#area-new').click();
 await page.waitForTimeout(250);
 assert.equal(await page.evaluate(() => app.state.mode), 'define-area', 'New area should enter define mode when outlines are waiting');
 assert.equal(await page.getAttribute('#area-find-undefined', 'aria-pressed'), 'true', 'New area should highlight what there is to define');
 assert.ok(/waiting/.test(await page.textContent('#area-workflow-status')), 'New area should say how many outlines are waiting');

 // with nothing left undefined it hands over the drawing tool instead
 // defineAreaTarget can swap app.state.polygons for a fresh array, so a
 // forEach over a snapshot silently drops every define after the first.
 // Re-read the live array each time instead.
 await page.evaluate(() => {
   let guard = 0, first = true;
   while (guard++ < 40) {
     const poly = app.state.polygons.find(p => p.type === 'UND');
     if (!poly) break;
     app.defineAreaTarget(poly, first ? 'GLA1' : 'GAR', first ? 'First Floor' : 'Garage');
     first = false;
   }
   app.render(); app.ui.updateCalcsPanel();
 });
 assert.equal(await page.evaluate(() => app.state.polygons.some(p => p.type === 'UND')), false, 'fixture should have no undefined outlines left');
 await page.waitForTimeout(250);
 await page.locator('#area-new').click();
 await page.waitForTimeout(250);
 assert.equal(await page.evaluate(() => app.state.mode), 'draw-exterior', 'New area should hand over the drawing tool when nothing is undefined');

 // ---- right-click an area in the Calcs list to edit its definition ----
 await page.evaluate(() => app.ui.showPanel('panel-calcs'));
 await page.waitForTimeout(300);
 assert.ok(await page.locator('#area-calcs-hint').count(), 'Calcs needs a hint that right-click edits an area');
 const calcsRow = page.locator('#calcs-tree [data-poly-id]').first();
 await calcsRow.click({ button: 'right' });
 await page.waitForSelector('#area-definition-chooser');
 assert.equal(await page.inputValue('#area-definition-code'), 'GLA1', 'the chooser should open on the right-clicked area');
 assert.equal(await page.evaluate(() => document.querySelector('.area-chooser-head strong').textContent), 'Edit definition');
 await page.fill('#area-definition-name', 'Main Level');
 await page.locator('#area-definition-chooser [type=submit]').click();
 await page.waitForTimeout(250);
 assert.equal(await page.evaluate(() => app.state.polygons[0].name), 'Main Level', 'editing from the Calcs list should save');
 assert.equal(await page.evaluate(() => document.getElementById('panel-calcs').hidden), false, 'editing from Calcs should leave you on Calcs');
 await page.evaluate(() => app.ui.showPanel('panel-define-area'));
 await page.waitForTimeout(200);

 // ---- right-click a palette type to edit the code itself ----
 await page.evaluate(() => app.ui.showPanel('panel-define-area'));
 await page.waitForTimeout(250);
 await page.locator('.area-tile[data-code="GLA2"]').click({ button: 'right' });
 await page.waitForSelector('.sketch-context-menu');
 const typeMenu = await page.evaluate(() => [...document.querySelectorAll('.sketch-context-menu button')].map(b => b.textContent.trim()));
 assert.ok(typeMenu.some(l => l.startsWith('Edit type')), 'the type menu needs Edit: ' + JSON.stringify(typeMenu));
 assert.ok(typeMenu.some(l => l.startsWith('New type')), 'the type menu needs New: ' + JSON.stringify(typeMenu));
 assert.ok(typeMenu.some(l => l.startsWith('Delete type')), 'the type menu needs Delete: ' + JSON.stringify(typeMenu));
 assert.ok(typeMenu.some(l => l.startsWith('Assign by clicking')), 'the type menu needs the arm option: ' + JSON.stringify(typeMenu));
 await page.evaluate(() => [...document.querySelectorAll('.sketch-context-menu button')].find(b => b.textContent.trim().startsWith('Edit type')).click());
 await page.waitForSelector('.area-definition-dialog');
 assert.equal(await page.evaluate(() => document.querySelector('.area-definition-dialog .sidebar-manager-title strong').textContent),
   'Edit GLA2', 'right-clicking a type should open that code editor directly');
 assert.equal(await page.inputValue('.area-definition-dialog [name=name]'), 'Second Floor');
 await page.fill('.area-definition-dialog [name=name]', 'Upper Level');
 await page.locator('.area-definition-dialog [type=submit]').click();
 await page.waitForTimeout(400);
 assert.equal(await page.evaluate(() => app.areaCodes.find(c => c.code === 'GLA2').name), 'Upper Level', 'the code edit should save');
 await page.waitForFunction(() => document.querySelector('.area-tile[data-code="GLA2"] .area-tile-name').textContent === 'Upper Level');
 // the editor persists to localStorage; put the fixture back
 await page.evaluate(() => {
   const c = app.areaCodes.find(x => x.code === 'GLA2');
   c.name = 'Second Floor';
   try { localStorage.removeItem('sketch.areaCodes'); } catch (_) {}
   app.render();
 });

 // ---- right-click an area on the canvas offers Edit Definition ----
 await page.evaluate(() => app.setMode('select'));
 const areaPt = await polyCenter(0);
 await page.mouse.click(areaPt.x, areaPt.y, { button: 'right' });
 await page.waitForTimeout(300);
 const menuLabels = await page.evaluate(() =>
   [...document.querySelectorAll('.sketch-context-menu button')].map(b => b.textContent.trim()));
 assert.ok(menuLabels[0] && menuLabels[0].startsWith('Edit Definition'),
   'the canvas menu should lead with Edit Definition over an area, got: ' + JSON.stringify(menuLabels.slice(0, 3)));
 assert.ok(!/&$/.test(menuLabels[0]),
   'the menu label lost its ellipsis to the latin1 bundle write: ' + menuLabels[0]);
 await page.keyboard.press('Escape');
 await page.waitForTimeout(200);

 // ---- type-menu actions ----
 async function typeMenuClick(code, startsWith) {
   const tile = page.locator('.area-tile[data-code="' + code + '"]');
   await tile.scrollIntoViewIfNeeded();
   await tile.click({ button: 'right' });
   await page.waitForSelector('.sketch-context-menu');
   const hit = await page.evaluate(label => {
     const b = [...document.querySelectorAll('.sketch-context-menu button')].find(x => x.textContent.trim().startsWith(label));
     if (b) b.click();
     return !!b;
   }, startsWith);
   assert.ok(hit, 'no "' + startsWith + '" in the ' + code + ' menu');
   await page.waitForTimeout(350);
 }

 // assign the selection through the menu
 await page.evaluate(() => { app.state.selectedPolyIds = new Set([app.state.polygons[1].id]); app.ui.updateAreaActionStates(); app.render(); });
 await typeMenuClick('BSMT', 'Assign to');
 assert.equal(await page.evaluate(() => app.state.polygons[1].type), 'BSMT', 'menu assign should classify the selection');

 // select every area using a type
 await page.evaluate(() => { app.state.selectedPolyIds = new Set(); app.render(); });
 await typeMenuClick('BSMT', 'Select the');
 assert.equal(await page.evaluate(() => app.state.selectedPolyIds.size), 1, 'menu select should select the areas using that type');

 // Undefined cannot be deleted - it is the unclassified sentinel
 await typeMenuClick('UND', 'Delete type');
 assert.ok(await page.evaluate(() => !!app.areaCodes.find(c => c.code === 'UND')), 'UND must survive a delete attempt');
 assert.ok(/cannot be deleted/.test(await page.textContent('#area-workflow-status')), 'deleting UND should say why it is refused');

 // deleting a type in use warns, then leaves those areas unclassified
 await page.evaluate(() => { window.__confirmMsg = null; app.ui.confirmDialog = async m => { window.__confirmMsg = m; return true; }; });
 await typeMenuClick('BSMT', 'Delete type');
 assert.ok(/becomes unclassified/.test(await page.evaluate(() => window.__confirmMsg || '')), 'the delete confirm should name the consequence: ' + await page.evaluate(() => window.__confirmMsg));
 assert.ok(await page.evaluate(() => !app.areaCodes.find(c => c.code === 'BSMT')), 'the type should be gone from the library');
 assert.equal(await page.evaluate(() => app.state.polygons[1].type), 'UND', 'areas using a deleted type fall back to unclassified');
 await page.waitForFunction(() => !document.querySelector('.area-tile[data-code="BSMT"]'), null, { timeout: 5000 });
 assert.ok(await page.evaluate(() => !!document.querySelector('.area-tile[data-code="BSMT2"]')), 'deleting one code must not take its group-mates with it');
 await page.evaluate(() => { try { localStorage.removeItem('sketch.areaCodes'); } catch (_) {} });

 // ---- the Code library is retired; the palette owns the type state ----
 assert.deepEqual(await page.evaluate(() => ['area-code-search','area-pending-code','area-name-input','btn-apply-area']
   .filter(id => document.getElementById(id))), [], 'the code-library controls should be gone from the DOM');
 assert.equal(await page.locator('.area-tree').count(), 0, 'the code tree is retired');

 // arming sets the state the tree used to own, and un-picking clears it
 await page.evaluate(() => app.ui.showPanel('panel-define-area'));
 await page.waitForTimeout(200);
 await page.locator('.area-tile[data-code="GLA3"]').click();
 await page.waitForTimeout(150);
 assert.equal(await page.evaluate(() => app.state.selectedAreaType), 'GLA3', 'arming should set selectedAreaType');
 assert.equal(await page.evaluate(() => app.state.selectedAreaName), 'Third Floor', 'arming should set selectedAreaName');

 // Define First reads it WHILE DRAWING, so picking the pen must not clear it
 const born = await page.evaluate(() => {
   app.applyOptions({ ...app.state.options, defineFirst: true });
   app.setMode('draw-exterior');
   const standing = app.state.selectedAreaType;
   for (const pt of [{x:200,y:200},{x:212,y:200},{x:212,y:209},{x:200,y:209},{x:200,y:200}]) app.handleCanvasClick(pt);
   const poly = app.state.polygons[app.state.polygons.length - 1];
   app.applyOptions({ ...app.state.options, defineFirst: false });
   return { standing, type: poly && poly.type, name: poly && poly.name };
 });
 assert.equal(born.standing, 'GLA3', 'switching to a drawing tool must not clear the standing type - Define First needs it');
 assert.equal(born.type, 'GLA3', 'Define First should draw the polygon pre-classified from the armed swatch');
 assert.equal(born.name, 'Third Floor');

 // Redefine now reads the armed type instead of a tree selection
 await page.locator('.area-tile[data-code="GAR2"]').click();
 await page.waitForTimeout(150);
 const target = await page.evaluate(() => {
   const poly = app.state.polygons[app.state.polygons.length - 1];
   app.state.selectedPolyIds = new Set([poly.id]);
   app.ui.updateAreaActionStates();
   return poly.id;
 });
 await page.locator('#area-open-library').click();
 await page.waitForTimeout(200);
 await page.locator('#btn-redefine-area').click();
 await page.waitForTimeout(300);
 assert.equal(await page.evaluate(id => app.state.polygons.find(p => p.id === id).type, target), 'GAR2',
   'Redefine should use the type armed in the palette');
 await page.locator('.area-advanced-close').click();
 await page.waitForTimeout(200);

 // Edit type and New type still work with #area-name-input gone (it was written unguarded)
 await page.evaluate(() => app.ui.showAreaDefinitionEditor('GLA3'));
 await page.waitForSelector('.area-definition-dialog');
 await page.fill('.area-definition-dialog [name=name]', 'Attic');
 await page.locator('.area-definition-dialog [type=submit]').click();
 await page.waitForTimeout(300);
 assert.equal(await page.evaluate(() => app.areaCodes.find(c => c.code === 'GLA3').name), 'Attic',
   'editing a code must survive the removal of #area-name-input');
 await page.evaluate(() => app.ui.showAddAreaCode());
 await page.waitForTimeout(250);
 assert.ok(await page.evaluate(() => !!document.querySelector('.sidebar-manager-dialog')), 'New type should still open');
 await page.evaluate(() => document.querySelector('.sidebar-manager-overlay')?.remove());
 await page.evaluate(() => { try { localStorage.removeItem('sketch.areaCodes'); } catch (_) {} });
 assert.deepEqual(errors,[]);console.log('PASS: unrestricted drawing, cancel purity, real canvas targeting, definitions/totals, undo/redo, repeat, custom codes, area list editing, Escape, view-only find, responsive chooser, import dismissal, bounded palette, definition-only Areas tab, library sheet, pin toggle the area-type palette (drag, arm, clear, reclassify), the New-area flow, and right-click editing from the Calcs list, the palette and the canvas, the type context menu (assign, select, edit, delete), and the retired code library (palette owns selectedAreaType; Define First and Redefine still work).');
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
