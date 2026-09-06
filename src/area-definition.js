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
    // The code library and the legacy area operations move into a sheet over the
    // panel instead of sitting inline under the list: the canvas chooser is the
    // definition surface now. The controls keep their IDs, handlers, state and
    // their #panel-define-area ancestry; only their place in the flow changes.
    const advanced = document.createElement('div');
    advanced.id = 'area-advanced-tools';
    advanced.hidden = true;
    advanced.setAttribute('role', 'dialog');
    advanced.setAttribute('aria-modal', 'true');
    advanced.setAttribute('aria-label', 'Edit areas');
    const advancedHead = document.createElement('div');
    advancedHead.className = 'area-advanced-head';
    advancedHead.innerHTML = '<strong>Edit areas</strong>';
    const advancedClose = document.createElement('button');
    advancedClose.type = 'button';
    advancedClose.className = 'area-advanced-close';
    advancedClose.setAttribute('aria-label', 'Close the area editor');
    advancedClose.innerHTML = '&times;';
    advancedHead.append(advancedClose);
    const advancedBody = document.createElement('div');
    advancedBody.className = 'area-advanced-body';
    [...panel.children].forEach(node => advancedBody.append(node));
    advanced.append(advancedHead, advancedBody);
    buildEditSheet(advancedBody);
    const surface = document.createElement('section');
    surface.className = 'area-workflow';
    surface.innerHTML = `<div class="area-workflow-note" id="area-workflow-status" role="status"></div>
      <div class="area-palette" id="area-palette" role="listbox" aria-label="Area types"></div>
      <div class="area-workflow-foot">
      <div class="area-workflow-links"><button id="area-new" type="button">New area</button><span aria-hidden="true">·</span><button id="area-find-undefined" type="button" aria-pressed="false">Find undefined</button><span aria-hidden="true">·</span><button id="area-open-library" type="button">Edit areas…</button></div></div>`;
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
    let priorSelection = null, refreshQueued = false;
    let armedCode = null, dragCode = null, dragGhost = null, hoverPoly = null;
    let paletteSignature = '';
    const collapsedGroups = new Set();
    const query = selector => surface.querySelector(selector);
    function notify(message) { query('#area-workflow-status').textContent = message; }
    let advancedOrigin = null;
    function openAdvanced(trigger) {
      close();
      advancedOrigin = trigger || null;
      advanced.hidden = false;
      advancedClose.focus();
    }
    function closeAdvanced(restoreFocus = false) {
      if (advanced.hidden) return;
      advanced.hidden = true;
      if (restoreFocus && advancedOrigin?.isConnected) advancedOrigin.focus();
      advancedOrigin = null;
    }
    /* Re-nest the moved controls into three plain sections. Anything that
       cannot be found is skipped, so a future bundle that drops a control
       degrades instead of throwing. */
    function buildEditSheet(host) {
      const grab = selector => host.querySelector(selector);
      const section = (title, hint) => {
        const el = document.createElement('section');
        el.className = 'area-edit-group';
        el.innerHTML = '<h3 class="area-edit-title">' + title + '</h3>' +
          (hint ? '<p class="area-edit-hint">' + hint + '</p>' : '');
        return el;
      };
      const ops = section('Area operations', 'Acts on the areas selected on the canvas.');
      const opRow = document.createElement('div');
      opRow.className = 'area-edit-actions';
      for (const id of ['btn-redefine-area', 'btn-clone-area', 'btn-reopen-area', 'btn-detect-regions']) {
        const btn = grab('#' + id);
        if (btn) opRow.append(btn);
      }
      ops.append(opRow);

      const labels = section('Label defaults', 'Applied to areas you define from now on.');
      const post = grab('.auto-post');
      if (post) {
        post.querySelector('.auto-post-title')?.remove();
        labels.append(post);
      }

      const library = section('Code library');
      for (const selector of ['#area-code-search', '.area-tree', '#area-pending-code', '#area-name-input']) {
        const el = grab(selector);
        if (el) library.append(el);
      }
      const libRow = document.createElement('div');
      libRow.className = 'area-edit-actions';
      for (const id of ['btn-add-area-code', 'btn-edit-area', 'btn-apply-area']) {
        const btn = grab('#' + id);
        if (btn) libRow.append(btn);
      }
      library.append(libRow);

      host.replaceChildren(ops, labels, library);
    }

    function editable(poly) { return app.isEntityVisible(poly) && !app.isEntityLocked(poly); }

    /* ---- Area-type palette -------------------------------------------------
       Every record in app.areaCodes carries the colour it paints on canvas, so
       the palette is that colour list. Picking and applying are one gesture:
       drag a swatch onto an outline, or arm a swatch and click outlines. */
    function codeColor(entry) { return entry?.color || entry?.fillColor || '#858585'; }
    function groupLabel(group) { return labels[group] || group; }
    function usageCount(code) { return app.state.polygons.filter(p => p.type === code).length; }
    function paletteGroups() {
      const seen = [];
      for (const entry of app.areaCodes) if (entry.group !== 'UND' && !seen.includes(entry.group)) seen.push(entry.group);
      return seen;
    }
    function assignTo(poly, code) {
      if (!poly || !app.state.polygons.includes(poly)) return false;
      if (!editable(poly)) { notify('Show and unlock this area before changing its definition.'); return false; }
      const entry = app.areaCodes.find(c => c.code === code);
      // Same transaction the Apply path uses: one undo entry, labels left to defaults.
      app.defineAreaTarget(poly, code, entry?.name || code);
      return true;
    }
    function setArmed(code) {
      const next = armedCode === code ? null : code;
      armedCode = next;
      if (next) activate();
      notify(next ? 'Click an outline to assign ' + (app.areaCodes.find(c => c.code === next)?.name || next) + '. Escape stops.' : '');
      paletteSignature = '';
      schedule();
    }
    /* Context menu for a type. Options first, editing last, so the common
       cases do not require opening a dialog at all. */
    function showTypeMenu(entry, clientX, clientY) {
      const selectedIds = [...app.state.selectedPolyIds];
      const usedBy = app.state.polygons.filter(p => p.type === entry.code);
      const label = entry.name || entry.code;
      const items = [];
      if (selectedIds.length) items.push({
        action: 'assign',
        icon: entry.code === 'UND' ? 'ph-eraser' : 'ph-paint-bucket',
        label: (entry.code === 'UND' ? 'Clear ' : 'Assign to ') + selectedIds.length +
          (selectedIds.length === 1 ? ' selected area' : ' selected areas'),
        run: () => {
          // Re-resolve each polygon: defineAreaTarget can swap state.polygons
          // for a fresh array, which would strand a captured object list.
          let done = 0;
          for (const id of selectedIds) {
            const poly = app.state.polygons.find(p => p.id === id);
            if (poly && assignTo(poly, entry.code)) done++;
          }
          notify(done + (done === 1 ? ' area set to ' : ' areas set to ') + label + '.');
          schedule();
        }
      });
      items.push({
        action: 'arm', icon: 'ph-cursor-click',
        label: armedCode === entry.code ? 'Stop assigning' : 'Assign by clicking outlines',
        run: () => setArmed(entry.code)
      });
      if (usedBy.length) items.push({
        action: 'select', icon: 'ph-selection-all',
        label: 'Select the ' + usedBy.length + (usedBy.length === 1 ? ' area' : ' areas') + ' using it',
        run: () => {
          app.state.selectedPolyIds = new Set(usedBy.map(p => p.id));
          app.ui.updateAreaActionStates();
          app.render();
          notify('Selected ' + usedBy.length + (usedBy.length === 1 ? ' area' : ' areas') + ' using ' + label + '.');
        }
      });
      items.push({ separator: true });
      items.push({ action: 'edit', icon: 'ph-pencil-simple', label: 'Edit type...',
        run: () => app.ui.showAreaDefinitionEditor(entry.code) });
      items.push({ action: 'new', icon: 'ph-plus', label: 'New type...',
        run: () => app.ui.showAddAreaCode() });
      items.push({ action: 'delete', icon: 'ph-trash', label: 'Delete type...', run: async () => {
        // UND is the sentinel the app uses for an unclassified outline; removing
        // it would leave nothing to fall back to.
        if (entry.code === 'UND') { notify('Undefined is how unclassified outlines are marked. It cannot be deleted.'); return; }
        const inUse = app.state.polygons.filter(p => p.type === entry.code).map(p => p.id);
        const ok = await app.ui.confirmDialog(inUse.length
          ? 'Delete ' + label + '? ' + inUse.length + (inUse.length === 1 ? ' area using it becomes unclassified.' : ' areas using it become unclassified.')
          : 'Delete ' + label + ' from the code library?');
        if (!ok) return;
        for (const id of inUse) {
          const poly = app.state.polygons.find(p => p.id === id);
          if (poly) app.defineAreaTarget(poly, 'UND', 'Undefined Area');
        }
        if (armedCode === entry.code) setArmed(entry.code);
        app.setAreaCodes(app.areaCodes.filter(c => c.code !== entry.code));
        try { localStorage.setItem('sketch.areaCodes', JSON.stringify(app.areaCodes)); } catch (_) { /* unavailable */ }
        app.ui.populateAreaCodes(document.getElementById('area-code-search')?.value || '');
        paletteSignature = '';
        notify(label + ' deleted from the library.');
        app.render();
        schedule();
      } });
      const anchor = { getBoundingClientRect: () => ({ left: clientX, bottom: clientY }) };
      app.ui.showCommandPopup(anchor, items, 'sketch-context-menu');
    }

    function makeTile(entry, isClear) {
      const tile = document.createElement('button');
      tile.type = 'button';
      tile.className = 'area-tile';
      tile.dataset.code = entry.code;
      tile.setAttribute('role', 'option');
      tile.setAttribute('aria-selected', String(armedCode === entry.code));
      const count = usageCount(entry.code);
      tile.innerHTML = `<span class="area-tile-swatch" style="background:${esc(codeColor(entry))}"></span>` +
        `<span class="area-tile-name">${esc(isClear ? 'Undefined · clear' : (entry.name || entry.code))}</span>` +
        (count && !isClear ? `<span class="area-tile-used">${count}</span>` : '') +
        `<span class="area-tile-code">${esc(entry.code)}</span>`;
      tile.title = isClear
        ? 'Drag onto an area to clear its classification. Right-click for options.'
        : 'Drag onto an outline, or click to arm. Right-click for options.';
      tile.addEventListener('pointerdown', startTileDrag);
      /* Right-click a type to edit the code itself - name, colours, factor -
         without drilling into the edit sheet. */
      tile.addEventListener('contextmenu', event => {
        event.preventDefault();
        event.stopPropagation();
        showTypeMenu(entry, event.clientX, event.clientY);
      });
      tile.addEventListener('keydown', event => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        setArmed(entry.code);
      });
      return tile;
    }
    function paintPalette() {
      const host = query('#area-palette');
      if (!host) return;
      // A rebuild mid-drag would detach the tile holding the pointer capture.
      if (dragCode) return;
      const matches = app.areaCodes.filter(entry => entry.code !== 'UND');
      const undefinedEntry = app.areaCodes.find(c => c.code === 'UND') || { code: 'UND', name: 'Undefined Area', color: '#E53E3E' };
      const signature = JSON.stringify([[...collapsedGroups], armedCode,
        matches.map(c => [c.code, c.name, codeColor(c), usageCount(c.code)])]);
      if (signature === paletteSignature) return;
      paletteSignature = signature;
      const scroll = host.scrollTop;
      host.replaceChildren();
      // areaCodes is not group-contiguous (OTH sits either side of LAND/SITE),
      // so collect each group rather than heading on adjacency.
      for (const group of paletteGroups()) {
        const inGroup = matches.filter(entry => entry.group === group);
        if (!inGroup.length) continue;
        const collapsed = collapsedGroups.has(group);
        const head = document.createElement('button');
        head.type = 'button';
        head.className = 'area-tile-group';
        head.dataset.group = group;
        head.setAttribute('aria-expanded', String(!collapsed));
        head.innerHTML = '<i class="ph ' + (collapsed ? 'ph-caret-right' : 'ph-caret-down') + '" aria-hidden="true"></i>' +
          '<span class="area-group-name">' + esc(groupLabel(group)) + '</span>' +
          '<span class="area-group-count">' + inGroup.length + '</span>';
        head.onclick = () => {
          if (collapsed) collapsedGroups.delete(group); else collapsedGroups.add(group);
          paletteSignature = '';
          paintPalette();
        };
        host.append(head);
        if (!collapsed) for (const entry of inGroup) host.append(makeTile(entry, false));
      }
      if (!matches.length) {
        const empty = document.createElement('div');
        empty.className = 'area-palette-empty';
        empty.textContent = 'No area types in the library.';
        host.append(empty);
      }
      host.append(makeTile(undefinedEntry, true));
      host.scrollTop = scroll;
    }

    /* Drag targets: the canvas resolves through the same point-in-polygon test
       the click path uses, so drag and click always agree about the outline. */
    function polyAtClient(clientX, clientY) {
      const rect = canvas.getBoundingClientRect();
      if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) return null;
      const world = window.Geometry.toWorld({ x: clientX - rect.left, y: clientY - rect.top }, app.state.pan, app.state.zoom);
      return app.state.polygons.filter(poly => editable(poly) && window.Geometry.pointInPolygon(world, window.Geometry.flattenRing(poly)))
        .sort((a, b) => Math.abs(a.area ?? a.gross ?? 0) - Math.abs(b.area ?? b.gross ?? 0))[0] || null;
    }
    function startTileDrag(event) {
      if (event.button != null && event.button !== 0) return;
      const tile = event.currentTarget, code = tile.dataset.code;
      const startX = event.clientX, startY = event.clientY;
      let moved = false;
      try { tile.setPointerCapture(event.pointerId); } catch (_) { /* pointer may be gone */ }
      const move = moveEvent => {
        if (!moved && Math.abs(moveEvent.clientX - startX) + Math.abs(moveEvent.clientY - startY) < 5) return;
        if (!moved) {
          moved = true; dragCode = code;
          const entry = app.areaCodes.find(c => c.code === code) || { code, name: code };
          dragGhost = document.createElement('div');
          dragGhost.className = 'area-drag-ghost';
          dragGhost.innerHTML = `<i style="background:${esc(codeColor(entry))}"></i>${esc(entry.name || code)} <small>${esc(code)}</small>`;
          document.body.append(dragGhost);
          document.body.classList.add('area-dragging');
        }
        dragGhost.style.left = moveEvent.clientX + 'px';
        dragGhost.style.top = moveEvent.clientY + 'px';
        const overPoly = polyAtClient(moveEvent.clientX, moveEvent.clientY);
        if (overPoly !== hoverPoly) { hoverPoly = overPoly; paintOverlay(); }
      };
      const finish = upEvent => {
        try { tile.releasePointerCapture(event.pointerId); } catch (_) { /* already released */ }
        tile.removeEventListener('pointermove', move);
        tile.removeEventListener('pointerup', finish);
        tile.removeEventListener('pointercancel', finish);
        document.body.classList.remove('area-dragging');
        if (dragGhost) { dragGhost.remove(); dragGhost = null; }
        const wasDragging = moved;
        dragCode = null; hoverPoly = null;
        if (!wasDragging) { setArmed(code); return; }
        const target = polyAtClient(upEvent.clientX, upEvent.clientY);
        if (target && assignTo(target, code)) {
          notify(code === 'UND' ? 'Classification cleared.' : 'Area defined. Drag another type, or click one to keep assigning.');
        }
        paintOverlay();
        schedule();
      };
      tile.addEventListener('pointermove', move);
      tile.addEventListener('pointerup', finish);
      tile.addEventListener('pointercancel', finish);
    }

    /* Canvas overlay: undefined-region highlights plus the live drop preview. */
    function paintOverlay() {
      overlay.replaceChildren();
      overlay.setAttribute('viewBox', `0 0 ${canvas.clientWidth} ${canvas.clientHeight}`);
      const ring = (poly, stroke, fill, dash) => {
        const shape = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        shape.setAttribute('points', window.Geometry.flattenRing(poly).map(pt => {
          const screen = window.Geometry.toScreen(pt, app.state.pan, app.state.zoom);
          return `${screen.x},${screen.y}`;
        }).join(' '));
        shape.setAttribute('fill', fill);
        shape.setAttribute('stroke', stroke);
        shape.setAttribute('stroke-width', '2');
        if (dash) shape.setAttribute('stroke-dasharray', dash);
        overlay.append(shape);
      };
      if (findUndefined) for (const poly of app.state.polygons.filter(p => p.type === 'UND' && app.isEntityVisible(p))) {
        ring(poly, 'var(--bg-active)', 'rgba(0,122,204,.08)', '6 4');
      }
      if (dragCode && hoverPoly) {
        const color = codeColor(app.areaCodes.find(c => c.code === dragCode));
        ring(hoverPoly, color, color + '33');
      }
    }
    function close(restoreFocus = false) {
      if (!chooser) return;
      chooser.remove(); chooser = null; target = null; targetPage = null;
      if (priorSelection) app.state.selectedPolyIds = new Set(priorSelection.filter(id => app.state.polygons.some(p => p.id === id)));
      priorSelection = null;
      app.ui.updateAreaActionStates(); app.render();
      if (restoreFocus && origin?.isConnected) origin.focus();
    }
    function activate() {
      close(); closeAdvanced();
      if (app.state.mode === 'draw-exterior' || app.state.mode === 'draw-interior') previousDraw = app.state.mode;
      app.setMode('define-area');
      app.ui.showPanel('panel-define-area');
      notify('Click inside a closed outline. Escape returns to drawing.');
    }
    function beginDrawing() { close(); closeAdvanced(); disarm(); app.setMode(previousDraw); notify('Drawing mode. Area definition remains optional.'); }
    function disarm() {
      if (!armedCode) return;
      armedCode = null;
      paletteSignature = '';
      schedule();
    }
    function open(poly, point, trigger) {
      close();
      if (!editable(poly)) { notify('Show and unlock this area before editing its definition.'); return; }
      target = poly; targetPage = app.state.polygons; origin = trigger || null;
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
      if(armedCode){if(assignTo(candidates[0],armedCode))notify('Assigned. Click another outline, or Escape to stop.');schedule();return;}
      const screen=window.Geometry.toScreen(worldPt,app.state.pan,app.state.zoom),bounds=canvas.getBoundingClientRect();
      open(candidates[0],{x:bounds.left+screen.x,y:bounds.top+screen.y});
    }
    function refresh() {
      if(chooser && (targetPage!==app.state.polygons || !app.state.polygons.includes(target) || !editable(target)))close();
      paintOverlay();
      paintPalette();
    }
    function schedule(){if(refreshQueued)return;refreshQueued=true;requestAnimationFrame(()=>{refreshQueued=false;refresh();});}
    app.areaWorkflow={activate,beginDrawing,click,close,open,polyAt:polyAtClient,refresh:schedule};
    const render=app.render.bind(app);app.render=function(...args){const result=render(...args);schedule();return result;};
    const setMode=app.setMode.bind(app);app.setMode=function(mode){if(mode!==app.state.mode)close();if(mode!=='define-area')disarm();return setMode(mode);};
    query('#area-new').onclick = () => {
      const undefinedOutlines = app.state.polygons.filter(p => p.type === 'UND' && app.isEntityVisible(p));
      if (undefinedOutlines.length) {
        activate();
        findUndefined = true;
        query('#area-find-undefined').setAttribute('aria-pressed', 'true');
        notify(undefinedOutlines.length + (undefinedOutlines.length === 1 ? ' outline is' : ' outlines are') +
          ' waiting. Click one to define it, or drag a type onto it.');
      } else {
        beginDrawing();
        notify('Draw a closed outline, then drag a type onto it.');
      }
      schedule();
    };
    query('#area-open-library').onclick=event=>openAdvanced(event.currentTarget);
    /* The Calcs tree is the areas list; right-click a row to edit that area. */
    document.addEventListener('contextmenu', event => {
      const node = event.target.closest?.('#calcs-tree [data-poly-id]');
      if (!node) return;
      const poly = app.state.polygons.find(p => String(p.id) === node.dataset.polyId);
      if (!poly) return;
      event.preventDefault();
      open(poly, { x: event.clientX, y: event.clientY }, node);
    });
    const calcsTree = document.getElementById('calcs-tree');
    if (calcsTree && !document.getElementById('area-calcs-hint')) {
      const hint = document.createElement('div');
      hint.id = 'area-calcs-hint';
      hint.className = 'area-calcs-hint';
      hint.textContent = 'Right-click an area here or on the drawing to edit its definition.';
      calcsTree.insertAdjacentElement('afterend', hint);
    }
    advancedClose.onclick=()=>closeAdvanced(true);
    query('#area-find-undefined').onclick=()=>{findUndefined=!findUndefined;query('#area-find-undefined').setAttribute('aria-pressed',String(findUndefined));refresh();notify(findUndefined?'Undefined outlines highlighted. Classification is optional.':'Undefined highlights hidden.');};
    // Dialog input must not trigger drawing shortcuts. Escape exits the optional tool.
    document.addEventListener('keydown',event=>{
      if(event.key==='Escape' && !advanced.hidden){event.preventDefault();event.stopImmediatePropagation();closeAdvanced(true);return;}
      if(event.key==='Escape' && (chooser || app.state.mode==='define-area')){event.preventDefault();event.stopImmediatePropagation();beginDrawing();return;}
      if(chooser?.contains(event.target)){event.stopImmediatePropagation();if(event.key==='Tab'){const controls=[...chooser.querySelectorAll('button,input,select,summary')].filter(e=>!e.disabled && e.getClientRects().length);const first=controls[0],last=controls.at(-1);if(event.shiftKey && document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey && document.activeElement===last){event.preventDefault();first.focus();}}}
    },true);
    new ResizeObserver(()=>{if(chooser)close();schedule();}).observe(canvas);
    window.addEventListener('resize',()=>close());
    refresh();
  }
  if(window.app)boot();else window.addEventListener('load',boot);
})();
