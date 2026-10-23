const dmkDatabase = [
  // Domestic Carriers (Terminal 2)
  { name: "Thai AirAsia (Domestic)", code: "FD", terminal: "Terminal 2", tag: "t2", notes: "Main domestic low-cost hub across Thailand." },
  { name: "Nok Air (Domestic)", code: "DD", terminal: "Terminal 2", tag: "t2", notes: "Domestic routes across Thailand." },
  { name: "Thai Lion Air (Domestic)", code: "SL", terminal: "Terminal 2", tag: "t2", notes: "Domestic mainline routes." },
  { name: "Bangkok Airways (Domestic)", code: "PG", terminal: "Terminal 2", tag: "t2", notes: "Boutique service to Koh Samui (USM)." },

  // International Low-Cost & Regional Carriers (Terminal 1)
  { name: "Thai AirAsia (International)", code: "FD", terminal: "Terminal 1", tag: "t1", notes: "Regional international routes." },
  { name: "Thai AirAsia X", code: "XJ", terminal: "Terminal 1", tag: "t1", notes: "Medium/long-haul budget (Japan, Korea, Australia)." },
  { name: "Nok Air (International)", code: "DD", terminal: "Terminal 1", tag: "t1", notes: "Regional international flights (China, India)." },
  { name: "Thai Lion Air (International)", code: "SL", terminal: "Terminal 1", tag: "t1", notes: "International Asian destinations." },
  { name: "AirAsia Malaysia", code: "AK", terminal: "Terminal 1", tag: "t1", notes: "Kuala Lumpur & Penang." },
  { name: "AirAsia Philippines", code: "Z2", terminal: "Terminal 1", tag: "t1", notes: "Manila flights." },
  { name: "Indonesia AirAsia", code: "QZ", terminal: "Terminal 1", tag: "t1", notes: "Jakarta Soekarno-Hatta & Bali." },
  { name: "Batik Air Malaysia", code: "OD", terminal: "Terminal 1", tag: "t1", notes: "Kuala Lumpur hub." },
  { name: "Batik Air Indonesia", code: "ID", terminal: "Terminal 1", tag: "t1", notes: "Jakarta Soekarno-Hatta." },
  { name: "Cebu Pacific", code: "5J", terminal: "Terminal 1", tag: "t1", notes: "Manila, Cebu, and Davao connections." },
  { name: "flydubai", code: "FZ", terminal: "Terminal 1", tag: "t1", notes: "Dubai international connections." },
  { name: "Citilink", code: "QG", terminal: "Terminal 1", tag: "t1", notes: "Indonesia low-cost." },
  { name: "Myanmar Airways International", code: "8M", terminal: "Terminal 1", tag: "t1", notes: "Yangon & Mandalay." },
  { name: "Spring Airlines", code: "9C", terminal: "Terminal 1", tag: "t1", notes: "Shanghai, Xiamen & Xi'an." },
  { name: "9 Air", code: "AQ", terminal: "Terminal 1", tag: "t1", notes: "Guangzhou low-cost routes." },
  { name: "Air Macau", code: "NX", terminal: "Terminal 1", tag: "t1", notes: "Macau direct flights." }
];

// Always expose array globally
window.dmkDatabase = dmkDatabase;

// Page UI Execution (Only runs on dmk.html where directory elements exist)
document.addEventListener('DOMContentLoaded', () => {
  const airlineList = document.getElementById('airlineList');
  const searchInput = document.getElementById('airlineSearch');
  const instantCard = document.getElementById('instantCard');
  const matchCount = document.getElementById('matchCount');
  const filterPills = document.querySelectorAll('.filter-pill');

  if (!airlineList) return; // Exit cleanly if running on index.html

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

  renderCards(dmkDatabase);

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      
      if (query.length >= 2) {
        // Multi-match filter for split-terminal carriers
        const matches = dmkDatabase.filter(a => 
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

      // Filter main directory list below
      const filtered = dmkDatabase.filter(item => {
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
      const filtered = dmkDatabase.filter(item => {
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