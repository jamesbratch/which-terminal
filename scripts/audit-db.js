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
  const content = fs.readFileSync(fileInfo.path, 'utf8');
  const jsonMatch = content.match(/const\s+\w+\s*=\s*(\[\s*\{[\s\S]*?\}\s*\]);/);
  if (!jsonMatch) return [];

  try {
    return eval(jsonMatch[1]);
  } catch (err) {
    console.error("Error evaluating database:", err);
    return [];
  }
}

async function runAudit() {
  console.log("🔍 Running Diagnostic Terminal Audit...\n");

  // Baseline official reference map
  const officialMap = {
    "philippine airlines": "Terminal 2",
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

    console.log(`--------------------------------------------------`);
    console.log(`Airline Record: "${record.name}"`);
    console.log(`  - Local Terminal in File: "${record.terminal}"`);
    console.log(`  - Stripped Name Key: "${strippedName}"`);
    console.log(`  - Official Mapped Terminal: "${officialTerminal || 'NONE FOUND'}"`);

    if (officialTerminal) {
      const normalizedLocal = record.terminal.toLowerCase().replace(/terminal\s*/, 't').trim();
      const normalizedOfficial = officialTerminal.toLowerCase().replace(/terminal\s*/, 't').trim();

      console.log(`  - Normalized Local: "${normalizedLocal}" vs Official: "${normalizedOfficial}"`);

      if (!normalizedLocal.includes(normalizedOfficial)) {
        console.log(`  🚨 MISMATCH DETECTED! Adding to report queue.`);
        report.push({
          airline: record.name,
          dbTerminal: record.terminal,
          officialWebsiteTerminal: officialTerminal
        });
      } else {
        console.log(`  ✅ Match verified.`);
      }
    } else {
      console.log(`  ⚠️ Skipped: No official baseline mapping found for this entry.`);
    }
  }

  console.log(`\n==================================================`);
  console.log(`Total Discrepancies Found: ${report.length}`);
  console.log(`==================================================\n`);

  if (report.length > 0) {
    console.warn("⚠️ TERMINAL DISCREPANCIES DETECTED! Updating database files...");
    console.table(report);

    for (const item of report) {
      let content = fs.readFileSync(fileInfo.path, 'utf8');
      const safeAirline = item.airline.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(name:\\s*['"]${safeAirline}['"][\\s\\S]*?terminal:\\s*['"])[^'"]+(['"])`, 'i');
      
      content = content.replace(regex, `$1${item.officialWebsiteTerminal}$2`);
      fs.writeFileSync(fileInfo.path, content, 'utf8');
      console.log(`✨ Successfully updated "${item.airline}" to "${item.officialWebsiteTerminal}" in ${fileInfo.filename}`);
    }
  } else {
    console.log("✅ Audit completed: All entries matched baseline successfully.");
  }
}

runAudit();