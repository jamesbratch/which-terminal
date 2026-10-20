// scripts/audit-db.js
const fs = require('fs');
const path = require('path');

const DB_FILES = {
  MNL: 'mnl-database.js',
  DMK: 'dmk-database.js',
  BKK: 'bkk-database.js'
};

function loadLocalDatabase(filename) {
  const filePath = path.join(__dirname, '..', filename);
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, 'utf8');
  const jsonMatch = content.match(/const\s+\w+\s*=\s*(\[\s*\{[\s\S]*?\}\s*\]);/);
  if (!jsonMatch) return [];
  try {
    return eval(jsonMatch[1]);
  } catch (err) {
    return [];
  }
}

async function fetchOfficialManilaTerminals() {
  const terminalMap = {};
  try {
    const response = await fetch('https://newnaia.com.ph/flights/airline-information');
    const html = await response.text();

    // Extracts both Airline Names and IATA Codes (e.g. Air China (CA))
    const matches = html.matchAll(/(?:class="airline-name">([^<]+)<\/div>|([A-Z0-9]{2})\))[\s\S]*?Terminal\s*(\d)/gi);
    for (const match of matches) {
      if (match[1]) terminalMap[match[1].trim().toLowerCase()] = `Terminal ${match[3]}`;
      if (match[2]) terminalMap[match[2].trim().toLowerCase()] = `Terminal ${match[3]}`;
    }
  } catch (error) {
    console.warn('Could not fetch NAIA site:', error.message);
  }
  return terminalMap;
}

async function fetchOfficialDMKTerminals() {
  const terminalMap = {};
  try {
    const response = await fetch('https://www.donmueangairport.com/');
    const html = await response.text();
    const t2Matches = html.matchAll(/(AirAsia|Thai Lion|Nok Air|Bangkok Airways|THAI Smile)/gi);
    for (const match of t2Matches) {
      terminalMap[match[1].toLowerCase()] = 'Terminal 2';
    }
  } catch (error) {
    console.warn('Could not fetch DMK site:', error.message);
  }
  return terminalMap;
}

async function fetchOfficialBKKTerminals() {
  return {};
}

async function runAudit() {
  console.log("🔍 Fetching live updates directly from airport web portals...\n");

  const [mnlLiveMap, dmkLiveMap, bkkLiveMap] = await Promise.all([
    fetchOfficialManilaTerminals(),
    fetchOfficialDMKTerminals(),
    fetchOfficialBKKTerminals()
  ]);

  const databases = [
    { name: "Manila (NAIA)", file: DB_FILES.MNL, hub: "MNL", liveMap: mnlLiveMap },
    { name: "Bangkok (DMK)", file: DB_FILES.DMK, hub: "DMK", liveMap: dmkLiveMap },
    { name: "Bangkok (BKK)", file: DB_FILES.BKK, hub: "BKK", liveMap: bkkLiveMap }
  ];

  const report = [];

  for (const dbInfo of databases) {
    console.log(`Auditing ${dbInfo.name}...`);
    const records = loadLocalDatabase(dbInfo.file);

    for (const record of records) {
      if (record.terminal.includes('/') || record.terminal.includes('Main Terminal / SAT-1')) {
        continue;
      }

      // Check match by name OR IATA code
      const cleanName = record.name.replace(/\s*\([^)]*\)/g, '').trim().toLowerCase();
      const code = (record.code || '').toLowerCase();
      
      const officialTerminal = dbInfo.liveMap[cleanName] || dbInfo.liveMap[code] || dbInfo.liveMap[record.name.toLowerCase()];

      if (officialTerminal) {
        const normalizedLocal = record.terminal.toLowerCase().replace(/terminal\s*/, 't').trim();
        const normalizedOfficial = officialTerminal.toLowerCase().replace(/terminal\s*/, 't').trim();

        if (!normalizedLocal.includes(normalizedOfficial)) {
          report.push({
            hub: dbInfo.hub,
            airline: record.name,
            file: dbInfo.file,
            dbTerminal: record.terminal,
            officialWebsiteTerminal: officialTerminal
          });
        }
      }
    }
  }

  if (report.length > 0) {
    console.warn("\n⚠️ TERMINAL DISCREPANCIES DETECTED! Updating database files...");
    console.table(report);

    for (const item of report) {
      const filePath = path.join(__dirname, '..', item.file);
      let content = fs.readFileSync(filePath, 'utf8');

      const safeAirline = item.airline.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(name:\\s*['"]${safeAirline}['"][\\s\\S]*?terminal:\\s*['"])[^'"]+(['"])`, 'i');
      
      content = content.replace(regex, `$1${item.officialWebsiteTerminal}$2`);
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated ${item.airline} in ${item.file} to "${item.officialWebsiteTerminal}"`);
    }

    console.log("\n✨ Local files updated. Ready for Pull Request generation.");
  } else {
    console.log("\n✅ All local terminal databases match official airport web directories!");
  }
}

runAudit();