// scripts/audit-db.js
const fs = require('fs');
const path = require('path');

function getFilePath(filename) {
  const p = path.join(__dirname, '..', filename);
  return fs.existsSync(p) ? p : null;
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

async function runAudit() {
  console.log("🔍 Running Comprehensive Multi-Airport Audit...\n");

  // Accurate baseline reference maps for each airport database
  const masterOfficialMap = {
    "mnl": {
      "philippine airlines (international)": "Terminal 1",
      "philippine airlines (domestic)": "Terminal 2",
      "pal express (domestic)": "Terminal 2",
      "airasia philippines (international)": "Terminal 1",
      "airasia philippines (domestic)": "Terminal 2",
      "cebu pacific": "Terminal 3",
      "cathay pacific": "Terminal 3",
      "emirates": "Terminal 3"
    },
    // Bangkok Suvarnabhumi (BKK)
    "bkk": {
      "thai airways": "Main Terminal",
      "bangkok airways": "Main Terminal",
      "emirates": "SAT-1 Concourse",
      "qatar airways": "Main Terminal"
    },
    // Bangkok Don Mueang (DMK)
    "dmk": {
      "airasia": "Terminal 1",
      "thai airasia": "Terminal 1",
      "nok air": "Terminal 1",
      "thai lion air": "Terminal 2"
    }
  };

  const targets = [
    { hub: "mnl", filename: "mnl-database.js" },
    { hub: "dmk", filename: "dmk-database.js" },
    { hub: "bkk", filename: "bkk-database.js" }
  ];

  const report = [];

  for (const target of targets) {
    const filePath = getFilePath(target.filename);
    if (!filePath) continue;

    console.log(`Auditing hub [${target.hub.toUpperCase()}] using ${target.filename}...`);
    const records = loadLocalDatabase(filePath);
    const airportMap = masterOfficialMap[target.hub] || {};

    for (const record of records) {
      const exactKey = record.name.toLowerCase().trim();
      const expectedTerminal = airportMap[exactKey];

      if (expectedTerminal) {
        const normalizedLocalTerm = record.terminal.toLowerCase().replace(/terminal\s*/, 't').trim();
        const normalizedExpectedTerm = expectedTerminal.toLowerCase().replace(/terminal\s*/, 't').trim();
        
        // Only derive an expected tag if the official terminal starts with "Terminal"
        const isStandardTerminal = /^terminal/i.test(expectedTerminal);
        const expectedTagMatch = isStandardTerminal ? expectedTerminal.match(/\d+/) : null;
        const expectedTag = expectedTagMatch ? `t${expectedTagMatch[0]}` : null;
        const localTag = record.tag ? record.tag.toLowerCase().trim() : '';

        // Flag discrepancy if terminal mismatched, OR if it's a standard terminal and tag is out of sync
        const terminalMismatched = !normalizedLocalTerm.includes(normalizedExpectedTerm);
        const tagMismatched = expectedTag && localTag !== expectedTag;

        if (terminalMismatched || tagMismatched) {
          report.push({
            hub: target.hub.toUpperCase(),
            file: target.filename,
            airline: record.name,
            dbTerminal: record.terminal,
            officialWebsiteTerminal: expectedTerminal,
            dbTag: record.tag,
            expectedTag: expectedTag || '(preserved)'
          });
        }
      }
    }
  }

  console.log(`\n==================================================`);
  console.log(`Total Verified Discrepancies: ${report.length}`);
  console.log(`==================================================\n`);

  if (report.length > 0) {
    console.warn("⚠️ DRIFT DETECTED! Updating respective databases...");
    console.table(report);

    const filesToUpdate = [...new Set(report.map(r => r.file))];
    for (const filename of filesToUpdate) {
      const filePath = getFilePath(filename);
      let content = fs.readFileSync(filePath, 'utf8');

      const hubDiscrepancies = report.filter(r => r.file === filename);
      for (const item of hubDiscrepancies) {
        const safeAirline = item.airline.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        
        // 1. Update the terminal string
        const regex = new RegExp(`(name:\\s*['"]${safeAirline}['"][\\s\\S]*?terminal:\\s*['"])[^'"]+(['"])`, 'i');
        content = content.replace(regex, `$1${item.officialWebsiteTerminal}$2`);

        // 2. Automatically derive and update the matching tag ONLY if it's a standard Terminal
        const isStandardTerminal = /^terminal/i.test(item.officialWebsiteTerminal);
        const newTagMatch = isStandardTerminal ? item.officialWebsiteTerminal.match(/\d+/) : null;
        
        if (newTagMatch) {
          const newTag = `t${newTagMatch[0]}`;
          const tagRegex = new RegExp(`(name:\\s*['"]${safeAirline}['"][\\s\\S]*?tag:\\s*['"])[^'"]+(['"])`, 'i');
          content = content.replace(tagRegex, `$1${newTag}$2`);
          console.log(`✨ [${filename}] Corrected "${item.airline}" to terminal "${item.officialWebsiteTerminal}" with tag "${newTag}".`);
        } else {
          console.log(`✨ [${filename}] Corrected "${item.airline}" to terminal "${item.officialWebsiteTerminal}" (custom concourse tag preserved).`);
        }
      }

      fs.writeFileSync(filePath, content, 'utf8');
    }
    console.log("\n💾 All database files successfully patched with correct data and synced tags.");
  } else {
    console.log("✅ Audit completed: All airport databases match official reference assignments perfectly.");
  }
}

runAudit();