# 📊 Google Sheets & Google Drive Integration Guide

This guide walks you through setting up automatic, real-time data storage in **Google Sheets** and screenshot storage in **Google Drive** using the provided `google-apps-script.gs` backend.

---

## ⚡ 3-Minute Quick Setup

### Step 1: Create a Google Sheet
1. Open [Google Sheets](https://sheets.new) in your browser.
2. Name your spreadsheet: **"1-Day Picnic 2026 Registrations"**.
3. (Optional) Rename the bottom tab from `Sheet1` to `Registrations`.

### Step 2: Open Apps Script Editor
1. In the top menu of your Google Sheet, click **Extensions** > **Apps Script**.
2. A new tab will open with a code editor.
3. Select and delete any default code inside the editor (`function myFunction() { ... }`).
4. Copy the entire contents of [`google-apps-script.gs`](./google-apps-script.gs) and paste it into the editor.
5. Click the **Save** icon (diskette) or press `Ctrl + S`.

### Step 3: Deploy as a Web App
1. Click the blue **Deploy** button in the top right corner.
2. Select **New deployment**.
3. In the modal that opens, click the **Gear icon (Select type)** and choose **Web app**.
4. Configure the deployment settings:
   - **Description**: `Picnic 2026 Registration API`
   - **Execute as**: `Me (your-email@gmail.com)`
   - **Who has access**: **`Anyone`** *(⚠️ VERY IMPORTANT: This allows your website form to submit registrations without requiring users to log in with Google).*
5. Click **Deploy**.
6. Google will ask you to **Authorize access**:
   - Click *Authorize access*.
   - Select your Google account.
   - If you see "Google hasn't verified this app", click **Advanced** (at the bottom) > Click **Go to Untitled project (unsafe)** > Click **Allow**.
7. Copy the **Web app URL** (it looks like `https://script.google.com/macros/s/AKfycbx.../exec`).

### Step 4: Link with the Web App
1. In the Picnic Registration web application, click the **Admin Dashboard** button (key icon in top right) or open Admin Settings.
2. Enter the default PIN: `2026`.
3. In the **Settings** tab, paste your **Google Apps Script Web App URL**.
4. Click **Save Configuration & Test Connection**.
5. You're all set! Every registration submitted from the website will now:
   - Create a new row in your Google Sheet with unique ID `PIC-2026-0001`, `PIC-2026-0002`...
   - Upload the payment screenshot to your Google Drive in a folder named `Picnic_2026_Payment_Screenshots`.
   - Insert a clickable hyperlink directly in Column 10 of Google Sheets to view the payment screenshot.

---

## 📋 Spreadsheet Column Structure

| Col # | Column Header | Description |
| :---: | :--- | :--- |
| **A** | `Registration ID` | Unique ID (`PIC-2026-0001`, `PIC-2026-0002`, ...) |
| **B** | `Date & Time` | Indian Standard Time (`DD/MM/YYYY, HH:MM:SS AM/PM`) |
| **C** | `Primary Name` | Primary contact person's full name |
| **D** | `Mobile Number` | Validated 10-digit Indian mobile number |
| **E** | `Address` | Contact address / city |
| **F** | `Total Members` | Number of members attending |
| **G** | `Price Per Member (₹)` | Configured fee (e.g. ₹500) |
| **H** | `Total Amount (₹)` | Calculated amount (`Total Members × Price`) |
| **I** | `Payment Status` | `Payment Screenshot Uploaded / Pending Verification` |
| **J** | `Payment Screenshot URL` | Clickable Google Drive URL to view proof |
| **K** | `Member 1 Name` | Dynamic member 1 full name |
| **L** | `Member 1 Age` | Dynamic member 1 age |
| **M** | `Member 1 Gender` | Dynamic member 1 gender (`Male` / `Female` / `Other`) |
| **N...** | `Member 2, 3...` | Dynamically continued for up to 15+ members |

---

## 🔒 Security & Privacy Features

- **No Exposed Credentials**: The frontend does not expose any private service account keys or Google API keys.
- **Serverless Lock Protection**: The Apps Script includes `LockService` concurrency handling to prevent duplicate IDs or race conditions.
- **Drive Permissions**: Screenshots are securely stored in the organizer's Google Drive and shared with a direct viewable link.
- **Offline Fallback Storage**: The web application automatically caches submissions locally in `LocalStorage` as a backup if the user loses network connection.
