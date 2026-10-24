// connection-calculator.js — Multi-Hub & Dual-Airport Self-Transfer Engine


function getDatabaseForHub(hubCode) {
  if (hubCode === 'MNL') {
    return window.naiaDatabase || (typeof naiaDatabase !== 'undefined' ? naiaDatabase : []);
  }
  if (hubCode === 'BKK') {
    if (window.combinedBangkokDatabase) {
      return window.combinedBangkokDatabase;
    }
    const bkk = window.bkkDatabase || [];
    const dmk = window.dmkDatabase || [];
    return [...bkk.map(a => ({...a, airport: 'BKK'})), ...dmk.map(a => ({...a, airport: 'DMK'}))];
  }
  if (hubCode === 'KUL') {
    return window.KUL_AIRLINES || (typeof KUL_AIRLINES !== 'undefined' ? KUL_AIRLINES : []);
  }
  return [];
}


function populateAirlineDropdowns() {
  const hubSelect = document.getElementById('calcHub');
  const inSelect = document.getElementById('calcInAirline');
  const outSelect = document.getElementById('calcOutAirline');

  if (!hubSelect || !inSelect || !outSelect) return;

  const selectedHub = hubSelect.value;

  inSelect.innerHTML = '';
  outSelect.innerHTML = '';

  if (selectedHub === 'BKK') {
    const bkkAirlines = window.bkkDatabase || [];
    const dmkAirlines = window.dmkDatabase || [];

    if (bkkAirlines.length === 0 && dmkAirlines.length === 0) {
      renderEmptyOption(inSelect, outSelect);
      return;
    }

    // Combine into indexed datasets tagged with airport codes
    const combinedAirlines = [
      ...bkkAirlines.map(item => ({ ...item, airport: 'BKK' })),
      ...dmkAirlines.map(item => ({ ...item, airport: 'DMK' }))
    ];

    // Cache combined dataset on window so risk evaluator reads correct indices
    window.combinedBangkokDatabase = combinedAirlines;

    // Create Optgroups for Visual Split
    const bkkGroupIn = document.createElement('optgroup');
    bkkGroupIn.label = "✈️ Suvarnabhumi Airport (BKK)";
    const bkkGroupOut = document.createElement('optgroup');
    bkkGroupOut.label = "✈️ Suvarnabhumi Airport (BKK)";

    const dmkGroupIn = document.createElement('optgroup');
    dmkGroupIn.label = "✈️ Don Mueang Airport (DMK)";
    const dmkGroupOut = document.createElement('optgroup');
    dmkGroupOut.label = "✈️ Don Mueang Airport (DMK)";

    combinedAirlines.forEach((airline, index) => {
      const optText = `[${airline.airport}] ${airline.name} (${airline.code}) — ${airline.terminal}`;
      
      const optIn = new Option(optText, index);
      const optOut = new Option(optText, index);

      if (airline.airport === 'BKK') {
        bkkGroupIn.appendChild(optIn);
        bkkGroupOut.appendChild(optOut);
      } else {
        dmkGroupIn.appendChild(optIn);
        dmkGroupOut.appendChild(optOut);
      }
    });

    inSelect.appendChild(bkkGroupIn);
    inSelect.appendChild(dmkGroupIn);
    outSelect.appendChild(bkkGroupOut);
    outSelect.appendChild(dmkGroupOut);

  } else {
    // Standard Hub Handling (e.g. MNL, KUL)
    const airlines = getDatabaseForHub(selectedHub);

    if (!airlines || airlines.length === 0) {
      renderEmptyOption(inSelect, outSelect);
      return;
    }

    airlines.forEach((airline, index) => {
      const optText = `${airline.name} (${airline.code}) — ${airline.terminal}`;
      inSelect.appendChild(new Option(optText, index));
      outSelect.appendChild(new Option(optText, index));
    });
  }
}

function renderEmptyOption(inSelect, outSelect) {
  const emptyOpt = document.createElement('option');
  emptyOpt.value = "";
  emptyOpt.textContent = "⚠️ Database not loaded";
  inSelect.appendChild(emptyOpt);
  outSelect.appendChild(emptyOpt.cloneNode(true));
}


function evaluateConnectionRisk() {
  const hubSelect = document.getElementById('calcHub');
  const selectedHubCode = hubSelect ? hubSelect.value : 'MNL';
  
  const inVal = document.getElementById('calcInAirline').value;
  const outVal = document.getElementById('calcOutAirline').value;
  const hours = parseInt(document.getElementById('calcHours').value) || 0;
  const mins = parseInt(document.getElementById('calcMins').value) || 0;
  
  let isIntl = document.getElementById('calcIntl').checked;
  const hasBags = document.getElementById('calcBags').checked;

  const airlines = getDatabaseForHub(selectedHubCode);
  
  const incomingAirline = airlines[parseInt(inVal)];
  const outgoingAirline = airlines[parseInt(outVal)];

  ruleKey = "SAME_TERMINAL";
  transferName = "Same Terminal Transfer";
  transitBuffer = 15; 
  checkInCutoff = 45;

  if (inAirport !== outAirport) {
    ruleKey = "CROSS_AIRPORT";
    transferName = `Cross-Airport Transfer (${inAirport} ↔ ${outAirport})`;
    transitBuffer = hubConfig.crossAirportMins || 120; // Uses the 120-min BKK<->DMK buffer
    checkInCutoff = 60; // International/LCC cross-airport check-in cutoff
    isIntl = true; // FORCE IMMIGRATION
  } else if (incomingAirline.terminal !== outgoingAirline.terminal) {
    ruleKey = "CROSS_TERMINAL";
    transferName = "Cross-Terminal Transfer";
    transitBuffer = hubConfig.interTerminalMins || 40;
  }

  // 1. Dynamic Airport Tagging (Defaults to selectedHubCode if no sub-airport is specified)
  const inAirport = incomingAirline.airport || selectedHubCode;
  const outAirport = outgoingAirline.airport || selectedHubCode;

  // Pull configurations dynamically from connection-config.js (window.TRANSIT_CONFIG)
  const transitConfig = window.TRANSIT_CONFIG || {};
  const hubConfig = transitConfig[selectedHubCode] || { immigrationMins: 45, baggageMins: 35, interTerminalMins: 40 };

  let ruleKey = "SAME_TERMINAL";
  let transferName = "Same Terminal Transfer";
  let transitBuffer = 15; // default buffer for same terminal
  const checkInCutoff = 45;

  if (inAirport !== outAirport) {
    ruleKey = "CROSS_AIRPORT";
    transferName = `Cross-Airport Transfer (${inAirport} ↔ ${outAirport})`;
    transitBuffer = hubConfig.interTerminalMins || 90;
    isIntl = true; // FORCE IMMIGRATION: Inter-airport transfer requires immigration entry!
  } else if (incomingAirline.terminal !== outgoingAirline.terminal) {
    ruleKey = "CROSS_TERMINAL";
    transferName = "Cross-Terminal Transfer";
    transitBuffer = hubConfig.interTerminalMins || 40;
  } else {
    transitBuffer = 10;
  }

  const totalLayoverMins = (hours * 60) + mins;
  
  let requiredMins = transitBuffer + checkInCutoff;
  if (isIntl) requiredMins += hubConfig.immigrationMins;
  if (hasBags) requiredMins += hubConfig.baggageMins;

  const safetyMargin = totalLayoverMins - requiredMins;

  const resultCard = document.getElementById('calcResult');
  const badge = document.getElementById('riskBadge');
  const title = document.getElementById('riskTitle');
  const desc = document.getElementById('riskDesc');
  const breakdown = document.getElementById('riskBreakdown');

  if (!resultCard) return;
  resultCard.style.display = 'block';

  // Dynamic transfer label for breakdown
  const transitLabel = (ruleKey === 'CROSS_AIRPORT') 
    ? `${inAirport}↔${outAirport} Ground Travel` 
    : 'Transit & Terminal Transfer';

  if (safetyMargin < -15) {
    resultCard.style.background = 'rgba(239, 68, 68, 0.1)';
    resultCard.style.borderColor = '#ef4444';
    badge.style.background = '#ef4444';
    badge.style.color = '#fff';
    badge.innerText = '☠️ VERY HIGH RISK';
    title.innerText = 'Connection Unlikely to Succeed';
    desc.innerText = `Your ${totalLayoverMins} min layover is far less than the required ${requiredMins} mins for this transfer. You will almost certainly miss this flight.`;
  } else if (safetyMargin < 20) {
    resultCard.style.background = 'rgba(249, 115, 22, 0.1)';
    resultCard.style.borderColor = '#f97316';
    badge.style.background = '#f97316';
    badge.style.color = '#fff';
    badge.innerText = '🔴 HIGH RISK';
    title.innerText = 'Critical Window — High Traffic Risk';
    desc.innerText = `Very tight layover between ${incomingAirline.name} [${incomingAirline.terminal}] and ${outgoingAirline.name} [${outgoingAirline.terminal}]. Traffic or passport queues will break this connection.`;
  } else if (safetyMargin < 50) {
    resultCard.style.background = 'rgba(234, 179, 8, 0.1)';
    resultCard.style.borderColor = '#eab308';
    badge.style.background = '#eab308';
    badge.style.color = '#000';
    badge.innerText = '🟠 MODERATE RISK';
    title.innerText = 'Feasible, But Proceed Quickly';
    desc.innerText = `Manageable window with a ${safetyMargin} min safety buffer between ${incomingAirline.terminal} and ${outgoingAirline.terminal}.`;
  } else {
    resultCard.style.background = 'rgba(16, 185, 129, 0.1)';
    resultCard.style.borderColor = '#10b981';
    badge.style.background = '#10b981';
    badge.style.color = '#000';
    badge.innerText = '🟢 LOW RISK';
    title.innerText = 'Safe Connection Window';
    desc.innerText = `Comfortable layover window with a ${safetyMargin} min safety buffer.`;
  }

  breakdown.innerHTML = `
    <strong>Transfer Type:</strong> ${transferName}<br>
    <strong>Route:</strong> [${inAirport}] ${incomingAirline.name} (${incomingAirline.terminal}) ➔ [${outAirport}] ${outgoingAirline.name} (${outgoingAirline.terminal})<br>
    <strong>Required Minimum Window:</strong> ${requiredMins} mins total (${transitLabel}: ${transitBuffer}m | Immigration: ${hubConfig.immigrationMins}m | Baggage: ${hubConfig.baggageMins}m | Check-in Cutoff: ${checkInCutoff}m)
  `;
}

document.addEventListener('DOMContentLoaded', () => {
  populateAirlineDropdowns();

  const hubSelect = document.getElementById('calcHub');
  if (hubSelect) {
    hubSelect.addEventListener('change', populateAirlineDropdowns);
  }

  const calcBtn = document.getElementById('calcSubmitBtn');
  if (calcBtn) {
    calcBtn.addEventListener('click', evaluateConnectionRisk);
  }
});



/*
// connection-calculator.js — Multi-Hub & Dual-Airport Self-Transfer Engine
function getDatabaseForHub(hubCode) {
  if (hubCode === 'MNL') {
    return window.naiaDatabase || (typeof naiaDatabase !== 'undefined' ? naiaDatabase : []);
  }
  if (hubCode === 'BKK') {
    if (window.combinedBangkokDatabase) {
      return window.combinedBangkokDatabase;
    }
    const bkk = window.bkkDatabase || [];
    const dmk = window.dmkDatabase || [];
    return [...bkk.map(a => ({...a, airport: 'BKK'})), ...dmk.map(a => ({...a, airport: 'DMK'}))];
  }
  return [];
}

const routeRules = {
  SAME_TERMINAL: { name: "Same Terminal Transfer", transit: 10, immigration: 45, baggage: 30, checkInCutoff: 45 },
  CROSS_TERMINAL: { name: "Cross-Terminal Transfer", transit: 40, immigration: 45, baggage: 35, checkInCutoff: 45 },
  CROSS_AIRPORT: { name: "Cross-Airport Transfer (BKK ↔ DMK)", transit: 90, immigration: 60, baggage: 40, checkInCutoff: 60 }
};


function populateAirlineDropdowns() {
  const hubSelect = document.getElementById('calcHub');
  const inSelect = document.getElementById('calcInAirline');
  const outSelect = document.getElementById('calcOutAirline');

  if (!hubSelect || !inSelect || !outSelect) return;

  const selectedHub = hubSelect.value;

  inSelect.innerHTML = '';
  outSelect.innerHTML = '';

  if (selectedHub === 'BKK') {
    const bkkAirlines = window.bkkDatabase || [];
    const dmkAirlines = window.dmkDatabase || [];

    if (bkkAirlines.length === 0 && dmkAirlines.length === 0) {
      renderEmptyOption(inSelect, outSelect);
      return;
    }

    // Combine into indexed datasets tagged with airport codes
    const combinedAirlines = [
      ...bkkAirlines.map(item => ({ ...item, airport: 'BKK' })),
      ...dmkAirlines.map(item => ({ ...item, airport: 'DMK' }))
    ];

    // Cache combined dataset on window so risk evaluator reads correct indices
    window.combinedBangkokDatabase = combinedAirlines;

    // Create Optgroups for Visual Split
    const bkkGroupIn = document.createElement('optgroup');
    bkkGroupIn.label = "✈️ Suvarnabhumi Airport (BKK)";
    const bkkGroupOut = document.createElement('optgroup');
    bkkGroupOut.label = "✈️ Suvarnabhumi Airport (BKK)";

    const dmkGroupIn = document.createElement('optgroup');
    dmkGroupIn.label = "✈️ Don Mueang Airport (DMK)";
    const dmkGroupOut = document.createElement('optgroup');
    dmkGroupOut.label = "✈️ Don Mueang Airport (DMK)";

    combinedAirlines.forEach((airline, index) => {
      const optText = `[${airline.airport}] ${airline.name} (${airline.code}) — ${airline.terminal}`;
      
      const optIn = new Option(optText, index);
      const optOut = new Option(optText, index);

      if (airline.airport === 'BKK') {
        bkkGroupIn.appendChild(optIn);
        bkkGroupOut.appendChild(optOut);
      } else {
        dmkGroupIn.appendChild(optIn);
        dmkGroupOut.appendChild(optOut);
      }
    });

    inSelect.appendChild(bkkGroupIn);
    inSelect.appendChild(dmkGroupIn);
    outSelect.appendChild(bkkGroupOut);
    outSelect.appendChild(dmkGroupOut);

  } else {
    // Standard Hub Handling (e.g. MNL)
    const airlines = getDatabaseForHub(selectedHub);

    if (!airlines || airlines.length === 0) {
      renderEmptyOption(inSelect, outSelect);
      return;
    }

    airlines.forEach((airline, index) => {
      const optText = `${airline.name} (${airline.code}) — ${airline.terminal}`;
      inSelect.appendChild(new Option(optText, index));
      outSelect.appendChild(new Option(optText, index));
    });
  }
}

function renderEmptyOption(inSelect, outSelect) {
  const emptyOpt = document.createElement('option');
  emptyOpt.value = "";
  emptyOpt.textContent = "⚠️ Database not loaded";
  inSelect.appendChild(emptyOpt);
  outSelect.appendChild(emptyOpt.cloneNode(true));
}


function evaluateConnectionRisk() {
  const hubSelect = document.getElementById('calcHub');
  const selectedHubCode = hubSelect ? hubSelect.value : 'MNL';
  
  const inVal = document.getElementById('calcInAirline').value;
  const outVal = document.getElementById('calcOutAirline').value;
  const hours = parseInt(document.getElementById('calcHours').value) || 0;
  const mins = parseInt(document.getElementById('calcMins').value) || 0;
  
  let isIntl = document.getElementById('calcIntl').checked;
  const hasBags = document.getElementById('calcBags').checked;

  const airlines = getDatabaseForHub(selectedHubCode);
  
  const incomingAirline = airlines[parseInt(inVal)];
  const outgoingAirline = airlines[parseInt(outVal)];

  if (!incomingAirline || !outgoingAirline) {
    alert("Please select valid incoming and outgoing airlines.");
    return;
  }

  // 1. Dynamic Airport Tagging (Defaults to selectedHubCode if no sub-airport is specified)
  const inAirport = incomingAirline.airport || selectedHubCode;
  const outAirport = outgoingAirline.airport || selectedHubCode;

  let ruleKey = "SAME_TERMINAL";

  if (inAirport !== outAirport) {
    ruleKey = "CROSS_AIRPORT";
    isIntl = true; // FORCE IMMIGRATION: Inter-airport transfer requires immigration entry!
  } else if (incomingAirline.terminal !== outgoingAirline.terminal) {
    ruleKey = "CROSS_TERMINAL";
  }

  const rule = routeRules[ruleKey];

  const totalLayoverMins = (hours * 60) + mins;
  let requiredMins = rule.transit + rule.checkInCutoff;
  if (isIntl) requiredMins += rule.immigration;
  if (hasBags) requiredMins += rule.baggage;

  const safetyMargin = totalLayoverMins - requiredMins;

  const resultCard = document.getElementById('calcResult');
  const badge = document.getElementById('riskBadge');
  const title = document.getElementById('riskTitle');
  const desc = document.getElementById('riskDesc');
  const breakdown = document.getElementById('riskBreakdown');

  if (!resultCard) return;
  resultCard.style.display = 'block';

  // Dynamic transfer label for breakdown (e.g. "BKK↔DMK Ground Travel" vs "Terminal Transfer")
  const transitLabel = (ruleKey === 'CROSS_AIRPORT') 
    ? `${inAirport}↔${outAirport} Ground Travel` 
    : 'Transit & Terminal Transfer';

  if (safetyMargin < -15) {
    resultCard.style.background = 'rgba(239, 68, 68, 0.1)';
    resultCard.style.borderColor = '#ef4444';
    badge.style.background = '#ef4444';
    badge.style.color = '#fff';
    badge.innerText = '☠️ VERY HIGH RISK';
    title.innerText = 'Connection Unlikely to Succeed';
    desc.innerText = `Your ${totalLayoverMins} min layover is far less than the required ${requiredMins} mins for this transfer. You will almost certainly miss this flight.`;
  } else if (safetyMargin < 20) {
    resultCard.style.background = 'rgba(249, 115, 22, 0.1)';
    resultCard.style.borderColor = '#f97316';
    badge.style.background = '#f97316';
    badge.style.color = '#fff';
    badge.innerText = '🔴 HIGH RISK';
    title.innerText = 'Critical Window — High Traffic Risk';
    desc.innerText = `Very tight layover between ${incomingAirline.name} [${incomingAirline.terminal}] and ${outgoingAirline.name} [${outgoingAirline.terminal}]. Traffic or passport queues will break this connection.`;
  } else if (safetyMargin < 50) {
    resultCard.style.background = 'rgba(234, 179, 8, 0.1)';
    resultCard.style.borderColor = '#eab308';
    badge.style.background = '#eab308';
    badge.style.color = '#000';
    badge.innerText = '🟠 MODERATE RISK';
    title.innerText = 'Feasible, But Proceed Quickly';
    desc.innerText = `Manageable window with a ${safetyMargin} min safety buffer between ${incomingAirline.terminal} and ${outgoingAirline.terminal}.`;
  } else {
    resultCard.style.background = 'rgba(16, 185, 129, 0.1)';
    resultCard.style.borderColor = '#10b981';
    badge.style.background = '#10b981';
    badge.style.color = '#000';
    badge.innerText = '🟢 LOW RISK';
    title.innerText = 'Safe Connection Window';
    desc.innerText = `Comfortable layover window with a ${safetyMargin} min safety buffer.`;
  }

  breakdown.innerHTML = `
    <strong>Transfer Type:</strong> ${rule.name}<br>
    <strong>Route:</strong> [${inAirport}] ${incomingAirline.name} (${incomingAirline.terminal}) ➔ [${outAirport}] ${outgoingAirline.name} (${outgoingAirline.terminal})<br>
    <strong>Required Minimum Window:</strong> ${requiredMins} mins total (${transitLabel}: ${rule.transit}m | Immigration: ${rule.immigration}m | Baggage: ${rule.baggage}m | Check-in Cutoff: ${rule.checkInCutoff}m)
  `;
}

document.addEventListener('DOMContentLoaded', () => {
  populateAirlineDropdowns();

  const hubSelect = document.getElementById('calcHub');
  if (hubSelect) {
    hubSelect.addEventListener('change', populateAirlineDropdowns);
  }

  const calcBtn = document.getElementById('calcSubmitBtn');
  if (calcBtn) {
    calcBtn.addEventListener('click', evaluateConnectionRisk);
  }
});
*/