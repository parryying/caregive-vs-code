/**
 * Caregiver Time Tracker - Main Application
 * Handles all UI interactions and application logic
 */

class CaregiverApp {
    constructor() {
        this.currentCaregiver = null;
        this.currentSession = null;
        this.timerInterval = null;
        this.isLoaded = false;
        
        // Initialize app when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }
    
    /**
     * Initialize the application
     */
    async init() {
        try {
            console.log('Starting Caregiver App initialization...');
            
            // Show loading screen
            this.showLoadingScreen(true);
            
            // Initialize components step by step with error handling
            console.log('Initializing elements...');
            this.initializeElements();
            
            console.log('Setting up event listeners...');
            this.initializeEventListeners();
            
            console.log('Setting up notification manager...');
            this.initializeNotificationManager();
            
            // Load initial data
            console.log('Loading initial data...');
            await this.loadInitialData();
            
            // Setup auto-updates
            console.log('Starting clock updates...');
            this.startClockUpdate();
            
            console.log('App initialization completed successfully');
            
            // Hide loading screen and show app
            this.showLoadingScreen(false);
            this.isLoaded = true;
            
        } catch (error) {
            console.error('Error initializing app:', error);
            // Force hide loading screen on error
            if (this.elements.loadingScreen) {
                this.elements.loadingScreen.style.display = 'none';
            }
            if (this.elements.app) {
                this.elements.app.classList.add('loaded');
            }
            this.showNotification('App initialized with errors. Check console for details.', 'warning');
        }
    }
    
    /**
     * Initialize DOM elements
     */
    initializeElements() {
        // Main elements
        this.elements = {
            app: document.getElementById('app'),
            loadingScreen: document.getElementById('loadingScreen'),
            currentTime: document.getElementById('currentTime'),
            
            // Caregiver selector
            caregiverSelect: document.getElementById('caregiverSelect'),
            addCaregiverBtn: document.getElementById('addCaregiverBtn'),
            
            // Caregiver card
            caregiverName: document.getElementById('caregiverName'),
            statusBadge: document.getElementById('statusBadge'),
            statusText: document.getElementById('statusText'),
            
            // Clock controls
            clockInBtn: document.getElementById('clockInBtn'),
            clockOutBtn: document.getElementById('clockOutBtn'),
            editTimeBtn: document.getElementById('editTimeBtn'),
            
            // Time display
            hoursWorked: document.getElementById('hoursWorked'),
            hoursRemaining: document.getElementById('hoursRemaining'),
            liveTimer: document.getElementById('liveTimer'),
            currentSessionTime: document.getElementById('currentSessionTime'),
            
            // Admin buttons
            manageCaregivers: document.getElementById('manageCaregivers'),
            generateReport: document.getElementById('generateReport'),
            setupGoogleSheets: document.getElementById('setupGoogleSheets'),
            viewLogsBtn: document.getElementById('viewLogsBtn'),
            
            // Modals
            caregiverModal: document.getElementById('caregiverModal'),
            timeEditModal: document.getElementById('timeEditModal'),
            timeLogsModal: document.getElementById('timeLogsModal'),
            googleSheetsModal: document.getElementById('googleSheetsModal'),
            
            // Notification container
            notifications: document.getElementById('notifications')
        };
    }
    
    /**
     * Initialize event listeners
     */
    initializeEventListeners() {
        // Caregiver selection
        this.elements.caregiverSelect.addEventListener('change', (e) => {
            this.selectCaregiver(e.target.value);
        });
        
        this.elements.addCaregiverBtn.addEventListener('click', () => {
            this.showCaregiverModal();
        });
        
        // Clock controls
        this.elements.clockInBtn.addEventListener('click', () => {
            this.clockIn();
        });
        
        this.elements.clockOutBtn.addEventListener('click', () => {
            this.clockOut();
        });
        
        this.elements.editTimeBtn.addEventListener('click', () => {
            this.showTimeEditModal();
        });
        
        // Admin controls
        this.elements.manageCaregivers.addEventListener('click', () => {
            this.showCaregiverModal();
        });
        
        this.elements.generateReport.addEventListener('click', () => {
            this.generateReport();
        });
        
        this.elements.setupGoogleSheets.addEventListener('click', () => {
            this.showGoogleSheetsModal();
        });
        
        this.elements.viewLogsBtn.addEventListener('click', () => {
            this.showTimeLogsModal();
        });
        
        // Modal close buttons
        document.querySelectorAll('.close-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) {
                    this.hideModal(modal);
                }
            });
        });
        
        // Modal background click to close
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideModal(modal);
                }
            });
        });
        
        // Form submissions
        this.initializeFormListeners();
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });
        
        // Online/offline status
        window.addEventListener('online', () => {
            window.googleSheetsManager.updateSyncStatus('synced');
            this.showNotification('Connection restored', 'success');
        });
        
        window.addEventListener('offline', () => {
            window.googleSheetsManager.updateSyncStatus('offline');
            this.showNotification('Working offline', 'warning');
        });
    }
    
    /**
     * Initialize form listeners
     */
    initializeFormListeners() {
        // Caregiver form
        const caregiverForm = document.getElementById('caregiverForm');
        if (caregiverForm) {
            caregiverForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addCaregiver();
            });
        }
        
        // Time edit form
        const timeEditForm = document.getElementById('timeEditForm');
        if (timeEditForm) {
            timeEditForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveTimeEdit();
            });
        }
        
        // Google Sheets form
        const googleSheetsForm = document.getElementById('googleSheetsForm');
        if (googleSheetsForm) {
            googleSheetsForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.testGoogleSheetsConnection();
            });
        }
        
        // Log filter form
        const filterBtn = document.getElementById('filterLogs');
        if (filterBtn) {
            filterBtn.addEventListener('click', () => {
                this.filterTimeLogs();
            });
        }
        
        // Export logs
        const exportBtn = document.getElementById('exportLogs');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportTimeLogs();
            });
        }
    }
    
    /**
     * Initialize notification manager
     */
    initializeNotificationManager() {
        window.NotificationManager = {
            show: (message, type = 'info', duration = CONFIG.NOTIFICATIONS.DURATION) => {
                this.showNotification(message, type, duration);
            }
        };
    }
    
    /**
     * Load initial data
     */
    async loadInitialData() {
        // Load caregivers
        const caregivers = window.storageManager.getCaregivers();
        this.populateCaregiverSelect(caregivers);
        
        // Select first caregiver or default
        if (caregivers.length > 0) {
            this.selectCaregiver(caregivers[0].id);
        }
        
        // Load current session if exists
        this.loadCurrentSession();
        
        // Update initial time display
        this.updateTimeDisplay();
    }
    
    /**
     * Populate caregiver selector
     */
    populateCaregiverSelect(caregivers) {
        const select = this.elements.caregiverSelect;
        select.innerHTML = '';
        
        caregivers.forEach(caregiver => {
            const option = document.createElement('option');
            option.value = caregiver.id;
            option.textContent = `${caregiver.nameEn} | ${caregiver.nameCn}`;
            select.appendChild(option);
        });
    }
    
    /**
     * Select a caregiver
     */
    selectCaregiver(caregiverId) {
        const caregiver = window.storageManager.getCaregiver(caregiverId);
        if (!caregiver) return;
        
        this.currentCaregiver = caregiver;
        
        // Update UI
        this.elements.caregiverName.textContent = `${caregiver.nameEn} | ${caregiver.nameCn}`;
        this.elements.caregiverSelect.value = caregiverId;
        
        // Update status
        this.updateCaregiverStatus(caregiver.currentStatus);
        
        // Update time display
        this.updateTimeDisplay();
        
        // Check for active session
        this.checkActiveSession();
    }
    
    /**
     * Update caregiver status display
     */
    updateCaregiverStatus(status) {
        const badge = this.elements.statusBadge;
        const text = this.elements.statusText;
        const clockInBtn = this.elements.clockInBtn;
        const clockOutBtn = this.elements.clockOutBtn;
        
        if (status === 'in') {
            badge.className = 'status-badge clocked-in';
            text.textContent = 'Clocked In | 已上班';
            clockInBtn.disabled = true;
            clockOutBtn.disabled = false;
        } else {
            badge.className = 'status-badge';
            text.textContent = 'Clocked Out | 已下班';
            clockInBtn.disabled = false;
            clockOutBtn.disabled = true;
        }
    }
    
    /**
     * Clock in functionality
     */
    async clockIn() {
        if (!this.currentCaregiver) return;
        
        try {
            const timestamp = new Date();
            const session = window.storageManager.startSession(this.currentCaregiver.id, timestamp);
            
            // Update UI
            this.updateCaregiverStatus('in');
            this.currentSession = session;
            this.startLiveTimer();
            
            // Log to Google Sheets
            if (window.googleSheetsManager.isConnected) {
                await window.googleSheetsManager.logClockEvent(
                    `${this.currentCaregiver.nameEn} | ${this.currentCaregiver.nameCn}`,
                    'in',
                    timestamp.toISOString()
                );
            }
            
            this.showNotification(`${this.currentCaregiver.nameEn} clocked in successfully`, 'success');
            
        } catch (error) {
            console.error('Error clocking in:', error);
            this.showNotification('Failed to clock in', 'error');
        }
    }
    
    /**
     * Clock out functionality
     */
    async clockOut() {
        if (!this.currentCaregiver || !this.currentSession) return;
        
        try {
            const timestamp = new Date();
            const result = window.storageManager.endSession(timestamp);
            
            if (result) {
                // Update UI
                this.updateCaregiverStatus('out');
                this.stopLiveTimer();
                this.currentSession = null;
                
                // Update time display
                this.updateTimeDisplay();
                
                // Log to Google Sheets
                if (window.googleSheetsManager.isConnected) {
                    await window.googleSheetsManager.logClockEvent(
                        `${this.currentCaregiver.nameEn} | ${this.currentCaregiver.nameCn}`,
                        'out',
                        timestamp.toISOString()
                    );
                }
                
                this.showNotification(
                    `${this.currentCaregiver.nameEn} clocked out. Hours worked: ${result.timeLog.totalHours}`,
                    'success'
                );
            }
            
        } catch (error) {
            console.error('Error clocking out:', error);
            this.showNotification('Failed to clock out', 'error');
        }
    }
    
    /**
     * Start live timer
     */
    startLiveTimer() {
        this.elements.liveTimer.style.display = 'block';
        
        this.timerInterval = setInterval(() => {
            const session = window.storageManager.getCurrentSession();
            if (session && session.isActive) {
                const startTime = new Date(session.startTime);
                const now = new Date();
                const elapsed = now - startTime;
                
                const hours = Math.floor(elapsed / (1000 * 60 * 60));
                const minutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((elapsed % (1000 * 60)) / 1000);
                
                this.elements.currentSessionTime.textContent = 
                    `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
        }, 1000);
    }
    
    /**
     * Stop live timer
     */
    stopLiveTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        this.elements.liveTimer.style.display = 'none';
    }
    
    /**
     * Load current session if exists
     */
    loadCurrentSession() {
        const session = window.storageManager.getCurrentSession();
        if (session && session.isActive) {
            this.currentSession = session;
            if (this.currentCaregiver && this.currentCaregiver.id === session.caregiverId) {
                this.updateCaregiverStatus('in');
                this.startLiveTimer();
            }
        }
    }
    
    /**
     * Check for active session
     */
    checkActiveSession() {
        const session = window.storageManager.getCurrentSession();
        if (session && session.isActive && this.currentCaregiver.id === session.caregiverId) {
            this.currentSession = session;
            this.updateCaregiverStatus('in');
            this.startLiveTimer();
        }
    }
    
    /**
     * Update time display
     */
    updateTimeDisplay() {
        if (!this.currentCaregiver) return;
        
        const currentMonthHours = window.storageManager.getCurrentMonthHours(this.currentCaregiver.id);
        const remainingHours = Math.max(0, this.currentCaregiver.monthlyHours - currentMonthHours);
        
        this.elements.hoursWorked.textContent = currentMonthHours.toFixed(1);
        this.elements.hoursRemaining.textContent = remainingHours.toFixed(1);
    }
    
    /**
     * Start clock update
     */
    startClockUpdate() {
        this.updateCurrentTime();
        setInterval(() => {
            this.updateCurrentTime();
        }, 1000);
    }
    
    /**
     * Update current time display
     */
    updateCurrentTime() {
        const now = new Date();
        const options = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        this.elements.currentTime.textContent = now.toLocaleDateString('en-US', options);
    }
    
    /**
     * Show/hide loading screen
     */
    showLoadingScreen(show) {
        try {
            if (show) {
                this.elements.loadingScreen.style.display = 'flex';
                this.elements.app.classList.remove('loaded');
            } else {
                setTimeout(() => {
                    this.elements.loadingScreen.style.display = 'none';
                    this.elements.app.classList.add('loaded');
                }, 300); // Reduced delay
            }
        } catch (error) {
            console.error('Error managing loading screen:', error);
            // Force show app if there's an error
            if (this.elements.loadingScreen) this.elements.loadingScreen.style.display = 'none';
            if (this.elements.app) this.elements.app.classList.add('loaded');
        }
    }
    
    /**
     * Show notification
     */
    showNotification(message, type = 'info', duration = CONFIG.NOTIFICATIONS.DURATION) {
        try {
            const notification = document.createElement('div');
            notification.className = `notification ${type}`;
            notification.textContent = message;
            
            if (this.elements.notifications) {
                this.elements.notifications.appendChild(notification);
                
                // Auto-remove notification
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, duration);
                
                // Limit number of notifications
                const notifications = this.elements.notifications.children;
                if (notifications.length > CONFIG.NOTIFICATIONS.MAX_COUNT) {
                    notifications[0].remove();
                }
            } else {
                // Fallback to console if notifications container not found
                console.log(`Notification (${type}): ${message}`);
            }
        } catch (error) {
            console.error('Error showing notification:', error);
            console.log(`Notification (${type}): ${message}`);
        }
    }
    
    /**
     * Modal management
     */
    showModal(modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
    
    hideModal(modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
    
    /**
     * Show caregiver management modal
     */
    showCaregiverModal() {
        this.showModal(this.elements.caregiverModal);
        this.loadCaregiverList();
    }
    
    /**
     * Load caregiver list in modal
     */
    loadCaregiverList() {
        const container = document.getElementById('caregiverList');
        const caregivers = window.storageManager.getCaregivers();
        
        container.innerHTML = '';
        
        caregivers.forEach(caregiver => {
            const item = document.createElement('div');
            item.className = 'caregiver-item';
            item.innerHTML = `
                <div class="caregiver-details">
                    <h4>${caregiver.nameEn} | ${caregiver.nameCn}</h4>
                    <p>Monthly Hours: ${caregiver.monthlyHours} | Status: ${caregiver.currentStatus}</p>
                </div>
                <div class="caregiver-actions">
                    <button class="log-action-btn" onclick="app.editCaregiver('${caregiver.id}')">Edit</button>
                    <button class="log-action-btn" onclick="app.deleteCaregiver('${caregiver.id}')">Delete</button>
                </div>
            `;
            container.appendChild(item);
        });
    }
    
    /**
     * Add new caregiver
     */
    addCaregiver() {
        const nameEn = document.getElementById('caregiverNameInput').value.trim();
        const nameCn = document.getElementById('caregiverNameCn').value.trim();
        const monthlyHours = parseInt(document.getElementById('monthlyHours').value) || CONFIG.MONTHLY_HOURS;
        
        if (!nameEn) {
            this.showNotification('Please enter caregiver name', 'error');
            return;
        }
        
        const caregiver = {
            nameEn,
            nameCn: nameCn || nameEn,
            monthlyHours
        };
        
        const success = window.storageManager.addCaregiver(caregiver);
        
        if (success) {
            this.showNotification('Caregiver added successfully', 'success');
            
            // Refresh UI
            const caregivers = window.storageManager.getCaregivers();
            this.populateCaregiverSelect(caregivers);
            this.loadCaregiverList();
            
            // Clear form
            document.getElementById('caregiverForm').reset();
        } else {
            this.showNotification('Failed to add caregiver', 'error');
        }
    }
    
    /**
     * Delete caregiver
     */
    deleteCaregiver(caregiverId) {
        if (confirm('Are you sure you want to delete this caregiver?')) {
            const success = window.storageManager.deleteCaregiver(caregiverId);
            
            if (success) {
                this.showNotification('Caregiver deleted successfully', 'success');
                
                // Refresh UI
                const caregivers = window.storageManager.getCaregivers();
                this.populateCaregiverSelect(caregivers);
                this.loadCaregiverList();
                
                // Select first available caregiver
                if (caregivers.length > 0 && this.currentCaregiver.id === caregiverId) {
                    this.selectCaregiver(caregivers[0].id);
                }
            } else {
                this.showNotification('Failed to delete caregiver', 'error');
            }
        }
    }
    
    /**
     * Show time edit modal
     */
    showTimeEditModal() {
        this.showModal(this.elements.timeEditModal);
        
        // Pre-fill with current date
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('editDate').value = today;
    }
    
    /**
     * Save time edit
     */
    saveTimeEdit() {
        const date = document.getElementById('editDate').value;
        const clockIn = document.getElementById('editClockIn').value;
        const clockOut = document.getElementById('editClockOut').value;
        const notes = document.getElementById('editNotes').value;
        
        if (!date || !clockIn || !clockOut) {
            this.showNotification('Please fill in all required fields', 'error');
            return;
        }
        
        // Calculate total hours
        const startTime = new Date(`${date}T${clockIn}`);
        const endTime = new Date(`${date}T${clockOut}`);
        const totalHours = ((endTime - startTime) / (1000 * 60 * 60)).toFixed(2);
        
        if (totalHours <= 0) {
            this.showNotification('Clock out time must be after clock in time', 'error');
            return;
        }
        
        // Add time log
        const timeLog = window.storageManager.addTimeLog({
            caregiverId: this.currentCaregiver.id,
            caregiverName: `${this.currentCaregiver.nameEn} | ${this.currentCaregiver.nameCn}`,
            date,
            clockIn,
            clockOut,
            totalHours: parseFloat(totalHours),
            notes,
            status: 'manual_entry'
        });
        
        this.showNotification('Time entry saved successfully', 'success');
        this.updateTimeDisplay();
        this.hideModal(this.elements.timeEditModal);
        
        // Clear form
        document.getElementById('timeEditForm').reset();
    }
    
    /**
     * Show time logs modal
     */
    showTimeLogsModal() {
        this.showModal(this.elements.timeLogsModal);
        this.loadTimeLogs();
    }
    
    /**
     * Load time logs
     */
    loadTimeLogs() {
        const container = document.getElementById('logsContainer');
        const logs = window.storageManager.getCaregiverTimeLogs(this.currentCaregiver.id);
        
        container.innerHTML = '';
        
        if (logs.length === 0) {
            container.innerHTML = '<p style="text-align: center; padding: 2rem; color: #64748b;">No time logs found</p>';
            return;
        }
        
        logs.forEach(log => {
            const entry = document.createElement('div');
            entry.className = 'log-entry';
            entry.innerHTML = `
                <div class="log-date">${new Date(log.date).toLocaleDateString()}</div>
                <div class="log-times">${log.clockIn} - ${log.clockOut}</div>
                <div class="log-duration">${log.totalHours}h</div>
                <div class="log-actions">
                    <button class="log-action-btn" onclick="app.editTimeLog('${log.id}')">Edit</button>
                    <button class="log-action-btn" onclick="app.deleteTimeLog('${log.id}')">Delete</button>
                </div>
            `;
            container.appendChild(entry);
        });
    }
    
    /**
     * Delete time log
     */
    deleteTimeLog(logId) {
        if (confirm('Are you sure you want to delete this time log?')) {
            const success = window.storageManager.deleteTimeLog(logId);
            
            if (success) {
                this.showNotification('Time log deleted successfully', 'success');
                this.loadTimeLogs();
                this.updateTimeDisplay();
            } else {
                this.showNotification('Failed to delete time log', 'error');
            }
        }
    }
    
    /**
     * Show Google Sheets setup modal
     */
    showGoogleSheetsModal() {
        this.showModal(this.elements.googleSheetsModal);
        
        // Load existing configuration
        const config = window.googleSheetsManager.getConnectionStatus();
        if (config.hasApiKey) {
            document.getElementById('apiKey').value = '••••••••••••••••';
        }
    }
    
    /**
     * Test Google Sheets connection
     */
    async testGoogleSheetsConnection() {
        const apiKey = document.getElementById('apiKey').value.trim();
        const spreadsheetId = document.getElementById('spreadsheetId').value.trim();
        
        if (!apiKey || !spreadsheetId) {
            this.showNotification('Please enter both API key and Spreadsheet ID', 'error');
            return;
        }
        
        const statusDiv = document.getElementById('connectionStatus');
        statusDiv.textContent = 'Testing connection...';
        statusDiv.className = 'connection-status';
        
        try {
            const result = await window.googleSheetsManager.testConnection(apiKey, spreadsheetId);
            
            if (result.success) {
                statusDiv.textContent = result.message;
                statusDiv.className = 'connection-status success';
                
                // Initialize sheet with headers
                await window.googleSheetsManager.initializeSheet();
                
                this.showNotification('Google Sheets connected successfully!', 'success');
            } else {
                statusDiv.textContent = result.message;
                statusDiv.className = 'connection-status error';
            }
            
        } catch (error) {
            statusDiv.textContent = `Connection failed: ${error.message}`;
            statusDiv.className = 'connection-status error';
        }
    }
    
    /**
     * Generate and download report
     */
    async generateReport() {
        try {
            const caregivers = window.storageManager.getCaregivers();
            const allLogs = window.storageManager.getTimeLogs();
            
            // Generate CSV content
            let csvContent = 'Caregiver Name,Date,Clock In,Clock Out,Total Hours,Notes,Status\n';
            
            allLogs.forEach(log => {
                const row = [
                    log.caregiverName,
                    log.date,
                    log.clockIn,
                    log.clockOut,
                    log.totalHours,
                    log.notes || '',
                    log.status
                ].map(field => `"${field}"`).join(',');
                csvContent += row + '\n';
            });
            
            // Download CSV
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `caregiver-report-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
            
            this.showNotification('Report generated successfully', 'success');
            
        } catch (error) {
            console.error('Error generating report:', error);
            this.showNotification('Failed to generate report', 'error');
        }
    }
    
    /**
     * Handle keyboard shortcuts
     */
    handleKeyboardShortcuts(e) {
        // Ctrl+I for clock in
        if (e.ctrlKey && e.key === 'i') {
            e.preventDefault();
            if (!this.elements.clockInBtn.disabled) {
                this.clockIn();
            }
        }
        
        // Ctrl+O for clock out
        if (e.ctrlKey && e.key === 'o') {
            e.preventDefault();
            if (!this.elements.clockOutBtn.disabled) {
                this.clockOut();
            }
        }
        
        // Escape to close modals
        if (e.key === 'Escape') {
            const openModal = document.querySelector('.modal.show');
            if (openModal) {
                this.hideModal(openModal);
            }
        }
    }
}

// Initialize app when script loads
window.app = new CaregiverApp();