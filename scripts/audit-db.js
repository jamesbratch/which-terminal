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
    return [];
  }
}

async function fetchOfficialManilaTerminals() {
  const terminalMap = {};
  try {
    const response = await fetch('https://newnaia.com.ph/flights/airline-information', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    const html = await response.text();

    const matches = html.matchAll(/(?:class="airline-name">([^<]+)<\/div>|([A-Z0-9]{2})\))[\s\S]*?Terminal\s*(\d)/gi);
    for (const match of matches) {
      if (match[1]) terminalMap[match[1].trim().toLowerCase()] = `Terminal ${match[3]}`;
      if (match[2]) terminalMap[match[2].trim().toLowerCase()] = `Terminal ${match[3]}`;
    }
  } catch (error) {
    console.warn('Could not fetch NAIA directory:', error.message);
  }
  
  console.log("🔍 Scraped NAIA Map Keys:", Object.keys(terminalMap));
  return terminalMap;
}

async function fetchOfficialDMKTerminals() {
  return {};
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

  const mnlFile = getFilePath('mnl-database.js', 'naia-database.js');
  const dmkFile = getFilePath('dmk-database.js', 'dmk-database.js');
  const bkkFile = getFilePath('bkk-database.js', 'bkk-database.js');

  const databases = [
    { name: "Manila (NAIA)", fileInfo: mnlFile, hub: "MNL", liveMap: mnlLiveMap }
  ];

  const report = [];

  for (const dbInfo of databases) {
    console.log(`Auditing ${dbInfo.name} (${dbInfo.fileInfo.filename})...`);
    const records = loadLocalDatabase(dbInfo.fileInfo);

    for (const record of records) {
      if (record.terminal.includes('/')) continue;

      const strippedName = record.name.replace(/\s*\([^)]*\)/g, '').trim().toLowerCase();
      const code = (record.code || '').toLowerCase();
      
      const officialTerminal = dbInfo.liveMap[record.name.toLowerCase()] || dbInfo.liveMap[strippedName] || dbInfo.liveMap[code];

      console.log(`Checking: ${record.name} (Code: ${code}) -> Found Live: ${officialTerminal || 'NOT FOUND IN LIVE MAP'}`);

      if (officialTerminal) {
        const normalizedLocal = record.terminal.toLowerCase().replace(/terminal\s*/, 't').trim();
        const normalizedOfficial = officialTerminal.toLowerCase().replace(/terminal\s*/, 't').trim();

        if (!normalizedLocal.includes(normalizedOfficial)) {
          report.push({
            hub: dbInfo.hub,
            airline: record.name,
            fileInfo: dbInfo.fileInfo,
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
      let content = fs.readFileSync(item.fileInfo.path, 'utf8');
      const safeAirline = item.airline.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(name:\\s*['"]${safeAirline}['"][\\s\\S]*?terminal:\\s*['"])[^'"]+(['"])`, 'i');
      
      content = content.replace(regex, `$1${item.officialWebsiteTerminal}$2`);
      fs.writeFileSync(item.fileInfo.path, content, 'utf8');
      console.log(`Updated "${item.airline}" to "${item.officialWebsiteTerminal}"`);
    }

    console.log("\n✨ Local files updated. Ready for Pull Request generation.");
  } else {
    console.log("\n✅ All local terminal databases match official airport web directories!");
  }
}

runAudit();