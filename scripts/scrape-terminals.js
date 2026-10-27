#!/usr/bin/env node
/**
 * Scrapes https://newnaia.com.ph/flights/airline-information and writes
 * hubs/mnl/mnl-terminals.generated.json  ({ airlineName -> terminalName }).
 *
 * Design (why the earlier attempts failed and how this avoids it):
 *  - No body.innerText splitting, no rolling cursor. We walk the real DOM.
 *  - "Terminal N" labels that live in nav/header/footer/filters/<select>/
 *    buttons are NOT section headings and are ignored. This is what used to
 *    lock everything onto "Terminal 1".
 *  - A heading only counts if at least one airline follows it before the next
 *    heading, so empty filter chips are dropped automatically.
 *  - Each airline is scoped by (1) the nearest ancestor containing exactly one
 *    terminal heading, else (2) the nearest PRECEDING real heading in document
 *    order. State never carries between airlines, so nothing "defaults to T4".
 *  - If the site uses tabs, each tab is clicked and only the visible panel is
 *    read.
 *  - Strict validation: name + (CODE) regex, junk/analytics/footer filter,
 *    sanity checks that fail the run rather than write bad data.
 */
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const URL = process.env.NAIA_URL || 'https://newnaia.com.ph/flights/airline-information';
const OUT = process.env.OUT || path.join('hubs', 'mnl', 'mnl-terminals.generated.json');
const DEBUG_DIR = process.env.DEBUG_DIR || 'scrape-debug';
const EXPECTED_TERMINALS = ['Terminal 1', 'Terminal 2', 'Terminal 3', 'Terminal 4'];
const MIN_AIRLINES = Number(process.env.MIN_AIRLINES || 15);
const MAX_SHARE = 0.9; // no single terminal may hold more than 90% of airlines

// Kept as strings so the same patterns run inside the page and in Node.
const AIRLINE_SRC = String.raw`^([A-Za-z][A-Za-z0-9&.'’\-\/ ]{1,59}?)\s*\(([A-Z0-9]{1,4})\)$`;
const TERMINAL_SRC = String.raw`^(?:NAIA\s+)?Terminal\s*([1-4])(?:\s*[-–:|]?\s*[A-Za-z ]{0,25})?$`;
const JUNK_SRC = String.raw`gtag|window\.|dataLayer|function\s*\(|=>|[{};<>]|©|new naia infra|all rights reserved|cookie|privacy`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Runs inside the browser. Returns raw {kind,text,...} candidates. */
function pageExtractor({ AIRLINE_SRC, TERMINAL_SRC, JUNK_SRC, onlyVisible }) {
  const AIRLINE = new RegExp(AIRLINE_SRC);
  const TERMINAL = new RegExp(TERMINAL_SRC, 'i');
  const JUNK = new RegExp(JUNK_SRC, 'i');
  const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const EXCLUDED = 'nav, header, footer, select, option, button, [role="tab"], [role="tablist"], [role="navigation"], [role="menu"], [aria-hidden="true"], script, style, noscript';
  const visible = (el) => !!(el.offsetParent || el.getClientRects().length);

  const all = Array.from(document.body.querySelectorAll('*'));
  const classify = (el) => {
    const t = norm(el.textContent);
    if (!t || t.length > 80) return null;
    // smallest element only: skip if a child element has the same text
    for (const c of el.children) if (norm(c.textContent) === t) return null;
    if (el.closest(EXCLUDED)) return null;
    if (onlyVisible && !visible(el)) return null;
    const tm = t.match(TERMINAL);
    if (tm) return { kind: 'heading', text: t, terminal: `Terminal ${tm[1]}` };
    if (JUNK.test(t)) return null;
    const am = t.match(AIRLINE);
    if (am) return { kind: 'airline', text: t, name: norm(am[1]), code: am[2] };
    return null;
  };

  const items = [];
  all.forEach((el) => {
    const c = classify(el);
    if (c) items.push({ el, ...c });
  });

  const headings = items.filter((i) => i.kind === 'heading');
  const airlines = items.filter((i) => i.kind === 'airline');
  const before = (a, b) => !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);

  // keep only headings that are followed by an airline before the next heading
  const realHeadings = headings.filter((h, idx) => {
    const next = headings[idx + 1];
    return airlines.some((a) => before(h.el, a.el) && (!next || before(a.el, next.el)));
  });

  const out = [];
  for (const a of airlines) {
    let terminal = null;
    // (1) nearest ancestor with exactly one distinct real terminal heading
    for (let n = a.el.parentElement; n && n !== document.body; n = n.parentElement) {
      const inside = new Set(realHeadings.filter((h) => n.contains(h.el)).map((h) => h.terminal));
      if (inside.size === 1) { terminal = [...inside][0]; break; }
      if (inside.size > 1) break;
    }
    // (2) nearest preceding real heading in document order
    if (!terminal) {
      for (let i = realHeadings.length - 1; i >= 0; i--) {
        if (before(realHeadings[i].el, a.el)) { terminal = realHeadings[i].terminal; break; }
      }
    }
    out.push({ name: a.name, code: a.code, text: a.text, terminal });
  }
  return { airlines: out, headings: realHeadings.map((h) => h.terminal) };
}

async function waitForHydration(page) {
  // Wait until airline-looking text exists AND the count is stable for 3 polls.
  const started = Date.now();
  let last = -1, stable = 0;
  while (Date.now() - started < 45000) {
    const count = await page.evaluate((src) => {
      const re = new RegExp(src);
      return Array.from(document.body.querySelectorAll('*')).filter((el) => {
        if (el.children.length) return false;
        return re.test((el.textContent || '').replace(/\s+/g, ' ').trim());
      }).length;
    }, AIRLINE_SRC);
    if (count >= 5 && count === last) stable++; else stable = 0;
    last = count;
    if (stable >= 3) return count;
    await sleep(750);
  }
  throw new Error(`Page did not hydrate (last airline-like count: ${last})`);
}

async function expandCollapsed(page) {
  // open accordions whose label is "Terminal N"
  await page.evaluate((TERMINAL_SRC) => {
    const re = new RegExp(TERMINAL_SRC.replace(/^\^|\$$/g, ''), 'i');
    document.querySelectorAll('[aria-expanded="false"], summary').forEach((el) => {
      if (re.test((el.textContent || '').trim().slice(0, 40))) el.click();
    });
  }, TERMINAL_SRC);
  await sleep(500);
}

/** Prints a compact picture of the page structure to the log when validation fails. */
async function diagnose(page) {
  const info = await page.evaluate((AIRLINE_SRC) => {
    const AIR = new RegExp(AIRLINE_SRC);
    const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
    const desc = (el) => {
      const cls = typeof el.className === 'string' && el.className.trim()
        ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '';
      const role = el.getAttribute('role') ? `[role=${el.getAttribute('role')}]` : '';
      const hid = el.getAttribute('aria-hidden') === 'true' ? '[aria-hidden]' : '';
      return `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${cls}${role}${hid}`;
    };
    const chain = (el) => {
      const out = [];
      for (let n = el; n && n !== document.body && out.length < 7; n = n.parentElement) out.push(desc(n));
      return out.join(' < ');
    };
    const every = Array.from(document.body.querySelectorAll('*'));
    const airlineLeaves = every.filter((e) => !e.children.length && AIR.test(norm(e.textContent)));
    const termEls = every.filter((e) => {
      const t = norm(e.textContent);
      return t.length <= 60 && /terminal\s*[1-4]/i.test(t) && ![...e.children].some((c) => norm(c.textContent) === t);
    });
    return {
      title: document.title,
      iframes: document.querySelectorAll('iframe').length,
      shadowHosts: every.filter((e) => e.shadowRoot).length,
      airlineLeafCount: airlineLeaves.length,
      airlineSamples: airlineLeaves.slice(0, 4).map((e) => ({ text: norm(e.textContent), chain: chain(e) })),
      terminalEls: termEls.slice(0, 15).map((e) => ({ text: norm(e.textContent), chain: chain(e) })),
      bodyHead: norm(document.body.innerText).slice(0, 300),
    };
  }, AIRLINE_SRC);
  console.error('--- DIAGNOSTIC ---\n' + JSON.stringify(info, null, 2) + '\n--- END DIAGNOSTIC ---');
}

/** Chip labels like "T1".."T4" inside <main>. */
async function findFilterChips(page) {
  return page.evaluate(() => {
    const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
    const root = document.querySelector('main') || document.body;
    const labels = new Set();
    root.querySelectorAll('button, a, li, div, span, label, [role="button"]').forEach((e) => {
      const t = norm(e.textContent);
      if (/^T[1-4]$/i.test(t) && (e.offsetParent || e.getClientRects().length)) labels.add(t.toUpperCase());
    });
    return [...labels].sort();
  });
}

async function clickByExactText(page, text) {
  return page.evaluate((text) => {
    const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
    const root = document.querySelector('main') || document.body;
    const cands = Array.from(root.querySelectorAll('button, a, li, div, span, label, [role="button"]')).filter(
      (e) => norm(e.textContent).toLowerCase() === text.toLowerCase() && (e.offsetParent || e.getClientRects().length)
    );
    if (!cands.length) return false;
    const pick = cands.find((e) => e.matches('button, a, [role="button"], label')) || cands[cands.length - 1];
    pick.click();
    return true;
  }, text);
}

/** Visible "Name (CODE)" leaf elements inside <main>. */
async function readVisibleAirlines(page) {
  return page.evaluate(({ AIRLINE_SRC, JUNK_SRC }) => {
    const AIR = new RegExp(AIRLINE_SRC);
    const JUNK = new RegExp(JUNK_SRC, 'i');
    const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
    const root = document.querySelector('main') || document.body;
    const out = [];
    root.querySelectorAll('*').forEach((e) => {
      if (e.children.length) return;
      if (!(e.offsetParent || e.getClientRects().length)) return;
      if (e.closest('nav, header, footer, select, option, script, style, noscript')) return;
      const t = norm(e.textContent);
      if (!t || t.length > 80 || JUNK.test(t)) return;
      const m = t.match(AIR);
      if (m) out.push({ name: norm(m[1]), code: m[2], text: t });
    });
    return out;
  }, { AIRLINE_SRC, JUNK_SRC });
}

/** Re-read until two consecutive reads agree (the SPA re-renders after a click). */
async function readStable(page) {
  let prev = null, cur = [];
  for (let i = 0; i < 8; i++) {
    await sleep(500);
    cur = await readVisibleAirlines(page);
    const key = JSON.stringify(cur.map((c) => c.text));
    if (key === prev) return cur;
    prev = key;
  }
  return cur;
}

async function scrapeOnce(browser) {
  const page = await browser.newPage();
  try {
    await page.setUserAgent(
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
    );
    await page.setViewport({ width: 1440, height: 2400 });
    await page.goto(URL, { waitUntil: 'networkidle2', timeout: 60000 });
    await waitForHydration(page);
    await expandCollapsed(page);

    const params = { AIRLINE_SRC, TERMINAL_SRC, JUNK_SRC };
    const rows = [];

    // Strategy F (current site): "Choose a terminal: All T1 T2 T3" filter chips over one flat list
    const chips = await findFilterChips(page);
    if (chips.length >= 2) {
      const all = await readStable(page);
      const assigned = new Set();
      for (const chip of chips) {
        await clickByExactText(page, 'All'); // reset in case chips are toggles
        await sleep(400);
        if (!(await clickByExactText(page, chip))) continue;
        const list = await readStable(page);
        const terminal = `Terminal ${chip.slice(1)}`;
        list.forEach((a) => { rows.push({ ...a, terminal }); assigned.add(a.code); });
      }
      await clickByExactText(page, 'All');
      const onlyInAll = all.filter((a) => !assigned.has(a.code));
      if (onlyInAll.length) {
        console.warn(`ℹ️  ${onlyInAll.length} airline(s) appear only under "All" (no chip): ${onlyInAll.map((a) => `${a.name} (${a.code})`).join(', ')}`);
      }
      return { rows, strategy: 'filter', page };
    }

    // Strategy A: tabs ("Terminal 1" ... "Terminal 4" with role=tab)
    const tabs = await page.$$('[role="tab"]');
    const tabLabels = [];
    for (const t of tabs) {
      const label = await t.evaluate((e) => (e.textContent || '').replace(/\s+/g, ' ').trim());
      const m = label.match(new RegExp(TERMINAL_SRC, 'i'));
      if (m) tabLabels.push({ handle: t, terminal: `Terminal ${m[1]}` });
    }
    if (tabLabels.length >= 2) {
      for (const { handle, terminal } of tabLabels) {
        await handle.click();
        await sleep(1200);
        const r = await page.evaluate(pageExtractor, { ...params, onlyVisible: true });
        r.airlines.forEach((a) => rows.push({ ...a, terminal })); // tab decides terminal
      }
      return { rows, strategy: 'tabs', page };
    }

    // Strategy B: scoped DOM walk
    const r = await page.evaluate(pageExtractor, { ...params, onlyVisible: false });
    return { rows: r.airlines, strategy: 'dom', headings: r.headings, page };
  } catch (e) {
    await page.close().catch(() => {});
    throw e;
  }
}

function buildAndValidate(rows) {
  const AIRLINE = new RegExp(AIRLINE_SRC);
  const JUNK = new RegExp(JUNK_SRC, 'i');
  const seen = new Map(); // `${name}|${code}` -> Set(terminals)
  let dropped = 0;

  for (const r of rows) {
    if (!r.terminal || !EXPECTED_TERMINALS.includes(r.terminal)) { dropped++; continue; }
    if (JUNK.test(r.text) || !AIRLINE.test(r.text)) { dropped++; continue; }
    const key = `${r.name}|${r.code}`;
    if (!seen.has(key)) seen.set(key, new Set());
    seen.get(key).add(r.terminal);
  }

  const airlines = [...seen.entries()]
    .map(([key, terms]) => {
      const [name, code] = key.split('|');
      return { name, code, terminals: [...terms].sort() };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const counts = Object.fromEntries(EXPECTED_TERMINALS.map((t) => [t, 0]));
  airlines.forEach((a) => a.terminals.forEach((t) => counts[t]++));
  const total = airlines.length;

  const problems = [];
  if (total < MIN_AIRLINES) problems.push(`Only ${total} airlines parsed (min ${MIN_AIRLINES}).`);
  // Some terminals may legitimately be empty/absent (the site currently has no T4 chip),
  // but at least two must be populated, and no two populated terminals may be identical
  // (identical lists mean the filter never applied and everything bled together).
  const populated = Object.entries(counts).filter(([, n]) => n > 0).map(([t]) => t);
  if (populated.length < 2) problems.push(`Only ${populated.length} terminal(s) populated; need at least 2.`);
  for (const [t, n] of Object.entries(counts)) {
    if (total && n / total > MAX_SHARE) problems.push(`${t} holds ${Math.round((100 * n) / total)}% of airlines (bleed suspected).`);
  }
  const sets = Object.fromEntries(populated.map((t) => [t, airlines.filter((a) => a.terminals.includes(t)).map((a) => a.code).sort().join(',')]));
  for (let i = 0; i < populated.length; i++) {
    for (let j = i + 1; j < populated.length; j++) {
      if (sets[populated[i]] === sets[populated[j]]) problems.push(`${populated[i]} and ${populated[j]} have identical airline lists (filter not applied).`);
    }
  }
  const empty = Object.entries(counts).filter(([, n]) => n === 0).map(([t]) => t);
  if (empty.length) console.warn(`ℹ️  No airlines found for: ${empty.join(', ')}`);
  return { airlines, counts, dropped, problems };
}

/** Scrape + validate. Returns { airlines, counts, dropped, strategy } or throws. */
async function scrape() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });
  let result, strategy, lastErr;
  try {
    for (let attempt = 1; attempt <= 3; attempt++) {
      let page;
      try {
        const s = await scrapeOnce(browser);
        page = s.page;
        strategy = s.strategy;
        result = buildAndValidate(s.rows);
        if (!result.problems.length) { await page.close(); break; }
        lastErr = new Error(result.problems.join(' '));
        if (attempt === 1) await diagnose(page);
        fs.mkdirSync(DEBUG_DIR, { recursive: true });
        await page.screenshot({ path: path.join(DEBUG_DIR, `attempt-${attempt}.png`), fullPage: true });
        fs.writeFileSync(path.join(DEBUG_DIR, `attempt-${attempt}.html`), await page.content());
        await page.close();
      } catch (e) {
        lastErr = e;
      }
      console.error(`Attempt ${attempt} failed: ${lastErr.message}`);
      await sleep(3000 * attempt);
      result = null;
    }
  } finally {
    await browser.close();
  }

  if (!result) throw new Error(`Scrape failed validation: ${lastErr && lastErr.message}`);
  return { ...result, strategy };
}

async function main() {
  let result;
  try {
    result = await scrape();
  } catch (e) {
    console.error(`${e.message}\nDatabase NOT touched.`);
    process.exit(1);
  }
  const strategy = result.strategy;
  const mapping = {};
  result.airlines.forEach((a) => {
    mapping[a.name] = a.terminals.length === 1 ? a.terminals[0] : a.terminals;
  });

  const payload = {
    source: URL,
    scrapedAt: new Date().toISOString(),
    strategy,
    counts: result.counts,
    airlines: result.airlines,
    mapping,
  };
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(payload, null, 2) + '\n');
  console.log(`Wrote ${OUT} (${result.airlines.length} airlines, strategy=${strategy}, dropped=${result.dropped})`);
  console.log(result.counts);
}

module.exports = { scrape };
if (require.main === module) main();