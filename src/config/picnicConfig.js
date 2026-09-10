// 1-Day Picnic System Configuration
// All values can be overridden via the Admin Settings panel in the app or customized here.

export const DEFAULT_CONFIG = {
  // Event Details
  eventName: "શ્રી બ્રહ્માનંદ સત્સંગ યાત્રા - 2026",
  eventTagline: "ભગવાનના સાનિધ્યમાં આનંદની 1 દિવસીય સત્સંગ યાત્રા",
  eventDate: "૨૦૨૬",
  eventTime: "સવારે ૭:૦૦ થી",
  eventVenue: "સત્સંગ યાત્રા સ્થળ",
  reportingPoint: "જોથાણ (બસ ઉપડવાનું સ્થળ)",
  
  // Payment Contact & Deadline Details
  paymentDeadline: "16-09-2026",
  paymentContactName: "અલ્પેશભાઈ વેગડ",
  paymentContactPhone: "76003 12101",
  
  // Bus & Pricing Configuration
  feePerMember: 100, // INR per member (₹100)
  busFare: 200, // INR per person for bus (₹200)
  currencySymbol: "₹",
  
  // QR Code Image Path
  qrImageUrl: "/qr-code.jpeg",
  
  // Google Sheets Webhook URL (LIVE CONNECTED & TESTED!)
  googleScriptUrl: "https://script.google.com/macros/s/AKfycbzLe7Ov18EYwyiIGF8NY_ja7pcDKKVyDegfqXnqjNJjThwjKWw-SGH1TEUMsJDwbSapjg/exec",
  
  // Registration ID Prefix
  idPrefix: "SBSY-2026-",
  
  // Admin PIN to access dashboard & configuration
  adminPin: "2026"
};

// Local storage key for persistent user customizations
export const STORAGE_KEYS = {
  CONFIG: "picnic_app_config_v5", // updated to v5 so new webhook takes effect immediately for all users
  REGISTRATIONS: "picnic_app_registrations_v1"
};

// Helper to get active config from localStorage or defaults
export const getActiveConfig = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.CONFIG);
    if (saved) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error("Error reading saved config:", e);
  }
  return { ...DEFAULT_CONFIG };
};

// Helper to save modified config
export const saveActiveConfig = (newConfig) => {
  try {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(newConfig));
    return true;
  } catch (e) {
    console.error("Error saving config:", e);
    return false;
  }
};
