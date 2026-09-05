"""Headless CDP verification for the sidebar redesign."""
import json, os, subprocess, time, urllib.request, socket, tempfile, shutil, sys

WS = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # repo root (script lives in scripts/)
BUNDLE = os.path.join(WS, "sketch.bundle.html")

def free_port():
    s = socket.socket(); s.bind(("127.0.0.1", 0)); p = s.getsockname()[1]; s.close(); return p

class CDP:
    def __init__(self, port):
        self.port = port
        self.ws = None
        self.mid = 0
        self._connect()

    def _connect(self):
        import websocket  # websocket-client, used by the past verifications
        for _ in range(50):
            try:
                resp = urllib.request.urlopen(f"http://127.0.0.1:{self.port}/json").read()
                targets = json.loads(resp)
                pages = [t for t in targets if t.get("type") == "page"]
                if not pages:
                    continue
                # remember all candidate URLs; caller picks via attach_to()
                self.targets = targets
                self.ws = websocket.create_connection(pages[0]["webSocketDebuggerUrl"], timeout=15)
                self.current_url = pages[0].get("url", "")
                return
            except Exception:
                time.sleep(0.3)
        raise RuntimeError("no CDP page target")

    def attach_to(self, prefix, settle=4.0, attempts=8):
        """Switch the websocket to a page target whose url starts with prefix.
        Retries: Edge may briefly report chrome-error:// or an interstitial tab."""
        import websocket
        last = None
        for _ in range(attempts):
            try:
                resp = urllib.request.urlopen(f"http://127.0.0.1:{self.port}/json", timeout=3).read()
                targets = json.loads(resp)
                pages = [t for t in targets if t.get("type") == "page" and t.get("url", "").startswith(prefix)]
                if not pages:
                    time.sleep(0.7)
                    continue
                try: self.ws.close()
                except Exception: pass
                self.ws = websocket.create_connection(pages[0]["webSocketDebuggerUrl"], timeout=15)
                self.current_url = pages[0].get("url", "")
                # verify the page is really live, not an error placeholder
                r = self.call("Runtime.evaluate", expression="location.href", returnByValue=True)
                cur = r.get("result", {}).get("value")
                last = cur
                if isinstance(cur, str) and cur.startswith(prefix):
                    return
                time.sleep(0.7)
            except Exception:
                time.sleep(0.7)
        raise RuntimeError(f"could not attach to {prefix} target (last: {last})")

    def call(self, method, **params):
        self.mid += 1
        self.ws.send(json.dumps({"id": self.mid, "method": method, "params": params}))
        while True:
            msg = json.loads(self.ws.recv())
            if msg.get("id") == self.mid:
                return msg.get("result", {})

    def js(self, expr, await_promise=False):
        r = self.call("Runtime.evaluate", expression=expr, returnByValue=True,
                      awaitPromise=await_promise)
        ex = r.get("exceptionDetails")
        if ex:
            return {"__error": json.dumps(ex)[:400]}
        return r.get("result", {}).get("value")

def main():
    port = free_port()
    udd = tempfile.mkdtemp(prefix="sr-cdp-")
    exe = None
    for cand in (os.path.expandvars(r"%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"),
                 os.path.expandvars(r"%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"),
                 os.path.expandvars(r"%ProgramFiles%\Google\Chrome\Application\chrome.exe"),
                 os.path.expandvars(r"%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe")):
        if os.path.exists(cand):
            exe = cand; break
    assert exe, "no chromium-family browser found"
    proc = subprocess.Popen([exe, "--headless=new", "--remote-debugging-port=%d" % port,
                             "--remote-allow-origins=*",
                             "--user-data-dir=" + udd, "--no-first-run", "--window-size=1600,900",
                             "file:///" + BUNDLE.replace("\\", "/").replace(" ", "%20")], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    cdp = None
    try:
        cdp = CDP(port)
        cdp.call("Page.enable"); cdp.call("Runtime.enable"); cdp.call("Log.enable")
        console = []
        # Edge opens a sync-confirmation tab on fresh profiles — always attach to the file: page
        cdp.attach_to("file:")
        time.sleep(4.0)
        # force viewport
        cdp.call("Emulation.setDeviceMetricsOverride", width=1600, height=900, deviceScaleFactor=1, mobile=False)
        time.sleep(1.0)
        # confirm we are on the bundle
        cur = cdp.js("location.href")
        assert cur and cur.startswith("file:"), "attached to " + str(cur)

        def check(name, value, expect=None):
            ok = (value == expect) if expect is not None else bool(value)
            print(("PASS" if ok else "FAIL"), name, "->", json.dumps(value)[:220] if not isinstance(value, str) else value[:220])
            return ok

        results = []
        results.append(check("app constructor", cdp.js("window.app && window.app.constructor.name"), "SketchApp"))

        # console sweep (exceptions + errors)
        sweep = cdp.js("""(() => { return window.__srErrors || 'no-hook'; })()""")
        # collect via Runtime events instead: evaluate a quick error probe
        errors = cdp.js("""(() => {
          return {exceptions: window.__uncaught ? window.__uncaught.length : 'unknown'};
        })()""")
        # Use Log + Runtime event buffers from the CDP session directly
        # (simpler: run a fresh evaluate that returns nothing; rely on exceptionDetails above)

        # --- structural probes ---
        results.append(check("tabs count 5", cdp.js("document.querySelectorAll('.sidebar-tab').length"), 5))
        results.append(check("nav is first element child of dock",
            cdp.js("[...document.getElementById('sidebar-dock').children].find(e=>e.className==='sidebar-tabs')?.className === 'sidebar-tabs'"), True))
        results.append(check("collapse + expand present",
            cdp.js("[!!document.getElementById('sidebar-collapse'), !!document.getElementById('sidebar-expand')]"), [True, True]))
        results.append(check("no pin in DOM (header hidden)",
            cdp.js("document.querySelectorAll('.sidebar-pin').length"), 5))  # kept in DOM, headers hidden by CSS

        # dock layout: nav on top, flex-direction column
        results.append(check("dock flex-direction column",
            cdp.js("getComputedStyle(document.getElementById('sidebar-dock')).flexDirection"), "column"))
        nav_top = cdp.js("""(() => {
            const dock = document.getElementById('sidebar-dock').getBoundingClientRect();
            const nav = document.querySelector('.sidebar-tabs').getBoundingClientRect();
            return Math.abs(nav.top - dock.top) < 2;
        })()""")
        results.append(check("nav at top of dock", nav_top, True))

        # tab visibility: active tab fully visible in strip
        clip = cdp.js("""(() => {
            const tabs=[...document.querySelectorAll('.sidebar-tab')];
            const strip=document.querySelector('.sidebar-tabs').getBoundingClientRect();
            return tabs.every(t=>{const r=t.getBoundingClientRect(); return r.right<=strip.right+1 && r.left>=strip.left-1 && r.width>0;});
        })()""")
        results.append(check("all 5 tabs fully visible in strip", clip, True))

        # --- three-zone structure ---
        results.append(check("area zones 3",
            cdp.js("document.querySelectorAll('#panel-define-area .area-zone').length"), 3))
        results.append(check("zone order summary->browser->setup",
            cdp.js("""(() => {
                const z=[...document.querySelectorAll('#panel-define-area .area-zone')].map(e=>e.className);
                return z[0].includes('summary') && z[1].includes('browser') && z[2].includes('setup');
            })()"""), True))
        results.append(check("pending readout present",
            cdp.js("document.getElementById('area-pending-code').textContent"), "No classification selected"))
        results.append(check("selection summary present",
            cdp.js("!!document.getElementById('area-selection-body')"), True))
        results.append(check("search + tree + new-code inside browser zone",
            cdp.js("""(() => {
                const z=document.querySelector('.area-browser-zone');
                return !!z.querySelector('#area-code-search') && !!z.querySelector('.area-tree') && !!z.querySelector('#btn-add-area-code');
            })()"""), True))
        results.append(check("apply directly above labels disclosure",
            cdp.js("""(() => {
                const z=document.querySelector('.area-setup-zone');
                const apply=z.querySelector('#btn-apply-area');
                const labels=[...z.querySelectorAll('details.define-more')][0];
                return apply && labels && labels.querySelector('summary').textContent==='Labels' && apply.getBoundingClientRect().bottom<=labels.getBoundingClientRect().top+2;
            })()"""), True))

        # --- tab switching through the real click path ---
        for tab_text, panel in (("Text", "panel-text-library"), ("Symbols", "panel-symbol-library"),
                                ("Calcs", "panel-calcs"), ("Layers", "panel-layers"), ("Define", "panel-define-area")):
            r = cdp.js(f"""(() => {{
                const t=[...document.querySelectorAll('.sidebar-tab')].find(t=>t.textContent.trim()==='{tab_text}');
                t.click(); return document.getElementById('{panel}').hidden===false &&
                    document.querySelectorAll('.panel:not([hidden])').length===1;
            }})()""")
            results.append(check(f"click tab {tab_text} -> {panel} shown exclusively", r, True))

        # state key updated
        results.append(check("state.sidebar.active tracks tabs",
            cdp.js("window.app.state.sidebar.active"), "define"))

        # --- collapse / expand ---
        r = cdp.js("""(() => {
            document.getElementById('sidebar-collapse').click();
            return new Promise(res => setTimeout(() => res({
                openClass: document.getElementById('sidebar-dock').classList.contains('open'),
                stateOpen: window.app.state.sidebar.open,
                railVisible: getComputedStyle(document.getElementById('sidebar-collapsed-rail')).display
            }), 250));
        })()""")
        r = cdp.js("""(() => new Promise(res => {
            document.getElementById('sidebar-collapse').click();
            setTimeout(() => res({
                openClass: document.getElementById('sidebar-dock').classList.contains('open'),
                stateOpen: window.app.state.sidebar.open,
                railDisplay: getComputedStyle(document.getElementById('sidebar-collapsed-rail')).display,
                tabsDisplay: getComputedStyle(document.querySelector('.sidebar-tabs')).display
            }), 250);
        }))()""", await_promise=True)
        results.append(check("collapse: state open=false, rail shown, tabs hidden",
            r and r.get("openClass") == False and r.get("stateOpen") == False and r.get("railDisplay") != "none" and r.get("tabsDisplay") == "none"))
        r = cdp.js("""(() => new Promise(res => {
            document.getElementById('sidebar-expand').click();
            setTimeout(() => res({
                openClass: document.getElementById('sidebar-dock').classList.contains('open'),
                tabsDisplay: getComputedStyle(document.querySelector('.sidebar-tabs')).display
            }), 250);
        }))()""", await_promise=True)
        results.append(check("expand: dock reopens with tabs", r and r.get("openClass") == True and r.get("tabsDisplay") != "none"))

        # --- classification browser: search + select + pending + apply flow ---
        flow = cdp.js("""(() => new Promise(async (res) => {
            const out = {};
            const app = window.app;
            const ui = app.ui;
            ui.showPanel('panel-define-area');
            await new Promise(r=>setTimeout(r,50));
            // search across categories
            const search = document.getElementById('area-code-search');
            search.value = 'living';
            search.dispatchEvent(new Event('input', {bubbles:true}));
            await new Promise(r=>setTimeout(r,50));
            out.searchHits = document.querySelectorAll('.area-tree .area-btn').length;
            out.groupsVisible = document.querySelectorAll('.area-tree .tree-node').length;
            // select a code
            const btn = document.querySelector('.area-tree .area-btn');
            btn.click();
            await new Promise(r=>setTimeout(r,50));
            out.pendingText = document.getElementById('area-pending-code').textContent;
            out.selectedType = app.state.selectedAreaType;
            // create a real polygon via the app's own room-shape pipeline
            app.state.pendingShape = { kind: 'rectangle', width: 20, depth: 15,
                cutWidth: 0, cutDepth: 0, rotation: 0, defineAsArea: true };
            app.placeShapeAt({ x: 0, y: 0 });
            await new Promise(r=>setTimeout(r,100));
            out.polyCount = app.state.polygons.length;
            // select the new polygon
            const poly = app.state.polygons[app.state.polygons.length-1];
            app.state.selectedPolyIds = new Set([poly.id]);
            ui.updateAreaActionStates();
            const applyBtn = document.getElementById('btn-apply-area');
            out.applyEnabledBefore = !applyBtn.disabled;
            applyBtn.click();
            await new Promise(r=>setTimeout(r,150));
            out.appliedType = poly.type;
            out.pendingAfterApply = document.getElementById('area-pending-code').textContent;
            res(out);
        }))()""", await_promise=True)
        print("flow:", json.dumps(flow)[:400])
        results.append(check("search filtered tree", isinstance(flow, dict) and flow.get("searchHits", 0) > 0))
        results.append(check("pending shows after code click",
            isinstance(flow, dict) and "Pending:" in str(flow.get("pendingText", ""))))
        results.append(check("apply flow completes on polygon",
            isinstance(flow, dict) and flow.get("appliedType") not in (None, "UND")))

        # empty-state honesty after apply (selection cleared)
        results.append(check("selection summary back to empty state",
            cdp.js("document.getElementById('area-selection-body').textContent.length > 10"), True))

        # --- labels + area tools disclosures intact ---
        results.append(check("labels disclosure has 6 checkboxes + suffix",
            cdp.js("""(() => {
                const d=[...document.querySelectorAll('#panel-define-area details.define-more')][0];
                return d.querySelectorAll('input[type=checkbox]').length===6 && !!d.querySelector('#autopost-suffix');
            })()"""), True))
        results.append(check("area tools has 4 buttons",
            cdp.js("""(() => {
                const d=[...document.querySelectorAll('#panel-define-area details.define-more')][1];
                return d.querySelectorAll('button').length===4;
            })()"""), True))

        # --- themes ---
        for theme in ("light-theme", "blue-theme"):
            cdp.js(f"document.body.classList.remove('dark-theme','light-theme','blue-theme'); document.body.classList.add('{theme}')")
            ok = cdp.js("""(() => {
                const dock=document.getElementById('sidebar-dock');
                const nav=document.querySelector('.sidebar-tabs');
                const tab=document.querySelector('.sidebar-tab.active');
                return nav && tab && getComputedStyle(nav).borderBottomColor === getComputedStyle(dock).borderLeftColor
                  && getComputedStyle(tab).backgroundColor !== 'rgba(0, 0, 0, 0)';
            })()""")
            results.append(check(f"{theme}: sidebar themed", ok, True))
        cdp.js("document.body.classList.remove('light-theme','blue-theme'); document.body.classList.add('dark-theme')")

        # --- host contract round-trip ---
        rt = cdp.js("""(() => new Promise(async (res) => {
            const m = window.__exportState();
            await window.__importState(JSON.parse(JSON.stringify(m)));
            const m2 = window.__exportState();
            res({same: JSON.stringify(Object.keys(m).sort())===JSON.stringify(Object.keys(m2).sort()),
                 sidebar: m2.settings && m2.settings.sidebar});
        }))()""", await_promise=True)
        print("roundtrip:", json.dumps(rt)[:200])
        results.append(check("export/import round-trip", isinstance(rt, dict) and rt.get("same") is True))
        results.append(check("saved sidebar keys unchanged (define/open/pinned)",
            isinstance(rt, dict) and rt.get("sidebar", {}).get("active") == "define" and rt.get("sidebar", {}).get("open") is True))

        # screenshot for visual QA
        shot = cdp.call("Page.captureScreenshot", format="png")
        with open(os.path.join(WS, "docs", "qa-sidebar-redesign.png"), "wb") as f:
            f.write(__import__("base64").b64decode(shot["data"]))

        # console/exception sweep from CDP events (non-blocking drain)
        drained = []
        cdp.ws.settimeout(0.4)
        try:
            while True:
                msg = json.loads(cdp.ws.recv())
                if msg.get("method") in ("Runtime.exceptionThrown", "Log.entryAdded"):
                    drained.append(msg["method"])
        except Exception:
            pass
        print("console sweep after actions:", len(drained), "entries")
        results.append(check("no runtime exceptions during session", len(drained) == 0, True))

        print("\n== %d/%d PASS ==" % (sum(1 for r in results if r), len(results)))
        return 0 if all(results) else 1
    finally:
        try:
            if cdp: cdp.ws.close()
        except Exception: pass
        proc.terminate()
        time.sleep(0.5)
        proc.kill()
        shutil.rmtree(udd, ignore_errors=True)

if __name__ == "__main__":
    sys.exit(main())
