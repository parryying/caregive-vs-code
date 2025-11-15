/**
 * Enhanced Google Apps Script for Caregiver Time Tracker
 * Handles multiple sheets: Caregivers, Sessions, and Settings
 */

function doGet(e) {
  console.log('doGet called with event object:', e);
  
  try {
    // Initialize spreadsheet first to ensure it exists
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    
    // Ensure sheets are initialized
    initializeSheets();
    
    // Safe parameter access with fallback
    const parameters = e && e.parameter ? e.parameter : {};
    const action = parameters.action || 'read';
    
    console.log('Parameters received:', parameters);
    console.log('Action:', action);
    
    // Handle JSONP callback
    const callback = parameters.callback;
    
    let result = {};
    
    switch(action) {
      case 'read':
        result = readAllData(spreadsheet);
        break;
        
      case 'readCaregivers':
        result = readCaregivers(spreadsheet);
        break;
        
      case 'readSessions':
        result = readSessions(spreadsheet);
        break;
        
      case 'testConnection':
        result = { success: true, message: 'Connection successful', timestamp: new Date().toISOString() };
        break;
        
      default:
        result = { success: false, error: 'Unknown action: ' + action };
    }
    
    // Handle individual data submissions via GET (JSONP)
    if (parameters.values) {
      try {
        const values = JSON.parse(parameters.values);
        const dataType = parameters.dataType || 'session'; // 'session' or 'caregiver'
        const eventType = values.eventType || values.action;
        
        console.log('Processing data submission:', { dataType, eventType, values });
        
        if (dataType === 'caregiver') {
          result = addOrUpdateCaregiver(spreadsheet, values);
        } else if (eventType === 'DELETE_SESSION') {
          result = deleteSession(spreadsheet, values);
        } else if (eventType === 'UPDATE_SESSION') {
          result = updateSession(spreadsheet, values);
        } else if (eventType === 'COMPLETE_SESSION') {
          // Handle complete session - clean up the action/notes to avoid rejection
          const cleanedValues = { ...values };
          if (cleanedValues.action && cleanedValues.action === 'Complete Session') {
            cleanedValues.action = 'Session completed';
          }
          result = addSession(spreadsheet, cleanedValues);
        } else {
          // Only process complete sessions, reject individual clock events
          if (eventType === 'CLOCK_IN' || eventType === 'CLOCK_OUT') {
            result = { success: false, error: 'Individual clock events are not stored. Only complete sessions are saved.' };
          } else {
            result = addSession(spreadsheet, values);
          }
        }
      } catch (parseError) {
        result = { success: false, error: 'Invalid JSON in values parameter: ' + parseError.message };
      }
    }
    
    const response = JSON.stringify(result);
    
    if (callback) {
      return ContentService
        .createTextOutput(callback + '(' + response + ')')
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    } else {
      return ContentService
        .createTextOutput(response)
        .setMimeType(ContentService.MimeType.JSON);
    }
    
  } catch (error) {
    console.error('Error in doGet:', error);
    const errorResponse = JSON.stringify({
      success: false,
      error: error.toString(),
      stack: error.stack
    });
    
    const callback = parameters.callback;
    if (callback) {
      return ContentService
        .createTextOutput(callback + '(' + errorResponse + ')')
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    } else {
      return ContentService
        .createTextOutput(errorResponse)
        .setMimeType(ContentService.MimeType.JSON);
    }
  }
}

function doPost(e) {
  console.log('doPost called with event object:', e);
  
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    let data;
    
    // Safe access to post data
    if (e && e.postData && e.postData.type === 'application/json') {
      data = JSON.parse(e.postData.contents);
    } else if (e && e.parameters) {
      // Handle form data
      data = e.parameters;
    } else {
      data = {};
    }
    
    console.log('Post data received:', data);
    
    const action = data.action || 'addSession';
    let result = {};
    
    switch(action) {
      case 'addSession':
        result = addSession(spreadsheet, data.values || data);
        break;
        
      case 'addCaregiver':
        result = addOrUpdateCaregiver(spreadsheet, data.values || data);
        break;
        
      case 'syncBatch':
        result = syncBatchData(spreadsheet, data.caregivers, data.sessions);
        break;
        
      case 'DELETE_SESSION':
        result = deleteSession(spreadsheet, data);
        break;
        
      case 'UPDATE_SESSION':
        result = updateSession(spreadsheet, data);
        break;
        
      case 'COMPLETE_SESSION':
        // Handle complete session - clean up the action/notes
        const cleanedData = { ...data };
        if (cleanedData.action && cleanedData.action === 'Complete Session') {
          cleanedData.action = 'Session completed';
        }
        result = addSession(spreadsheet, cleanedData);
        break;
        
      default:
        result = { success: false, error: 'Unknown action: ' + action };
    }
    
    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error in doPost:', error);
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function initializeSheets() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  
  // Initialize Caregivers sheet
  let caregiversSheet = spreadsheet.getSheetByName('Caregivers');
  if (!caregiversSheet) {
    caregiversSheet = spreadsheet.insertSheet('Caregivers');
    caregiversSheet.getRange('A1:E1').setValues([['Name', 'Chinese Name', 'Assigned Hours', 'Created Date', 'Last Modified']]);
    caregiversSheet.getRange('A1:E1').setFontWeight('bold');
  }
  
  // Initialize Sessions sheet
  let sessionsSheet = spreadsheet.getSheetByName('Sessions');
  if (!sessionsSheet) {
    sessionsSheet = spreadsheet.insertSheet('Sessions');
    sessionsSheet.getRange('A1:H1').setValues([['Timestamp', 'Caregiver Name', 'Date', 'Clock In', 'Clock Out', 'Duration Hours', 'Notes', 'Device ID']]);
    sessionsSheet.getRange('A1:H1').setFontWeight('bold');
  }
  
  // Initialize Settings sheet
  let settingsSheet = spreadsheet.getSheetByName('Settings');
  if (!settingsSheet) {
    settingsSheet = spreadsheet.insertSheet('Settings');
    settingsSheet.getRange('A1:C1').setValues([['Setting Name', 'Setting Value', 'Last Modified']]);
    settingsSheet.getRange('A1:C1').setFontWeight('bold');
  }
  
  // Delete or rename default Sheet1 if it exists
  try {
    const defaultSheet = spreadsheet.getSheetByName('Sheet1');
    if (defaultSheet) {
      // If Sheet1 has data, rename it to preserve the data
      if (defaultSheet.getLastRow() > 1) {
        console.log('Sheet1 has data, renaming to Old_Data_Sheet1');
        defaultSheet.setName('Old_Data_Sheet1_' + Date.now());
      } else {
        // If Sheet1 is empty, delete it
        console.log('Sheet1 is empty, deleting it');
        spreadsheet.deleteSheet(defaultSheet);
      }
    }
  } catch (e) {
    console.log('Sheet1 cleanup completed or not needed:', e.toString());
  }
  
  return { success: true, message: 'Sheets initialized successfully' };
}

function addOrUpdateCaregiver(spreadsheet, caregiverData) {
  const sheet = getOrCreateSheet(spreadsheet, 'Caregivers', ['Name', 'Chinese Name', 'Assigned Hours', 'Created Date', 'Last Modified']);
  
  try {
    const name = caregiverData.name || caregiverData[0];
    const chineseName = caregiverData.chineseName || caregiverData[1] || '';
    const assignedHours = caregiverData.hours || caregiverData[2] || 160;
    const now = new Date().toISOString();
    
    // Check if caregiver already exists
    const data = sheet.getDataRange().getValues();
    let existingRowIndex = -1;
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === name) {
        existingRowIndex = i + 1; // Sheet rows are 1-indexed
        break;
      }
    }
    
    if (existingRowIndex > 0) {
      // Update existing caregiver
      sheet.getRange(existingRowIndex, 2, 1, 4).setValues([[chineseName, assignedHours, data[existingRowIndex - 1][3], now]]);
    } else {
      // Add new caregiver
      sheet.appendRow([name, chineseName, assignedHours, now, now]);
    }
    
    return { success: true, message: 'Caregiver data saved successfully' };
    
  } catch (error) {
    console.error('Error saving caregiver:', error);
    return { success: false, error: error.toString() };
  }
}

function addSession(spreadsheet, sessionData) {
  const sheet = getOrCreateSheet(spreadsheet, 'Sessions', ['Timestamp', 'Caregiver Name', 'Date', 'Clock In', 'Clock Out', 'Duration Hours', 'Notes', 'Device ID']);
  
  try {
    // Handle both array and object formats
    let timestamp, caregiverName, date, clockIn, clockOut, duration, notes, deviceId;
    
    if (Array.isArray(sessionData)) {
      [timestamp, caregiverName, date, clockIn, clockOut, duration, notes] = sessionData;
      deviceId = sessionData[7] || 'unknown';
    } else {
      timestamp = sessionData.timestamp || new Date().toISOString();
      caregiverName = sessionData.caregiverName || sessionData.name;
      date = sessionData.date;
      clockIn = sessionData.clockIn;
      clockOut = sessionData.clockOut;
      duration = sessionData.duration || sessionData.sessionHours;
      notes = sessionData.notes || sessionData.action || '';
      deviceId = sessionData.deviceId || 'unknown';
    }
    
    // Reject event records and incomplete sessions, but allow COMPLETE_SESSION
    if (notes && (notes.includes('CLOCK_IN') || notes.includes('CLOCK_OUT') || 
        notes.includes('DELETE_SESSION') || notes.includes('UPDATE_SESSION'))) {
      console.log('Rejecting event record:', notes);
      return { success: false, error: 'Event records should not be stored as sessions' };
    }
    
    // Only save complete sessions (must have both clock in and clock out)
    if (!clockIn || !clockOut) {
      console.log('Rejecting incomplete session - missing clock in or out:', { clockIn, clockOut });
      return { success: false, error: 'Incomplete session - both clock in and clock out required' };
    }
    
    // Ensure caregiver name is provided
    if (!caregiverName) {
      console.log('Rejecting session without caregiver name');
      return { success: false, error: 'Caregiver name is required' };
    }
    
    sheet.appendRow([timestamp, caregiverName, date, clockIn, clockOut, duration, notes, deviceId]);
    
    return { success: true, message: 'Session data saved successfully' };
    
  } catch (error) {
    console.error('Error saving session:', error);
    return { success: false, error: error.toString() };
  }
}

function readAllData(spreadsheet) {
  try {
    const caregivers = readCaregivers(spreadsheet);
    const sessions = readSessions(spreadsheet);
    
    return {
      success: true,
      data: {
        caregivers: caregivers.success ? caregivers.data : [],
        sessions: sessions.success ? sessions.data : []
      }
    };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

function readCaregivers(spreadsheet) {
  try {
    const sheet = spreadsheet.getSheetByName('Caregivers');
    if (!sheet) {
      return { success: true, data: [] };
    }
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return { success: true, data: [] };
    }
    
    // Skip header row
    const caregivers = data.slice(1).map(row => ({
      name: row[0],
      chineseName: row[1] || '',
      assignedHours: row[2] || 160,
      createdDate: row[3],
      lastModified: row[4]
    }));
    
    return { success: true, data: caregivers };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

function readSessions(spreadsheet) {
  try {
    const sheet = spreadsheet.getSheetByName('Sessions');
    if (!sheet) {
      return { success: true, data: [] };
    }
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return { success: true, data: [] };
    }
    
    // Skip header row and filter out event records
    const sessions = data.slice(1)
      .filter(row => {
        const notes = row[6] || '';
        const clockIn = row[3];
        const clockOut = row[4];
        
        // Filter out event records and incomplete sessions
        return !notes.includes('DELETE_SESSION') && 
               !notes.includes('UPDATE_SESSION') && 
               !notes.includes('CLOCK_IN') && 
               !notes.includes('CLOCK_OUT') &&
               clockIn && clockOut; // Only include complete sessions
      })
      .map(row => ({
        timestamp: row[0],
        caregiverName: row[1],
        date: row[2],
        clockIn: row[3],
        clockOut: row[4],
        duration: row[5],
        notes: row[6] || '',
        deviceId: row[7] || 'unknown'
      }));
    
    return { success: true, data: sessions };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

function syncBatchData(spreadsheet, caregivers, sessions) {
  try {
    let results = { caregivers: 0, sessions: 0, errors: [] };
    
    // Sync caregivers
    if (caregivers && caregivers.length > 0) {
      for (const caregiver of caregivers) {
        const result = addOrUpdateCaregiver(spreadsheet, caregiver);
        if (result.success) {
          results.caregivers++;
        } else {
          results.errors.push('Caregiver: ' + result.error);
        }
      }
    }
    
    // Sync sessions
    if (sessions && sessions.length > 0) {
      for (const session of sessions) {
        const result = addSession(spreadsheet, session);
        if (result.success) {
          results.sessions++;
        } else {
          results.errors.push('Session: ' + result.error);
        }
      }
    }
    
    return {
      success: true,
      message: `Synced ${results.caregivers} caregivers and ${results.sessions} sessions`,
      details: results
    };
    
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

function getOrCreateSheet(spreadsheet, sheetName, headers) {
  let sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
    if (headers && headers.length > 0) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    }
  }
  return sheet;
}

// Manual cleanup function - call this to clean up old sheets
function cleanupOldSheets() {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const allSheets = spreadsheet.getSheets();
    
    console.log('Found sheets:', allSheets.map(s => s.getName()));
    
    // Find and handle old sheets
    for (const sheet of allSheets) {
      const sheetName = sheet.getName();
      
      // Handle Sheet1 or old data sheets
      if (sheetName === 'Sheet1' || sheetName.startsWith('Old_Data_Sheet1')) {
        const lastRow = sheet.getLastRow();
        console.log(`Sheet ${sheetName} has ${lastRow} rows`);
        
        if (lastRow <= 1) {
          // Empty sheet, safe to delete
          console.log(`Deleting empty sheet: ${sheetName}`);
          spreadsheet.deleteSheet(sheet);
        } else {
          // Has data, ask user or rename
          console.log(`Sheet ${sheetName} has data. Consider moving data to proper tabs.`);
        }
      }
    }
    
    // Ensure we have the correct 3 tabs
    initializeSheets();
    
    return {
      success: true,
      message: 'Cleanup completed. Check console for details.',
      remainingSheets: spreadsheet.getSheets().map(s => s.getName())
    };
    
  } catch (error) {
    console.error('Cleanup error:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

// Migrate old data from Sheet1 to new structure
function migrateOldData() {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const oldSheet = spreadsheet.getSheetByName('Sheet1');
    
    if (!oldSheet) {
      return { success: false, message: 'No Sheet1 found to migrate' };
    }
    
    const data = oldSheet.getDataRange().getValues();
    if (data.length <= 1) {
      // No data to migrate
      spreadsheet.deleteSheet(oldSheet);
      return { success: true, message: 'Sheet1 was empty and has been deleted' };
    }
    
    let migratedSessions = 0;
    let migratedCaregivers = new Set();
    
    // Process each row (skip header if exists)
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const [timestamp, caregiverName, date, clockIn, clockOut, sessionHours, totalHours, action] = row;
      
      if (caregiverName && caregiverName !== 'Caregiver Name') {
        // Add caregiver if not already added
        if (!migratedCaregivers.has(caregiverName)) {
          addOrUpdateCaregiver(spreadsheet, {
            name: caregiverName,
            chineseName: '',
            hours: totalHours || 160
          });
          migratedCaregivers.add(caregiverName);
        }
        
        // Add session if we have clock in/out data
        if (clockIn && clockOut) {
          addSession(spreadsheet, {
            timestamp: timestamp || new Date().toISOString(),
            caregiverName: caregiverName,
            date: date || new Date().toLocaleDateString(),
            clockIn: clockIn,
            clockOut: clockOut,
            duration: sessionHours || '',
            notes: action || 'Migrated from old data',
            deviceId: 'migrated'
          });
          migratedSessions++;
        }
      }
    }
    
    // Rename the old sheet instead of deleting to preserve original data
    oldSheet.setName('Migrated_Old_Data_' + Date.now());
    
    return {
      success: true,
      message: `Migration completed: ${migratedCaregivers.size} caregivers, ${migratedSessions} sessions`,
      details: {
        caregivers: migratedCaregivers.size,
        sessions: migratedSessions
      }
    };
    
  } catch (error) {
    console.error('Migration error:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

// Test function to verify the script is working
function testScript() {
  console.log('Test function called');
  
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    console.log('Spreadsheet found:', spreadsheet.getName());
    
    // Initialize sheets
    const initResult = initializeSheets();
    console.log('Sheets initialized:', initResult);
    
    // Test adding a caregiver
    const caregiverResult = addOrUpdateCaregiver(spreadsheet, {
      name: 'Test Caregiver',
      chineseName: '测试护工',
      hours: 160
    });
    console.log('Caregiver test result:', caregiverResult);
    
    // Test adding a session
    const sessionResult = addSession(spreadsheet, {
      timestamp: new Date().toISOString(),
      caregiverName: 'Test Caregiver',
      date: new Date().toLocaleDateString(),
      clockIn: '09:00:00',
      clockOut: '17:00:00',
      duration: 8,
      notes: 'Test session',
      deviceId: 'test_device'
    });
    console.log('Session test result:', sessionResult);
    
    // Test reading data
    const readResult = readAllData(spreadsheet);
    console.log('Read test result:', readResult);
    
    return {
      success: true,
      message: 'All tests passed!',
      results: {
        init: initResult,
        caregiver: caregiverResult,
        session: sessionResult,
        read: readResult
      }
    };
    
  } catch (error) {
    console.error('Test failed:', error);
    return {
      success: false,
      error: error.toString(),
      stack: error.stack
    };
  }
}

// Delete a session from Google Sheets
function deleteSession(spreadsheet, sessionData) {
  try {
    const sessionsSheet = getOrCreateSheet(spreadsheet, 'Sessions');
    const data = sessionsSheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      return { success: false, error: 'No sessions to delete' };
    }
    
    // Find the session to delete by matching timestamp, caregiver name, or session ID
    let rowToDelete = -1;
    const sessionId = sessionData.sessionId;
    const caregiverName = sessionData.caregiverName;
    const clockInTime = sessionData.clockIn;
    const clockOutTime = sessionData.clockOut;
    const date = sessionData.date;
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const rowTimestamp = row[0]; // Column A: Timestamp
      const rowCaregiverName = row[1]; // Column B: Caregiver Name
      const rowDate = row[2]; // Column C: Date
      const rowClockIn = row[3]; // Column D: Clock In
      const rowClockOut = row[4]; // Column E: Clock Out
      const rowNotes = row[6]; // Column G: Notes
      
      // Skip event records (DELETE_SESSION, UPDATE_SESSION, etc.)
      if (rowNotes && (rowNotes.includes('DELETE_SESSION') || rowNotes.includes('UPDATE_SESSION') || 
          rowNotes.includes('CLOCK_IN') || rowNotes.includes('CLOCK_OUT'))) {
        continue;
      }
      
      // Match by session ID first, then by caregiver name, date, and time
      if (sessionId && rowTimestamp && rowTimestamp.toString().includes(sessionId)) {
        rowToDelete = i + 1;
        break;
      } else if (caregiverName && rowCaregiverName === caregiverName && 
                 date && rowDate === date &&
                 clockInTime && rowClockIn === clockInTime &&
                 clockOutTime && rowClockOut === clockOutTime) {
        rowToDelete = i + 1;
        break;
      }
    }
    
    if (rowToDelete > 0) {
      sessionsSheet.deleteRow(rowToDelete);
      return { 
        success: true, 
        message: `Session deleted from row ${rowToDelete}`,
        deletedRow: rowToDelete 
      };
    } else {
      return { 
        success: false, 
        error: 'Session not found in Google Sheets',
        searchCriteria: { sessionId, caregiverName, date, clockInTime, clockOutTime }
      };
    }
    
  } catch (error) {
    console.error('Error deleting session:', error);
    return {
      success: false,
      error: error.toString(),
      stack: error.stack
    };
  }
}

// Update a session in Google Sheets (find and update existing session)
function updateSession(spreadsheet, sessionData) {
  try {
    const sessionsSheet = getOrCreateSheet(spreadsheet, 'Sessions');
    const data = sessionsSheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      // No existing sessions, just add the new one
      return addSession(spreadsheet, sessionData);
    }
    
    // Find the session to update by matching session ID or closest match
    let rowToUpdate = -1;
    const sessionId = sessionData.sessionId;
    const caregiverName = sessionData.caregiverName;
    const originalClockIn = sessionData.originalClockIn || sessionData.clockIn;
    const originalClockOut = sessionData.originalClockOut || sessionData.clockOut;
    const date = sessionData.date;
    
    console.log('Looking for session to update:', { sessionId, caregiverName, date, originalClockIn, originalClockOut });
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const rowTimestamp = row[0]; // Column A: Timestamp
      const rowCaregiverName = row[1]; // Column B: Caregiver Name
      const rowDate = row[2]; // Column C: Date
      const rowClockIn = row[3]; // Column D: Clock In
      const rowClockOut = row[4]; // Column E: Clock Out
      const rowNotes = row[6]; // Column G: Notes
      
      // Skip event records (DELETE_SESSION, UPDATE_SESSION, etc.)
      if (rowNotes && (rowNotes.includes('DELETE_SESSION') || rowNotes.includes('UPDATE_SESSION') || 
          rowNotes.includes('CLOCK_IN') || rowNotes.includes('CLOCK_OUT'))) {
        continue;
      }
      
      // Must have both clock in and clock out to be a valid session
      if (!rowClockIn || !rowClockOut) {
        continue;
      }
      
      // Match by session ID first, then by caregiver name, date, and original times
      if (sessionId && rowTimestamp && rowTimestamp.toString().includes(sessionId)) {
        rowToUpdate = i + 1;
        console.log('Found session by ID:', rowToUpdate);
        break;
      } else if (caregiverName && rowCaregiverName === caregiverName && 
                 date && rowDate === date &&
                 originalClockIn && rowClockIn === originalClockIn &&
                 originalClockOut && rowClockOut === originalClockOut) {
        rowToUpdate = i + 1;
        console.log('Found session by match:', rowToUpdate);
        break;
      }
    }
    
    if (rowToUpdate > 0) {
      // Update the existing row
      const timestamp = sessionData.sessionId || sessionData.timestamp || new Date().toISOString();
      const updatedRow = [
        timestamp,                           // Column A: Timestamp
        sessionData.caregiverName,          // Column B: Caregiver Name
        sessionData.date,                   // Column C: Date
        sessionData.clockIn,                // Column D: Clock In
        sessionData.clockOut,               // Column E: Clock Out
        sessionData.duration,               // Column F: Duration Hours
        sessionData.notes || 'Updated session', // Column G: Notes
        sessionData.deviceId || 'unknown'  // Column H: Device ID
      ];
      
      sessionsSheet.getRange(rowToUpdate, 1, 1, 8).setValues([updatedRow]);
      
      return {
        success: true,
        message: `Session updated successfully in row ${rowToUpdate}`,
        updatedRow: rowToUpdate,
        updatedData: updatedRow
      };
    } else {
      // Session not found, add as new session
      console.log('Session not found for update, adding as new session');
      return addSession(spreadsheet, {
        timestamp: sessionData.sessionId || sessionData.timestamp,
        caregiverName: sessionData.caregiverName,
        date: sessionData.date,
        clockIn: sessionData.clockIn,
        clockOut: sessionData.clockOut,
        duration: sessionData.duration,
        notes: sessionData.notes || 'New session',
        deviceId: sessionData.deviceId
      });
    }
    
  } catch (error) {
    console.error('Error updating session:', error);
    return {
      success: false,
      error: error.toString(),
      stack: error.stack
    };
  }
}

// Initialize the sheets when the script is first deployed
function onInstall() {
  initializeSheets();
}