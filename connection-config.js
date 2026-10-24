// Global Transit Configuration for Self-Transfer Risk Calculations
const TRANSIT_CONFIG = {
  MNL: {
    immigrationMins: 45,
    baggageMins: 30,       
    interTerminalMins: 40,
    crossAirportMins: 90
  },
  BKK: {
    immigrationMins: 45,   
    baggageMins: 35,     
    interTerminalMins: 40, 
    crossAirportMins: 90  
  },
  DMK: {
    immigrationMins: 45,
    baggageMins: 35,
    interTerminalMins: 40,
    crossAirportMins: 90
  }
};

window.TRANSIT_CONFIG = TRANSIT_CONFIG;