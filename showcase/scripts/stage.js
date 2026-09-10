'use strict';

// The recording stage: a browser that films itself, plus the drawn affordances a
// headless browser cannot supply (pointer, drag ghost, capture selection, camera).
//
// This file owns everything that is true of every demo. The per-demo choreography
// lives in its own script and drives this one. That split is deliberate: the
// choreography changes for every feature, the failure modes below do not.
//
// Usage from a demo script:
//
//   const { loadTarget, createStage } = require('../stage');
//   const target = loadTarget('heurist-finance');
//   const stage = await createStage({ target, outDir: '/path/to/assets' });
//   await stage.page.goto(...); stage.mark('ready'); await stage.glide(x, y);
//   await stage.finish();            // writes marks.json, returns { raw, marks }

const fs = require('fs');
const path = require('path');
const os = require('os');
const {createRequire} = require('module');
const {runId} = require('./output');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// Playwright resolution
// ---------------------------------------------------------------------------

// Playwright is not a dependency of this repo. Resolve it from wherever the machine
// already has it rather than vendoring a second copy of the browser download.
function requirePlaywright() {
  const tried = [];
  const candidates = [
    process.env.PLAYWRIGHT_MODULE,
    'playwright',
  ].filter(Boolean);
  for (const c of candidates) {
    try {
      return createRequire(path.join(process.cwd(), 'package.json'))(c);
    } catch (e) {
      tried.push(c);
    }
  }
  throw new Error(
    'playwright not found. Set PLAYWRIGHT_MODULE to its path. Tried:\n  ' + tried.join('\n  ')
  );
}

// ---------------------------------------------------------------------------
// Target config
// ---------------------------------------------------------------------------

// Targets are instance data, so they live outside this repo by default: the skill
// ships the schema, the project keeps its own config next to its evidence. A bare
// name resolves into the work bucket; anything with a slash is taken as a path.
function targetPath(nameOrPath) {
  if (nameOrPath.includes('/') || nameOrPath.endsWith('.json')) return path.resolve(nameOrPath);
  const bucket = process.env.AGENT_WORK_DIR || path.join(os.homedir(), '.agents/work');
  return path.join(bucket, nameOrPath, 'showcase/target.json');
}

function loadTarget(nameOrPath) {
  const p = targetPath(nameOrPath);
  if (!fs.existsSync(p)) {
    throw new Error(
      `no target config at ${p}\n` +
        'Copy targets/EXAMPLE.json there and fill it in, or pass an explicit path.'
    );
  }
  const t = JSON.parse(fs.readFileSync(p, 'utf8'));
  for (const k of ['name', 'app']) {
    if (!t[k]) throw new Error(`target ${p} is missing required key "${k}"`);
  }
  if (!t.app.url) throw new Error(`target ${p} is missing app.url`);
  t.__path = p;
  return t;
}

// ---------------------------------------------------------------------------
// Injected page scripts
// ---------------------------------------------------------------------------

// Every injected block installs itself defensively. addInitScript runs at
// document-start, before <head> exists, so a naive appendChild silently does
// nothing on the first paint and the frame ships with the styling absent.
const installer = (id, cssExpr) => `
  const add = () => {
    try {
      if (document.getElementById(${JSON.stringify(id)})) return true;
      const root = document.head || document.documentElement;
      if (!root) return false;
      const s = document.createElement('style');
      s.id = ${JSON.stringify(id)};
      s.textContent = ${cssExpr};
      root.appendChild(s);
      return true;
    } catch (e) { return false; }
  };
  if (!add()) {
    const t = setInterval(() => { if (add()) clearInterval(t); }, 4);
    document.addEventListener('DOMContentLoaded', add, { once: true });
  }
`;

// Playwright records the screencast at CSS-pixel size and ignores deviceScaleFactor,
// so a larger canvas only pads the frame. Record a native 1080p viewport and zoom the
// document instead: the app keeps laying out at its normal width while filling a true
// 1080p frame with large type. Zoom applies only to our own app, since magnifying a
// third-party page is not the point and it lays out for a normal desktop anyway.
function zoomScript(target) {
  const zoom = target.app.zoom || 1;
  if (zoom === 1) return null;
  return `(() => {
  if (!new RegExp(${JSON.stringify(target.app.hostPattern || '.')}).test(location.hostname)) return;
  ${installer('__zoomcss', JSON.stringify(`html{zoom:${zoom} !important}`))}
})();`;
}

// Chrome the dev build has and production does not. Hiding it at record time is the
// only option for anything that overlaps a live control: a box or blur in post smears
// the control next to it.
function devChromeScript(target) {
  const rules = target.devChrome && target.devChrome.rules;
  if (!rules || !rules.length) return null;
  const css = rules.map((r) => (typeof r === 'string' ? r : r.css)).join('');
  const host = target.devChrome.hostPattern || target.app.hostPattern || '.';
  return `(() => {
  if (!new RegExp(${JSON.stringify(host)}).test(location.hostname)) return;
  ${installer('__devhide', JSON.stringify(css))}
})();`;
}

// The drawn affordances. Every animation here runs in-page on requestAnimationFrame.
// Driving them from Node costs a CDP round trip per step, and under 1080p encoding
// each round trip runs into the hundreds of milliseconds, so a 40-step loop completes
// about two steps inside its budget and the result reads as a freeze. This is the
// single most expensive lesson in the file.
function cursorScript(target) {
  const zoom = target.app.zoom || 1;
  const hostPattern = target.app.hostPattern || '.';
  return `(() => {
  const build = () => {
    if (document.getElementById('__cur')) return;
    const Z = new RegExp(${JSON.stringify(hostPattern)}).test(location.hostname) ? ${zoom} : 1;
    window.__z = Z;

    const c = document.createElement('div');
    c.id = '__cur';
    c.style.cssText = [
      'position:fixed','left:0','top:0','width:22px','height:22px','z-index:2147483647',
      'pointer-events:none','margin:-2px 0 0 -2px',
      'filter:drop-shadow(0 2px 4px rgba(0,0,0,.55))'
    ].join(';');
    c.innerHTML = '<svg width="22" height="22" viewBox="0 0 22 22"><path d="M3 2 L3 17 L7.2 13.2 L9.8 19 L12.6 17.7 L10 12 L15.5 12 Z" fill="#fff" stroke="rgba(0,0,0,.65)" stroke-width="1.1" stroke-linejoin="round"/></svg>';
    document.body.appendChild(c);

    const ring = document.createElement('div');
    ring.id = '__ring';
    ring.style.cssText = [
      'position:fixed','left:0','top:0','width:34px','height:34px','margin:-17px 0 0 -17px',
      'border-radius:50%','border:2px solid rgba(120,170,255,.95)','z-index:2147483646',
      'pointer-events:none','opacity:0','transform:scale(.4)'
    ].join(';');
    document.body.appendChild(ring);

    // The dragged file, drawn because a headless browser cannot show the OS drag image.
    const ghost = document.createElement('div');
    ghost.id = '__ghost';
    ghost.style.cssText = [
      'position:fixed','left:0','top:0','z-index:2147483645','pointer-events:none',
      'opacity:0','transform:translate(-50%,-50%) scale(.9) rotate(-3deg)',
      'transition:opacity 180ms ease-out','border-radius:6px',
      'box-shadow:0 12px 28px rgba(0,0,0,.5)','overflow:hidden','border:1px solid rgba(255,255,255,.28)'
    ].join(';');
    document.body.appendChild(ghost);

    let x = innerWidth / 2, y = innerHeight / 2;
    // Coordinates are viewport pixels everywhere in the demo API. Dividing by the zoom
    // here is what keeps a caller from having to think about it.
    const place = () => {
      c.style.transform = 'translate(' + (x / Z) + 'px,' + (y / Z) + 'px)';
      ring.style.left = (x / Z) + 'px';
      ring.style.top = (y / Z) + 'px';
      ghost.style.left = ((x + 46) / Z) + 'px';
      ghost.style.top = ((y + 34) / Z) + 'px';
    };
    place();

    let anim = false;
    addEventListener('mousemove', (e) => { if (!anim) { x = e.clientX; y = e.clientY; place(); } }, true);

    window.__cursorSet = (nx, ny) => { anim = true; x = nx; y = ny; place(); };
    window.__cursorRelease = () => { anim = false; };

    window.__cursorTo = (tx, ty, ms) => new Promise((done) => {
      const fx = x, fy = y, t0 = performance.now();
      anim = true;
      const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
      const step = (now) => {
        const t = Math.min(1, (now - t0) / ms), k = ease(t);
        x = fx + (tx - fx) * k; y = fy + (ty - fy) * k; place();
        if (t < 1) requestAnimationFrame(step); else { anim = false; done(); }
      };
      requestAnimationFrame(step);
    });

    window.__ghostShow = (dataUrl, w) => {
      ghost.innerHTML = '<img src="' + dataUrl + '" style="display:block;width:' + w + 'px">';
      ghost.style.opacity = '.85';
    };
    window.__ghostHide = () => { ghost.style.opacity = '0'; };

    // Camera. Magnify a component, never <html>: a transform on the root element stops
    // fixed-position children painting at all, which silently empties the frame of every
    // docked control. This is why zoom uses the CSS zoom property and motion uses scale
    // on an inner element.
    window.__zoomEl = (sel, origin, s, ms) => {
      const el = typeof sel === 'string' ? document.querySelector(sel) : sel;
      if (!el) return false;
      el.style.transformOrigin = origin || '50% 70%';
      el.style.transition = 'transform ' + ms + 'ms cubic-bezier(.22,.61,.36,1)';
      el.style.transform = 'scale(' + s + ')';
      return true;
    };

    // Scroll a control back into frame rather than scaling the panel down to fit it.
    // Scaling a tall panel pushes its header out of shot as well.
    window.__reveal = (sel, ms) => new Promise((done) => {
      const el = document.querySelector(sel);
      if (!el) return done();
      try { el.scrollIntoView({ block: 'end', behavior: 'smooth' }); }
      catch (e) { el.scrollIntoView(false); }
      setTimeout(done, ms);
    });

    // Capture-selection rectangle, drawn for the screenshot beat.
    window.__selStart = (x0, y0) => {
      const dim = document.createElement('div');
      dim.id = '__sel';
      dim.style.cssText = [
        'position:fixed','inset:0','z-index:2147483640','pointer-events:none',
        'background:rgba(10,12,16,.28)','opacity:0','transition:opacity 220ms ease-out'
      ].join(';');
      const box = document.createElement('div');
      box.id = '__selbox';
      box.style.cssText = [
        'position:fixed','z-index:2147483641','pointer-events:none',
        'border:1px solid rgba(255,255,255,.95)','background:rgba(255,255,255,.06)',
        'box-shadow:0 0 0 1px rgba(0,0,0,.45)'
      ].join(';');
      document.body.appendChild(dim);
      document.body.appendChild(box);
      requestAnimationFrame(() => { dim.style.opacity = '1'; });
      window.__selOrigin = [x0, y0];
      window.__selSet(x0, y0);
    };
    window.__selSet = (x1, y1) => {
      const [x0, y0] = window.__selOrigin;
      const b = document.getElementById('__selbox');
      if (!b) return;
      b.style.left = Math.min(x0, x1) + 'px';
      b.style.top = Math.min(y0, y1) + 'px';
      b.style.width = Math.abs(x1 - x0) + 'px';
      b.style.height = Math.abs(y1 - y0) + 'px';
    };
    window.__selSweep = (x0, y0, x1, y1, ms) => new Promise((done) => {
      const t0 = performance.now();
      const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
      const step = (now) => {
        const t = Math.min(1, (now - t0) / ms), k = ease(t);
        const cx = x0 + (x1 - x0) * k, cy = y0 + (y1 - y0) * k;
        window.__selSet(cx, cy);
        window.__cursorSet(cx, cy);
        if (t < 1) requestAnimationFrame(step);
        else { window.__cursorRelease(); done(); }
      };
      requestAnimationFrame(step);
    });
    window.__selFlash = () => new Promise((done) => {
      const f = document.createElement('div');
      f.style.cssText = 'position:fixed;inset:0;z-index:2147483646;pointer-events:none;background:#fff;opacity:0;transition:opacity 90ms ease-out';
      document.body.appendChild(f);
      requestAnimationFrame(() => {
        f.style.opacity = '.85';
        setTimeout(() => {
          f.style.transition = 'opacity 260ms ease-out';
          f.style.opacity = '0';
          setTimeout(() => { f.remove(); done(); }, 300);
        }, 100);
      });
    });
    window.__selEnd = () => {
      ['__sel', '__selbox'].forEach((id) => { const n = document.getElementById(id); if (n) n.remove(); });
    };
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build, { once: true });
  else build();
})();`;
}

// ---------------------------------------------------------------------------
// Stage
// ---------------------------------------------------------------------------

async function createStage({ target, outDir, headless = true }) {
  // Each take owns its marks and raw recording. Never delete a previous take.
  const takeDir = path.join(outDir, 'build', runId('take'));
  const raw = path.join(takeDir, 'raw');
  fs.mkdirSync(raw, { recursive: true });

  const vw = (target.app.viewport && target.app.viewport.width) || 1920;
  const vh = (target.app.viewport && target.app.viewport.height) || 1080;

  const { chromium } = requirePlaywright();
  const browser = await chromium.launch({
    headless,
    executablePath: process.env.SHOWCASE_BROWSER || undefined,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--force-color-profile=srgb'],
  });
  const ctx = await browser.newContext({
    viewport: { width: vw, height: vh },
    recordVideo: { dir: raw, size: { width: vw, height: vh } },
  });
  const page = await ctx.newPage();

  for (const script of [zoomScript(target), devChromeScript(target), cursorScript(target)]) {
    if (script) await page.addInitScript(script);
  }

  // Playwright's video clock starts with the page, so every beat is stamped against
  // one origin. The edit then cuts on real boundaries instead of frames eyeballed
  // after the fact, which is what makes a re-record cheap.
  const T0 = Date.now();
  const marks = [];
  const mark = (name) => {
    const t = (Date.now() - T0) / 1000;
    marks.push({ name, t: Number(t.toFixed(3)) });
    console.log('mark', name, t.toFixed(2) + 's');
    return t;
  };

  // Move the drawn pointer and the real one together. The real mouse.move is what the
  // app reacts to; the drawn one is what the viewer sees. Firing the real move partway
  // through the glide keeps hover states in step with the visible pointer.
  const glide = async (x, y, ms = 420) => {
    const anim = page.evaluate(([a, b, c]) => window.__cursorTo(a, b, c), [x, y, ms]);
    await sleep(Math.round(ms * 0.62));
    await page.mouse.move(x, y).catch(() => {});
    await anim;
  };

  // Wait for a streaming region to stop growing rather than to pass a length. Firing on
  // length alone ends a take mid-sentence, which is the one thing a finished asset
  // cannot do. Scope it to the region that streams: matching document.body once caught
  // a ticker symbol in the feed behind the panel and reported an answer that had not
  // arrived.
  const waitForSettled = async ({
    selector,
    minChars = 300,
    stableFor = 3,
    pollMs = 900,
    timeoutMs = 420000,
    busyPattern = null,
  }) =>
    page
      .waitForFunction(
        ({ selector, minChars, stableFor, busyPattern }) => {
          const el = document.querySelector(selector);
          if (!el) return false;
          const txt = (el.innerText || '').replace(/\s+/g, ' ').trim();
          if (busyPattern && new RegExp(busyPattern, 'i').test(txt)) return false;
          if (txt.length < minChars) return false;
          const prev = window.__lastLen || 0;
          window.__lastLen = txt.length;
          if (txt.length !== prev) { window.__stable = 0; return false; }
          window.__stable = (window.__stable || 0) + 1;
          return window.__stable >= stableFor;
        },
        { selector, minChars, stableFor, busyPattern },
        { timeout: timeoutMs, polling: pollMs }
      )
      .then(() => true)
      .catch(() => false);

  const finish = async () => {
    await ctx.close();
    await browser.close();
    const marksPath = path.join(takeDir, 'marks.json');
    fs.writeFileSync(marksPath, JSON.stringify(marks, null, 1));
    const files = fs.readdirSync(raw).filter((f) => f.endsWith('.webm'));
    if (!files.length) throw new Error('no video written; the context closed without a recording');
    const rawFile = path.join(raw, files[0]);
    console.log('marks:', marksPath);
    console.log('raw:', rawFile);
    return { raw: rawFile, marks, marksPath, takeDir };
  };

  return { browser, ctx, page, mark, marks, glide, waitForSettled, finish, sleep, viewport: { width: vw, height: vh } };
}

module.exports = { loadTarget, targetPath, createStage, sleep, requirePlaywright };
