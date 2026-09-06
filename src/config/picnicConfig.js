// 1-Day Picnic System Configuration
// All values can be overridden via the Admin Settings panel in the app or customized here.

export const DEFAULT_CONFIG = {
  // Event Details
  eventName: "૧-દિવસીય વાર્ષિક પિકનિક ૨૦૨૬",
  eventTagline: "આનંદ, ઉલ્લાસ અને ભોજન સાથે યાદગાર પિકનિક",
  eventDate: "૨૦૨૬",
  eventTime: "સવારે ૭:૦૦ થી",
  eventVenue: "રિસોર્ટ",
  reportingPoint: "જોથાણ",
  
  // Pricing Configuration (Set to ₹100 per member)
  feePerMember: 100, // INR per member (₹100)
  currencySymbol: "₹",
  
  // QR Code Image Path
  qrImageUrl: "/qr-code.jpeg",
  
  // Google Sheets & Drive Webhook URL (LIVE CONNECTED!)
  googleScriptUrl: "https://script.google.com/macros/s/AKfycby9aRUnG3yi8Gb9jZ4JSb6Jcf1dcFmeNo9peZiUkSDiKDd0jKeJ_YVXA3JvdfcAzylz/exec",
  
  // Registration ID Prefix
  idPrefix: "PIC-2026-",
  
  // Admin PIN to access dashboard & configuration
  adminPin: "2026"
};

// Local storage key for persistent user customizations
export const STORAGE_KEYS = {
  CONFIG: "picnic_app_config_v3", // updated to v3 to guarantee live webhook URL takes effect immediately
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
