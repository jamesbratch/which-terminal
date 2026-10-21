// mnl-database.js / naia-database.js
const naiaDatabase = [
  // Philippine Domestic & Flag Carriers
  { name: "Philippine Airlines (International)", code: "PR", terminal: "Terminal 1", tag: "t1", notes: "Mainline international flights." },
  { name: "Philippine Airlines (Domestic)", code: "PR", terminal: "Terminal 2", tag: "t2", notes: "Domestic mainline routes." },
  { name: "PAL Express (Domestic)", code: "2P", terminal: "Terminal 2", tag: "t2", notes: "PAL domestic feeder flights." },
  { name: "AirAsia Philippines (International)", code: "Z2", terminal: "Terminal 1", tag: "t1", notes: "International flights." },
  { name: "AirAsia Philippines (Domestic)", code: "Z2", terminal: "Terminal 2", tag: "t2", notes: "Domestic flights." },
  { name: "AirAsia Malaysia", code: "AK", terminal: "Terminal 1", tag: "t1", notes: "Kuala Lumpur flights." },
  { name: "Cebu Pacific", code: "5J", terminal: "Terminal 3", tag: "t3", notes: "Mainline domestic and international." },
  { name: "CebGo", code: "DG", terminal: "Terminal 2", tag: "t2", notes: "Regional domestic turboprop flights." },
  { name: "AirSWIFT", code: "T6", terminal: "Terminal 2", tag: "t2", notes: "El Nido resort connections." },
  { name: "Sunlight Air", code: "2R", terminal: "Terminal 2", tag: "t2", notes: "Boutique island flights." },

  // Terminal 3 International Carriers
  { name: "Air China", code: "CA", terminal: "Terminal 3", tag: "t3", notes: "Beijing flights (Moved to T3)." },
  { name: "All Nippon Airways (ANA)", code: "NH", terminal: "Terminal 3", tag: "t3", notes: "Tokyo Haneda & Narita." },
  { name: "Cathay Pacific", code: "CX", terminal: "Terminal 3", tag: "t3", notes: "Hong Kong flights." },
  { name: "China Eastern Airlines", code: "MU", terminal: "Terminal 3", tag: "t3", notes: "Shanghai flights (Moved to T3)." },
  { name: "China Southern Airlines", code: "CZ", terminal: "Terminal 3", tag: "t3", notes: "Guangzhou flights." },
  { name: "Emirates", code: "EK", terminal: "Terminal 3", tag: "t3", notes: "Dubai long-haul." },
  { name: "Ethiopian Airlines", code: "ET", terminal: "Terminal 3", tag: "t3", notes: "Addis Ababa flights." },
  { name: "Etihad Airways", code: "EY", terminal: "Terminal 3", tag: "t3", notes: "Abu Dhabi flights." },
  { name: "Gulf Air", code: "GF", terminal: "Terminal 3", tag: "t3", notes: "Bahrain direct." },
  { name: "HK Express", code: "UO", terminal: "Terminal 3", tag: "t3", notes: "Hong Kong budget regional." },
  { name: "Japan Airlines (JAL)", code: "JL", terminal: "Terminal 3", tag: "t3", notes: "Tokyo Narita & Haneda." },
  { name: "Jeju Air", code: "7C", terminal: "Terminal 3", tag: "t3", notes: "Seoul Incheon & Busan." },
  { name: "Jetstar Asia", code: "3K", terminal: "Terminal 3", tag: "t3", notes: "Singapore flights." },
  { name: "KLM Royal Dutch Airlines", code: "KL", terminal: "Terminal 3", tag: "t3", notes: "Amsterdam long-haul." },
  { name: "Qantas", code: "QF", terminal: "Terminal 3", tag: "t3", notes: "Sydney direct." },
  { name: "Qatar Airways", code: "QR", terminal: "Terminal 3", tag: "t3", notes: "Doha long-haul." },
  { name: "Royal Brunei Airlines", code: "BI", terminal: "Terminal 3", tag: "t3", notes: "Bandar Seri Begawan." },
  { name: "Scoot", code: "TR", terminal: "Terminal 3", tag: "t3", notes: "Singapore low-cost." },
  { name: "Shenzhen Airlines", code: "ZH", terminal: "Terminal 3", tag: "t3", notes: "Shenzhen direct." },
  { name: "Singapore Airlines", code: "SQ", terminal: "Terminal 3", tag: "t3", notes: "Singapore hub flights." },
  { name: "STARLUX Airlines", code: "JX", terminal: "Terminal 3", tag: "t3", notes: "Taipei premium service." },
  { name: "Thai Airways", code: "TG", terminal: "Terminal 3", tag: "t3", notes: "Bangkok Suvarnabhumi." },
  { name: "Turkish Airlines", code: "TK", terminal: "Terminal 3", tag: "t3", notes: "Istanbul long-haul." },
  { name: "United Airlines", code: "UA", terminal: "Terminal 3", tag: "t3", notes: "Guam, Palau & San Francisco." },
  { name: "Vietnam Airlines", code: "VN", terminal: "Terminal 3", tag: "t3", notes: "Hanoi & Ho Chi Minh City." },

  // Terminal 1 International Carriers
  { name: "Air Niugini", code: "PX", terminal: "Terminal 1", tag: "t1", notes: "Port Moresby flights." },
  { name: "Asiana Airlines", code: "OZ", terminal: "Terminal 1", tag: "t1", notes: "Seoul Incheon." },
  { name: "China Airlines", code: "CI", terminal: "Terminal 1", tag: "t1", notes: "Taipei Taoyuan." },
  { name: "EVA Air", code: "BR", terminal: "Terminal 1", tag: "t1", notes: "Taipei Taoyuan." },
  { name: "Korean Air", code: "KE", terminal: "Terminal 1", tag: "t1", notes: "Seoul Incheon." },
  { name: "Kuwait Airways", code: "KU", terminal: "Terminal 1", tag: "t1", notes: "Kuwait City flights." },
  { name: "Malaysia Airlines", code: "MH", terminal: "Terminal 1", tag: "t1", notes: "Kuala Lumpur." },
  { name: "Oman Air", code: "WY", terminal: "Terminal 1", tag: "t1", notes: "Muscat long-haul." },
  { name: "Saudia", code: "SV", terminal: "Terminal 1", tag: "t1", notes: "Jeddah & Riyadh." },
  { name: "XiamenAir", code: "MF", terminal: "Terminal 1", tag: "t1", notes: "Xiamen & Fuzhou." }
];

// Always expose to window so calculator can access it anywhere
window.naiaDatabase = naiaDatabase;

// UI execution logic (Only runs when directory elements exist on mnl.html)
document.addEventListener('DOMContentLoaded', () => {
  const airlineList = document.getElementById('airlineList');
  const searchInput = document.getElementById('airlineSearch');
  const instantCard = document.getElementById('instantCard');
  const instantAirline = document.getElementById('instantAirline');
  const instantTerminal = document.getElementById('instantTerminal');
  const instantNotes = document.getElementById('instantNotes');
  const instantCode = document.getElementById('instantCode');
  const matchCount = document.getElementById('matchCount');
  const filterPills = document.querySelectorAll('.filter-pill');

  if (!airlineList) return; // Exit cleanly if on index.html

  let currentFilter = 'all';

  function renderCards(data) {
    if (matchCount) matchCount.textContent = data.length;
    airlineList.innerHTML = data.map(item => `
      <div class="airline-card">
        <div class="airline-card-top">
          <span class="airline-name">${item.name}</span>
          <span class="iata-code">${item.code}</span>
        </div>
        <span class="terminal-tag ${item.tag}">${item.terminal}</span>
        <p class="airline-notes">${item.notes}</p>
      </div>
    `).join('');
  }

  renderCards(naiaDatabase);

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      
      if (query.length >= 2) {
        const match = naiaDatabase.find(a => 
          a.name.toLowerCase().includes(query) || a.code.toLowerCase().includes(query)
        );

        if (match && instantCard) {
          if (instantAirline) instantAirline.textContent = match.name;
          if (instantTerminal) instantTerminal.textContent = match.terminal;
          if (instantNotes) instantNotes.textContent = match.notes;
          if (instantCode) instantCode.textContent = match.code;
          instantCard.classList.add('active');
        } else if (instantCard) {
          instantCard.classList.remove('active');
        }
      } else if (instantCard) {
        instantCard.classList.remove('active');
      }

      const filtered = naiaDatabase.filter(item => {
        const matchesQuery = item.name.toLowerCase().includes(query) || item.code.toLowerCase().includes(query);
        const matchesFilter = currentFilter === 'all' || item.terminal === currentFilter;
        return matchesQuery && matchesFilter;
      });
      renderCards(filtered);
    });
  }

  filterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      filterPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentFilter = pill.getAttribute('data-filter');
      
      const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
      const filtered = naiaDatabase.filter(item => {
        const matchesQuery = item.name.toLowerCase().includes(query) || item.code.toLowerCase().includes(query);
        const matchesFilter = currentFilter === 'all' || item.terminal === currentFilter;
        return matchesQuery && matchesFilter;
      });
      renderCards(filtered);
    });
  });

  const urlParams = new URLSearchParams(window.location.search);
  const queryParam = urlParams.get('q') || urlParams.get('search');
  const terminalParam = urlParams.get('t') || urlParams.get('terminal');

  if (terminalParam) {
    const targetPill = Array.from(filterPills).find(p => p.getAttribute('data-filter').toLowerCase() === terminalParam.toLowerCase());
    if (targetPill) targetPill.click();
  }

  if (queryParam && searchInput) {
    searchInput.value = queryParam;
    searchInput.dispatchEvent(new Event('input'));
  }
});