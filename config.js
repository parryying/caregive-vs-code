// Configuration constants
const CONFIG = {
    // Default caregiver data
    DEFAULT_CAREGIVERS: [
        {
            id: 'maria',
            nameEn: 'Maria Chen',
            nameCn: '陈玛丽亚',
            monthlyHours: 160,
            currentStatus: 'out'
        }
    ],
    
    // Time tracking settings
    WORK_WEEK_HOURS: 40,
    MONTHLY_HOURS: 160,
    OVERTIME_THRESHOLD: 8,
    
    // Google Sheets configuration
    GOOGLE_SHEETS: {
        API_URL: 'https://sheets.googleapis.com/v4/spreadsheets',
        SCOPES: ['https://www.googleapis.com/auth/spreadsheets'],
        SHEET_NAME: 'CaregiverLogs',
        COLUMNS: [
            'Timestamp',
            'Caregiver Name',
            'Date',
            'Clock In Time',
            'Clock Out Time',
            'Total Hours',
            'Notes',
            'Status'
        ]
    },
    
    // Local storage keys
    STORAGE_KEYS: {
        CAREGIVERS: 'caregiver_data',
        TIME_LOGS: 'time_logs',
        CURRENT_SESSION: 'current_session',
        GOOGLE_SHEETS_CONFIG: 'google_sheets_config',
        APP_SETTINGS: 'app_settings'
    },
    
    // Notification settings
    NOTIFICATIONS: {
        DURATION: 5000,
        MAX_COUNT: 5
    },
    
    // Sync settings
    SYNC: {
        INTERVAL: 30000, // 30 seconds
        RETRY_DELAY: 5000, // 5 seconds
        MAX_RETRIES: 3
    },
    
    // Date and time formats
    FORMATS: {
        DATE: 'YYYY-MM-DD',
        TIME: 'HH:mm',
        DATETIME: 'YYYY-MM-DD HH:mm:ss',
        DISPLAY_DATE: 'dddd, MMMM D, YYYY',
        DISPLAY_TIME: 'h:mm A'
    },
    
    // Languages
    LANGUAGES: {
        EN: 'en',
        CN: 'cn'
    },
    
    // Theme colors
    THEMES: {
        DEFAULT: 'default',
        DARK: 'dark',
        HIGH_CONTRAST: 'high-contrast'
    },
    
    // PWA settings
    PWA: {
        NAME: 'Caregiver Time Tracker',
        SHORT_NAME: 'CareTracker',
        DESCRIPTION: 'Family Dashboard for tracking caregiver work hours',
        THEME_COLOR: '#7c3aed',
        BACKGROUND_COLOR: '#7c3aed',
        DISPLAY: 'standalone',
        START_URL: '/',
        SCOPE: '/'
    },
    
    // Version info
    VERSION: '1.0.0',
    BUILD_DATE: new Date().toISOString()
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}

// Make available globally
window.CONFIG = CONFIG;