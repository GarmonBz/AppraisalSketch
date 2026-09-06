/* Visual QA for the sidebar streamlining pass:
   A) code library + area tools as a sheet over the Areas panel,
   B) the area list bounded so the total never scrolls away,
   C) the single reachable pin toggle in the tab strip.
   Captures dark, light and the owner's 500 CSS px DPI case. */
const {chromium}=require('playwright');
const path=require('node:path');
(async()=>{
 const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'msedge',headless:true});
 const page=await browser.newPage({viewport:{width:1500,height:1050}});
 await page.goto(fileUrl());
 await page.waitForFunction(()=>window.app?.areaWorkflow);

 // Seed twelve defined areas: past the eight that used to push the total off-screen.
 await page.evaluate(()=>{
   const names=['First Floor','Garage','Covered Porch','Second Floor','Basement','Workshop',
                'Rear Deck','Garden Shed','Bonus Room','Sunroom','Carport','Loft'];
   const codes=['GLA1','GAR','P/P','GLA2','BSMT','OTH','P/P','OTH','GLA2','GLA1','GAR','GLA3'];
   for(let i=0;i<names.length;i++){
     app.state.pendingShape={kind:'rectangle',width:10+i,depth:8,rotation:0,defineAsArea:true};
     app.placeShapeAt({x:i*40,y:0});
     app.defineAreaTarget(app.state.polygons[app.state.polygons.length-1],codes[i],names[i]);
   }
   app.centerAndFit();app.render();app.areaWorkflow.refresh();
 });
 await page.waitForFunction(()=>document.querySelectorAll('.area-tile').length>3);
 await page.waitForTimeout(200);

 // B: bounded list, footer and total still on screen at twelve areas.
 await page.locator('#sidebar-dock').screenshot({path:root('docs/qa-sidebar-streamline-list.png')});

 // Palette: default, filtered, and armed.
 await page.locator("#sidebar-dock").screenshot({path:root("docs/qa-area-palette.png")});
 await page.evaluate(() => {
   for (const head of document.querySelectorAll(".area-tile-group")) {
     if (!head.textContent.includes("Living space") && head.getAttribute("aria-expanded") === "true") head.click();
   }
 });
 await page.waitForTimeout(250);
 await page.locator("#sidebar-dock").screenshot({path:root("docs/qa-area-palette-collapsed.png")});
 await page.evaluate(() => {
   for (const head of document.querySelectorAll(".area-tile-group")) {
     if (head.getAttribute("aria-expanded") !== "true") head.click();
   }
 });
 await page.locator(".area-tile[data-code=\"GLA2\"]").click();
 await page.waitForTimeout(250);
 await page.locator("#sidebar-dock").screenshot({path:root("docs/qa-area-palette-armed.png")});
 await page.keyboard.press("Escape");
 await page.waitForTimeout(200);

 // A: the simplified edit sheet.
 await page.locator('#area-open-library').click();
 await page.waitForTimeout(250);
 await page.locator('#sidebar-dock').screenshot({path:root('docs/qa-sidebar-streamline-sheet.png')});

 // Light theme, sheet still open.
 await page.evaluate(()=>{document.body.classList.remove('dark-theme','blue-theme');document.body.classList.add('light-theme');});
 await page.waitForTimeout(300);
 await page.locator('#sidebar-dock').screenshot({path:root('docs/qa-sidebar-streamline-sheet-light.png')});
 await page.keyboard.press('Escape');
 await page.waitForTimeout(200);
 await page.locator('#sidebar-dock').screenshot({path:root('docs/qa-sidebar-streamline-list-light.png')});
 await page.evaluate(()=>{document.body.classList.remove('light-theme');document.body.classList.add('dark-theme');});

 // C: pin toggle, both states, in the tab strip.
 await page.locator('#sidebar-pin-toggle').click();
 await page.waitForTimeout(200);
 await page.locator('.sidebar-tabs').screenshot({path:root('docs/qa-sidebar-streamline-pin-off.png')});
 await page.locator('#sidebar-pin-toggle').click();
 await page.waitForTimeout(200);
 await page.locator('.sidebar-tabs').screenshot({path:root('docs/qa-sidebar-streamline-pin-on.png')});

 // Owner's narrow high-DPI case.
 await page.setViewportSize({width:500,height:850});
 await page.waitForTimeout(400);
 await page.screenshot({path:root('docs/qa-sidebar-streamline-500.png')});

 await browser.close();
 console.log('CAPTURES DONE');

 function fileUrl(){return 'file:///'+path.resolve(__dirname,'../sketch.bundle.html').replace(/\\/g,'/').replace(/ /g,'%20');}
 function root(p){return path.resolve(__dirname,'..',p);}
})().catch(e=>{console.error(e);process.exit(1)});
