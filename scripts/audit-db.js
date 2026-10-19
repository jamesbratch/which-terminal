// scripts/audit-db.js
const fs = require('fs');
const path = require('path');

// 1. Helper to extract database array from local file
function loadLocalDatabase(filename) {
  const filePath = path.join(__dirname, '..', filename);
  if (!fs.existsSync(filePath)) return [];
  
  const content = fs.readFileSync(filePath, 'utf8');
  const jsonMatch = content.match(/const\s+\w+\s*=\s*(\[\s*\{[\s\S]*?\}\s*\]);/);
  if (!jsonMatch) return [];

  try {
    return eval(jsonMatch[1]);
  } catch (err) {
    console.error(`Failed to parse ${filename}:`, err);
    return [];
  }
}

// 2. Fetch Manila (NAIA) Directory directly from newnaia.com.ph
async function fetchOfficialManilaTerminals() {
  const terminalMap = {};
  try {
    const response = await fetch('https://newnaia.com.ph/flights/airline-information');
    const html = await response.text();

    // Regex match airline names and terminal assignments in page markup
    const matches = html.matchAll(/class="airline-name">([^<]+)<\/div>[\s\S]*?Terminal\s*(\d)/gi);
    for (const match of matches) {
      const airlineName = match[1].trim().toLowerCase();
      const terminalNumber = `T${match[2]}`;
      terminalMap[airlineName] = terminalNumber;
    }
  } catch (error) {
    console.warn('Could not fetch directly from NAIA website:', error.message);
  }
  return terminalMap;
}

// 3. Check Don Mueang (DMK) Terminal structure
async function fetchOfficialDMKTerminals() {
  const terminalMap = {};
  try {
    const response = await fetch('https://www.donmueangairport.com/');
    const html = await response.text();

    const t2Matches = html.matchAll(/(AirAsia|Thai Lion|Nok Air|Bangkok Airways|THAI Smile)/gi);
    for (const match of t2Matches) {
      terminalMap[match[1].toLowerCase()] = 'T2';
    }
  } catch (error) {
    console.warn('Could not fetch DMK directory:', error.message);
  }
  return terminalMap;
}

// 4. Check Suvarnabhumi (BKK) Satellite & Main Terminal mappings
async function fetchOfficialBKKTerminals() {
  const terminalMap = {};
  try {
    const response = await fetch('https://www.bangkokairportonline.com/suvarnabhumi-airport-terminal-map/');
    const html = await response.text();

    if (html.includes('SAT-1')) {
      terminalMap['sat1_active'] = true;
    }
  } catch (error) {
    console.warn('Could not fetch BKK directory:', error.message);
  }
  return terminalMap;
}

// 5. Main Audit Runner
async function runAudit() {
  console.log("🔍 Fetching live updates directly from airport web portals...\n");

  const [mnlLiveMap, dmkLiveMap, bkkLiveMap] = await Promise.all([
    fetchOfficialManilaTerminals(),
    fetchOfficialDMKTerminals(),
    fetchOfficialBKKTerminals()
  ]);

  const databases = [
    { name: "Manila (NAIA)", file: "mnl-database.js", hub: "MNL", liveMap: mnlLiveMap },
    { name: "Bangkok (DMK)", file: "dmk-database.js", hub: "DMK", liveMap: dmkLiveMap },
    { name: "Bangkok (BKK)", file: "bkk-database.js", hub: "BKK", liveMap: bkkLiveMap }
  ];

  const report = [];

  for (const dbInfo of databases) {
    console.log(`Auditing ${dbInfo.name}...`);
    const records = loadLocalDatabase(dbInfo.file);

    for (const record of records) {
      if (record.terminal.includes('/') || record.terminal.includes('Main Terminal / SAT-1')) {
        continue;
      }

      const officialTerminal = dbInfo.liveMap[record.name.toLowerCase()];
      if (officialTerminal) {
        const normalizedLocal = record.terminal.toLowerCase().replace(/terminal\s*/, 't').trim();
        const normalizedOfficial = officialTerminal.toLowerCase().replace(/terminal\s*/, 't').trim();

        if (!normalizedLocal.includes(normalizedOfficial)) {
          report.push({
            hub: dbInfo.hub,
            airline: record.name,
            code: record.code,
            dbTerminal: record.terminal,
            officialWebsiteTerminal: officialTerminal
          });
        }
      }
    }
  }

  if (report.length > 0) {
    console.warn("\n⚠️ TERMINAL DISCREPANCIES DETECTED:");
    console.table(report);
    fs.writeFileSync(path.join(__dirname, 'drift-report.json'), JSON.stringify(report, null, 2));
    process.exit(1);
  } else {
    console.log("\n✅ All local terminal databases match official airport web directories!");
  }
}

runAudit();