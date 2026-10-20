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
  console.log("🔍 Running Multi-Airport Terminal Alignment Audit (NAIA, DMK, BKK)...\n");

  // Comprehensive official mapping across all supported hubs
  const masterOfficialMap = {
    // Manila (NAIA)
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
    // Bangkok Don Mueang (DMK)
    "dmk": {
      "airasia": "Terminal 1",
      "thai airasia": "Terminal 1",
      "nok air": "Terminal 1",
      "thai lion air": "Terminal 2"
    },
    // Bangkok Suvarnabhumi (BKK)
    "bkk": {
      "bangkok airways": "Terminal 1",
      "thai airways": "Terminal 1",
      "emirates": "Terminal 1",
      "qatar airways": "Terminal 1"
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
    if (!filePath) {
      console.log(`ℹ️ Skipped ${target.filename}: File not found.`);
      continue;
    }

    console.log(`Auditing hub [${target.hub.toUpperCase()}] using ${target.filename}...`);
    const records = loadLocalDatabase(filePath);
    const airportMap = masterOfficialMap[target.hub] || {};

    for (const record of records) {
      const exactKey = record.name.toLowerCase().trim();
      const officialTerminal = airportMap[exactKey];

      if (officialTerminal) {
        const normalizedLocal = record.terminal.toLowerCase().replace(/terminal\s*/, 't').trim();
        const normalizedOfficial = officialTerminal.toLowerCase().replace(/terminal\s*/, 't').trim();

        if (!normalizedLocal.includes(normalizedOfficial)) {
          report.push({
            hub: target.hub.toUpperCase(),
            file: target.filename,
            airline: record.name,
            dbTerminal: record.terminal,
            officialWebsiteTerminal: officialTerminal
          });
        }
      }
    }
  }

  console.log(`\n==================================================`);
  console.log(`Total Discrepancies Across All Airports: ${report.length}`);
  console.log(`==================================================\n`);

  if (report.length > 0) {
    console.warn("⚠️ TERMINAL DISCREPANCIES DETECTED! Updating respective databases...");
    console.table(report);

    // Group updates by file to patch them cleanly
    const filesToUpdate = [...new Set(report.map(r => r.file))];

    for (const filename of filesToUpdate) {
      const filePath = getFilePath(filename);
      let content = fs.readFileSync(filePath, 'utf8');

      const hubDiscrepancies = report.filter(r => r.file === filename);
      for (const item of hubDiscrepancies) {
        const safeAirline = item.airline.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(name:\\s*['"]${safeAirline}['"][\\s\\S]*?terminal:\\s*['"])[^'"]+(['"])`, 'i');
        content = content.replace(regex, `$1${item.officialWebsiteTerminal}$2`);
        console.log(`✨ [${filename}] Corrected "${item.airline}" to "${item.officialWebsiteTerminal}"`);
      }

      fs.writeFileSync(filePath, content, 'utf8');
    }
    console.log("\n💾 All affected database files successfully patched and ready for PR.");
  } else {
    console.log("✅ Audit completed: All airport databases match official assignments perfectly.");
  }
}

runAudit();