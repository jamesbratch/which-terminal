const bkkDatabase = [
  // Home Hub Carriers & Thailand Mainline
  { name: "Thai Airways", code: "TG", terminal: "Main Terminal", tag: "t1", notes: "Flag carrier; check-in Rows H/J." },
  { name: "Bangkok Airways", code: "PG", terminal: "Main Terminal", tag: "t1", notes: "Boutique domestic & regional; check-in Row F." },
  { name: "Thai VietJet Air (Domestic)", code: "VZ", terminal: "Main Terminal", tag: "t1", notes: "Domestic flights depart from Main Terminal." },
  { name: "Thai VietJet Air (International)", code: "VZ", terminal: "SAT-1 Concourse", tag: "t3", notes: "International departures at SAT-1 concourse." },
  { name: "Thai AirAsia X", code: "XJ", terminal: "SAT-1 Concourse", tag: "t3", notes: "Intl budget long-haul (Check-in Main Terminal Row N)." },

  // SAT-1 Satellite Concourse Primary Carriers
  { name: "Emirates", code: "EK", terminal: "SAT-1 Concourse", tag: "t3", notes: "Dubai A380/777 services (Check-in Main Terminal Row T)." },
  { name: "Asiana Airlines", code: "OZ", terminal: "SAT-1 Concourse", tag: "t3", notes: "Seoul Incheon (Check-in Main Terminal)." },
  { name: "British Airways", code: "BA", terminal: "SAT-1 Concourse", tag: "t3", notes: "London Gatwick (Check-in Main Terminal)." },
  { name: "Austrian Airlines", code: "OS", terminal: "SAT-1 Concourse", tag: "t3", notes: "Vienna long-haul (Check-in Main Terminal)." },
  { name: "Air Canada", code: "AC", terminal: "SAT-1 Concourse", tag: "t3", notes: "Vancouver long-haul (Check-in Main Terminal)." },
  { name: "Ethiopian Airlines", code: "ET", terminal: "SAT-1 Concourse", tag: "t3", notes: "Addis Ababa flights (Check-in Main Terminal)." },

  // East Asian Full-Service & Regional Carriers
  { name: "All Nippon Airways (ANA)", code: "NH", terminal: "Main Terminal", tag: "t1", notes: "Tokyo Haneda & Narita." },
  { name: "Japan Airlines (JAL)", code: "JL", terminal: "Main Terminal", tag: "t1", notes: "Tokyo Haneda & Narita." },
  { name: "ZIPAIR Tokyo", code: "ZG", terminal: "Main Terminal", tag: "t1", notes: "Tokyo Narita low-cost." },
  { name: "Peach Aviation", code: "MM", terminal: "Main Terminal", tag: "t1", notes: "Osaka Kansai budget service." },
  { name: "Korean Air", code: "KE", terminal: "Main Terminal", tag: "t1", notes: "Seoul Incheon." },
  { name: "Jeju Air", code: "7C", terminal: "Main Terminal", tag: "t1", notes: "Seoul Incheon & Busan." },
  { name: "Jin Air", code: "LJ", terminal: "Main Terminal", tag: "t1", notes: "Seoul Incheon." },
  { name: "Air Busan", code: "BX", terminal: "Main Terminal", tag: "t1", notes: "Busan direct." },
  { name: "Air Premia", code: "YP", terminal: "Main Terminal", tag: "t1", notes: "Seoul Incheon hybrid." },
  { name: "T'way Air", code: "TW", terminal: "Main Terminal", tag: "t1", notes: "Seoul Incheon & Daegu." },
  { name: "Cathay Pacific", code: "CX", terminal: "Main Terminal", tag: "t1", notes: "Hong Kong flights; Concourse G." },
  { name: "HK Express", code: "UO", terminal: "Main Terminal", tag: "t1", notes: "Hong Kong budget regional." },
  { name: "Hong Kong Airlines", code: "HX", terminal: "Main Terminal", tag: "t1", notes: "Hong Kong direct." },
  { name: "Air Macau", code: "NX", terminal: "Main Terminal", tag: "t1", notes: "Macau direct flights." },
  { name: "EVA Air", code: "BR", terminal: "Main Terminal", tag: "t1", notes: "Taipei Taoyuan & European connections." },
  { name: "China Airlines", code: "CI", terminal: "Main Terminal", tag: "t1", notes: "Taipei & Kaohsiung." },
  { name: "Starlux Airlines", code: "JX", terminal: "Main Terminal", tag: "t1", notes: "Taipei premium service." },

  // Chinese Mainland Carriers
  { name: "Air China", code: "CA", terminal: "Main Terminal", tag: "t1", notes: "Beijing & Chengdu." },
  { name: "China Eastern Airlines", code: "MU", terminal: "Main Terminal", tag: "t1", notes: "Shanghai Pudong & Kunming." },
  { name: "China Southern Airlines", code: "CZ", terminal: "Main Terminal", tag: "t1", notes: "Guangzhou & Shenzhen." },
  { name: "Spring Airlines", code: "9C", terminal: "Main Terminal", tag: "t1", notes: "Shanghai Pudong low-cost." },
  { name: "Hainan Airlines", code: "HU", terminal: "Main Terminal", tag: "t1", notes: "Beijing & Haikou." },
  { name: "Sichuan Airlines", code: "3U", terminal: "Main Terminal", tag: "t1", notes: "Chengdu Tianfu." },
  { name: "XiamenAir", code: "MF", terminal: "Main Terminal", tag: "t1", notes: "Xiamen & Fuzhou." },
  { name: "Shenzhen Airlines", code: "ZH", terminal: "Main Terminal", tag: "t1", notes: "Shenzhen direct." },
  { name: "9 Air", code: "AQ", terminal: "Main Terminal", tag: "t1", notes: "Guangzhou low-cost." },

  // Southeast Asian Regional Carriers
  { name: "Singapore Airlines", code: "SQ", terminal: "Main Terminal", tag: "t1", notes: "Singapore hub flights; Concourse D." },
  { name: "Scoot", code: "TR", terminal: "Main Terminal", tag: "t1", notes: "Singapore low-cost." },
  { name: "Malaysia Airlines", code: "MH", terminal: "Main Terminal", tag: "t1", notes: "Kuala Lumpur hub." },
  { name: "AirAsia Malaysia", code: "AK", terminal: "Main Terminal", tag: "t1", notes: "Kuala Lumpur flights." },
  { name: "Batik Air Malaysia", code: "OD", terminal: "Main Terminal", tag: "t1", notes: "Kuala Lumpur connections." },
  { name: "Philippine Airlines", code: "PR", terminal: "Main Terminal", tag: "t1", notes: "Manila mainline." },
  { name: "Cebu Pacific", code: "5J", terminal: "Main Terminal", tag: "t1", notes: "Manila & Clark." },
  { name: "Garuda Indonesia", code: "GA", terminal: "Main Terminal", tag: "t1", notes: "Jakarta Soekarno-Hatta." },
  { name: "Vietnam Airlines", code: "VN", terminal: "Main Terminal", tag: "t1", notes: "Hanoi & Ho Chi Minh City." },
  { name: "VietJet Air", code: "VJ", terminal: "Main Terminal", tag: "t1", notes: "Vietnam low-cost routes." },
  { name: "Royal Brunei Airlines", code: "BI", terminal: "Main Terminal", tag: "t1", notes: "Bandar Seri Begawan." },
  { name: "Lao Airlines", code: "QV", terminal: "Main Terminal", tag: "t1", notes: "Vientiane & Luang Prabang." },
  { name: "Myanmar Airways International", code: "8M", terminal: "Main Terminal", tag: "t1", notes: "Yangon & Mandalay." },

  // Middle Eastern & South Asian Carriers
  { name: "Qatar Airways", code: "QR", terminal: "Main Terminal", tag: "t1", notes: "Doha long-haul; Concourses E/F/G." },
  { name: "Etihad Airways", code: "EY", terminal: "Main Terminal", tag: "t1", notes: "Abu Dhabi flights." },
  { name: "Gulf Air", code: "GF", terminal: "Main Terminal", tag: "t1", notes: "Bahrain direct." },
  { name: "Oman Air", code: "WY", terminal: "Main Terminal", tag: "t1", notes: "Muscat long-haul." },
  { name: "Saudia", code: "SV", terminal: "Main Terminal", tag: "t1", notes: "Jeddah & Riyadh." },
  { name: "Kuwait Airways", code: "KU", terminal: "Main Terminal", tag: "t1", notes: "Kuwait City." },
  { name: "Air Arabia", code: "G9", terminal: "Main Terminal", tag: "t1", notes: "Sharjah hub." },
  { name: "El Al", code: "LY", terminal: "Main Terminal", tag: "t1", notes: "Tel Aviv direct." },
  { name: "Air India", code: "AI", terminal: "Main Terminal", tag: "t1", notes: "Delhi & Mumbai." },
  { name: "IndiGo", code: "6E", terminal: "Main Terminal", tag: "t1", notes: "India budget connections." },
  { name: "SriLankan Airlines", code: "UL", terminal: "Main Terminal", tag: "t1", notes: "Colombo hub." },
  { name: "Biman Bangladesh Airlines", code: "BG", terminal: "Main Terminal", tag: "t1", notes: "Dhaka direct." },
  { name: "Drukair", code: "KB", terminal: "Main Terminal", tag: "t1", notes: "Paro, Bhutan." },

  // European, American & Oceanian Long-Haul
  { name: "Lufthansa", code: "LH", terminal: "Main Terminal", tag: "t1", notes: "Frankfurt & Munich." },
  { name: "Swiss International Air Lines", code: "LX", terminal: "Main Terminal", tag: "t1", notes: "Zurich long-haul." },
  { name: "Air France", code: "AF", terminal: "Main Terminal", tag: "t1", notes: "Paris CDG flights." },
  { name: "KLM Royal Dutch Airlines", code: "KL", terminal: "Main Terminal", tag: "t1", notes: "Amsterdam flights." },
  { name: "Finnair", code: "AY", terminal: "Main Terminal", tag: "t1", notes: "Helsinki long-haul." },
  { name: "Turkish Airlines", code: "TK", terminal: "Main Terminal", tag: "t1", notes: "Istanbul long-haul." },
  { name: "Qantas", code: "QF", terminal: "Main Terminal", tag: "t1", notes: "Sydney direct." },
  { name: "Jetstar Airways", code: "JQ", terminal: "Main Terminal", tag: "t1", notes: "Melbourne & Perth direct." }
];

window.bkkDatabase = bkkDatabase;

document.addEventListener('DOMContentLoaded', () => {
  const airlineList = document.getElementById('airlineList');
  const searchInput = document.getElementById('airlineSearch');
  const instantCard = document.getElementById('instantCard');
  const matchCount = document.getElementById('matchCount');
  const filterPills = document.querySelectorAll('.filter-pill');

  if (!airlineList) return;

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

  renderCards(bkkDatabase);

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      
      if (query.length >= 2) {
        // Query bkkDatabase correctly
        const matches = bkkDatabase.filter(a => 
          a.name.toLowerCase().includes(query) || a.code.toLowerCase().includes(query)
        );

        if (matches.length > 0 && instantCard) {
          instantCard.innerHTML = matches.map(match => `
            <div class="instant-result-item" style="margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #334155;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div>
                  <div class="instant-title" style="font-weight: 600; color: #f8fafc;">${match.name}</div>
                  <div class="instant-terminal" style="color: #38bdf8; font-weight: 500; margin-top: 2px;">${match.terminal}</div>
                </div>
                <span class="iata-code" style="background: #1e293b; padding: 2px 8px; border-radius: 4px; font-size: 0.85rem; color: #94a3b8;">${match.code}</span>
              </div>
              <p class="instant-notes" style="color: #94a3b8; font-size: 0.875rem; margin-top: 6px; margin-bottom: 0;">${match.notes}</p>
            </div>
          `).join('');
          
          const items = instantCard.querySelectorAll('.instant-result-item');
          if (items.length > 0) {
            items[items.length - 1].style.borderBottom = 'none';
            items[items.length - 1].style.marginBottom = '0';
            items[items.length - 1].style.paddingBottom = '0';
          }

          instantCard.classList.add('active');
        } else if (instantCard) {
          instantCard.classList.remove('active');
        }
      } else if (instantCard) {
        instantCard.classList.remove('active');
      }

      // Filter main directory list
      const filtered = bkkDatabase.filter(item => {
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
      const filtered = bkkDatabase.filter(item => {
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

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('SW Registered:', reg.scope))
      .catch(err => console.error('SW Registration Failed:', err));
  });
}

// Network status check
function checkNetworkStatus() {
  if (navigator.onLine) {
    document.body.classList.remove('is-offline');
  } else {
    document.body.classList.add('is-offline');
  }
}

window.addEventListener('online', checkNetworkStatus);
window.addEventListener('offline', checkNetworkStatus);
document.addEventListener('DOMContentLoaded', checkNetworkStatus);