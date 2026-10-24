// Global Transit Configuration for Self-Transfer Risk Calculations
const TRANSIT_CONFIG = {
  MNL: {
    immigrationMins: 45,
    baggageMins: 35,
    interTerminalMins: 40
  },
  BKK: {
    immigrationMins: 30,
    baggageMins: 25,
    interTerminalMins: 60 // BKK <-> DMK transfer
  },
  KUL: {
    immigrationMins: 35,
    baggageMins: 20,
    interTerminalMins: 25 // KLIA1 <-> KLIA2 rail transfer
  }
};

// Expose globally so connection-calculator.js can access it
window.TRANSIT_CONFIG = TRANSIT_CONFIG;