/* Optional region classification. No drawing completion event opens this UI. */
(() => {
  'use strict';
  function boot() {
    const app = window.app;
    if (!app || app.areaWorkflow) return;
    const panel = document.querySelector('#panel-define-area > .panel-body');
    const canvas = document.getElementById('sketchCanvas');
    if (!panel || !canvas) return;
    const esc = value => app.ui.escapeHTML(value);
    const advanced = document.createElement('details');
    advanced.id = 'area-advanced-tools';
    const summary = document.createElement('summary');
    summary.textContent = 'Code library & advanced area tools';
    advanced.append(summary);
    // Move the original live controls; their IDs, handlers and state stay intact.
    [...panel.children].forEach(node => advanced.append(node));
    const surface = document.createElement('section');
    surface.className = 'area-workflow';
    surface.innerHTML = `<div class="area-workflow-heading"><strong>Your areas</strong><span class="area-workflow-count"></span></div>
      <div class="area-workflow-actions"><button id="area-define-mode" type="button" aria-pressed="false">Define Areas</button><button id="area-return-draw" type="button">Draw</button></div>
      <div class="area-workflow-note" id="area-workflow-status" role="status">Draw first. Define whenever you are ready.</div>
      <div class="area-workflow-list"></div><button id="area-find-undefined" type="button" aria-pressed="false">Find undefined regions</button>
      <div class="area-workflow-total"><span>Living area · this page</span><strong id="area-workflow-total"></strong></div>`;
    panel.append(surface, advanced);
    document.querySelector('[data-sidebar-target="panel-define-area"] span').textContent = 'Areas';
    document.getElementById('tool-define-area').title = 'Define Areas: click inside an outline';
    const overlay = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    overlay.classList.add('area-workflow-overlay');
    overlay.setAttribute('aria-hidden', 'true');
    canvas.parentElement.append(overlay);
    const labels = { GLA:'Living space', GBA:'Building area', GAR:'Garage / carport', BSMT:'Basement', 'P/P':'Outdoor', OTH:'Storage', LAND:'Land', SITE:'Site', NCA:'Non-calculated', UND:'Undefined' };
    let chooser = null, target = null, targetPage = null, origin = null;
    let remembered = null, repeat = false, findUndefined = false, previousDraw = 'draw-exterior';
    let priorSelection = null, listSignature = '', refreshQueued = false;
    const query = selector => surface.querySelector(selector);
    function notify(message) { query('#area-workflow-status').textContent = message; }
    function editable(poly) { return app.isEntityVisible(poly) && !app.isEntityLocked(poly); }
    function close(restoreFocus = false) {
      if (!chooser) return;
      chooser.remove(); chooser = null; target = null; targetPage = null;
      if (priorSelection) app.state.selectedPolyIds = new Set(priorSelection.filter(id => app.state.polygons.some(p => p.id === id)));
      priorSelection = null;
      app.ui.updateAreaActionStates(); app.render();
      if (restoreFocus && origin?.isConnected) origin.focus();
    }
    function activate() {
      close();
      if (app.state.mode === 'draw-exterior' || app.state.mode === 'draw-interior') previousDraw = app.state.mode;
      app.setMode('define-area');
      app.ui.showPanel('panel-define-area');
      notify('Click inside a closed outline. Escape returns to drawing.');
    }
    function beginDrawing() { close(); app.setMode(previousDraw); notify('Drawing mode. Area definition remains optional.'); }
    function open(poly, point, trigger) {
      close();
      if (!editable(poly)) { notify('Show and unlock this area before editing its definition.'); return; }
      target = poly; targetPage = app.state.polygons; origin = trigger || query('#area-define-mode');
      priorSelection = [...app.state.selectedPolyIds]; app.state.selectedPolyIds = new Set([poly.id]);
      app.ui.updateAreaActionStates(); app.render();
      const post = { ...app.state.autoPost, dims:app.state.dimensionsEnabled, ...poly.autoPost };
      const known = app.areaCodes.find(c => c.code === poly.type);
      let code = poly.type !== 'UND' ? poly.type : (repeat ? remembered : null);
      let group = app.areaCodes.find(c => c.code === code)?.group || 'GLA';
      chooser = document.createElement('form'); chooser.className = 'area-chooser'; chooser.id = 'area-definition-chooser';
      chooser.setAttribute('role','dialog'); chooser.setAttribute('aria-label','Define selected area');
      chooser.innerHTML = `<div class="area-chooser-head"><strong>${poly.type === 'UND' ? 'Define this area' : 'Edit definition'}</strong><span>${Number(poly.net ?? poly.area ?? 0).toFixed(1)} sf</span></div>
        <label class="area-field"><span>What is this space?</span><input id="area-definition-search" type="search" placeholder="Find any type or custom code..."></label>
        <div class="area-chooser-types"></div><label class="area-field"><span>Classification</span><select id="area-definition-code" required></select></label>
        <label class="area-field"><span>Name · optional</span><input id="area-definition-name" value="${esc(poly.type === 'UND' ? '' : poly.name || '')}" placeholder="Custom area name"></label>
        <details><summary>Label settings</summary><div class="area-chooser-checks">${[['code','Code'],['name','Name'],['dims','Dimensions'],['calcs','Area'],['base','Base'],['factor','Factor']].map(([key,name]) => `<label><input type="checkbox" name="post-${key}" ${post[key] ? 'checked' : ''}>${name}</label>`).join('')}</div>
          <label class="area-field"><span>Area suffix</span><select name="suffix"></select></label></details>
        <label class="area-chooser-repeat"><input type="checkbox" name="repeat" ${repeat ? 'checked' : ''}>Keep assigning this type</label>
        <div class="area-chooser-actions"><button type="button" data-cancel>Cancel</button><button class="area-primary" type="submit">${poly.type === 'UND' ? 'Define area' : 'Save changes'}</button></div>`;
      const form = chooser;
      const search = form.querySelector('#area-definition-search');
      const select = form.querySelector('#area-definition-code');
      const suffix = form.elements.namedItem('suffix');
      for (const option of document.getElementById('autopost-suffix').options) suffix.add(new Option(option.textContent,option.value));
      suffix.value = post.suffix || 'sf';
      const codes = () => {
        const values = app.areaCodes.slice();
        if (poly.type !== 'UND' && !known) values.push({code:poly.type,name:poly.name || poly.type,group:'Custom',description:'Existing classification'});
        return values;
      };
      function drawChoices() {
        const term = search.value.trim().toLowerCase();
        const values = codes();
        const groups = [...new Set(values.map(c=>c.group))];
        const host = form.querySelector('.area-chooser-types'); host.replaceChildren();
        for (const key of groups) {
          if (term && !values.some(c=>c.group===key && `${c.code} ${c.name} ${c.description} ${labels[key] || key}`.toLowerCase().includes(term))) continue;
          const button = document.createElement('button'); button.type='button'; button.textContent=labels[key] || key;
          button.setAttribute('aria-pressed',String(key===group));
          button.onclick=()=>{group=key;search.value='';code=null;drawChoices();}; host.append(button);
        }
        const matches=values.filter(c=>term ? `${c.code} ${c.name} ${c.description} ${labels[c.group] || c.group}`.toLowerCase().includes(term) : c.group===group);
        select.replaceChildren(new Option('Choose a classification...', ''));
        for(const item of matches) select.add(new Option(`${item.name} (${item.code})`,item.code));
        if(matches.some(c=>c.code===code)) select.value=code; else select.value='';
        form.querySelector('[type=submit]').disabled=!select.value;
      }
      search.oninput=drawChoices;
      select.onchange=()=>{code=select.value;form.querySelector('[type=submit]').disabled=!code;};
      form.querySelector('[data-cancel]').onclick=()=>{close(true);notify('Canceled. Drawing unchanged.');};
      form.onsubmit=event=>{
        event.preventDefault();
        if (targetPage!==app.state.polygons || !app.state.polygons.includes(poly) || !editable(poly)) {close(true);notify('Area changed. Select it again.');return;}
        const definition=codes().find(c=>c.code===select.value);
        if(!definition)return;
        const autoPost={suffix:suffix.value};
        for(const key of ['code','name','dims','calcs','base','factor'])autoPost[key]=form.elements.namedItem(`post-${key}`).checked;
        const name=form.querySelector('#area-definition-name').value.trim() || definition.name;
        repeat=form.elements.namedItem('repeat').checked;remembered=repeat ? definition.code : null;
        // Reuse the core classification transaction; one undo includes labels.
        app.defineAreaTarget(poly,definition.code,name,autoPost);
        close(true);notify('Area defined. Click another outline, or choose Draw.');
      };
      document.body.append(form);drawChoices();
      const bounds=canvas.getBoundingClientRect();
      form.style.left=Math.max(10,Math.min(window.innerWidth-310,(point?.x ?? bounds.right-310)+16))+'px';
      form.style.top=Math.max(10,Math.min(window.innerHeight-form.offsetHeight-10,point?.y ?? bounds.top+20))+'px';
      search.focus();
    }
    function click(worldPt) {
      const candidates=app.state.polygons.filter(poly=>editable(poly) && window.Geometry.pointInPolygon(worldPt,window.Geometry.flattenRing(poly)))
        .sort((a,b)=>Math.abs(a.area ?? a.gross ?? 0)-Math.abs(b.area ?? b.gross ?? 0));
      if(!candidates.length){notify('No closed area here. Use Detect Regions in advanced tools for enclosed wall networks.');return;}
      const screen=window.Geometry.toScreen(worldPt,app.state.pan,app.state.zoom),bounds=canvas.getBoundingClientRect();
      open(candidates[0],{x:bounds.left+screen.x,y:bounds.top+screen.y});
    }
    function refresh() {
      if(chooser && (targetPage!==app.state.polygons || !app.state.polygons.includes(target) || !editable(target)))close();
      query('#area-define-mode').setAttribute('aria-pressed',String(app.state.mode==='define-area'));
      const defined=app.state.polygons.filter(p=>p.type && p.type!=='UND');
      const signature=JSON.stringify(defined.map(p=>[p.id,p.name,p.type,p.net,p.area,editable(p)]));
      if(signature!==listSignature){
        listSignature=signature;const list=query('.area-workflow-list');list.replaceChildren();
        query('.area-workflow-count').textContent=`${defined.length} defined · this page`;
        if(!defined.length){const empty=document.createElement('div');empty.className='area-workflow-note';empty.textContent='No defined areas yet. Your outlines can remain unclassified.';list.append(empty);}
        for(const poly of defined){const row=document.createElement('button');row.type='button';row.className='area-workflow-row';row.disabled=!editable(poly);row.innerHTML=`<span>${esc(poly.name || poly.type)}<small>${esc(poly.type)}${editable(poly)?'':' · Hidden or locked'}</small></span><strong>${Number(poly.net ?? poly.area ?? 0).toFixed(1)} sf</strong>`;row.onclick=()=>{activate();open(poly,null,row);};list.append(row);}
      }
      const living=defined.filter(p=>app.areaCodes.find(c=>c.code===p.type)?.includeInGLA).reduce((sum,p)=>sum+Number(p.net ?? p.area ?? 0),0);
      query('#area-workflow-total').textContent=defined.length?living.toFixed(1)+' sf':'—';
      overlay.replaceChildren();overlay.setAttribute('viewBox',`0 0 ${canvas.clientWidth} ${canvas.clientHeight}`);
      if(findUndefined)for(const poly of app.state.polygons.filter(p=>p.type==='UND' && app.isEntityVisible(p))){const shape=document.createElementNS('http://www.w3.org/2000/svg','polygon');shape.setAttribute('points',window.Geometry.flattenRing(poly).map(p=>{const s=window.Geometry.toScreen(p,app.state.pan,app.state.zoom);return `${s.x},${s.y}`;}).join(' '));shape.setAttribute('fill','rgba(0,122,204,.08)');shape.setAttribute('stroke','var(--bg-active)');shape.setAttribute('stroke-width','2');shape.setAttribute('stroke-dasharray','6 4');overlay.append(shape);}
    }
    function schedule(){if(refreshQueued)return;refreshQueued=true;requestAnimationFrame(()=>{refreshQueued=false;refresh();});}
    app.areaWorkflow={activate,beginDrawing,click,close,refresh:schedule};
    const render=app.render.bind(app);app.render=function(...args){const result=render(...args);schedule();return result;};
    const setMode=app.setMode.bind(app);app.setMode=function(mode){if(mode!==app.state.mode)close();return setMode(mode);};
    query('#area-define-mode').onclick=activate;query('#area-return-draw').onclick=beginDrawing;
    query('#area-find-undefined').onclick=()=>{findUndefined=!findUndefined;query('#area-find-undefined').setAttribute('aria-pressed',String(findUndefined));refresh();notify(findUndefined?'Undefined outlines highlighted. Classification is optional.':'Undefined highlights hidden.');};
    // Dialog input must not trigger drawing shortcuts. Escape exits the optional tool.
    document.addEventListener('keydown',event=>{
      if(event.key==='Escape' && (chooser || app.state.mode==='define-area')){event.preventDefault();event.stopImmediatePropagation();beginDrawing();query('#area-return-draw').focus();return;}
      if(chooser?.contains(event.target)){event.stopImmediatePropagation();if(event.key==='Tab'){const controls=[...chooser.querySelectorAll('button,input,select,summary')].filter(e=>!e.disabled && e.getClientRects().length);const first=controls[0],last=controls.at(-1);if(event.shiftKey && document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey && document.activeElement===last){event.preventDefault();first.focus();}}}
    },true);
    new ResizeObserver(()=>{if(chooser)close();schedule();}).observe(canvas);
    window.addEventListener('resize',()=>close());
    refresh();
  }
  if(window.app)boot();else window.addEventListener('load',boot);
})();
