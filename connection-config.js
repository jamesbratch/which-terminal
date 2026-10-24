// connection-config.js — Centralized Transit & Risk Configuration
const TRANSIT_CONFIG = {
  MNL: {
    immigrationMins: 45,
    checkInCutoff: 45,
    sameTerminal: { transitMins: 10, baggageMins: 30 },
    crossTerminal: { transitMins: 40, baggageMins: 35 },
    crossAirport: { transitMins: 40, baggageMins: 40 }
  },
  BKK: {
    immigrationMins: 45,
    checkInCutoff: 45,
    sameTerminal: { transitMins: 10, baggageMins: 30 },
    crossTerminal: { transitMins: 40, baggageMins: 35 },
    crossAirport: { transitMins: 90, baggageMins: 40 }
  },
  DMK: {
    immigrationMins: 45,
    checkInCutoff: 45,
    sameTerminal: { transitMins: 10, baggageMins: 30 },
    crossTerminal: { transitMins: 30, baggageMins: 35 }, // DMK T1 / T2 split
    crossAirport: { transitMins: 90, baggageMins: 40 }
  }
};

window.TRANSIT_CONFIG = TRANSIT_CONFIG;