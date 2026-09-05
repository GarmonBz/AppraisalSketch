const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..'),file=path.join(root,'sketch.bundle.html');
let source=fs.readFileSync(file).toString('latin1');
function replaceOnce(from,to){const count=source.split(from).length-1;if(count!==1)throw Error('Expected one integration point: '+from.slice(0,100)+'; got '+count);source=source.replace(from,to)}
if(!source.includes('defineAreaTarget(target, code, name, autoPost')){
 replaceOnce("if (mode === 'draw-exterior' || mode === 'draw-interior') {\n        this.app.handleCanvasClick(worldPt);", "if (mode === 'define-area') {\n        this.app.areaWorkflow?.click(worldPt);\n      } else if (mode === 'draw-exterior' || mode === 'draw-interior') {\n        this.app.handleCanvasClick(worldPt);");
 replaceOnce("else if (id === 'tool-define-area') {\n          this.showPanel('panel-define-area');", "else if (id === 'tool-define-area') {\n          this.app.areaWorkflow?.activate();\n          this.showPanel('panel-define-area');");
 replaceOnce("    this.pushUndo('Define Area');\n    target.type = code;", "    this.defineAreaTarget(target, code, name);\n  }\n\n  defineAreaTarget(target, code, name, autoPost = null) {\n    if (!this.state.polygons.includes(target)) return;\n    this.pushUndo('Define Area');\n    if (autoPost) {\n      target.autoPost = { ...(target.autoPost || {}), ...autoPost };\n      const lineIds = new Set((target.edges || []).map(edge => edge.lineId));\n      if (typeof autoPost.dims === 'boolean') this.state.lines.forEach(line => {\n        if (lineIds.has(line.id)) line.dimensionHidden = !autoPost.dims;\n      });\n    }\n    target.type = code;");
}
const start='<!-- AREA DEFINITION WORKFLOW: generated from src/area-definition.* -->';
const end='<!-- /AREA DEFINITION WORKFLOW -->';
if(source.includes(start)){const a=source.indexOf(start),b=source.indexOf(end,a);if(b<0)throw Error('Missing module end');source=source.slice(0,a)+source.slice(b+end.length);}
const css=fs.readFileSync(path.join(root,'src/area-definition.css')).toString('latin1');
const js=fs.readFileSync(path.join(root,'src/area-definition.js')).toString('latin1');
const closing=source.lastIndexOf('</body>');
if(closing<0)throw Error('Missing document body');
source=source.slice(0,closing)+`${start}\n<style>\n${css}\n</style>\n<script>\n${js}\n</script>\n${end}\n`+source.slice(closing);
fs.writeFileSync(file,Buffer.from(source,'latin1'));
console.log('Installed optional area workflow; existing bundle bytes preserved outside explicit integration points.');
