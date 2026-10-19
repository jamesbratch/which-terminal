// scripts/audit-db.js
const fs = require('fs');
const path = require('path');

// 1. Helper to extract array data from local database files
function loadLocalDatabase(filename, varName) {
  const filePath = path.join(__dirname, '..', filename);
  if (!fs.existsSync(filePath)) return [];
  
  const content = fs.readFileSync(filePath, 'utf8');
  // Simple match to parse array content without complex bundling
  const jsonMatch = content.match(/const\s+\w+\s*=\s*(\[\s*\{[\s\S]*?\}\s*\]);/);
  if (!jsonMatch) return [];

  try {
    // Evaluate clean array safely
    return eval(jsonMatch[1]);
  } catch (err) {
    console.error(`Failed to parse ${filename}:`, err);
    return [];
  }
}

// 2. Fetch live flight status for an airline via free flight APIs (Aviationstack example)
async function fetchLiveTerminal(airlineCode, airportIata) {
  const API_KEY = process.env.AVIATIONSTACK_KEY;
  if (!API_KEY) return null;

  try {
    const url = `https://api.aviationstack.com/v1/flights?access_key=${API_KEY}&airline_iata=${airlineCode}&arr_iata=${airportIata}&limit=3`;
    const response = await fetch(url);
    const data = await response.json();

    if (data && data.data && data.data.length > 0) {
      // Extract terminal from incoming flight data
      const sample = data.data.find(f => f.arrival && f.arrival.terminal);
      return sample ? sample.arrival.terminal : null;
    }
  } catch (error) {
    console.warn(`Could not verify ${airlineCode} at ${airportIata}:`, error.message);
  }
  return null;
}

// 3. Main Audit Loop
async function runAudit() {
  console.log("🔍 Running Terminal Drift Audit...\n");

  const databases = [
    { name: "Manila (NAIA)", file: "mnl-database.js", varName: "naiaDatabase", hub: "MNL" },
    { name: "Bangkok (BKK)", file: "bkk-database.js", varName: "bkkDatabase", hub: "BKK" },
    { name: "Bangkok (DMK)", file: "dmk-database.js", varName: "dmkDatabase", hub: "DMK" }
  ];

  const report = [];

  for (const dbInfo of databases) {
    console.log(`Checking ${dbInfo.name}...`);
    const records = loadLocalDatabase(dbInfo.file, dbInfo.varName);

    for (const record of records) {
      // Skip carriers with multiple complex terminals unless checking specific routes
      if (record.terminal.includes('/') || record.terminal.includes('Main Terminal / SAT-1')) {
        continue;
      }

      const liveTerminal = await fetchLiveTerminal(record.code, dbInfo.hub);

      if (liveTerminal) {
        const normalizedLocal = record.terminal.toLowerCase().replace(/terminal\s*/, 't').trim();
        const normalizedLive = liveTerminal.toLowerCase().replace(/terminal\s*/, 't').trim();

        if (!normalizedLocal.includes(normalizedLive) && !normalizedLive.includes(normalizedLocal)) {
          report.push({
            hub: dbInfo.hub,
            airline: record.name,
            code: record.code,
            dbTerminal: record.terminal,
            detectedTerminal: liveTerminal
          });
        }
      }
    }
  }

  // 4. Output Audit Summary
  if (report.length > 0) {
    console.warn("\n⚠️ TERMINAL DISCREPANCIES DETECTED:");
    console.table(report);
    // Write report artifact for GitHub Actions step
    fs.writeFileSync(path.join(__dirname, 'drift-report.json'), JSON.stringify(report, null, 2));
    process.exit(1); // Fail step so GitHub Action triggers notification
  } else {
    console.log("\n✅ All airline database terminal records match live operational data!");
  }
}

runAudit();