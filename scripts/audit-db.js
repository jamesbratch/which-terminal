// scripts/audit-db.js
const fs = require('fs');
const path = require('path');

// Map hub codes to database files
const DB_FILES = {
  MNL: 'mnl-database.js',
  DMK: 'dmk-database.js',
  BKK: 'bkk-database.js'
};

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

    const matches = html.matchAll(/class="airline-name">([^<]+)<\/div>[\s\S]*?Terminal\s*(\d)/gi);
    for (const match of matches) {
      const airlineName = match[1].trim().toLowerCase();
      const terminalNumber = `Terminal ${match[2]}`;
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
      terminalMap[match[1].toLowerCase()] = 'Terminal 2';
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

// 5. Main Audit & Auto-Sync Runner
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

      const officialTerminal = dbInfo.liveMap[record.name.toLowerCase()];
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
    console.warn("\n⚠️ TERMINAL DISCREPANCIES DETECTED! Updating local database files...");
    console.table(report);

    // Overwrite local database files with corrected terminal info
    for (const item of report) {
      const filePath = path.join(__dirname, '..', item.file);
      let content = fs.readFileSync(filePath, 'utf8');

      const safeAirline = item.airline.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(name:\\s*['"]${safeAirline}['"][\\s\\S]*?terminal:\\s*['"])[^'"]+(['"])`, 'i');
      
      content = content.replace(regex, `$1${item.officialWebsiteTerminal}$2`);
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated ${item.airline} in ${item.file} to "${item.officialWebsiteTerminal}"`);
    }

    console.log("\n✨ Database files updated locally for Pull Request generation.");
  } else {
    console.log("\n✅ All local terminal databases match official airport web directories!");
  }
}

runAudit();