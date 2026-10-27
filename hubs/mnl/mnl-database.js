// mnl-database.js / naia-database.js
const naiaDatabase = [
  // Philippine Domestic & Flag Carriers
  { name: "Philippine Airlines (International)", code: "PR", terminal: "Terminal 1", tag: "t1", hubName: "Manila (NAIA)", hubCode: "mnl", link: "hubs/mnl/mnl.html", notes: "Mainline international flights." },
  { name: "Philippine Airlines (Domestic)", code: "PR", terminal: "Terminal 2", tag: "t2", hubName: "Manila (NAIA)", hubCode: "mnl", link: "hubs/mnl/mnl.html", notes: "Domestic mainline routes." },
  { name: "PAL Express (Domestic)", code: "2P", terminal: "Terminal 2", tag: "t2", hubName: "Manila (NAIA)", hubCode: "mnl", link: "hubs/mnl/mnl.html", notes: "PAL domestic feeder flights." },
  { name: "AirAsia Philippines (International)", code: "Z2", terminal: "Terminal 1", tag: "t1", hubName: "Manila (NAIA)", hubCode: "mnl", link: "hubs/mnl/mnl.html", notes: "International flights." },
  { name: "AirAsia Philippines (Domestic)", code: "Z2", terminal: "Terminal 2", tag: "t2", hubName: "Manila (NAIA)", hubCode: "mnl", link: "hubs/mnl/mnl.html", notes: "Domestic flights." },
  { name: "AirAsia Malaysia", code: "AK", terminal: "Terminal 1", tag: "t1", hubName: "Manila (NAIA)", hubCode: "mnl", link: "hubs/mnl/mnl.html", notes: "Kuala Lumpur flights." },
  { name: "Cebu Pacific", code: "5J", terminal: "Terminal 3", tag: "t3", hubName: "Manila (NAIA)", hubCode: "mnl", link: "hubs/mnl/mnl.html", notes: "Mainline domestic and international." },
  { name: "CebGo", code: "DG", terminal: "Terminal 2", tag: "t2", hubName: "Manila (NAIA)", hubCode: "mnl", link: "hubs/mnl/mnl.html", notes: "Regional domestic turboprop flights." },
  { name: "AirSWIFT", code: "T6", terminal: "Terminal 2", tag: "t2", hubName: "Manila (NAIA)", hubCode: "mnl", link: "hubs/mnl/mnl.html", notes: "El Nido resort connections." },
  { name: "Sunlight Air", code: "2R", terminal: "Terminal 2", tag: "t2", hubName: "Manila (NAIA)", hubCode: "mnl", link: "hubs/mnl/mnl.html", notes: "Boutique island flights." },

  // Terminal 3 International Carriers
  { name: "Air China", code: "CA", terminal: "Terminal 3", tag: "t3", hubName: "Manila (NAIA)", hubCode: "mnl", link: "hubs/mnl/mnl.html", notes: "Beijing flights (Moved to T3)." },
  { name: "All Nippon Airways (ANA)", code: "NH", terminal: "Terminal 3", tag: "t3", hubName: "Manila (NAIA)", hubCode: "mnl", link: "hubs/mnl/mnl.html", notes: "Tokyo Haneda & Narita." },
  { name: "Cathay Pacific", code: "CX", terminal: "Terminal 3", tag: "t3", hubName: "Manila (NAIA)", hubCode: "mnl", link: "hubs/mnl/mnl.html", notes: "Hong Kong flights." },
  { name: "China Eastern Airlines", code: "MU", terminal: "Terminal 3", tag: "t3", hubName: "Manila (NAIA)", hubCode: "mnl", link: "hubs/mnl/mnl.html", notes: "Shanghai flights (Moved to T3)." },
  { name: "China Southern Airlines", code: "CZ", terminal: "Terminal 3", tag: "t3", hubName: "Manila (NAIA)", hubCode: "mnl", link: "hubs/mnl/mnl.html", notes: "Guangzhou flights." },
  { name: "Emirates", code: "EK", terminal: "Terminal 3", tag: "t3", hubName: "Manila (NAIA)", hubCode: "mnl", link: "hubs/mnl/mnl.html", notes: "Dubai long-haul." },
  { name: "Ethiopian Airlines", code: "ET", terminal: "Terminal 3", tag: "t3", hubName: "Manila (NAIA)", hubCode: "mnl", link: "hubs/mnl/mnl.html", notes: "Addis Ababa flights." },
  { name: "Etihad Airways", code: "EY", terminal: "Terminal 3", tag: "t3", hubName: "Manila (NAIA)", hubCode: "mnl", link: "hubs/mnl/mnl.html", notes: "Abu Dhabi flights." },
  { name: "Gulf Air", code: "GF", terminal: "Terminal 3", tag: "t3", hubName: "Manila (NAIA)", hubCode: "mnl", link: "hubs/mnl/mnl.html", notes: "Bahrain direct." },
  { name: "HK Express", code: "UO", terminal: "Terminal 3", tag: "t3", hubName: "Manila (NAIA)", hubCode: "mnl", link: "hubs/mnl/mnl.html", notes: "Hong Kong budget regional." },
  { name: "Japan Airlines (JAL)", code: "JL", terminal: "Terminal 3", tag: "t3", hubName: "Manila (NAIA)", hubCode: "mnl", link: "hubs/mnl/mnl.html", notes: "Tokyo Narita & Haneda." },
  { name: "Jeju Air", code: "7C", terminal: "Terminal 3", tag: "t3", hubName: "Manila (NAIA)", hubCode: "mnl", link: "hubs/mnl/mnl.html", notes: "Seoul Incheon & Busan." },
  { name: "Jetstar Asia", code: "3K", terminal: "Terminal 3", tag: "t3", hubName: "Manila (NAIA)", hubCode: "mnl", link: "hubs/mnl/mnl.html", notes: "Singapore flights." },
  { name: "KLM Royal Dutch Airlines", code: "KL", terminal: "Terminal 3", tag: "t3", hubName: "Manila (NAIA)", hubCode: "mnl", link: "hubs/mnl/mnl.html", notes: "Amsterdam long-haul." },
  { name: "Qantas", code: "QF", terminal: "Terminal 3", tag: "t3", hubName: "Manila (NAIA)", hubCode: "mnl", link: "hubs/mnl/mnl.html", notes: "Sydney direct." },
  { name: "Qatar Airways", code: "QR", terminal: "Terminal 3", tag: "t3", hubName: "Manila (NAIA)", hubCode: "mnl", link: "hubs/mnl/mnl.html", notes: "Doha long-haul." },
  { name: "Royal Brunei Airlines", code: "BI", terminal: "Terminal 3", tag: "t3", hubName: "Manila (NAIA)", hubCode: "mnl", link: "hubs/mnl/mnl.html", notes: "Bandar Seri Begawan." },
  { name: "Scoot", code: "TR", terminal: "Terminal 3", tag: "t3", hubName: "Manila (NAIA)", hubCode: "mnl", link: "hubs/mnl/mnl.html", notes: "Singapore low-cost." },
  { name: "Shenzhen Airlines", code: "ZH", terminal: "Terminal 3", tag: "t3", hubName: "Manila (NAIA)", hubCode: "mnl", link: "hubs/mnl/mnl.html", notes: "Shenzhen direct." },
  { name: "Singapore Airlines", code: "SQ", terminal: "Terminal 3", tag: "t3", hubName: "Manila (NAIA)", hubCode: "mnl", link: "hubs/mnl/mnl.html", notes: "Singapore hub flights." },
  { name: "STARLUX Airlines", code: "JX", terminal: "Terminal 3", tag: "t3", hubName: "Manila (NAIA)", hubCode: "mnl", link: "hubs/mnl/mnl.html", notes: "Taipei premium service." },
  { name: "Thai Airways", code: "TG", terminal: "Terminal 3", tag: "t3", hubName: "Manila (NAIA)", hubCode: "mnl", link: "hubs/mnl/mnl.html", notes: "Bangkok Suvarnabhumi." },
  { name: "Turkish Airlines", code: "TK", terminal: "Terminal 3", tag: "t3", hubName: "Manila (NAIA)", hubCode: "mnl", link: "hubs/mnl/mnl.html", notes: "Istanbul long-haul." },
  { name: "United Airlines", code: "UA", terminal: "Terminal 3", tag: "t3", hubName: "Manila (NAIA)", hubCode: "mnl", link: "hubs/mnl/mnl.html", notes: "Guam, Palau & San Francisco." },
  { name: "Vietnam Airlines", code: "VN", terminal: "Terminal 3", tag: "t3", hubName: "Manila (NAIA)", hubCode: "mnl", link: "hubs/mnl/mnl.html", notes: "Hanoi & Ho Chi Minh City." },

  // Terminal 1 International Carriers
  { name: "Air Niugini", code: "PX", terminal: "Terminal 1", tag: "t1", hubName: "Manila (NAIA)", hubCode: "mnl", link: "hubs/mnl/mnl.html", notes: "Port Moresby flights." },
  { name: "Asiana Airlines", code: "OZ", terminal: "Terminal 1", tag: "t1", hubName: "Manila (NAIA)", hubCode: "mnl", link: "hubs/mnl/mnl.html", notes: "Seoul Incheon." },
  { name: "China Airlines", code: "CI", terminal: "Terminal 1", tag: "t1", hubName: "Manila (NAIA)", hubCode: "mnl", link: "hubs/mnl/mnl.html", notes: "Taipei Taoyuan." },
  { name: "EVA Air", code: "BR", terminal: "Terminal 1", tag: "t1", hubName: "Manila (NAIA)", hubCode: "mnl", link: "hubs/mnl/mnl.html", notes: "Taipei Taoyuan." },
  { name: "Korean Air", code: "KE", terminal: "Terminal 1", tag: "t1", hubName: "Manila (NAIA)", hubCode: "mnl", link: "hubs/mnl/mnl.html", notes: "Seoul Incheon." },
  { name: "Kuwait Airways", code: "KU", terminal: "Terminal 1", tag: "t1", hubName: "Manila (NAIA)", hubCode: "mnl", link: "hubs/mnl/mnl.html", notes: "Kuwait City flights." },
  { name: "Malaysia Airlines", code: "MH", terminal: "Terminal 1", tag: "t1", hubName: "Manila (NAIA)", hubCode: "mnl", link: "hubs/mnl/mnl.html", notes: "Kuala Lumpur." },
  { name: "Oman Air", code: "WY", terminal: "Terminal 1", tag: "t1", hubName: "Manila (NAIA)", hubCode: "mnl", link: "hubs/mnl/mnl.html", notes: "Muscat long-haul." },
  { name: "Saudia", code: "SV", terminal: "Terminal 1", tag: "t1", hubName: "Manila (NAIA)", hubCode: "mnl", link: "hubs/mnl/mnl.html", notes: "Jeddah & Riyadh." },
  { name: "XiamenAir", code: "MF", terminal: "Terminal 1", tag: "t1", hubName: "Manila (NAIA)", hubCode: "mnl", link: "hubs/mnl/mnl.html", notes: "Xiamen & Fuzhou." }
];

// Always expose to window for both Manila UI and Global Homepage Search
window.naiaDatabase = naiaDatabase;
window.MNL_AIRLINES = naiaDatabase;

// UI execution logic (Only runs when directory elements exist on mnl.html)
document.addEventListener('DOMContentLoaded', () => {
  const airlineList = document.getElementById('airlineList');
  const searchInput = document.getElementById('airlineSearch');
  const instantCard = document.getElementById('instantCard');
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
        const matches = naiaDatabase.filter(a => 
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
            items[items.length - 1  { name: "Air Canada", code: "AC", terminal: "Terminal 3", tag: "t3", hubName: "Manila (NAIA)", hubCode: "mnl", link: "hubs/mnl/mnl.html", notes: "Auto-appended from live official source." },
  { name: "Air Changan", code: "9H", terminal: "Terminal 3", tag: "t3", hubName: "Manila (NAIA)", hubCode: "mnl", link: "hubs/mnl/mnl.html", notes: "Auto-appended from live official source." },
  { name: "Air France", code: "AF", terminal: "Terminal 3", tag: "t3", hubName: "Manila (NAIA)", hubCode: "mnl", link: "hubs/mnl/mnl.html", notes: "Auto-appended from live official source." },
  { name: "Air India", code: "AI", terminal: "Terminal 1", tag: "t1", hubName: "Manila (NAIA)", hubCode: "mnl", link: "hubs/mnl/mnl.html", notes: "Auto-appended from live official source." },
  { name: "Air Macau", code: "NX", terminal: "Terminal 3", tag: "t3", hubName: "Manila (NAIA)", hubCode: "mnl", link: "hubs/mnl/mnl.html", notes: "Auto-appended from live official source." },
  { name: "Bamboo Airlines", code: "QH", terminal: "Terminal 1", tag: "t1", hubName: "Manila (NAIA)", hubCode: "mnl", link: "hubs/mnl/mnl.html", notes: "Auto-appended from live official source." },
  { name: "China Central Airlines", code: "I9", terminal: "Terminal 1", tag: "t1", hubName: "Manila (NAIA)", hubCode: "mnl", link: "hubs/mnl/mnl.html", notes: "Auto-appended from live official source." },
  { name: "Greater Bay Airline", code: "HB", terminal: "Terminal 3", tag: "t3", hubName: "Manila (NAIA)", hubCode: "mnl", link: "hubs/mnl/mnl.html", notes: "Auto-appended from live official source." },
  { name: "Hong Kong Air Cargo", code: "RH", terminal: "Terminal 1", tag: "t1", hubName: "Manila (NAIA)", hubCode: "mnl", link: "hubs/mnl/mnl.html", notes: "Auto-appended from live official source." },
  { name: "Jetstar", code: "JQ", terminal: "Terminal 3", tag: "t3", hubName: "Manila (NAIA)", hubCode: "mnl", link: "hubs/mnl/mnl.html", notes: "Auto-appended from live official source." },
  { name: "Jetstar Japan", code: "GK", terminal: "Terminal 3", tag: "t3", hubName: "Manila (NAIA)", hubCode: "mnl", link: "hubs/mnl/mnl.html", notes: "Auto-appended from live official source." },
  { name: "Riyadh Air", code: "RX", terminal: "Terminal 3", tag: "t3", hubName: "Manila (NAIA)", hubCode: "mnl", link: "hubs/mnl/mnl.html", notes: "Auto-appended from live official source." },
  { name: "VietJet Air", code: "VJ", terminal: "Terminal 1", tag: "t1", hubName: "Manila (NAIA)", hubCode: "mnl", link: "hubs/mnl/mnl.html", notes: "Auto-appended from live official source." },
].style.paddingBottom = '0';
          }

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

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .catch(err => console.error('SW Registration Failed:', err));
  });
}

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

