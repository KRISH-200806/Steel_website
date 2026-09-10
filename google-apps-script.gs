/**
 * ==============================================================================
 * શ્રી બ્રહ્માનંદ સત્સંગ યાત્રા - 2026 : GOOGLE APPS SCRIPT BACKEND
 * ==============================================================================
 * 
 * 1. Automatically initializes formatted columns in Google Sheets
 * 2. Saves all member details, travel mode (Bus / Own Vehicle), ages, & fee breakdown
 * 3. Works seamlessly without requiring Google login from website users
 * ==============================================================================
 */

const SCRIPT_CONFIG = {
  SHEET_NAME: "Registrations",
  ID_PREFIX: "SBSY-2026-",
  MAX_MEMBER_COLUMNS: 15 // Up to 15 members columns
};

/**
 * Handle POST request from the website registration form
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
  } catch (lockError) {
    return createJsonResponse({
      success: false,
      message: "Server is busy. Please try again."
    });
  }

  try {
    if (!e || !e.postData || !e.postData.contents) {
      return createJsonResponse({
        success: false,
        message: "No data received."
      });
    }

    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SCRIPT_CONFIG.SHEET_NAME);
    
    // Create sheet if missing
    if (!sheet) {
      sheet = ss.insertSheet(SCRIPT_CONFIG.SHEET_NAME);
    }

    // Ensure table headers exist
    setupHeadersIfMissing(sheet);

    // 1. Generate / verify Registration ID
    const lastRow = sheet.getLastRow();
    const nextSeqNumber = Math.max(1, lastRow); // row 2 = 0001
    const generatedId = SCRIPT_CONFIG.ID_PREFIX + String(nextSeqNumber).padStart(4, '0');
    const registrationId = data.registrationId || generatedId;

    // 2. Format Date & Time
    const timestamp = data.timestamp || Utilities.formatDate(new Date(), "Asia/Kolkata", "dd/MM/yyyy, hh:mm:ss a");

    // 3. Process Members and Pricing
    const members = Array.isArray(data.members) ? data.members : [];
    const totalMembers = Number(data.totalMembers) || members.length || 1;
    const transportMode = data.transportMode || "Bus (Jothan)";
    const isBus = transportMode.indexOf("Bus") > -1;

    const chargeableCount = data.chargeableCount !== undefined 
      ? Number(data.chargeableCount) 
      : members.filter(function(m) { return Number(m.age) > 5; }).length;

    const freeKidsCount = data.freeKidsCount !== undefined 
      ? Number(data.freeKidsCount) 
      : members.filter(function(m) { return Number(m.age) > 0 && Number(m.age) <= 5; }).length;

    const feePerMember = Number(data.feePerMember) || 100;
    const busFare = Number(data.busFare) || 200;
    const memberFeeTotal = data.memberFeeTotal !== undefined ? Number(data.memberFeeTotal) : (chargeableCount * feePerMember);
    const busFeeTotal = data.busFeeTotal !== undefined ? Number(data.busFeeTotal) : (isBus ? chargeableCount * busFare : 0);
    const totalAmount = data.totalAmount !== undefined ? Number(data.totalAmount) : (memberFeeTotal + busFeeTotal);
    const status = data.status || "Confirmed";

    // 4. Build Row Data
    const rowData = [
      registrationId,
      timestamp,
      data.primaryName || "",
      data.primaryAge || "",
      data.primaryGender || "",
      "'" + String(data.mobileNumber || "").replace(/\D/g, ''),
      transportMode,
      totalMembers,
      chargeableCount,
      freeKidsCount,
      memberFeeTotal,
      busFeeTotal,
      totalAmount,
      status
    ];

    // Append member columns
    for (let i = 0; i < SCRIPT_CONFIG.MAX_MEMBER_COLUMNS; i++) {
      if (i < members.length) {
        const mAge = Number(members[i].age) || 0;
        const isChg = mAge > 5;
        const mFee = isChg ? (isBus ? feePerMember + busFare : feePerMember) : 0;
        
        rowData.push(members[i].name || "");
        rowData.push(members[i].age || "");
        rowData.push(members[i].gender || "");
        rowData.push(mFee);
      } else {
        rowData.push(""); // Name
        rowData.push(""); // Age
        rowData.push(""); // Gender
        rowData.push(""); // Fee
      }
    }

    // 5. Append New Row to Google Sheet
    sheet.appendRow(rowData);
    const insertedRowIndex = sheet.getLastRow();

    // Style the new row
    try {
      const rowRange = sheet.getRange(insertedRowIndex, 1, 1, rowData.length);
      rowRange.setVerticalAlignment("middle");
      
      // Highlight transport & status
      const transportCell = sheet.getRange(insertedRowIndex, 7);
      if (isBus) {
        transportCell.setBackground("#eff6ff").setFontColor("#1e40af").setFontWeight("bold");
      } else {
        transportCell.setBackground("#faf5ff").setFontColor("#6b21a8").setFontWeight("bold");
      }

      const totalCell = sheet.getRange(insertedRowIndex, 13);
      totalCell.setBackground("#ecfdf5").setFontColor("#047857").setFontWeight("bold");

      const statusCell = sheet.getRange(insertedRowIndex, 14);
      statusCell.setBackground("#d1fae5").setFontColor("#065f46").setFontWeight("bold");
    } catch (styleErr) {
      Logger.log("Style note: " + styleErr.toString());
    }

    return createJsonResponse({
      success: true,
      message: "Registration successfully recorded in Google Sheet!",
      registrationId: registrationId,
      timestamp: timestamp,
      totalAmount: totalAmount
    });

  } catch (error) {
    Logger.log("Error in doPost: " + error.toString());
    return createJsonResponse({
      success: false,
      message: "Server Error: " + error.message
    });
  } finally {
    lock.releaseLock();
  }
}

/**
 * Handle GET request (Fetch all registrations & Health Check)
 */
function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SCRIPT_CONFIG.SHEET_NAME);
    
    if (!sheet || sheet.getLastRow() <= 1) {
      return createJsonResponse({
        status: "active",
        message: "Google Sheets is active and connected! No registrations yet.",
        totalRegistrations: 0,
        registrations: [],
        spreadsheetName: ss ? ss.getName() : "",
        spreadsheetUrl: ss ? ss.getUrl() : ""
      });
    }

    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    const values = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();

    const registrations = values.map(function(row) {
      const members = [];
      // Dynamic member columns start at index 14 (Column 15: Name, Age, Gender, Fee)
      for (let c = 14; c < row.length; c += 4) {
        if (row[c] && String(row[c]).trim() !== "") {
          members.push({
            name: String(row[c]),
            age: row[c + 1] !== undefined ? String(row[c + 1]) : "",
            gender: row[c + 2] !== undefined ? String(row[c + 2]) : "",
            fee: row[c + 3] !== undefined ? Number(row[c + 3]) : 0
          });
        }
      }

      return {
        registrationId: String(row[0] || ""),
        timestamp: String(row[1] || ""),
        primaryName: String(row[2] || ""),
        primaryAge: row[3] !== "" ? Number(row[3]) : "",
        primaryGender: String(row[4] || ""),
        mobileNumber: String(row[5] || "").replace(/'/g, ''),
        transportMode: String(row[6] || "Bus (Jothan)"),
        totalMembers: Number(row[7]) || members.length || 1,
        chargeableCount: Number(row[8]) || 0,
        freeKidsCount: Number(row[9]) || 0,
        memberFeeTotal: Number(row[10]) || 0,
        busFeeTotal: Number(row[11]) || 0,
        totalAmount: Number(row[12]) || 0,
        status: String(row[13] || "Confirmed"),
        members: members
      };
    }).reverse(); // Newest first

    return createJsonResponse({
      status: "active",
      message: "Google Sheets Webhook is active and connected!",
      totalRegistrations: registrations.length,
      registrations: registrations,
      spreadsheetName: ss.getName(),
      spreadsheetUrl: ss.getUrl()
    });
  } catch (error) {
    return createJsonResponse({
      status: "error",
      message: error.message
    });
  }
}

/**
 * Setup formatted header row if sheet is fresh
 */
function setupHeadersIfMissing(sheet) {
  if (sheet.getLastRow() === 0) {
    const headers = [
      "Registration ID",
      "Date & Time",
      "Primary Name",
      "Primary Age",
      "Primary Gender",
      "Mobile Number",
      "Transportation Mode",
      "Total Members",
      "Chargeable (>5 yrs)",
      "Free Kids (<=5 yrs)",
      "Member Fee Total (₹)",
      "Bus Fare Total (₹)",
      "Total Amount (₹)",
      "Status"
    ];

    for (let i = 1; i <= SCRIPT_CONFIG.MAX_MEMBER_COLUMNS; i++) {
      headers.push(`Member ${i} Name`);
      headers.push(`Member ${i} Age`);
      headers.push(`Member ${i} Gender`);
      headers.push(`Member ${i} Fee (₹)`);
    }

    sheet.appendRow(headers);

    // Format Header Row
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground("#047857") // Emerald 700
               .setFontColor("#ffffff")
               .setFontWeight("bold")
               .setHorizontalAlignment("center")
               .setVerticalAlignment("middle");
    
    sheet.setFrozenRows(1);
    
    for (let col = 1; col <= 14; col++) {
      try {
        sheet.autoResizeColumn(col);
      } catch (e) {}
    }
  }
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
