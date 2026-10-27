#!/usr/bin/env node
/**
 * READ-ONLY reconnaissance of the official AOT flight boards (Don Mueang / Suvarnabhumi).
 * It loads each page once in a headless browser and records the data requests the page
 * itself makes, then prints the field names and a few sample rows. It writes nothing
 * outside the output folder and changes no database.
 *
 *   node scripts/recon-official-board.js
 *
 * Optional env: URLS=comma,separated  OUT=recon-output  WAIT_MS=10000
 *
 * Be considerate: one page load per airport per run, no loops. Check the site's terms
 * before ever running this on a schedule.
 */
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const URLS = (process.env.URLS ||
  'https://donmueang.airportthai.co.th/flight,https://suvarnabhumi.airportthai.co.th/flight')
  .split(',').map((s) => s.trim()).filter(Boolean);
const OUT = process.env.OUT || 'recon-output';
const WAIT_MS = Number(process.env.WAIT_MS || 10000);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** First array of objects anywhere in the JSON (the likely list of flights). */
function findFirstArray(node, trail = '$', depth = 0) {
  if (depth > 6 || node === null || typeof node !== 'object') return null;
  if (Array.isArray(node)) {
    if (node.length && typeof node[0] === 'object' && node[0] !== null) return { trail, arr: node };
    return null;
  }
  for (const [k, v] of Object.entries(node)) {
    const hit = findFirstArray(v, `${trail}.${k}`, depth + 1);
    if (hit) return hit;
  }
  return null;
}

async function reconOne(browser, url, idx) {
  const host = new URL(url).hostname.split('.')[0];
  const dir = path.join(OUT, `${idx}-${host}`);
  fs.mkdirSync(dir, { recursive: true });
  const captured = [];
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 2000 });
  await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36');

  page.on('response', async (res) => {
    const req = res.request();
    if (!['xhr', 'fetch'].includes(req.resourceType())) return;
    let body = '';
    try { body = await res.text(); } catch { return; }
    const n = captured.length + 1;
    const ct = res.headers()['content-type'] || '';
    let json = null;
    try { json = JSON.parse(body); } catch { /* not JSON */ }
    const file = `${String(n).padStart(2, '0')}.${json ? 'json' : 'txt'}`;
    fs.writeFileSync(path.join(dir, file), body.slice(0, 2_000_000));
    captured.push({ n, file, method: req.method(), status: res.status(), url: req.url(), ct, bytes: body.length, post: req.postData() || null, json });
  });

  console.log(`\n=================== ${url} ===================`);
  try { await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 }); }
  catch (e) { console.log(`(navigation note: ${e.message})`); }
  await sleep(WAIT_MS);

  // Make sure the DEPARTURES view is the one shown, then give it time to load.
  const clicked = await page.evaluate(() => {
    const norm = (s) => (s || '').replace(/\s+/g, ' ').trim().toLowerCase();
    const el = Array.from(document.querySelectorAll('button, a, li, div, span, label'))
      .find((e) => e.children.length === 0 && /^departures?$/.test(norm(e.textContent)));
    if (el) { el.click(); return true; }
    return false;
  });
  if (clicked) await sleep(WAIT_MS / 2);

  await page.screenshot({ path: path.join(dir, 'page.png'), fullPage: true }).catch(() => {});
  fs.writeFileSync(path.join(dir, 'page.html'), await page.content());

  // What is visibly on the page: table headers and the first rows.
  const table = await page.evaluate(() => {
    const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
    return Array.from(document.querySelectorAll('table')).slice(0, 3).map((t) => ({
      headers: Array.from(t.querySelectorAll('th')).map((h) => norm(h.textContent)).slice(0, 15),
      rows: Array.from(t.querySelectorAll('tbody tr, tr')).slice(0, 8).map((r) =>
        Array.from(r.children).map((c) => norm(c.textContent)).slice(0, 15)),
    }));
  });
  console.log(`Visible tables: ${table.length}`);
  table.forEach((t, i) => {
    console.log(`  table ${i + 1} headers: ${JSON.stringify(t.headers)}`);
    t.rows.slice(0, 5).forEach((r) => console.log(`    ${JSON.stringify(r)}`));
  });

  console.log(`\nData requests captured (xhr/fetch): ${captured.length}`);
  captured.forEach((c) => console.log(`  #${c.n} ${c.method} ${c.status} ${c.bytes}B ${c.json ? 'JSON' : (c.ct || 'text')}  ${c.url}${c.post ? '\n      POST body: ' + c.post.slice(0, 300) : ''}`));

  // The most flight-like JSON: the biggest one that contains an array of objects.
  const best = captured
    .filter((c) => c.json && findFirstArray(c.json))
    .sort((a, b) => b.bytes - a.bytes)[0];
  if (best) {
    const { trail, arr } = findFirstArray(best.json);
    console.log(`\nLikely flight list: request #${best.n} at ${trail} (${arr.length} items)`);
    console.log(`FIELD NAMES: ${Object.keys(arr[0]).join(', ')}`);
    console.log('First 3 items:');
    arr.slice(0, 3).forEach((it) => console.log(JSON.stringify(it).slice(0, 700)));
  } else {
    console.log('\nNo JSON flight list found in the captured requests.');
  }
  await page.close();
  return { url, captured: captured.map(({ json, ...rest }) => rest) };
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] });
  const summary = [];
  try {
    for (let i = 0; i < URLS.length; i++) summary.push(await reconOne(browser, URLS[i], i + 1));
  } finally {
    await browser.close();
  }
  fs.writeFileSync(path.join(OUT, 'summary.json'), JSON.stringify(summary, null, 2));
  console.log(`\nSaved screenshots, page HTML and raw responses to ./${OUT}/`);
})();