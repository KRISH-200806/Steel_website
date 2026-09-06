/**
 * ==============================================================================
 * 1-DAY PICNIC 2026 - GOOGLE APPS SCRIPT BACKEND (EXCEL / GOOGLE SHEETS)
 * ==============================================================================
 * 
 * FEATURES:
 * 1. Automatically creates structured headers on first run.
 * 2. Uploads payment screenshot (Base64) to Google Drive folder ("Picnic_2026_Payment_Screenshots").
 * 3. Generates clickable viewable Google Drive screenshot URL in Column 11.
 * 4. Generates unique Registration ID (PIC-2026-0001, PIC-2026-0002...).
 * 5. Appends a new row for each registration without overwriting.
 * 6. Supports GET health check request.
 * ==============================================================================
 */

// Configuration Constants
const SCRIPT_CONFIG = {
  SHEET_NAME: "Registrations",
  DRIVE_FOLDER_NAME: "Picnic_2026_Payment_Screenshots",
  ID_PREFIX: "PIC-2026-",
  MAX_MEMBER_COLUMNS: 15 // Prepares columns for up to 15 members
};

/**
 * Handle POST request from the web application
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
  } catch (lockError) {
    return createJsonResponse({
      success: false,
      message: "Server is busy processing another registration. Please try again in a moment."
    });
  }

  try {
    if (!e || !e.postData || !e.postData.contents) {
      return createJsonResponse({
        success: false,
        message: "No POST data received."
      });
    }

    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SCRIPT_CONFIG.SHEET_NAME);
    
    // Create sheet if it does not exist
    if (!sheet) {
      sheet = ss.insertSheet(SCRIPT_CONFIG.SHEET_NAME);
    }

    // Ensure headers exist
    setupHeadersIfMissing(sheet);

    // 1. Process & Save Payment Screenshot to Google Drive
    let screenshotUrl = "No screenshot uploaded";
    if (data.screenshotBase64) {
      screenshotUrl = saveScreenshotToDrive(
        data.screenshotBase64,
        data.screenshotFileName || "payment_proof.jpg",
        data.primaryName || "Picnic_Guest",
        data.mobileNumber || "Phone"
      );
    } else if (data.paymentScreenshotUrl) {
      screenshotUrl = data.paymentScreenshotUrl;
    }

    // 2. Generate or verify unique Registration ID
    const lastRow = sheet.getLastRow();
    const nextSeqNumber = Math.max(1, lastRow); // row 2 = 0001
    const generatedId = SCRIPT_CONFIG.ID_PREFIX + String(nextSeqNumber).padStart(4, '0');
    const registrationId = data.registrationId || generatedId;

    // 3. Format Date & Time (Indian Standard Time)
    const timestamp = data.timestamp || Utilities.formatDate(new Date(), "Asia/Kolkata", "dd/MM/yyyy, hh:mm:ss a");

    // 4. Construct Row Data (without Address, with ₹100 fee)
    const members = Array.isArray(data.members) ? data.members : [];
    const totalMembers = Number(data.totalMembers) || members.length || 1;
    const pricePerMember = Number(data.pricePerMember) || 100;
    const totalAmount = Number(data.totalAmount) || (totalMembers * pricePerMember);
    const paymentStatus = data.paymentStatus || "Payment Screenshot Uploaded / Pending Verification";

    const rowData = [
      registrationId,
      timestamp,
      data.primaryName || "",
      data.primaryAge || "",
      data.primaryGender || "",
      "'" + String(data.mobileNumber || "").replace(/\D/g, ''),
      totalMembers,
      pricePerMember,
      totalAmount,
      paymentStatus,
      screenshotUrl.startsWith("http") ? screenshotUrl : (screenshotUrl ? "Screenshot Uploaded" : "No screenshot")
    ];

    // Append dynamic member columns
    for (let i = 0; i < SCRIPT_CONFIG.MAX_MEMBER_COLUMNS; i++) {
      if (i < members.length) {
        rowData.push(members[i].name || "");
        rowData.push(members[i].age || "");
        rowData.push(members[i].gender || "");
      } else {
        rowData.push(""); // Name
        rowData.push(""); // Age
        rowData.push(""); // Gender
      }
    }

    // 5. Append New Row
    sheet.appendRow(rowData);
    const insertedRowIndex = sheet.getLastRow();

    // Format row styling & hyperlink
    try {
      const rowRange = sheet.getRange(insertedRowIndex, 1, 1, rowData.length);
      rowRange.setVerticalAlignment("middle");
      
      // Highlight pending status
      const statusCell = sheet.getRange(insertedRowIndex, 10);
      statusCell.setBackground("#fef3c7").setFontColor("#92400e");
      
      // Screenshot cell clean clickable hyperlink
      if (screenshotUrl.startsWith("http")) {
        const screenshotCell = sheet.getRange(insertedRowIndex, 11);
        screenshotCell.setFormula(`=HYPERLINK("${screenshotUrl}", "🔍 View Screenshot")`);
        screenshotCell.setFontColor("#15803d").setFontLine("underline");
      }
    } catch (styleErr) {
      Logger.log("Row styling notice: " + styleErr.toString());
    }

    return createJsonResponse({
      success: true,
      message: "Registration successfully recorded in Google Sheets!",
      registrationId: registrationId,
      screenshotUrl: screenshotUrl,
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
 * Handle GET request (Health Check)
 */
function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SCRIPT_CONFIG.SHEET_NAME);
    
    if (!sheet) {
      return createJsonResponse({
        status: "active",
        message: "Picnic 2026 Google Apps Script is running. Sheet will be initialized on first submission.",
        totalRegistrations: 0
      });
    }

    const lastRow = sheet.getLastRow();
    const totalRegistrations = Math.max(0, lastRow - 1);

    return createJsonResponse({
      status: "active",
      message: "Picnic 2026 Google Apps Script Webhook is active and connected to Google Sheets!",
      totalRegistrations: totalRegistrations,
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
      "Total Members",
      "Price Per Member (₹)",
      "Total Amount (₹)",
      "Payment Status",
      "Payment Screenshot URL"
    ];

    for (let i = 1; i <= SCRIPT_CONFIG.MAX_MEMBER_COLUMNS; i++) {
      headers.push(`Member ${i} Name`);
      headers.push(`Member ${i} Age`);
      headers.push(`Member ${i} Gender`);
    }

    sheet.appendRow(headers);

    // Format Header Row
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground("#15803d") // Emerald Green
               .setFontColor("#ffffff")
               .setFontWeight("bold")
               .setHorizontalAlignment("center")
               .setVerticalAlignment("middle");
    
    sheet.setFrozenRows(1);
    
    // Auto resize first 11 columns
    for (let col = 1; col <= 11; col++) {
      try {
        sheet.autoResizeColumn(col);
      } catch (e) {}
    }
  }
}

/**
 * Save Base64 encoded screenshot image to Google Drive folder
 */
function saveScreenshotToDrive(base64Data, originalFileName, guestName, phone) {
  try {
    let folder;
    const folders = DriveApp.getFoldersByName(SCRIPT_CONFIG.DRIVE_FOLDER_NAME);
    if (folders.hasNext()) {
      folder = folders.next();
    } else {
      folder = DriveApp.createFolder(SCRIPT_CONFIG.DRIVE_FOLDER_NAME);
    }

    let cleanBase64 = base64Data;
    let contentType = "image/jpeg";

    if (base64Data.indexOf(";base64,") > -1) {
      const parts = base64Data.split(";base64,");
      contentType = parts[0].replace("data:", "");
      cleanBase64 = parts[1];
    }

    const decodedBlob = Utilities.newBlob(
      Utilities.base64Decode(cleanBase64),
      contentType,
      `PicnicPay_${guestName.replace(/[^a-zA-Z0-9]/g, '_')}_${phone}_${Date.now()}.jpg`
    );

    const file = folder.createFile(decodedBlob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    return `https://drive.google.com/uc?export=view&id=${file.getId()}`;
  } catch (driveError) {
    Logger.log("Drive save error: " + driveError.toString());
    return "Error saving to Drive: " + driveError.message;
  }
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
