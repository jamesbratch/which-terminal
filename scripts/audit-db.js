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

// Official authoritative baseline directory mappings for NAIA
async function fetchOfficialManilaTerminals() {
  const terminalMap = {
    "philippine airlines": "Terminal 2", // Domestic baseline
    "pal express": "Terminal 2",
    "cebu pacific": "Terminal 3",
    "airasia philippines": "Terminal 2",
    "air china": "Terminal 3",
    "cathay pacific": "Terminal 3",
    "emirates": "Terminal 3",
    "singapore airlines": "Terminal 3",
    "japan airlines": "Terminal 3",
    "all nippon airways": "Terminal 3",
    "asiana airlines": "Terminal 1",
    "korean air": "Terminal 1",
    "eva air": "Terminal 1",
    "china airlines": "Terminal 1",
    "pr": "Terminal 2",
    "5j": "Terminal 3",
    "cx": "Terminal 3",
    "ek": "Terminal 3"
  };

  try {
    const response = await fetch('https://newnaia.com.ph/flights/airline-information', {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const html = await response.text();
    const matches = html.matchAll(/(?:class="airline-name">([^<]+)<\/div>|([A-Z0-9]{2})\))[\s\S]*?Terminal\s*(\d)/gi);
    for (const match of matches) {
      if (match[1]) terminalMap[match[1].trim().toLowerCase()] = `Terminal ${match[3]}`;
      if (match[2]) terminalMap[match[2].trim().toLowerCase()] = `Terminal ${match[3]}`;
    }
  } catch (error) {
    console.warn('Live fetch warning, using authoritative baseline map.');
  }

  return terminalMap;
}

async function runAudit() {
  console.log("🔍 Running automated terminal alignment audit...\n");

  const mnlLiveMap = await fetchOfficialManilaTerminals();
  const mnlFile = getFilePath('mnl-database.js', 'naia-database.js');
  const databases = [{ name: "Manila (NAIA)", fileInfo: mnlFile, hub: "MNL", liveMap: mnlLiveMap }];

  const report = [];

  for (const dbInfo of databases) {
    console.log(`Auditing ${dbInfo.name} (${dbInfo.fileInfo.filename})...`);
    const records = loadLocalDatabase(dbInfo.fileInfo);

    for (const record of records) {
      if (record.terminal.includes('/')) continue;

      const strippedName = record.name.replace(/\s*\([^)]*\)/g, '').trim().toLowerCase();
      const code = (record.code || '').toLowerCase();
      
      const officialTerminal = dbInfo.liveMap[record.name.toLowerCase()] || dbInfo.liveMap[strippedName] || dbInfo.liveMap[code];

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
      console.log(`Updated "${item.airline}" in ${item.fileInfo.filename} to "${item.officialWebsiteTerminal}"`);
    }

    console.log("\n✨ Local files updated. Ready for Pull Request generation.");
  } else {
    console.log("\n✅ All local terminal databases match official airport directories!");
  }
}

runAudit();