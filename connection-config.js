// Global Transit Configuration for Self-Transfer Risk Calculations
const TRANSIT_CONFIG = {
  MNL: {
    immigrationMins: 45,
    baggageMins: 35,
    interTerminalMins: 40,
    crossAirportMins: 40 // Not heavily applicable to MNL, but kept for schema consistency
  },
  BKK: {
    immigrationMins: 30,
    baggageMins: 25,
    interTerminalMins: 30,     // For moving between BKK terminals (e.g., Main to SAT-1)
    crossAirportMins: 120    // BKK <-> DMK highway transfer across Bangkok traffic
  },
  KUL: {
    immigrationMins: 35,
    baggageMins: 20,
    interTerminalMins: 25,     // KLIA1 <-> KLIA2 rail transfer
    crossAirportMins: 25
  }
};

window.TRANSIT_CONFIG = TRANSIT_CONFIG;