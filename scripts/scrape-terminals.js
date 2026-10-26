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
const MAX_SHARE = 0.85; // no single terminal may hold more than 85% of airlines

// Kept as strings so the same patterns run inside the page and in Node.
const AIRLINE_SRC = String.raw`^([A-Za-z][A-Za-z0-9&.'’\-\/ ]{1,59}?)\s*\(([A-Z0-9]{1,4})\)$`;
const TERMINAL_SRC = String.raw`^(?:NAIA\s+)?Terminal\s*([1-4])$`;
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
  for (const [t, n] of Object.entries(counts)) {
    if (n === 0) problems.push(`${t} has 0 airlines.`);
    if (total && n / total > MAX_SHARE) problems.push(`${t} holds ${Math.round((100 * n) / total)}% of airlines (bleed suspected).`);
  }
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