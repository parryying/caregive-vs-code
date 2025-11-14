# Quick Google Sheets Setup Guide

## 🚀 How to Connect Your Caregiver Tracker to Google Sheets

### Step 1: Set up Google Sheets API

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Sign in with your Google account

2. **Create or Select Project**
   - Click "Select a project" → "New Project"
   - Name it "Caregiver Tracker"
   - Click "Create"

3. **Enable Google Sheets API**
   - Go to "APIs & Services" → "Library"
   - Search for "Google Sheets API"
   - Click on it and press "Enable"

4. **Create API Key**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "API Key"
   - Copy the API key (keep it secure!)
   - Optional: Click "Restrict Key" and choose "Google Sheets API" for security

### Step 2: Create Your Google Sheet

1. **Create New Sheet**
   - Go to: https://sheets.google.com/
   - Click "Blank" to create new spreadsheet
   - Name it "Caregiver Time Logs" (or any name you want)

2. **Get Sheet ID**
   - Look at the URL: `https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit`
   - Copy the long string between `/d/` and `/edit` - this is your Spreadsheet ID

3. **Set Permissions (Optional)**
   - Click "Share" button
   - Add email addresses of people who should see the data
   - Set permissions (Viewer/Editor)

### Step 3: Connect in the App

1. **Open the Caregiver Tracker app**
2. **Click "Setup Google Sheets" button**
3. **Enter your credentials:**
   - Paste your API Key
   - Paste your Spreadsheet ID
4. **Click "Test Connection"**
5. **Success!** Data will now sync automatically

## 📊 What Gets Logged

The app automatically logs:
- **Timestamp** - When the action occurred
- **Caregiver** - Name of the caregiver
- **Date** - Date of the session
- **Clock In** - Time clocked in
- **Clock Out** - Time clocked out  
- **Session Hours** - Hours worked in that session
- **Total Hours** - Running total
- **Action** - Clock In/Clock Out with notes

## 🔄 How Syncing Works

- **Real-time sync** - Every clock in/out immediately syncs
- **Offline support** - If offline, data queues and syncs when online
- **Status indicator** - Shows sync status (Connected/Syncing/Error)
- **Automatic headers** - App creates proper column headers
- **Error handling** - Retries failed syncs automatically

## 🔧 Troubleshooting

**❌ HTTP 403 Error (Most Common):**
1. **Check Google Sheets API is enabled:**
   - Go back to [Google Cloud Console](https://console.cloud.google.com/)
   - Navigate to "APIs & Services" → "Enabled APIs"
   - Make sure "Google Sheets API" is in the list
   - If not, go to "Library" → Search "Google Sheets API" → Click "Enable"

2. **Verify API Key Permissions:**
   - Go to "APIs & Services" → "Credentials"
   - Click on your API key
   - Under "API restrictions" → Choose "Restrict key"
   - Select "Google Sheets API" from the list
   - Click "Save"

3. **Make sure you're using the correct project:**
   - Check the project name in top-left of Google Cloud Console
   - Make sure it matches where you enabled the API

4. **Try creating a new API Key:**
   - Delete old key and create a fresh one
   - Sometimes keys need a few minutes to activate

**Connection Failed:**
- Double-check API key and Sheet ID
- Make sure Google Sheets API is enabled
- Try creating a new API key

**Sync Error:**
- Check internet connection
- Verify Google Sheet still exists
- Check if API key has proper permissions

**No Data Appearing:**
- Refresh your Google Sheet
- Check the correct sheet tab
- Look for data starting from row 2 (row 1 has headers)

**Sheet Access Issues:**
- Make sure the Google Sheet is not restricted
- Try making it "Anyone with the link can view"
- Check if you're signed into the correct Google account

## 🔒 Security Notes

- API key is stored locally in your browser only
- No data passes through external servers
- Direct connection to Google Sheets API
- You control who has access to the spreadsheet

## ✅ You're All Set!

Once connected, every time someone clocks in or out, the data automatically appears in your Google Sheet. You can:

- **View data in real-time** on any device
- **Share with family members** via Google Sheets sharing
- **Export data** for reports or backup
- **Access from anywhere** via Google Sheets mobile app

The sync happens automatically - no manual work required! 🎉