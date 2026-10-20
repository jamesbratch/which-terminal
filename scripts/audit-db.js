// scripts/audit-db.js
const fs = require('fs');
const path = require('path');

function getFilePath(preferredName, fallbackName) {
  let p = path.join(__dirname, '..', preferredName);
  if (fs.existsSync(p)) return { path: p, filename: preferredName };
  p = path.join(__dirname, '..', fallbackName);
  if (fs.existsSync(p)) return { path: p, filename: fallbackName };
  return { path: null, filename: preferredName };
}

function loadLocalDatabase(fileInfo) {
  if (!fileInfo.path) return [];
  try {
    let content = fs.readFileSync(fileInfo.path, 'utf8');

    // Remove window assignment and DOM listeners so node can evaluate cleanly
    content = content.replace(/window\.\w+\s*=\s*\w+;/g, '');
    content = content.replace(/document\.addEventListener[\s\S]*/g, '');

    // Extract everything between the first '[' and last ']'
    const startIdx = content.indexOf('[');
    const endIdx = content.lastIndexOf(']');

    if (startIdx === -1 || endIdx === -1) return [];

    const arrayString = content.substring(startIdx, endIdx + 1);
    return eval(arrayString);
  } catch (err) {
    console.error(`Error loading database from ${fileInfo.filename}:`, err.message);
    return [];
  }
}

async function runAudit() {
  console.log("🔍 Running Diagnostic Terminal Audit...\n");

  // Baseline official reference map
  const officialMap = {
    "philippine airlines": "Terminal 2",
    "philippine airlines (domestic)": "Terminal 2",
    "pal express": "Terminal 2",
    "cebu pacific": "Terminal 3",
    "airasia philippines": "Terminal 2",
    "air china": "Terminal 3",
    "cathay pacific": "Terminal 3",
    "pr": "Terminal 2",
    "5j": "Terminal 3"
  };

  const fileInfo = getFilePath('mnl-database.js', 'naia-database.js');
  console.log(`📂 Target Database File Found: ${fileInfo.filename} at path: ${fileInfo.path}`);
  
  const records = loadLocalDatabase(fileInfo);
  console.log(`📊 Total records loaded from database: ${records.length}\n`);

  const report = [];

  for (const record of records) {
    const strippedName = record.name.replace(/\s*\([^)]*\)/g, '').trim().toLowerCase();
    const code = (record.code || '').toLowerCase();
    
    const officialTerminal = officialMap[record.name.toLowerCase()] || officialMap[strippedName] || officialMap[code];

    if (officialTerminal) {
      const normalizedLocal = record.terminal.toLowerCase().replace(/terminal\s*/, 't').trim();
      const normalizedOfficial = officialTerminal.toLowerCase().replace(/terminal\s*/, 't').trim();

      if (!normalizedLocal.includes(normalizedOfficial)) {
        console.log(`🚨 MISMATCH FOUND for "${record.name}": File has "${record.terminal}" | Official is "${officialTerminal}"`);
        report.push({
          airline: record.name,
          dbTerminal: record.terminal,
          officialWebsiteTerminal: officialTerminal
        });
      }
    }
  }

  console.log(`\n==================================================`);
  console.log(`Total Discrepancies Found: ${report.length}`);
  console.log(`==================================================\n`);

  if (report.length > 0) {
    console.warn("⚠️ TERMINAL DISCREPANCIES DETECTED! Updating database files...");
    console.table(report);

    let content = fs.readFileSync(fileInfo.path, 'utf8');

    for (const item of report) {
      const safeAirline = item.airline.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(name:\\s*['"]${safeAirline}['"][\\s\\S]*?terminal:\\s*['"])[^'"]+(['"])`, 'i');
      
      content = content.replace(regex, `$1${item.officialWebsiteTerminal}$2`);
      console.log(`✨ Corrected "${item.airline}" to "${item.officialWebsiteTerminal}"`);
    }

    fs.writeFileSync(fileInfo.path, content, 'utf8');
    console.log(`\n💾 Saved updated records back to ${fileInfo.filename}`);
  } else {
    console.log("✅ Audit completed: All entries matched baseline successfully.");
  }
}

runAudit();