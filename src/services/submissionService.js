import { STORAGE_KEYS, getActiveConfig } from '../config/picnicConfig';

/**
 * Helper to parse highest numeric sequence from a list of registrations
 */
export const getHighestSequenceNumber = (registrations = []) => {
  let maxSeq = 0;
  if (!Array.isArray(registrations)) return 0;

  registrations.forEach(r => {
    const idStr = String(r.registrationId || '').trim();
    const match = idStr.match(/(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxSeq) {
        maxSeq = num;
      }
    }
  });
  return maxSeq;
};

/**
 * Generate Unique Registration ID: SBSY-2026-XXXX
 * Guaranteed to continue the sequence based on the highest existing number.
 */
export const generateRegistrationId = () => {
  const config = getActiveConfig();
  const prefix = config.idPrefix || "SBSY-2026-";
  try {
    const existing = getStoredRegistrations();
    const maxNum = getHighestSequenceNumber(existing);
    const nextNum = Math.max(maxNum + 1, existing.length + 1, 1);
    return `${prefix}${String(nextNum).padStart(4, '0')}`;
  } catch (e) {
    const random = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}${random}`;
  }
};

/**
 * Fetch guaranteed continuous Registration ID by querying cloud database first
 */
export const fetchNextSequentialRegistrationId = async () => {
  const config = getActiveConfig();
  const prefix = config.idPrefix || "SBSY-2026-";

  try {
    if (config.googleScriptUrl && config.googleScriptUrl.trim().startsWith("http")) {
      // 1. Try fast getNextId endpoint
      try {
        const response = await fetch(`${config.googleScriptUrl}?action=getNextId`, { method: "GET" });
        if (response.ok) {
          const res = await response.json();
          if (res && res.nextId) {
            return res.nextId;
          }
        }
      } catch (err) {
        // Fallback to full cloud registrations fetch
      }

      // 2. Fetch cloud registrations list
      const cloudRes = await fetchCloudRegistrations(config.googleScriptUrl);
      if (cloudRes && cloudRes.success && Array.isArray(cloudRes.data)) {
        const cloudMax = getHighestSequenceNumber(cloudRes.data);
        const localMax = getHighestSequenceNumber(getStoredRegistrations());
        const maxNum = Math.max(cloudMax, localMax);
        const nextNum = maxNum + 1;
        return `${prefix}${String(nextNum).padStart(4, '0')}`;
      }
    }
  } catch (e) {
    console.warn("Could not query next cloud ID:", e);
  }

  // Fallback to local continuous generator
  return generateRegistrationId();
};

/**
 * Convert local file to Base64 String
 */
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Get all registrations saved in browser LocalStorage
 */
export const getStoredRegistrations = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.REGISTRATIONS);
    if (!data) return [];
    return JSON.parse(data);
  } catch (e) {
    console.error("Error loading local registrations:", e);
    return [];
  }
};

/**
 * Fetch all registrations directly from Google Sheets Cloud Webhook
 */
export const fetchCloudRegistrations = async (customUrl) => {
  const config = getActiveConfig();
  const url = customUrl || config.googleScriptUrl;
  if (!url || !url.startsWith("http")) {
    return { success: false, data: getStoredRegistrations(), source: 'local' };
  }

  try {
    const response = await fetch(url, { method: "GET" });
    if (response.ok) {
      const result = await response.json();
      if (Array.isArray(result.registrations)) {
        // Keep local storage in sync with cloud database
        try {
          localStorage.setItem(STORAGE_KEYS.REGISTRATIONS, JSON.stringify(result.registrations));
        } catch (storageErr) {
          console.warn("Local storage sync error:", storageErr);
        }

        return {
          success: true,
          data: result.registrations,
          total: result.totalRegistrations,
          spreadsheetUrl: result.spreadsheetUrl,
          source: 'cloud'
        };
      }
    }
  } catch (e) {
    console.warn("Cloud sync note:", e);
  }

  // Fallback to local storage
  return { success: false, data: getStoredRegistrations(), source: 'local' };
};

/**
 * Request Google Apps Script backend to resequence/repair all IDs in the Sheet (0001, 0002, 0003...)
 */
export const repairCloudSequence = async (customUrl) => {
  const config = getActiveConfig();
  const url = customUrl || config.googleScriptUrl;
  if (!url || !url.startsWith("http")) {
    return { success: false, message: "Google Sheet Webhook URL not configured." };
  }

  try {
    const response = await fetch(`${url}?action=repairSequence`, { method: "GET" });
    if (response.ok) {
      const result = await response.json();
      // After repairing cloud sequence, fetch latest data to update local storage
      await fetchCloudRegistrations(url);
      return result;
    } else {
      return { success: false, message: `Server error: ${response.status}` };
    }
  } catch (e) {
    return { success: false, message: e.message };
  }
};

/**
 * Save a registration to browser LocalStorage
 */
export const saveRegistrationLocally = (registration) => {
  try {
    const existing = getStoredRegistrations();
    // Avoid duplicate if already exists with same registrationId
    const filtered = existing.filter(r => r.registrationId !== registration.registrationId);
    const updated = [registration, ...filtered];
    localStorage.setItem(STORAGE_KEYS.REGISTRATIONS, JSON.stringify(updated));
    return true;
  } catch (e) {
    console.error("Error saving registration locally:", e);
    return false;
  }
};

/**
 * Update Status for a Registration ID
 */
export const updatePaymentStatus = (registrationId, newStatus) => {
  try {
    const existing = getStoredRegistrations();
    const updated = existing.map(reg => {
      if (reg.registrationId === registrationId) {
        return { ...reg, paymentStatus: newStatus, status: newStatus };
      }
      return reg;
    });
    localStorage.setItem(STORAGE_KEYS.REGISTRATIONS, JSON.stringify(updated));
    return true;
  } catch (e) {
    console.error("Error updating status:", e);
    return false;
  }
};

// Guard against simultaneous duplicate submissions
let isSubmissionInProgress = false;

/**
 * Submit Registration to Google Apps Script Webhook & Local Storage
 * Sends EXACTLY ONE request to prevent duplicate entries in Google Sheets
 */
export const submitRegistration = async (formData) => {
  if (isSubmissionInProgress) {
    console.warn("Submission already in progress. Ignoring duplicate trigger.");
    return { success: false, message: "Submission in progress" };
  }

  isSubmissionInProgress = true;

  try {
    const config = getActiveConfig();
    
    // 1. Determine accurate continuous Registration ID from Google Sheet or fallback
    let assignedRegistrationId = formData.registrationId;
    if (!assignedRegistrationId) {
      assignedRegistrationId = await fetchNextSequentialRegistrationId();
    }
    
    let assignedTimestamp = new Date().toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });

    const membersList = formData.members || [];
    const feePerMember = config.feePerMember || 100;
    const busFare = config.busFare || 200;
    const transportMode = formData.transportMode || 'Bus (Jothan)';
    const isBus = transportMode.includes('Bus');

    // Rule: Age > 5 is chargeable at feePerMember (₹100) + Bus Fare (₹200 if bus); Age <= 5 is free (₹0)
    const chargeableCount = formData.chargeableCount !== undefined
      ? formData.chargeableCount
      : membersList.filter(m => {
        const age = Number(m.age);
        return !isNaN(age) && age > 5;
      }).length;

    const freeKidsCount = formData.freeKidsCount !== undefined
      ? formData.freeKidsCount
      : membersList.filter(m => {
        const age = Number(m.age);
        return !isNaN(age) && age > 0 && age <= 5;
      }).length;

    const memberFeeTotal = formData.memberFeeTotal !== undefined
      ? formData.memberFeeTotal
      : chargeableCount * feePerMember;

    const busFeeTotal = formData.busFeeTotal !== undefined
      ? formData.busFeeTotal
      : (isBus ? chargeableCount * busFare : 0);

    const totalAmount = formData.totalAmount !== undefined
      ? formData.totalAmount
      : (memberFeeTotal + busFeeTotal);

    // Prepare clean unified payload
    const fullPayload = {
      registrationId: assignedRegistrationId,
      timestamp: assignedTimestamp,
      primaryName: (formData.primaryName || '').trim(),
      primaryAge: formData.primaryAge ? Number(formData.primaryAge) : '',
      primaryGender: formData.primaryGender || '',
      mobileNumber: (formData.mobileNumber || '').trim(),
      transportMode: transportMode,
      totalMembers: membersList.length || 1,
      chargeableCount: chargeableCount,
      freeKidsCount: freeKidsCount,
      feePerMember: feePerMember,
      busFare: busFare,
      memberFeeTotal: memberFeeTotal,
      busFeeTotal: busFeeTotal,
      totalAmount: totalAmount,
      status: "Confirmed",
      members: membersList.map((m, idx) => {
        const ageNum = Number(m.age) || 0;
        const isChargeable = ageNum > 5;
        const mMemberFee = isChargeable ? feePerMember : 0;
        const mBusFee = (isChargeable && isBus) ? busFare : 0;
        return {
          index: idx + 1,
          name: (m.name || '').trim(),
          age: ageNum,
          gender: m.gender || '',
          isChargeable: isChargeable,
          memberFee: mMemberFee,
          busFee: mBusFee,
          fee: mMemberFee + mBusFee
        };
      })
    };

    let googleSyncSuccess = false;

    // 2. Submit to Google Apps Script Backend (Excel Google Sheet) - SINGLE REQUEST
    if (config.googleScriptUrl && config.googleScriptUrl.trim().startsWith("http")) {
      const url = config.googleScriptUrl.trim();
      try {
        await fetch(url, {
          method: "POST",
          mode: "no-cors",
          headers: {
            "Content-Type": "text/plain;charset=utf-8",
          },
          body: JSON.stringify(fullPayload),
        });
        googleSyncSuccess = true;
      } catch (postErr) {
        console.warn("Google Sheet sync notice:", postErr?.message || postErr);
      }
    }

    // 3. Persist in local storage
    saveRegistrationLocally(fullPayload);

    return {
      success: true,
      registrationId: assignedRegistrationId,
      timestamp: assignedTimestamp,
      transportMode: fullPayload.transportMode,
      totalMembers: fullPayload.totalMembers,
      chargeableCount: chargeableCount,
      freeKidsCount: freeKidsCount,
      totalAmount: totalAmount,
      feePerMember: feePerMember,
      googleSync: googleSyncSuccess
    };
  } finally {
    isSubmissionInProgress = false;
  }
};

/**
 * Test Connection to Google Apps Script Webhook (uses GET action=getNextId to avoid adding dummy rows)
 */
export const testGoogleScriptConnection = async (url) => {
  if (!url || !url.startsWith("http")) {
    return { success: false, message: "Please provide a valid HTTP/HTTPS Webhook URL." };
  }

  try {
    const response = await fetch(`${url}?action=getNextId&_t=${Date.now()}`, { method: "GET" });
    if (response.ok) {
      return { success: true, message: "Google Apps Script Webhook is active and connected!" };
    } else {
      return { success: false, message: `Server responded with status ${response.status}. Please check permissions.` };
    }
  } catch (e) {
    return { success: false, message: `Connection note: ${e.message}` };
  }
};

/**
 * Export registrations to CSV format with Excel compatibility
 */
export const exportToCSV = (registrations) => {
  if (!registrations || registrations.length === 0) {
    alert("No registration records to export.");
    return;
  }

  let maxMembers = 0;
  registrations.forEach(r => {
    if (r.members && r.members.length > maxMembers) {
      maxMembers = r.members.length;
    }
  });
  maxMembers = Math.max(maxMembers, 1);

  // Build CSV headers
  const headers = [
    "Registration ID",
    "Date & Time",
    "Primary Name",
    "Primary Age",
    "Primary Gender",
    "Mobile Number",
    "Transportation Mode",
    "Total Members",
    "Chargeable Members (>5 yrs)",
    "Free Kids (<=5 yrs)",
    "Member Fee (₹)",
    "Bus Fare (₹)",
    "Total Amount (₹)",
    "Status"
  ];

  for (let i = 1; i <= maxMembers; i++) {
    headers.push(`Member ${i} Name`);
    headers.push(`Member ${i} Age`);
    headers.push(`Member ${i} Gender`);
    headers.push(`Member ${i} Fee (₹)`);
  }

  const csvRows = [headers.join(",")];

  registrations.forEach(r => {
    const mobileValue = r.mobileNumber ? `="${r.mobileNumber}"` : '""';
    const transportValue = `"${r.transportMode || 'Bus (Jothan)'}"`;
    const isBus = (r.transportMode || '').includes('Bus');
    const members = r.members || [];

    const chargeable = r.chargeableCount !== undefined
      ? r.chargeableCount
      : members.filter(m => Number(m.age) > 5).length;

    const freeKids = r.freeKidsCount !== undefined
      ? r.freeKidsCount
      : members.filter(m => Number(m.age) > 0 && Number(m.age) <= 5).length;

    const memFee = r.memberFeeTotal !== undefined ? r.memberFeeTotal : (chargeable * 100);
    const bFee = r.busFeeTotal !== undefined ? r.busFeeTotal : (isBus ? chargeable * 200 : 0);

    const totalAmt = r.totalAmount !== undefined
      ? r.totalAmount
      : (memFee + bFee);

    const row = [
      `"${r.registrationId || ''}"`,
      `"${r.timestamp || ''}"`,
      `"${(r.primaryName || '').replace(/"/g, '""')}"`,
      r.primaryAge || '',
      `"${r.primaryGender || ''}"`,
      mobileValue,
      transportValue,
      r.totalMembers || members.length || 1,
      chargeable,
      freeKids,
      memFee,
      bFee,
      totalAmt,
      `"${r.status || 'Confirmed'}"`
    ];

    for (let i = 0; i < maxMembers; i++) {
      if (i < members.length) {
        const mAge = Number(members[i].age) || 0;
        const mFee = mAge > 5 ? (isBus ? 300 : 100) : 0;
        row.push(`"${(members[i].name || '').replace(/"/g, '""')}"`);
        row.push(members[i].age || '');
        row.push(`"${members[i].gender || ''}"`);
        row.push(mFee);
      } else {
        row.push('""');
        row.push('""');
        row.push('""');
        row.push('""');
      }
    }

    csvRows.push(row.join(","));
  });

  const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + encodeURIComponent(csvRows.join("\n"));
  const link = document.createElement("a");
  link.setAttribute("href", csvContent);
  link.setAttribute("download", `Satsang_Yatra_2026_Registrations_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Export registrations as formatted Excel HTML Spreadsheet (.xls)
 */
export const exportToExcelFormatted = (registrations) => {
  if (!registrations || registrations.length === 0) {
    alert("No registration records to export.");
    return;
  }

  let maxMembers = 0;
  registrations.forEach(r => {
    if (r.members && r.members.length > maxMembers) {
      maxMembers = r.members.length;
    }
  });
  maxMembers = Math.max(maxMembers, 1);

  let tableHtml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
      <style>
        table { border-collapse: collapse; font-family: Arial, sans-serif; font-size: 11pt; }
        th { background-color: #047857; color: #ffffff; font-weight: bold; border: 1px solid #065f46; padding: 10px; text-align: center; }
        td { border: 1px solid #cbd5e1; padding: 8px; vertical-align: middle; }
        .text-center { text-align: center; }
        .text-num { mso-number-format: "\\@"; }
        .bg-bus { background-color: #eff6ff; color: #1e40af; font-weight: bold; }
        .bg-vehicle { background-color: #faf5ff; color: #6b21a8; font-weight: bold; }
        .bg-confirmed { background-color: #d1fae5; color: #065f46; font-weight: bold; }
        .bg-amount { background-color: #ecfdf5; color: #047857; font-weight: bold; text-align: right; }
      </style>
    </head>
    <body>
      <h2>Shri Brahmanand Satsang Yatra 2026 - Registration Records</h2>
      <p>Generated on: ${new Date().toLocaleString('en-IN')}</p>
      <p>Fee Policy: Above 5 Years = ₹100 Member Fee + ₹200 Bus Fare (if bus) | Age 5 & Under = Free (₹0)</p>
      <table>
        <thead>
          <tr>
            <th>Reg ID</th>
            <th>Date & Time</th>
            <th>Primary Name</th>
            <th>Age</th>
            <th>Gender</th>
            <th>Mobile Number</th>
            <th>Transportation Mode</th>
            <th>Total Members</th>
            <th>Above 5 Yrs (Chargeable)</th>
            <th>5 Yrs & Under (Free)</th>
            <th>Member Fee (₹)</th>
            <th>Bus Fare (₹)</th>
            <th>Total Amount (₹)</th>
            <th>Status</th>
  `;

  for (let i = 1; i <= maxMembers; i++) {
    tableHtml += `<th>Member ${i} Name</th><th>Member ${i} Age</th><th>Member ${i} Gender</th><th>Member ${i} Fee (₹)</th>`;
  }

  tableHtml += `</tr></thead><tbody>`;

  registrations.forEach(r => {
    const isBus = (r.transportMode || '').includes('Bus');
    const transportClass = isBus ? 'bg-bus' : 'bg-vehicle';
    const transportLabel = r.transportMode || 'Bus (Jothan)';
    const members = r.members || [];

    const chargeable = r.chargeableCount !== undefined
      ? r.chargeableCount
      : members.filter(m => Number(m.age) > 5).length;

    const freeKids = r.freeKidsCount !== undefined
      ? r.freeKidsCount
      : members.filter(m => Number(m.age) > 0 && Number(m.age) <= 5).length;

    const memFee = r.memberFeeTotal !== undefined ? r.memberFeeTotal : (chargeable * 100);
    const bFee = r.busFeeTotal !== undefined ? r.busFeeTotal : (isBus ? chargeable * 200 : 0);

    const totalAmt = r.totalAmount !== undefined
      ? r.totalAmount
      : (memFee + bFee);

    tableHtml += `
      <tr>
        <td class="text-center"><strong>${r.registrationId || ''}</strong></td>
        <td>${r.timestamp || ''}</td>
        <td><strong>${r.primaryName || ''}</strong></td>
        <td class="text-center">${r.primaryAge || ''}</td>
        <td class="text-center">${r.primaryGender || ''}</td>
        <td class="text-num text-center">${r.mobileNumber || ''}</td>
        <td class="text-center ${transportClass}">${transportLabel}</td>
        <td class="text-center"><strong>${r.totalMembers || members.length || 1}</strong></td>
        <td class="text-center">${chargeable}</td>
        <td class="text-center">${freeKids}</td>
        <td class="text-center">₹${memFee}</td>
        <td class="text-center">${isBus ? `₹${bFee}` : '₹0'}</td>
        <td class="bg-amount">₹${totalAmt.toLocaleString('en-IN')}</td>
        <td class="text-center bg-confirmed">${r.status || 'Confirmed'}</td>
      `;

    for (let i = 0; i < maxMembers; i++) {
      if (i < members.length) {
        const mAge = Number(members[i].age) || 0;
        const mFee = mAge > 5 ? (isBus ? 300 : 100) : 0;
        tableHtml += `
          <td>${members[i].name || ''}</td>
          <td class="text-center">${members[i].age || ''}</td>
          <td class="text-center">${members[i].gender || ''}</td>
          <td class="text-center">${mFee > 0 ? `₹${mFee}` : 'Free (₹0)'}</td>
        `;
      } else {
        tableHtml += `<td></td><td></td><td></td><td></td>`;
      }
    }

    tableHtml += `</tr>`;
  });

  tableHtml += `</tbody></table></body></html>`;

  const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Picnic_2026_Registrations_${new Date().toISOString().slice(0, 10)}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
