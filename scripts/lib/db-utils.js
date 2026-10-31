// scripts/lib/db-utils.js - safe helpers for editing/reading hubs/*/*-database.js
const fs = require('fs');
const path = require('path');

function resolveFile(relativePath) {
  const a = path.resolve(process.cwd(), relativePath);
  if (fs.existsSync(a)) return a;
  const b = path.resolve(__dirname, '..', '..', relativePath);
  return fs.existsSync(b) ? b : null;
}

/** `[` of `const x = [` and its MATCHING `]`; skips strings and comments. */
function findDbArray(content) {
  const decl = /(?:const|let|var)\s+[\w$]+\s*=\s*\[/.exec(content);
  const start = decl ? decl.index + decl[0].length - 1 : content.indexOf('[');
  if (start === -1) return null;
  let depth = 0;
  for (let i = start; i < content.length; i++) {
    const c = content[i], n = content[i + 1];
    if (c === '/' && n === '/') { const e = content.indexOf('\n', i); i = e === -1 ? content.length : e; continue; }
    if (c === '/' && n === '*') { const e = content.indexOf('*/', i + 2); i = e === -1 ? content.length : e + 1; continue; }
    if (c === '"' || c === "'" || c === '`') {
      for (i++; i < content.length && content[i] !== c; i++) if (content[i] === '\\') i++;
      continue;
    }
    if (c === '[') depth++;
    else if (c === ']' && --depth === 0) return { start, end: i };
  }
  return null;
}

/** Parse the array literal. Returns { entries, error }. */
function loadEntries(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const b = findDbArray(content);
    if (!b) return { entries: [], error: 'Could not find the database array' };
    const entries = new Function(`return ${content.slice(b.start, b.end + 1)}`)();
    return { entries, error: null, content, bounds: b };
  } catch (e) {
    return { entries: [], error: `Could not parse the database: ${e.message}` };
  }
}

module.exports = { resolveFile, findDbArray, loadEntries };