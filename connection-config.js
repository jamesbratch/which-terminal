// connection-config.js — Centralized Transit & Risk Configuration
const TRANSIT_CONFIG = {
  MNL: {
    sameTerminal: { transitMins: 10, immigrationMins: 45, baggageMins: 30, checkInCutoff: 45 },
    crossTerminal: { transitMins: 40, immigrationMins: 45, baggageMins: 35, checkInCutoff: 45 },
    crossAirport: { transitMins: 40, immigrationMins: 60, baggageMins: 40, checkInCutoff: 60 }
  },
  BKK: {
    sameTerminal: { transitMins: 10, immigrationMins: 45, baggageMins: 30, checkInCutoff: 45 },
    crossTerminal: { transitMins: 40, immigrationMins: 45, baggageMins: 35, checkInCutoff: 45 },
    crossAirport: { transitMins: 90, immigrationMins: 60, baggageMins: 40, checkInCutoff: 60 }
  },
  DMK: {
    sameTerminal: { transitMins: 10, immigrationMins: 45, baggageMins: 30, checkInCutoff: 45 },
    crossTerminal: { transitMins: 30, immigrationMins: 45, baggageMins: 35, checkInCutoff: 45 },
    crossAirport: { transitMins: 90, immigrationMins: 60, baggageMins: 40, checkInCutoff: 60 }
  }
};

window.TRANSIT_CONFIG = TRANSIT_CONFIG;