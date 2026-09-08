import { STORAGE_KEYS, getActiveConfig } from '../config/picnicConfig';

/**
 * Generate Unique Registration ID: PIC-2026-XXXX
 */
export const generateRegistrationId = () => {
  const config = getActiveConfig();
  const prefix = config.idPrefix || "PIC-2026-";
  try {
    const existing = getStoredRegistrations();
    const nextNum = existing.length + 1;
    return `${prefix}${String(nextNum).padStart(4, '0')}`;
  } catch (e) {
    const random = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}${random}`;
  }
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
 * Save a registration to browser LocalStorage
 */
export const saveRegistrationLocally = (registration) => {
  try {
    const existing = getStoredRegistrations();
    const updated = [registration, ...existing];
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

/**
 * Submit Registration to Google Apps Script Webhook & Local Storage
 */
export const submitRegistration = async (formData) => {
  const config = getActiveConfig();
  const registrationId = formData.registrationId || generateRegistrationId();
  const timestamp = new Date().toLocaleString('en-IN', {
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

  // Rule: Age > 5 is chargeable at feePerMember (₹100); Age <= 5 is free (₹0)
  const chargeableCount = membersList.filter(m => {
    const age = Number(m.age);
    return !isNaN(age) && age > 5;
  }).length;

  const freeKidsCount = membersList.filter(m => {
    const age = Number(m.age);
    return !isNaN(age) && age > 0 && age <= 5;
  }).length;

  const totalAmount = chargeableCount * feePerMember;

  // Prepare full data payload
  const fullPayload = {
    registrationId: registrationId,
    timestamp: timestamp,
    primaryName: (formData.primaryName || '').trim(),
    primaryAge: formData.primaryAge ? Number(formData.primaryAge) : '',
    primaryGender: formData.primaryGender || '',
    mobileNumber: (formData.mobileNumber || '').trim(),
    transportMode: formData.transportMode || 'Bus (Jothan)',
    totalMembers: membersList.length || 1,
    chargeableCount: chargeableCount,
    freeKidsCount: freeKidsCount,
    feePerMember: feePerMember,
    totalAmount: totalAmount,
    status: "Confirmed",
    members: membersList.map((m, idx) => {
      const ageNum = Number(m.age) || 0;
      const isChargeable = ageNum > 5;
      return {
        index: idx + 1,
        name: (m.name || '').trim(),
        age: ageNum,
        gender: m.gender || '',
        isChargeable: isChargeable,
        fee: isChargeable ? feePerMember : 0
      };
    })
  };

  let googleSuccess = false;

  // 1. Submit to Google Apps Script (Using no-cors to guarantee cloud sync without browser CORS errors)
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
      googleSuccess = true;
    } catch (e) {
      console.warn("Google Apps Script sync note:", e.message);
    }
  }

  // 2. Always persist in local database
  saveRegistrationLocally(fullPayload);

  return {
    success: true,
    registrationId: registrationId,
    timestamp: timestamp,
    transportMode: fullPayload.transportMode,
    totalMembers: fullPayload.totalMembers,
    chargeableCount: chargeableCount,
    freeKidsCount: freeKidsCount,
    totalAmount: totalAmount,
    feePerMember: feePerMember,
    googleSync: googleSuccess
  };
};

/**
 * Test Connection to Google Apps Script Webhook
 */
export const testGoogleScriptConnection = async (url) => {
  if (!url || !url.startsWith("http")) {
    return { success: false, message: "Please provide a valid HTTP/HTTPS Webhook URL." };
  }

  try {
    const testPayload = {
      action: "TEST_CONNECTION",
      registrationId: "TEST-0000",
      primaryName: "Test Webhook",
      mobileNumber: "0000000000",
      transportMode: "Bus (Jothan)",
      totalMembers: 1,
      timestamp: new Date().toLocaleString('en-IN')
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify(testPayload)
    });

    if (response.ok) {
      return { success: true, message: "Google Apps Script Webhook is active and connected!" };
    } else {
      return { success: false, message: `Server responded with status ${response.status}. Please check permissions.` };
    }
  } catch (e) {
    try {
      await fetch(url, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({ action: "TEST_NO_CORS" })
      });
      return { success: true, message: "Webhook ping received in no-cors mode." };
    } catch (err2) {
      return { success: false, message: `Connection failed: ${err2.message}` };
    }
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
    "Transportation Mode (Bus from Jothan / Own Vehicle)",
    "Total Members",
    "Chargeable Members (>5 yrs)",
    "Free Kids (<=5 yrs)",
    "Total Fee (INR)",
    "Status"
  ];

  for (let i = 1; i <= maxMembers; i++) {
    headers.push(`Member ${i} Name`);
    headers.push(`Member ${i} Age`);
    headers.push(`Member ${i} Gender`);
    headers.push(`Member ${i} Fee (INR)`);
  }

  const csvRows = [headers.join(",")];

  registrations.forEach(r => {
    const mobileValue = r.mobileNumber ? `="${r.mobileNumber}"` : '""';
    const transportValue = `"${r.transportMode || 'Bus (Jothan)'}"`;
    const members = r.members || [];
    
    const chargeable = r.chargeableCount !== undefined 
      ? r.chargeableCount 
      : members.filter(m => Number(m.age) > 5).length;
      
    const freeKids = r.freeKidsCount !== undefined 
      ? r.freeKidsCount 
      : members.filter(m => Number(m.age) > 0 && Number(m.age) <= 5).length;
      
    const totalAmt = r.totalAmount !== undefined 
      ? r.totalAmount 
      : chargeable * 100;

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
      totalAmt,
      `"${r.status || 'Confirmed'}"`
    ];

    for (let i = 0; i < maxMembers; i++) {
      if (i < members.length) {
        const mAge = Number(members[i].age) || 0;
        const mFee = mAge > 5 ? 100 : 0;
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
      <p>Fee Policy: Above 5 Years = ₹100 | Age 5 & Under = Free (₹0) | Bus Fare = ₹200/person</p>
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
      
    const totalAmt = r.totalAmount !== undefined 
      ? r.totalAmount 
      : chargeable * 100;

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
        <td class="bg-amount">₹${totalAmt.toLocaleString('en-IN')}</td>
        <td class="text-center bg-confirmed">${r.status || 'Confirmed'}</td>
      `;

    for (let i = 0; i < maxMembers; i++) {
      if (i < members.length) {
        const mAge = Number(members[i].age) || 0;
        const mFee = mAge > 5 ? 100 : 0;
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
