/**
 * Local Storage Management Module
 * Handles all local data storage and retrieval operations
 */

class StorageManager {
    constructor() {
        this.isAvailable = this.checkStorageAvailability();
        this.initializeStorage();
    }
    
    /**
     * Check if localStorage is available
     */
    checkStorageAvailability() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            console.warn('localStorage is not available:', e);
            return false;
        }
    }
    
    /**
     * Initialize storage with default data
     */
    initializeStorage() {
        if (!this.isAvailable) return;
        
        // Initialize caregivers if not exists
        if (!this.get(CONFIG.STORAGE_KEYS.CAREGIVERS)) {
            this.set(CONFIG.STORAGE_KEYS.CAREGIVERS, CONFIG.DEFAULT_CAREGIVERS);
        }
        
        // Initialize time logs if not exists
        if (!this.get(CONFIG.STORAGE_KEYS.TIME_LOGS)) {
            this.set(CONFIG.STORAGE_KEYS.TIME_LOGS, []);
        }
        
        // Initialize app settings if not exists
        if (!this.get(CONFIG.STORAGE_KEYS.APP_SETTINGS)) {
            this.set(CONFIG.STORAGE_KEYS.APP_SETTINGS, {
                currentLanguage: CONFIG.LANGUAGES.EN,
                theme: CONFIG.THEMES.DEFAULT,
                notifications: true,
                autoSync: true
            });
        }
    }
    
    /**
     * Get data from localStorage
     */
    get(key, defaultValue = null) {
        if (!this.isAvailable) return defaultValue;
        
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error(`Error getting item ${key}:`, error);
            return defaultValue;
        }
    }
    
    /**
     * Set data to localStorage
     */
    set(key, value) {
        if (!this.isAvailable) return false;
        
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error(`Error setting item ${key}:`, error);
            return false;
        }
    }
    
    /**
     * Remove data from localStorage
     */
    remove(key) {
        if (!this.isAvailable) return false;
        
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error(`Error removing item ${key}:`, error);
            return false;
        }
    }
    
    /**
     * Clear all storage data
     */
    clear() {
        if (!this.isAvailable) return false;
        
        try {
            localStorage.clear();
            this.initializeStorage();
            return true;
        } catch (error) {
            console.error('Error clearing storage:', error);
            return false;
        }
    }
    
    // Caregiver Management
    
    /**
     * Get all caregivers
     */
    getCaregivers() {
        return this.get(CONFIG.STORAGE_KEYS.CAREGIVERS, []);
    }
    
    /**
     * Add a new caregiver
     */
    addCaregiver(caregiver) {
        const caregivers = this.getCaregivers();
        const newCaregiver = {
            id: caregiver.id || this.generateId(),
            nameEn: caregiver.nameEn,
            nameCn: caregiver.nameCn || '',
            monthlyHours: caregiver.monthlyHours || CONFIG.MONTHLY_HOURS,
            currentStatus: 'out',
            createdAt: new Date().toISOString(),
            ...caregiver
        };
        
        caregivers.push(newCaregiver);
        return this.set(CONFIG.STORAGE_KEYS.CAREGIVERS, caregivers);
    }
    
    /**
     * Update a caregiver
     */
    updateCaregiver(id, updates) {
        const caregivers = this.getCaregivers();
        const index = caregivers.findIndex(c => c.id === id);
        
        if (index !== -1) {
            caregivers[index] = { ...caregivers[index], ...updates };
            return this.set(CONFIG.STORAGE_KEYS.CAREGIVERS, caregivers);
        }
        
        return false;
    }
    
    /**
     * Delete a caregiver
     */
    deleteCaregiver(id) {
        const caregivers = this.getCaregivers();
        const filtered = caregivers.filter(c => c.id !== id);
        return this.set(CONFIG.STORAGE_KEYS.CAREGIVERS, filtered);
    }
    
    /**
     * Get a specific caregiver by ID
     */
    getCaregiver(id) {
        const caregivers = this.getCaregivers();
        return caregivers.find(c => c.id === id);
    }
    
    // Time Log Management
    
    /**
     * Get all time logs
     */
    getTimeLogs() {
        return this.get(CONFIG.STORAGE_KEYS.TIME_LOGS, []);
    }
    
    /**
     * Add a time log entry
     */
    addTimeLog(logEntry) {
        const logs = this.getTimeLogs();
        const newLog = {
            id: this.generateId(),
            timestamp: new Date().toISOString(),
            ...logEntry
        };
        
        logs.push(newLog);
        this.set(CONFIG.STORAGE_KEYS.TIME_LOGS, logs);
        
        // Sync to Google Sheets if available
        if (window.googleSheetsManager && window.googleSheetsManager.isConnected) {
            window.googleSheetsManager.logTimeEntry(
                newLog.caregiverName,
                newLog.date,
                newLog.clockIn,
                newLog.clockOut,
                newLog.totalHours,
                newLog.notes,
                newLog.status
            );
        }
        
        return newLog;
    }
    
    /**
     * Update a time log entry
     */
    updateTimeLog(id, updates) {
        const logs = this.getTimeLogs();
        const index = logs.findIndex(l => l.id === id);
        
        if (index !== -1) {
            logs[index] = { ...logs[index], ...updates };
            this.set(CONFIG.STORAGE_KEYS.TIME_LOGS, logs);
            return logs[index];
        }
        
        return null;
    }
    
    /**
     * Delete a time log entry
     */
    deleteTimeLog(id) {
        const logs = this.getTimeLogs();
        const filtered = logs.filter(l => l.id !== id);
        return this.set(CONFIG.STORAGE_KEYS.TIME_LOGS, filtered);
    }
    
    /**
     * Get time logs for a specific caregiver
     */
    getCaregiverTimeLogs(caregiverId, dateFrom = null, dateTo = null) {
        const logs = this.getTimeLogs();
        let filtered = logs.filter(log => log.caregiverId === caregiverId);
        
        if (dateFrom && dateTo) {
            const from = new Date(dateFrom);
            const to = new Date(dateTo);
            filtered = filtered.filter(log => {
                const logDate = new Date(log.date);
                return logDate >= from && logDate <= to;
            });
        }
        
        return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    }
    
    /**
     * Calculate total hours for a caregiver in a period
     */
    calculateTotalHours(caregiverId, dateFrom, dateTo) {
        const logs = this.getCaregiverTimeLogs(caregiverId, dateFrom, dateTo);
        return logs.reduce((total, log) => {
            return total + (parseFloat(log.totalHours) || 0);
        }, 0);
    }
    
    /**
     * Get current month hours for a caregiver
     */
    getCurrentMonthHours(caregiverId) {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        
        return this.calculateTotalHours(
            caregiverId,
            monthStart.toISOString().split('T')[0],
            monthEnd.toISOString().split('T')[0]
        );
    }
    
    // Current Session Management
    
    /**
     * Get current session data
     */
    getCurrentSession() {
        return this.get(CONFIG.STORAGE_KEYS.CURRENT_SESSION);
    }
    
    /**
     * Start a new session
     */
    startSession(caregiverId, timestamp = new Date()) {
        const session = {
            caregiverId,
            startTime: timestamp.toISOString(),
            isActive: true
        };
        
        this.set(CONFIG.STORAGE_KEYS.CURRENT_SESSION, session);
        this.updateCaregiver(caregiverId, { currentStatus: 'in' });
        
        return session;
    }
    
    /**
     * End current session
     */
    endSession(timestamp = new Date(), notes = '') {
        const session = this.getCurrentSession();
        if (!session || !session.isActive) {
            return null;
        }
        
        const endTime = timestamp.toISOString();
        const startTime = new Date(session.startTime);
        const totalHours = ((new Date(endTime) - startTime) / (1000 * 60 * 60)).toFixed(2);
        
        // Create time log entry
        const caregiver = this.getCaregiver(session.caregiverId);
        const timeLog = this.addTimeLog({
            caregiverId: session.caregiverId,
            caregiverName: caregiver ? `${caregiver.nameEn} | ${caregiver.nameCn}` : 'Unknown',
            date: startTime.toISOString().split('T')[0],
            clockIn: startTime.toTimeString().slice(0, 5),
            clockOut: new Date(endTime).toTimeString().slice(0, 5),
            totalHours: parseFloat(totalHours),
            notes,
            status: 'completed'
        });
        
        // Update session
        const updatedSession = {
            ...session,
            endTime,
            totalHours: parseFloat(totalHours),
            isActive: false
        };
        
        this.set(CONFIG.STORAGE_KEYS.CURRENT_SESSION, updatedSession);
        this.updateCaregiver(session.caregiverId, { currentStatus: 'out' });
        
        return { session: updatedSession, timeLog };
    }
    
    /**
     * Clear current session
     */
    clearSession() {
        this.remove(CONFIG.STORAGE_KEYS.CURRENT_SESSION);
    }
    
    // Utility functions
    
    /**
     * Generate unique ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    /**
     * Export all data
     */
    exportAllData() {
        return {
            caregivers: this.getCaregivers(),
            timeLogs: this.getTimeLogs(),
            currentSession: this.getCurrentSession(),
            settings: this.get(CONFIG.STORAGE_KEYS.APP_SETTINGS),
            exportedAt: new Date().toISOString()
        };
    }
    
    /**
     * Import data
     */
    importData(data) {
        try {
            if (data.caregivers) {
                this.set(CONFIG.STORAGE_KEYS.CAREGIVERS, data.caregivers);
            }
            if (data.timeLogs) {
                this.set(CONFIG.STORAGE_KEYS.TIME_LOGS, data.timeLogs);
            }
            if (data.settings) {
                this.set(CONFIG.STORAGE_KEYS.APP_SETTINGS, data.settings);
            }
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }
    
    /**
     * Get storage usage statistics
     */
    getStorageStats() {
        if (!this.isAvailable) return null;
        
        try {
            let totalSize = 0;
            const items = {};
            
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    const size = localStorage[key].length;
                    items[key] = size;
                    totalSize += size;
                }
            }
            
            return {
                totalSize,
                items,
                available: this.isAvailable
            };
        } catch (error) {
            console.error('Error getting storage stats:', error);
            return null;
        }
    }
}

// Initialize storage manager
window.StorageManager = StorageManager;

// Create global instance
if (typeof window !== 'undefined') {
    window.storageManager = new StorageManager();
}