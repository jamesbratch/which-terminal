// scripts/audit-db.js
// Usage:
//   node scripts/audit-db.js            # dry run: report only, writes nothing
//   node scripts/audit-db.js --write    # patch mismatched terminals (+ append missing airlines with --add-missing)
const fs = require('fs');
const path = require('path');
const { scrape } = require('./scrape-terminals');

const WRITE = process.argv.includes('--write');
const ADD_MISSING = process.argv.includes('--add-missing');

function getFilePath(relativePath) {
  const rootPath = path.resolve(process.cwd(), relativePath);
  if (fs.existsSync(rootPath)) return rootPath;
  const scriptRelPath = path.resolve(__dirname, '..', relativePath);
  if (fs.existsSync(scriptRelPath)) return scriptRelPath;
  return null;
}

function loadLocalDatabase(filePath) {
  if (!filePath) return [];
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/window\.\w+\s*=\s*\w+;/g, '');
    content = content.replace(/document\.addEventListener[\s\S]*/g, '');
    const startIdx = content.indexOf('[');
    const endIdx = content.lastIndexOf(']');
    if (startIdx === -1 || endIdx === -1) return [];
    return eval(content.substring(startIdx, endIdx + 1));
  } catch (err) {
    return [];
  }
}

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const norm = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const tagOf = (terminal) => {
  const m = /^terminal\s*(\d+)/i.exec(terminal || '');
  return m ? `t${m[1]}` : null;
};

/** Build lookups from the validated live scrape. */
function buildLiveIndex(airlines) {
  const byCode = new Map();
  const byName = new Map();
  const ambiguous = [];
  for (const a of airlines) {
    if (a.terminals.length !== 1) { ambiguous.push(a); continue; } // listed in >1 terminal: report only
    const entry = { name: a.name, code: a.code, terminal: a.terminals[0] };
    byCode.set(a.code.toUpperCase(), entry);
    byName.set(norm(a.name), entry);
  }
  return { byCode, byName, ambiguous };
}

function findLive(index, record) {
  const code = (record.code || '').toUpperCase();
  if (code && code !== 'XX' && index.byCode.has(code)) return index.byCode.get(code);
  return index.byName.get(norm(record.name)) || null;
}

async function runAudit() {
  console.log(`🔍 Running Multi-Airport Live Audit (${WRITE ? 'WRITE' : 'dry run'})...\n`);

  // Throws (and we exit before touching any file) if the terminal split looks wrong.
  let live;
  try {
    live = await scrape();
  } catch (err) {
    console.error(`❌ Live scrape rejected: ${err.message}`);
    console.error('No files were modified. See scrape-debug/ for a screenshot and the page HTML.');
    process.exit(1);
  }
  console.log(`🌐 Extracted ${live.airlines.length} airlines (strategy: ${live.strategy})`, live.counts, '\n');
  const liveIndex = buildLiveIndex(live.airlines);
  if (liveIndex.ambiguous.length) {
    console.log('ℹ️  Listed under multiple terminals (not auto-patched):',
      liveIndex.ambiguous.map((a) => `${a.name} [${a.terminals.join(', ')}]`).join('; '), '\n');
  }

  const staticMaps = {
    bkk: {
      'thai airways': 'Main Terminal',
      'bangkok airways': 'Main Terminal',
      emirates: 'SAT-1 Concourse',
      'qatar airways': 'Main Terminal',
    },
    dmk: {
      airasia: 'Terminal 1',
      'thai airasia': 'Terminal 1',
      'nok air': 'Terminal 1',
      'thai lion air': 'Terminal 2',
    },
  };

  const targets = [
    { hub: 'mnl', filename: 'hubs/mnl/mnl-database.js' },
    { hub: 'bkk', filename: 'hubs/bkk/bkk-database.js' },
    { hub: 'dmk', filename: 'hubs/dmk/dmk-database.js' },
  ];

  const report = [];
  const missing = [];
  const review = [];
  const stale = [];

  for (const target of targets) {
    const filePath = getFilePath(target.filename);
    if (!filePath) continue;
    console.log(`Auditing hub [${target.hub.toUpperCase()}] using ${target.filename}...`);
    const records = loadLocalDatabase(filePath);
    const matchedCodes = new Set();
    const codeCounts = {};
    records.forEach((r) => {
      const c = (r.code || '').toUpperCase();
      if (c && c !== 'XX') codeCounts[c] = (codeCounts[c] || 0) + 1;
    });

    for (const record of records) {
      let expected = null;
      if (target.hub === 'mnl') {
        const hit = findLive(liveIndex, record);
        if (!hit) {
          // In our DB but not on the official list: may have stopped serving MNL.
          const code = (record.code || '').toUpperCase();
          stale.push({
            airline: record.name,
            code: record.code || '(none)',
            dbTerminal: record.terminal,
            note: !code || code === 'XX' ? 'no IATA code in DB, matched by name only' : 'code and name not on live list',
          });
        }
        if (hit) {
          matchedCodes.add(hit.code.toUpperCase()); // never report as "missing"
          const code = (record.code || '').toUpperCase();
          const sharedCode = code && codeCounts[code] > 1;
          const qualifier = record.name.includes('(') && norm(record.name) !== norm(hit.name);
          if (sharedCode || qualifier) {
            // e.g. separate domestic/international entries: one live row can't decide both.
            // Only worth a human's attention when the terminals actually disagree.
            if (norm(record.terminal) !== norm(hit.terminal)) review.push({
              airline: record.name,
              dbTerminal: record.terminal,
              liveName: hit.name,
              liveTerminal: hit.terminal,
              reason: sharedCode ? 'code shared by several DB entries' : 'DB name has a qualifier',
            });
          } else {
            expected = hit.terminal;
          }
        }
      } else {
        expected = staticMaps[target.hub][norm(record.name)] || null;
      }
      if (!expected) continue;

      const expectedTag = tagOf(expected);
      const localTag = (record.tag || '').toLowerCase().trim();
      const termDiffers = norm(record.terminal) !== norm(expected);
      const tagDiffers = expectedTag && localTag !== expectedTag;
      if (termDiffers || tagDiffers) {
        report.push({
          hub: target.hub.toUpperCase(),
          file: target.filename,
          airline: record.name,
          dbTerminal: record.terminal,
          officialWebsiteTerminal: expected,
          dbTag: record.tag,
          expectedTag: expectedTag || '(preserved)',
        });
      }
    }

    if (target.hub === 'mnl') {
      for (const a of liveIndex.byCode.values()) {
        if (!matchedCodes.has(a.code.toUpperCase())) {
          const ln = norm(a.name);
          const near = records.find((r) => {
            const n = norm(r.name);
            const w = n.split(' ')[0];
            return n.includes(ln) || ln.includes(n) || (w.length > 3 && w === ln.split(' ')[0]);
          });
          missing.push({
            hub: 'MNL',
            file: target.filename,
            airline: a.name,
            code: a.code,
            officialWebsiteTerminal: a.terminal,
            possibleExisting: near ? `${near.name} (${near.code || 'no code'})` : '',
          });
        }
      }
    }
  }

  console.log('\n==================================================');
  console.log(`Total Mismatched Discrepancies: ${report.length}`);
  console.log(`Total Missing Airlines Found: ${missing.length}`);
  console.log(`In DB but not on live list (possibly no longer serve MNL): ${stale.length}`);
  console.log('==================================================\n');

  if (stale.length) {
    console.log('⚠️  Possibly no longer serving MNL (report only, never auto-removed).');
    console.log('    Check each one: seasonal or renamed airlines can drop off the list temporarily.');
    console.table(stale);
  }

  if (review.length) {
    console.log('Needs manual review (not auto-patched):');
    console.table(review);
  }
  if (report.length) console.table(report);
  if (missing.length) console.table(missing);

  if (!report.length && !missing.length && !stale.length) {
    console.log('✅ Audit completed: All local databases match live official sources.');
    return;
  }
  if (!WRITE) {
    console.log('Dry run: nothing written. Re-run with --write to patch terminals (add --add-missing to append new airlines).');
    if (process.argv.includes('--strict')) process.exitCode = 2; // opt-in: fail CI when drift exists
    return;
  }

  // ---- patch mismatched terminals, scoped to the single object literal for that airline
  for (const filename of [...new Set(report.map((r) => r.file))]) {
    const filePath = getFilePath(filename);
    let content = fs.readFileSync(filePath, 'utf8');
    for (const item of report.filter((r) => r.file === filename)) {
      const entryRe = new RegExp(`\\{[^{}]*name:\\s*['"]${esc(item.airline)}['"][^{}]*\\}`, 'i');
      const m = content.match(entryRe);
      if (!m) { console.warn(`Could not locate entry for ${item.airline}`); continue; }
      let patched = m[0].replace(/(terminal:\s*['"])[^'"]+(['"])/i, `$1${item.officialWebsiteTerminal}$2`);
      const newTag = tagOf(item.officialWebsiteTerminal);
      if (newTag) patched = patched.replace(/(tag:\s*['"])[^'"]+(['"])/i, `$1${newTag}$2`);
      content = content.replace(m[0], patched);
    }
    fs.writeFileSync(filePath, content, 'utf8');
  }

  // ---- append missing airlines (opt-in), using the real IATA code
  if (ADD_MISSING && missing.length) {
    for (const item of missing) {
      const filePath = getFilePath(item.file);
      let content = fs.readFileSync(filePath, 'utf8');
      const tag = tagOf(item.officialWebsiteTerminal) || 't1';
      const newEntry = `  { name: ${JSON.stringify(item.airline)}, code: ${JSON.stringify(item.code)}, terminal: ${JSON.stringify(item.officialWebsiteTerminal)}, tag: "${tag}", hubName: "Manila (NAIA)", hubCode: "mnl", link: "hubs/mnl/mnl.html", notes: "Auto-appended from live official source." },\n`;
      const idx = content.lastIndexOf(']');
      if (idx !== -1) {
        content = content.slice(0, idx) + newEntry + content.slice(idx);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✨ Appended "${item.airline}" (${item.code}) to ${item.file}`);
      }
    }
  }
  console.log('\n💾 Done.');
}

runAudit();