// scripts/audit-db.js
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

function getFilePath(relativePath) {
  const rootPath = path.resolve(process.cwd(), relativePath);
  if (fs.existsSync(rootPath)) return rootPath;
  const scriptRelPath = path.resolve(__dirname, '..', relativePath);
  if (fs.existsSync(scriptRelPath)) return scriptRelPath;
  return null;
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

async function scrapeLiveNaiaMappings() {
  console.log("🌐 Launching headless browser to scrape https://newnaia.com.ph/flights/airline-information...");
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.goto('https://newnaia.com.ph/flights/airline-information', { waitUntil: 'networkidle2', timeout: 40000 });
    await new Promise(resolve => setTimeout(resolve, 6000));

    // Extract mappings directly from the DOM using container scoping
    const finalMappings = await page.evaluate(() => {
      const results = {};
      
      // Look for container blocks or list items that house the airline info along with their terminal context
      // On many Bootstrap/Tailwind SPAs, sections have ID or class attributes matching terminal identifiers
      const terminalBlocks = document.querySelectorAll('div[id*="terminal"], section[id*="terminal"], .tab-pane, .card, .airline-container');

      if (terminalBlocks.length > 0) {
        terminalBlocks.forEach(block => {
          const blockText = block.innerText || '';
          const lowerBlockText = blockText.toLowerCase();

          let term = null;
          if (lowerBlockText.includes('terminal 1')) term = 'Terminal 1';
          else if (lowerBlockText.includes('terminal 2')) term = 'Terminal 2';
          else if (lowerBlockText.includes('terminal 3')) term = 'Terminal 3';
          else if (lowerBlockText.includes('terminal 4')) term = 'Terminal 4';

          if (term) {
            const items = block.querySelectorAll('li, p, td, span');
            items.forEach(item => {
              const text = item.innerText ? item.innerText.trim() : '';
              if (text.includes('(') && text.includes(')')) {
                const cleanName = text.split('(')[0].trim().toLowerCase();
                const isJunk = 
                  cleanName.length <= 2 || 
                  cleanName.includes('terminal') || 
                  cleanName.includes('flight') || 
                  cleanName.includes('©') || 
                  cleanName.includes('corp') || 
                  cleanName.includes('rights') ||
                  cleanName.includes('infra');

                if (!isJunk) {
                  results[cleanName] = term;
                }
              }
            });
          }
        });
      }

      // Fallback: If no structured blocks matched, perform a safe parse looking for explicit heading-to-item proximities
      if (Object.keys(results).length === 0) {
        const allElements = document.querySelectorAll('*');
        let currentTerm = 'Terminal 1';

        allElements.forEach(el => {
          const text = el.innerText ? el.innerText.trim() : '';
          const lower = text.toLowerCase();

          if (lower === 'terminal 1' || lower === 'naia terminal 1') currentTerm = 'Terminal 1';
          if (lower === 'terminal 2' || lower === 'naia terminal 2') currentTerm = 'Terminal 2';
          if (lower === 'terminal 3' || lower === 'naia terminal 3') currentTerm = 'Terminal 3';
          if (lower === 'terminal 4' || lower === 'naia terminal 4') currentTerm = 'Terminal 4';

          if (text.includes('(') && text.includes(')') && el.children.length === 0) {
            const cleanName = text.split('(')[0].trim().toLowerCase();
            const isJunk = 
              cleanName.length <= 2 || 
              cleanName.includes('terminal') || 
              cleanName.includes('flight') || 
              cleanName.includes('©') || 
              cleanName.includes('corp') || 
              cleanName.includes('rights') ||
              cleanName.includes('infra');

            if (!isJunk) {
              results[cleanName] = currentTerm;
            }
          }
        });
      }

      return results;
    });

    await browser.close();
    console.log(`🌐 Successfully extracted ${Object.keys(finalMappings).length} mappings via robust DOM scoping.`);
    return finalMappings;
  } catch (err) {
    console.error(`❌ Failed to scrape live NAIA site: ${err.message}`);
    await browser.close();
    return null;
  }
}

async function runAudit() {
  console.log("🔍 Running Comprehensive Multi-Airport Live Audit...\n");

  const liveMnlMappings = await scrapeLiveNaiaMappings() || {};

  const masterOfficialMap = {
    "mnl": liveMnlMappings,
    "bkk": {
      "thai airways": "Main Terminal",
      "bangkok airways": "Main Terminal",
      "emirates": "SAT-1 Concourse",
      "qatar airways": "Main Terminal"
    },
    "dmk": {
      "airasia": "Terminal 1",
      "thai airasia": "Terminal 1",
      "nok air": "Terminal 1",
      "thai lion air": "Terminal 2"
    }
  };

  const targets = [
    { hub: "mnl", filename: "hubs/mnl/mnl-database.js" },
    { hub: "bkk", filename: "hubs/bkk/bkk-database.js" },
    { hub: "dmk", filename: "hubs/dmk/dmk-database.js" }
  ];

  const report = [];
  const missingAirlinesReport = [];

  for (const target of targets) {
    const filePath = getFilePath(target.filename);
    if (!filePath) continue;

    console.log(`Auditing hub [${target.hub.toUpperCase()}] using ${target.filename}...`);
    const records = loadLocalDatabase(filePath);
    const airportMap = masterOfficialMap[target.hub] || {};
    const existingAirlineNames = new Set(records.map(r => r.name.toLowerCase().trim()));

    // 1. Check existing records for mismatches
    for (const record of records) {
      const exactKey = record.name.toLowerCase().trim();
      const expectedTerminal = airportMap[exactKey];

      if (expectedTerminal) {
        const normalizedLocalTerm = record.terminal.toLowerCase().replace(/terminal\s*/, 't').trim();
        const normalizedExpectedTerm = expectedTerminal.toLowerCase().replace(/terminal\s*/, 't').trim();
        
        const isStandardTerminal = /^terminal/i.test(expectedTerminal);
        const expectedTagMatch = isStandardTerminal ? expectedTerminal.match(/\d+/) : null;
        const expectedTag = expectedTagMatch ? `t${expectedTagMatch[0]}` : null;
        const localTag = record.tag ? record.tag.toLowerCase().trim() : '';

        if (!normalizedLocalTerm.includes(normalizedExpectedTerm) || (expectedTag && localTag !== expectedTag)) {
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

   // 2. Check for missing airlines present in live map but NOT in local records
    if (target.hub === 'mnl') {
      for (const [liveAirlineName, liveTerminal] of Object.entries(airportMap)) {
        
        // 🚨 SAFEGUARD: Skip footer text, copyright lines, or junk noise
        const lowerName = liveAirlineName.toLowerCase();
        if (
          lowerName.includes('©') || 
          lowerName.includes('corp') || 
          lowerName.includes('rights') ||
          lowerName.includes('infra')
        ) {
          continue;
        }

        const found = Array.from(existingAirlineNames).some(localName => 
          localName.includes(liveAirlineName) || liveAirlineName.includes(localName)
        );

        if (!found) {
          missingAirlinesReport.push({
            hub: 'MNL',
            file: target.filename,
            airline: liveAirlineName,
            officialWebsiteTerminal: liveTerminal
          });
        }
      }
    }
  }

  console.log(`\n==================================================`);
  console.log(`Total Mismatched Discrepancies: ${report.length}`);
  console.log(`Total Missing Airlines Found: ${missingAirlinesReport.length}`);
  console.log(`==================================================\n`);

  if (report.length > 0 || missingAirlinesReport.length > 0) {
    if (report.length > 0) {
      console.warn("⚠️ DRIFT DETECTED: Updating mismatched terminals...");
      console.table(report);
      
      const filesToUpdate = [...new Set(report.map(r => r.file))];
      for (const filename of filesToUpdate) {
        const filePath = getFilePath(filename);
        let content = fs.readFileSync(filePath, 'utf8');
        const hubDiscrepancies = report.filter(r => r.file === filename);
        
        for (const item of hubDiscrepancies) {
          const safeAirline = item.airline.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(`(name:\\s*['"]${safeAirline}['"][\\s\\S]*?terminal:\\s*['"])[^'"]+(['"])`, 'i');
          content = content.replace(regex, `$1${item.officialWebsiteTerminal}$2`);

          const isStandardTerminal = /^terminal/i.test(item.officialWebsiteTerminal);
          const newTagMatch = isStandardTerminal ? item.officialWebsiteTerminal.match(/\d+/) : null;
          if (newTagMatch) {
            const newTag = `t${newTagMatch[0]}`;
            const tagRegex = new RegExp(`(name:\\s*['"]${safeAirline}['"][\\s\\S]*?tag:\\s*['"])[^'"]+(['"])`, 'i');
            content = content.replace(tagRegex, `$1${newTag}$2`);
          }
        }
        fs.writeFileSync(filePath, content, 'utf8');
      }
    }

    if (missingAirlinesReport.length > 0) {
      console.warn("⚠️ MISSING AIRLINES DETECTED: Appending new entries to database...");
      console.table(missingAirlinesReport);

      for (const item of missingAirlinesReport) {
        const filePath = getFilePath(item.file);
        let content = fs.readFileSync(filePath, 'utf8');
        
        const termNum = item.officialWebsiteTerminal.match(/\d+/) ? item.officialWebsiteTerminal.match(/\d+/)[0] : '1';
        const newEntry = `  { name: "${item.airline.charAt(0).toUpperCase() + item.airline.slice(1)}", code: "XX", terminal: "${item.officialWebsiteTerminal}", tag: "t${termNum}", hubName: "Manila (NAIA)", hubCode: "mnl", link: "hubs/mnl/mnl.html", notes: "Auto-appended from live official source." },\n`;
        
        // Insert right before the closing bracket of the array
        const lastBracketIdx = content.lastIndexOf(']');
        if (lastBracketIdx !== -1) {
          content = content.slice(0, lastBracketIdx) + newEntry + content.slice(lastBracketIdx);
          fs.writeFileSync(filePath, content, 'utf8');
          console.log(`✨ Appended missing airline "${item.airline}" to ${item.file}`);
        }
      }
    }

    console.log("\n💾 All database files successfully patched with updates and missing airlines.");
  } else {
    console.log("✅ Audit completed: All local databases match live official sources perfectly.");
  }
}

runAudit();