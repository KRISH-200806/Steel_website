import { STORAGE_KEYS, getActiveConfig } from '../config/picnicConfig';

/**
 * Generate a unique Registration ID format: PIC-2026-0001
 */
export const generateRegistrationId = () => {
  const config = getActiveConfig();
  const existing = getStoredRegistrations();
  const count = existing.length + 1;
  const seq = String(count).padStart(4, '0');
  return `${config.idPrefix || 'PIC-2026-'}${seq}`;
};

/**
 * Get all stored registrations from LocalStorage
 */
export const getStoredRegistrations = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.REGISTRATIONS);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error("Error reading stored registrations:", err);
    return [];
  }
};

/**
 * Save a registration to local storage database
 */
export const saveRegistrationLocally = (registration) => {
  try {
    const existing = getStoredRegistrations();
    const index = existing.findIndex(r => r.registrationId === registration.registrationId);
    let updated;
    if (index >= 0) {
      updated = [...existing];
      updated[index] = registration;
    } else {
      updated = [registration, ...existing];
    }
    localStorage.setItem(STORAGE_KEYS.REGISTRATIONS, JSON.stringify(updated));
    return true;
  } catch (err) {
    console.error("Error saving local registration:", err);
    return false;
  }
};

/**
 * Update payment verification status in local database
 */
export const updatePaymentStatus = (registrationId, newStatus) => {
  try {
    const existing = getStoredRegistrations();
    const updated = existing.map(item => {
      if (item.registrationId === registrationId) {
        return {
          ...item,
          paymentStatus: newStatus,
          verifiedAt: new Date().toISOString()
        };
      }
      return item;
    });
    localStorage.setItem(STORAGE_KEYS.REGISTRATIONS, JSON.stringify(updated));
    return true;
  } catch (err) {
    console.error("Error updating status:", err);
    return false;
  }
};

/**
 * Convert a File object to a Base64 string
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
 * Submit Registration to Google Apps Script and Local Database
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

  // Prepare full data payload
  const fullPayload = {
    registrationId: registrationId,
    timestamp: timestamp,
    primaryName: (formData.primaryName || '').trim(),
    primaryAge: formData.primaryAge ? Number(formData.primaryAge) : '',
    primaryGender: formData.primaryGender || '',
    mobileNumber: (formData.mobileNumber || '').trim(),
    address: (formData.address || '').trim(),
    totalMembers: formData.members ? formData.members.length : 1,
    pricePerMember: config.feePerMember || 100,
    totalAmount: (formData.members ? formData.members.length : 1) * (config.feePerMember || 100),
    paymentStatus: "Payment Screenshot Uploaded / Pending Verification",
    screenshotBase64: formData.screenshotBase64 || "",
    screenshotFileName: formData.screenshotFileName || `proof_${registrationId}.jpg`,
    screenshotUrl: formData.screenshotPreview || "",
    members: (formData.members || []).map((m, idx) => ({
      index: idx + 1,
      name: (m.name || '').trim(),
      age: Number(m.age) || '',
      gender: m.gender || ''
    }))
  };

  let googleSuccess = false;
  let serverMessage = "";
  let liveScreenshotUrl = "";

  // 1. Submit to Google Apps Script if configured
  if (config.googleScriptUrl && config.googleScriptUrl.trim().startsWith("http")) {
    const url = config.googleScriptUrl.trim();
    try {
      // Try standard post
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },
        body: JSON.stringify(fullPayload),
      });

      if (response.ok) {
        googleSuccess = true;
        try {
          const resJson = await response.json();
          if (resJson.screenshotUrl) {
            liveScreenshotUrl = resJson.screenshotUrl;
            fullPayload.screenshotUrl = resJson.screenshotUrl;
          }
        } catch (e) {
          googleSuccess = true;
        }
      }
    } catch (networkErr) {
      // Fallback with no-cors mode to ensure data reaches Google Apps Script
      try {
        await fetch(url, {
          method: "POST",
          mode: "no-cors",
          headers: {
            "Content-Type": "text/plain",
          },
          body: JSON.stringify(fullPayload)
        });
        googleSuccess = true;
      } catch (e) {
        console.warn("Google Apps Script sync notice:", e.message);
      }
    }
  }

  // 2. Always persist in local database
  saveRegistrationLocally(fullPayload);

  return {
    success: true,
    registrationId: registrationId,
    timestamp: timestamp,
    totalAmount: fullPayload.totalAmount,
    totalMembers: fullPayload.totalMembers,
    googleSynced: googleSuccess,
    screenshotUrl: liveScreenshotUrl || fullPayload.screenshotUrl,
    message: googleSuccess
      ? "Registration recorded in Google Sheets and Google Drive successfully!"
      : "Registration saved successfully! (Backed up in local database)"
  };
};

/**
 * Test Google Apps Script Webhook connection
 */
export const testGoogleScriptConnection = async (url) => {
  if (!url || !url.trim().startsWith("http")) {
    return { success: false, message: "Please provide a valid HTTP/HTTPS Webhook URL." };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url.trim(), {
      method: "GET",
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json().catch(() => null);
      return {
        success: true,
        message: data?.message || "Connected to Google Apps Script successfully!",
        data: data
      };
    } else {
      return {
        success: false,
        message: `Server returned status ${response.status}: ${response.statusText}`
      };
    }
  } catch (err) {
    return {
      success: false,
      message: `Connection failed: ${err.message}. Ensure the script is deployed with access set to 'Anyone'.`
    };
  }
};

/**
 * Helper to trigger image download from URL or Base64 string
 */
export const downloadScreenshot = (screenshotData, fileName = "payment_proof.jpg") => {
  if (!screenshotData) {
    alert("No screenshot available to download.");
    return;
  }

  try {
    const link = document.createElement("a");
    link.href = screenshotData;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.error("Error downloading screenshot:", err);
    // Fallback: open in new tab
    window.open(screenshotData, "_blank");
  }
};

/**
 * Export registrations to CSV format with Excel compatibility (No scientific notation, No huge base64 strings)
 */
export const exportToCSV = (registrations) => {
  if (!registrations || registrations.length === 0) {
    alert("No registration records to export / એક્સપોર્ટ કરવા માટે કોઈ ડેટા નથી.");
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
    "Total Members",
    "Price Per Member (INR)",
    "Total Amount (INR)",
    "Payment Status",
    "Payment Screenshot"
  ];

  for (let i = 1; i <= maxMembers; i++) {
    headers.push(`Member ${i} Name`);
    headers.push(`Member ${i} Age`);
    headers.push(`Member ${i} Gender`);
  }

  const csvRows = [headers.join(",")];

  registrations.forEach(r => {
    // Format screenshot column: NEVER dump huge base64 into CSV cell!
    let screenshotCell = '""';
    if (r.screenshotUrl) {
      if (r.screenshotUrl.startsWith("http")) {
        // Web URL / Google Drive link
        screenshotCell = `"${r.screenshotUrl}"`;
      } else if (r.screenshotUrl.startsWith("data:image")) {
        // Base64 image
        screenshotCell = `"Photo Attached (View in Admin Portal)"`;
      } else {
        screenshotCell = `"${r.screenshotUrl}"`;
      }
    } else {
      screenshotCell = `"Not Uploaded"`;
    }

    // Format mobile number as ="9510371613" so Excel does NOT show scientific notation (9.51E+09)
    const mobileValue = r.mobileNumber ? `="${r.mobileNumber}"` : '""';

    const row = [
      `"${r.registrationId || ''}"`,
      `"${r.timestamp || ''}"`,
      `"${(r.primaryName || '').replace(/"/g, '""')}"`,
      r.primaryAge || '',
      `"${r.primaryGender || ''}"`,
      mobileValue,
      r.totalMembers || (r.members ? r.members.length : 1),
      r.pricePerMember || 100,
      r.totalAmount || 0,
      `"${r.paymentStatus || 'Pending Verification'}"`,
      screenshotCell
    ];

    const members = r.members || [];
    for (let i = 0; i < maxMembers; i++) {
      if (i < members.length) {
        row.push(`"${(members[i].name || '').replace(/"/g, '""')}"`);
        row.push(members[i].age || '');
        row.push(`"${members[i].gender || ''}"`);
      } else {
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
  link.setAttribute("download", `Picnic_2026_Registrations_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Export registrations as formatted Excel HTML Spreadsheet (.xls)
 * Opens cleanly in Microsoft Excel with formatted headers, styles, and full text numbers
 */
export const exportToExcelFormatted = (registrations) => {
  if (!registrations || registrations.length === 0) {
    alert("No registration records to export / એક્સપોર્ટ કરવા માટે કોઈ ડેટા નથી.");
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
        th { background-color: #15803d; color: #ffffff; font-weight: bold; border: 1px solid #047857; padding: 10px; text-align: center; }
        td { border: 1px solid #cbd5e1; padding: 8px; vertical-align: middle; }
        .text-center { text-align: center; }
        .text-num { mso-number-format: "\\@"; }
        .bg-pending { background-color: #fef3c7; color: #92400e; font-weight: bold; }
        .bg-verified { background-color: #d1fae5; color: #065f46; font-weight: bold; }
      </style>
    </head>
    <body>
      <h2>1-Day Picnic 2026 - Registration Records</h2>
      <p>Generated on: ${new Date().toLocaleString('en-IN')}</p>
      <table>
        <thead>
          <tr>
            <th>Reg ID</th>
            <th>Date & Time</th>
            <th>Primary Name</th>
            <th>Age</th>
            <th>Gender</th>
            <th>Mobile Number</th>
            <th>Total Members</th>
            <th>Fee (₹)</th>
            <th>Total (₹)</th>
            <th>Payment Status</th>
            <th>Screenshot Proof</th>
  `;

  for (let i = 1; i <= maxMembers; i++) {
    tableHtml += `<th>Member ${i} Name</th><th>Member ${i} Age</th><th>Member ${i} Gender</th>`;
  }

  tableHtml += `</tr></thead><tbody>`;

  registrations.forEach(r => {
    const isVerified = r.paymentStatus === 'Verified';
    const statusClass = isVerified ? 'bg-verified' : 'bg-pending';
    
    let proofCell = 'Not Uploaded';
    if (r.screenshotUrl) {
      if (r.screenshotUrl.startsWith('http')) {
        proofCell = `<a href="${r.screenshotUrl}" target="_blank">View Screenshot Link</a>`;
      } else {
        proofCell = `<span>Photo Attached (View in Admin)</span>`;
      }
    }

    tableHtml += `
      <tr>
        <td class="text-center"><strong>${r.registrationId || ''}</strong></td>
        <td>${r.timestamp || ''}</td>
        <td><strong>${r.primaryName || ''}</strong></td>
        <td class="text-center">${r.primaryAge || ''}</td>
        <td class="text-center">${r.primaryGender || ''}</td>
        <td class="text-num text-center">${r.mobileNumber || ''}</td>
        <td class="text-center">${r.totalMembers || (r.members ? r.members.length : 1)}</td>
        <td class="text-center">₹${r.pricePerMember || 100}</td>
        <td class="text-center"><strong>₹${r.totalAmount || 0}</strong></td>
        <td class="text-center ${statusClass}">${r.paymentStatus || 'Pending'}</td>
        <td class="text-center">${proofCell}</td>
    `;

    const members = r.members || [];
    for (let i = 0; i < maxMembers; i++) {
      if (i < members.length) {
        tableHtml += `
          <td>${members[i].name || ''}</td>
          <td class="text-center">${members[i].age || ''}</td>
          <td class="text-center">${members[i].gender || ''}</td>
        `;
      } else {
        tableHtml += `<td></td><td></td><td></td>`;
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

