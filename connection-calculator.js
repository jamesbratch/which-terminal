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
  const isHiddenHub = (hubSelect.type === 'hidden');

  inSelect.innerHTML = '';
  outSelect.innerHTML = '';

  // 1. COMBINED BKK + DMK HANDLING (Home Page / Cross-Hub Selectors)
  if (selectedHub === 'BKK' && !isHiddenHub) {
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

    // Create Optgroups for Visual Split on Home Page
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
    // 2. STANDARD & SINGLE-HUB PAGE HANDLING (e.g. BKK Page, DMK Page, MNL Page)
    let airlines = (typeof getDatabaseForHub === 'function') ? getDatabaseForHub(selectedHub) : null;

    // Fallback if getDatabaseForHub returns null or empty array
    if (!airlines || airlines.length === 0) {
      if (selectedHub === 'BKK') airlines = window.bkkDatabase || window.BKK_DATABASE;
      else if (selectedHub === 'DMK') airlines = window.dmkDatabase || window.DMK_DATABASE || window.DMK_AIRLINES;
      else if (selectedHub === 'MNL') airlines = window.mnlDatabase || window.MNL_DATABASE;
    }

    if (!airlines || airlines.length === 0) {
      renderEmptyOption(inSelect, outSelect);
      return;
    }

    // Single-hub clean dropdown (No [BKK]/[DMK] tags or optgroups)
    airlines.forEach((airline, index) => {
      const codeText = airline.code ? ` (${airline.code})` : '';
      const optText = `${airline.name}${codeText} — ${airline.terminal}`;
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
  const isHiddenHub = hubSelect && hubSelect.type === 'hidden';
  
  const inVal = document.getElementById('calcInAirline').value;
  const outVal = document.getElementById('calcOutAirline').value;
  const hours = parseInt(document.getElementById('calcHours').value) || 0;
  const mins = parseInt(document.getElementById('calcMins').value) || 0;
  
  let isIntl = document.getElementById('calcIntl').checked;
  const hasBags = document.getElementById('calcBags').checked;

  // Robust database resolution for DMK, BKK, MNL, and Home Page
  let airlines = [];
  if (selectedHubCode === 'BKK' && !isHiddenHub && window.combinedBangkokDatabase) {
    airlines = window.combinedBangkokDatabase;
  } else if (selectedHubCode === 'DMK') {
    airlines = window.dmkDatabase || window.DMK_DATABASE || window.DMK_AIRLINES;
  } else if (selectedHubCode === 'BKK') {
    airlines = window.bkkDatabase || window.BKK_DATABASE;
  } else if (typeof getDatabaseForHub === 'function') {
    airlines = getDatabaseForHub(selectedHubCode);
  } else {
    airlines = window.mnlDatabase || window.MNL_DATABASE || [];
  }
  
  const incomingAirline = airlines ? airlines[parseInt(inVal, 10)] : null;
  const outgoingAirline = airlines ? airlines[parseInt(outVal, 10)] : null;

  if (!incomingAirline || !outgoingAirline) {
    alert("Please select valid incoming and outgoing airlines.");
    return;
  }

  const inAirport = incomingAirline.airport || selectedHubCode;
  const outAirport = outgoingAirline.airport || selectedHubCode;

  const transitConfig = window.TRANSIT_CONFIG || {};
  const hubConfig = transitConfig[selectedHubCode] || transitConfig['MNL'];

  let ruleKey = "SAME_TERMINAL";
  let transferName = "Same Terminal Transfer";
  let activeRule = hubConfig.sameTerminal;

  if (inAirport !== outAirport) {
    ruleKey = "CROSS_AIRPORT";
    transferName = `Cross-Airport Transfer (${inAirport} ↔ ${outAirport})`;
    activeRule = hubConfig.crossAirport;
    isIntl = true;
  } else if (incomingAirline.terminal !== outgoingAirline.terminal) {
    ruleKey = "CROSS_TERMINAL";
    transferName = "Cross-Terminal Transfer";
    activeRule = hubConfig.crossTerminal;
  } 

  const transitBuffer = activeRule.transitMins;
  const immigrationMins = activeRule.immigrationMins;
  const baggageBuffer = activeRule.baggageMins;
  const checkInCutoff = activeRule.checkInCutoff;

  const totalLayoverMins = (hours * 60) + mins;
  
  let requiredMins = transitBuffer + checkInCutoff;
  if (isIntl) requiredMins += immigrationMins;
  if (hasBags) requiredMins += baggageBuffer;

  const safetyMargin = totalLayoverMins - requiredMins;

  const resultCard = document.getElementById('calcResult');
  const badge = document.getElementById('riskBadge');
  const title = document.getElementById('riskTitle');
  const desc = document.getElementById('riskDesc');
  const breakdown = document.getElementById('riskBreakdown');

  if (!resultCard) return;
  resultCard.style.display = 'block';

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
