/**
 * Google Sheets API Integration Module
 * Handles all Google Sheets operations including authentication, reading, and writing data
 */

class GoogleSheetsManager {
    constructor() {
        this.apiKey = null;
        this.spreadsheetId = null;
        this.isConnected = false;
        this.retryCount = 0;
        this.maxRetries = CONFIG.SYNC.MAX_RETRIES;
        this.syncQueue = [];
        this.lastSyncTime = null;
        
        // Load saved configuration
        this.loadConfiguration();
        
        // Auto-sync interval
        this.startAutoSync();
    }
    
    /**
     * Load Google Sheets configuration from local storage
     */
    loadConfiguration() {
        try {
            const config = localStorage.getItem(CONFIG.STORAGE_KEYS.GOOGLE_SHEETS_CONFIG);
            if (config) {
                const parsed = JSON.parse(config);
                this.apiKey = parsed.apiKey;
                this.spreadsheetId = parsed.spreadsheetId;
                this.isConnected = parsed.isConnected || false;
            }
        } catch (error) {
            console.error('Error loading Google Sheets configuration:', error);
        }
    }
    
    /**
     * Save Google Sheets configuration to local storage
     */
    saveConfiguration() {
        try {
            const config = {
                apiKey: this.apiKey,
                spreadsheetId: this.spreadsheetId,
                isConnected: this.isConnected,
                lastSyncTime: this.lastSyncTime
            };
            localStorage.setItem(CONFIG.STORAGE_KEYS.GOOGLE_SHEETS_CONFIG, JSON.stringify(config));
        } catch (error) {
            console.error('Error saving Google Sheets configuration:', error);
        }
    }
    
    /**
     * Test connection to Google Sheets
     */
    async testConnection(apiKey, spreadsheetId) {
        try {
            this.updateSyncStatus('syncing');
            
            const url = `${CONFIG.GOOGLE_SHEETS.API_URL}/${spreadsheetId}?key=${apiKey}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            // Test if we can read the sheet
            await this.readSheet(apiKey, spreadsheetId, CONFIG.GOOGLE_SHEETS.SHEET_NAME + '!A1:H1');
            
            this.apiKey = apiKey;
            this.spreadsheetId = spreadsheetId;
            this.isConnected = true;
            this.retryCount = 0;
            
            this.saveConfiguration();
            this.updateSyncStatus('synced');
            
            return {
                success: true,
                message: 'Connection successful! Google Sheets is ready for syncing.',
                data: data
            };
            
        } catch (error) {
            this.isConnected = false;
            this.updateSyncStatus('error');
            
            return {
                success: false,
                message: `Connection failed: ${error.message}`,
                error: error
            };
        }
    }
    
    /**
     * Initialize Google Sheets with proper headers if not exists
     */
    async initializeSheet() {
        if (!this.isConnected) {
            throw new Error('Not connected to Google Sheets');
        }
        
        try {
            // Check if sheet exists and has headers
            const range = `${CONFIG.GOOGLE_SHEETS.SHEET_NAME}!A1:H1`;
            const data = await this.readSheet(this.apiKey, this.spreadsheetId, range);
            
            if (!data || !data.values || data.values.length === 0) {
                // Create headers
                await this.writeToSheet(CONFIG.GOOGLE_SHEETS.COLUMNS, `${CONFIG.GOOGLE_SHEETS.SHEET_NAME}!A1:H1`);
            }
            
            return { success: true };
        } catch (error) {
            console.error('Error initializing sheet:', error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Read data from Google Sheets
     */
    async readSheet(apiKey = this.apiKey, spreadsheetId = this.spreadsheetId, range) {
        const url = `${CONFIG.GOOGLE_SHEETS.API_URL}/${spreadsheetId}/values/${range}?key=${apiKey}`;
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to read sheet: ${response.statusText}`);
        }
        
        return await response.json();
    }
    
    /**
     * Write data to Google Sheets
     */
    async writeToSheet(values, range = null) {
        if (!this.isConnected) {
            // Add to sync queue for later
            this.addToSyncQueue('write', { values, range });
            return { success: false, queued: true };
        }
        
        try {
            this.updateSyncStatus('syncing');
            
            // If no range specified, append to the sheet
            const targetRange = range || `${CONFIG.GOOGLE_SHEETS.SHEET_NAME}!A:H`;
            const url = `${CONFIG.GOOGLE_SHEETS.API_URL}/${this.spreadsheetId}/values/${targetRange}:append?key=${this.apiKey}&valueInputOption=USER_ENTERED`;
            
            const requestBody = {
                values: Array.isArray(values[0]) ? values : [values]
            };
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });
            
            if (!response.ok) {
                throw new Error(`Failed to write to sheet: ${response.statusText}`);
            }
            
            const result = await response.json();
            this.lastSyncTime = new Date().toISOString();
            this.updateSyncStatus('synced');
            this.retryCount = 0;
            
            return { success: true, result };
            
        } catch (error) {
            this.updateSyncStatus('error');
            this.addToSyncQueue('write', { values, range });
            throw error;
        }
    }
    
    /**
     * Log a time entry to Google Sheets
     */
    async logTimeEntry(caregiverName, date, clockIn, clockOut, totalHours, notes = '', status = 'completed') {
        const timestamp = new Date().toISOString();
        const row = [
            timestamp,
            caregiverName,
            date,
            clockIn,
            clockOut,
            totalHours,
            notes,
            status
        ];
        
        try {
            const result = await this.writeToSheet(row);
            
            // Show success notification
            if (result.success) {
                this.showNotification('Time entry synced to Google Sheets', 'success');
            } else if (result.queued) {
                this.showNotification('Time entry queued for sync', 'warning');
            }
            
            return result;
        } catch (error) {
            console.error('Error logging time entry:', error);
            this.showNotification('Failed to sync time entry', 'error');
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Log a clock in/out event
     */
    async logClockEvent(caregiverName, eventType, timestamp, notes = '') {
        const date = new Date(timestamp).toLocaleDateString();
        const time = new Date(timestamp).toLocaleTimeString();
        
        const row = [
            new Date().toISOString(),
            caregiverName,
            date,
            eventType === 'in' ? time : '',
            eventType === 'out' ? time : '',
            '',
            notes,
            eventType === 'in' ? 'clocked_in' : 'clocked_out'
        ];
        
        return await this.writeToSheet(row);
    }
    
    /**
     * Add operation to sync queue
     */
    addToSyncQueue(operation, data) {
        this.syncQueue.push({
            id: Date.now(),
            operation,
            data,
            timestamp: new Date().toISOString(),
            retries: 0
        });
        
        // Limit queue size
        if (this.syncQueue.length > 100) {
            this.syncQueue = this.syncQueue.slice(-50);
        }
        
        this.saveSyncQueue();
    }
    
    /**
     * Process sync queue
     */
    async processSyncQueue() {
        if (!this.isConnected || this.syncQueue.length === 0) {
            return;
        }
        
        const queue = [...this.syncQueue];
        this.syncQueue = [];
        
        for (const item of queue) {
            try {
                if (item.operation === 'write') {
                    await this.writeToSheet(item.data.values, item.data.range);
                }
                // Remove processed item
            } catch (error) {
                // Re-queue if retries available
                if (item.retries < this.maxRetries) {
                    item.retries++;
                    this.syncQueue.push(item);
                }
            }
        }
        
        this.saveSyncQueue();
    }
    
    /**
     * Save sync queue to local storage
     */
    saveSyncQueue() {
        try {
            localStorage.setItem('sync_queue', JSON.stringify(this.syncQueue));
        } catch (error) {
            console.error('Error saving sync queue:', error);
        }
    }
    
    /**
     * Load sync queue from local storage
     */
    loadSyncQueue() {
        try {
            const queue = localStorage.getItem('sync_queue');
            if (queue) {
                this.syncQueue = JSON.parse(queue);
            }
        } catch (error) {
            console.error('Error loading sync queue:', error);
            this.syncQueue = [];
        }
    }
    
    /**
     * Start automatic sync process
     */
    startAutoSync() {
        setInterval(() => {
            this.processSyncQueue();
        }, CONFIG.SYNC.INTERVAL);
        
        // Load existing queue
        this.loadSyncQueue();
    }
    
    /**
     * Update sync status indicator
     */
    updateSyncStatus(status) {
        const indicator = document.getElementById('syncIndicator');
        const text = document.getElementById('syncText');
        
        if (indicator && text) {
            indicator.className = `sync-indicator ${status}`;
            
            switch (status) {
                case 'synced':
                    text.textContent = 'Synced';
                    break;
                case 'syncing':
                    text.textContent = 'Syncing...';
                    break;
                case 'error':
                    text.textContent = 'Sync Error';
                    break;
                case 'offline':
                    text.textContent = 'Offline';
                    break;
                default:
                    text.textContent = 'Unknown';
            }
        }
    }
    
    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        if (window.NotificationManager) {
            window.NotificationManager.show(message, type);
        }
    }
    
    /**
     * Get connection status
     */
    getConnectionStatus() {
        return {
            isConnected: this.isConnected,
            hasApiKey: !!this.apiKey,
            hasSpreadsheetId: !!this.spreadsheetId,
            lastSyncTime: this.lastSyncTime,
            queueLength: this.syncQueue.length
        };
    }
    
    /**
     * Disconnect from Google Sheets
     */
    disconnect() {
        this.apiKey = null;
        this.spreadsheetId = null;
        this.isConnected = false;
        this.lastSyncTime = null;
        
        // Clear configuration
        localStorage.removeItem(CONFIG.STORAGE_KEYS.GOOGLE_SHEETS_CONFIG);
        this.updateSyncStatus('offline');
    }
    
    /**
     * Export data from Google Sheets
     */
    async exportData(dateFrom, dateTo) {
        if (!this.isConnected) {
            throw new Error('Not connected to Google Sheets');
        }
        
        try {
            const range = `${CONFIG.GOOGLE_SHEETS.SHEET_NAME}!A:H`;
            const data = await this.readSheet(this.apiKey, this.spreadsheetId, range);
            
            if (!data.values) {
                return { success: false, message: 'No data found' };
            }
            
            // Filter by date range if provided
            let filteredData = data.values;
            if (dateFrom && dateTo) {
                const fromDate = new Date(dateFrom);
                const toDate = new Date(dateTo);
                
                filteredData = data.values.filter((row, index) => {
                    if (index === 0) return true; // Keep headers
                    const rowDate = new Date(row[2]); // Date column
                    return rowDate >= fromDate && rowDate <= toDate;
                });
            }
            
            return {
                success: true,
                data: filteredData,
                headers: CONFIG.GOOGLE_SHEETS.COLUMNS
            };
            
        } catch (error) {
            console.error('Error exporting data:', error);
            return { success: false, error: error.message };
        }
    }
}

// Initialize Google Sheets manager
window.GoogleSheetsManager = GoogleSheetsManager;

// Create global instance
if (typeof window !== 'undefined') {
    window.googleSheetsManager = new GoogleSheetsManager();
}