#!/usr/bin/env node
/**
 * Structural audit + verification-age check for hubs that have NO official machine-readable
 * airline-by-terminal source (BKK, DMK). It never changes a database file and never calls
 * any website. It answers two questions:
 *   1. Is the data internally consistent (terminals, tags, codes, duplicates, file shape)?
 *   2. When did a human last verify it against an official source?
 *
 *   node scripts/audit-bkk-dmk.js              # report, exit 0
 *   node scripts/audit-bkk-dmk.js --strict     # exit 2 if any ERROR (or a verification is overdue)
 *   node scripts/audit-bkk-dmk.js --hub dmk    # one hub
 * Writes bkk-dmk-audit-report.md (used by the monthly workflow to open/refresh an issue).
 */
const fs = require('fs');
const { resolveFile, loadEntries } = require('./lib/db-utils');

const MAX_AGE_DAYS = Number(process.env.MAX_AGE_DAYS || 35);

const HUBS = {
  bkk: {
    label: 'Bangkok Suvarnabhumi (BKK)',
    file: 'hubs/bkk/bkk-database.js',
    hubName: 'Bangkok (BKK)', hubCode: 'bkk', link: 'hubs/bkk/bkk.html',
    terminals: { 'Main Terminal': 't1', 'SAT-1 Concourse': 't3' },
    minEntries: 40,
    sources: [
      ['AOT Suvarnabhumi - airlines / services', 'https://suvarnabhumi.airportthai.co.th/'],
      ['Each airline\'s own "airport / check-in" page', 'search "<airline> Suvarnabhumi check-in terminal"'],
    ],
  },
  dmk: {
    label: 'Bangkok Don Mueang (DMK)',
    file: 'hubs/dmk/dmk-database.js',
    hubName: 'Bangkok (DMK)', hubCode: 'dmk', link: 'hubs/dmk/dmk.html',
    terminals: { 'Terminal 1': 't1', 'Terminal 2': 't2' },
    minEntries: 12,
    sources: [
      ['AOT Don Mueang', 'https://donmueang.airportthai.co.th/'],
      ['Each airline\'s own "airport / check-in" page', 'search "<airline> Don Mueang check-in terminal"'],
    ],
  },
};

const only = (() => { const i = process.argv.indexOf('--hub'); return i > -1 ? process.argv[i + 1] : null; })();
const STRICT = process.argv.includes('--strict');

function loadVerification() {
  const p = resolveFile('data/bkk-dmk-verification.json');
  if (!p) return {};
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return {}; }
}

function auditHub(key, cfg, verification) {
  const errors = [], warnings = [];
  const err = (m) => errors.push(m), warn = (m) => warnings.push(m);

  const file = resolveFile(cfg.file);
  if (!file) { err(`File not found: ${cfg.file}`); return { key, cfg, errors, warnings, entries: [], counts: {} }; }
  const { entries, error, content, bounds } = loadEntries(file);
  if (error) { err(error); return { key, cfg, errors, warnings, entries: [], counts: {} }; }

  if (entries.length < cfg.minEntries) err(`Only ${entries.length} entries (expected at least ${cfg.minEntries}) - was something deleted?`);

  // File shape: the array must close BEFORE the window.* assignments / UI code.
  const afterArray = content.slice(bounds.end);
  if (!/window\.\w+\s*=/.test(afterArray)) warn('No window.* assignment found after the array - the pages may not see the data.');

  const counts = {}, byName = new Map(), byCode = new Map();
  entries.forEach((e, i) => {
    const id = `#${i + 1} ${e && e.name ? `"${e.name}"` : '(no name)'}`;
    for (const f of ['name', 'code', 'terminal', 'tag', 'hubName', 'hubCode', 'link', 'notes']) {
      if (typeof e[f] !== 'string' || !e[f].trim()) err(`${id}: missing or empty "${f}"`);
    }
    if (e.name !== e.name?.trim()) err(`${id}: name has leading/trailing spaces`);
    if (!(e.terminal in cfg.terminals)) err(`${id}: terminal "${e.terminal}" is not one of ${Object.keys(cfg.terminals).map((t) => `"${t}"`).join(', ')}`);
    else if (cfg.terminals[e.terminal] !== e.tag) err(`${id}: tag "${e.tag}" does not match terminal "${e.terminal}" (expected "${cfg.terminals[e.terminal]}")`);
    if (e.hubCode !== cfg.hubCode) err(`${id}: hubCode "${e.hubCode}" should be "${cfg.hubCode}"`);
    if (e.hubName !== cfg.hubName) err(`${id}: hubName "${e.hubName}" should be "${cfg.hubName}"`);
    if (e.link !== cfg.link) err(`${id}: link "${e.link}" should be "${cfg.link}"`);
    if (!/^[A-Z0-9]{2}$/.test(e.code || '')) err(`${id}: code "${e.code}" is not a 2-character IATA code`);
    counts[e.terminal] = (counts[e.terminal] || 0) + 1;

    const n = (e.name || '').toLowerCase();
    if (byName.has(n)) err(`${id}: duplicate name (also #${byName.get(n)})`); else byName.set(n, i + 1);
    if (!byCode.has(e.code)) byCode.set(e.code, []);
    byCode.get(e.code).push(e);
  });

  // A shared code is fine (domestic/international split) but each entry must say how it differs,
  // otherwise a traveller cannot tell the two cards apart.
  for (const [code, list] of byCode) {
    if (list.length < 2) continue;
    const unqualified = list.filter((e) => !/\([^)]+\)\s*$/.test(e.name));
    if (unqualified.length) err(`Code ${code} is shared by ${list.map((e) => `"${e.name}"`).join(', ')} - add a qualifier such as "(Domestic)" / "(International)" to: ${unqualified.map((e) => `"${e.name}"`).join(', ')}`);
    const terms = new Set(list.map((e) => e.terminal));
    if (terms.size === 1) warn(`Code ${code} has ${list.length} entries all in ${[...terms][0]} - merge them unless the split is intentional.`);
  }

  for (const t of Object.keys(cfg.terminals)) if (!counts[t]) warn(`No airlines listed for "${t}".`);

  // Verification age: never claim more than a human has actually checked.
  const v = verification[key];
  let age = null;
  if (!v || !v.verifiedOn) warn('Never verified - set a date in data/bkk-dmk-verification.json after you check an official source.');
  else {
    age = Math.floor((Date.now() - new Date(v.verifiedOn).getTime()) / 86400000);
    if (Number.isNaN(age)) err('data/bkk-dmk-verification.json has an invalid verifiedOn date (use YYYY-MM-DD).');
    else if (age > MAX_AGE_DAYS) err(`Verification is ${age} days old (limit ${MAX_AGE_DAYS}). Re-check the terminals and update data/bkk-dmk-verification.json.`);
  }
  return { key, cfg, errors, warnings, entries, counts, verification: v, age };
}

function render(results) {
  const out = [`# Hub terminal audit - ${new Date().toISOString().slice(0, 10)}`, ''];
  out.push('This checks the data for internal consistency and checks when a person last verified it. It cannot see airport-side changes by itself; that is what the verification step is for.', '');
  for (const r of results) {
    out.push(`## ${r.cfg.label}`, '');
    out.push(`- Entries: ${r.entries.length} (${Object.entries(r.counts).map(([t, n]) => `${t}: ${n}`).join(', ') || 'none'})`);
    out.push(`- Last verified: ${r.verification?.verifiedOn ? `${r.verification.verifiedOn} (${r.age} days ago)${r.verification.source ? ` against ${r.verification.source}` : ''}` : '**never**'}`);
    out.push(`- Errors: ${r.errors.length}, warnings: ${r.warnings.length}`, '');
    r.errors.forEach((m) => out.push(`- ERROR: ${m}`));
    r.warnings.forEach((m) => out.push(`- warning: ${m}`));
    out.push('', '**Monthly verification checklist**', '');
    out.push('- [ ] Spot-check every airline on a current official source (list below) and fix any terminal that changed');
    out.push('- [ ] Check the airport news / notices page for terminal or concourse moves');
    out.push('- [ ] Update `data/bkk-dmk-verification.json` with today\'s date and the source you used', '');
    r.cfg.sources.forEach(([t, u]) => out.push(`  - ${t}: ${u}`));
    out.push('');
  }
  return out.join('\n');
}

const verification = loadVerification();
const keys = Object.keys(HUBS).filter((k) => !only || k === only);
if (!keys.length) { console.error(`Unknown hub "${only}". Use: ${Object.keys(HUBS).join(', ')}`); process.exit(1); }
const results = keys.map((k) => auditHub(k, HUBS[k], verification));
const report = render(results);
console.log(report);
fs.writeFileSync('bkk-dmk-audit-report.md', report);
const bad = results.some((r) => r.errors.length);
if (STRICT && bad) process.exit(2);