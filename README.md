# Caregiver Time Tracker 护工时间追踪

A modern, bilingual (English/Chinese) web application for tracking caregiver work hours with automatic Google Sheets synchronization.

![Caregiver Time Tracker](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![PWA Ready](https://img.shields.io/badge/PWA-Ready-orange.svg)

## Features

### Core Functionality
- ⏰ **Clock In/Out System** - Simple one-click time tracking
- 👥 **Multi-Caregiver Support** - Manage multiple caregivers
- 📊 **Real-Time Analytics** - Live hour tracking and remaining time
- 🌐 **Bilingual Interface** - English and Chinese support
- 📱 **Mobile-First Design** - Responsive PWA optimized for all devices

### Data Management
- ☁️ **Google Sheets Integration** - Automatic data synchronization
- 💾 **Offline Functionality** - Works without internet, syncs when online
- 📈 **Reporting System** - Generate CSV reports
- 🔄 **Real-Time Sync** - Live data updates across devices
- 💿 **Local Backup** - Data persistence in browser storage

### User Experience
- 🚀 **Fast Loading** - Progressive Web App with caching
- 🔔 **Smart Notifications** - Status updates and sync confirmations
- ⌨️ **Keyboard Shortcuts** - Ctrl+I (clock in), Ctrl+O (clock out)
- 🎨 **Modern UI** - Clean, intuitive interface with smooth animations
- ♿ **Accessibility** - Screen reader support, keyboard navigation

## Quick Start

### 1. Download Files
Clone or download all files to your web server or hosting service.

### 2. Open in Browser
Navigate to `index.html` in your web browser. The app works immediately with local storage.

### 3. Set Up Google Sheets (Optional)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google Sheets API
4. Create API credentials (API key)
5. Create a new Google Sheet
6. Copy the Sheet ID from the URL
7. In the app, click "Setup Google Sheets" and enter your credentials

## Google Sheets Setup Guide

### Step 1: Enable Google Sheets API

1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Go to "APIs & Services" > "Library"
4. Search for "Google Sheets API" and enable it
5. Go to "APIs & Services" > "Credentials"
6. Click "Create Credentials" > "API Key"
7. Copy your API key (keep it secure!)

### Step 2: Create Your Spreadsheet

1. Go to [Google Sheets](https://sheets.google.com/)
2. Create a new spreadsheet
3. Name it "Caregiver Time Logs" (or any name you prefer)
4. Copy the Spreadsheet ID from the URL:
   ```
   https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit
   ```

### Step 3: Configure App

1. Open the Caregiver Time Tracker app
2. Click "Setup Google Sheets" button
3. Enter your API Key and Spreadsheet ID
4. Click "Test Connection"
5. If successful, your data will now automatically sync!

### Step 4: Share Spreadsheet (Optional)

To allow others to view the data:
1. Click "Share" in your Google Sheet
2. Add email addresses of people who need access
3. Set permissions (Viewer/Editor as needed)

## File Structure

```
caregive-vs-code/
├── index.html          # Main HTML file
├── styles.css          # CSS styles and responsive design
├── config.js           # Configuration constants
├── storage.js          # Local storage management
├── googleSheets.js     # Google Sheets API integration
├── app.js              # Main application logic
├── manifest.json       # PWA manifest
├── sw.js               # Service worker for offline functionality
├── REQUIREMENTS.md     # Detailed requirements document
└── README.md           # This file
```

## Deployment Options

### Option 1: GitHub Pages (Recommended)
1. Upload files to a GitHub repository
2. Enable GitHub Pages in repository settings
3. Your app will be available at `https://yourusername.github.io/repository-name`

### Option 2: Netlify
1. Drag and drop the folder to [Netlify](https://app.netlify.com/)
2. Get instant deployment with custom domain support

### Option 3: Vercel
1. Upload to [Vercel](https://vercel.com/) 
2. Connect your GitHub repository for automatic deployments

### Option 4: Local Server
For development or private use:
```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve .

# Using PHP
php -S localhost:8000
```

## Browser Compatibility

- ✅ Chrome 80+
- ✅ Safari 13+
- ✅ Firefox 75+
- ✅ Edge 80+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Security Notes

- API keys are stored locally in browser storage
- Data transmission to Google Sheets uses HTTPS
- No sensitive data is stored on external servers
- For production use, consider implementing server-side API proxy

## Troubleshooting

### Common Issues

**Google Sheets not syncing:**
- Check your API key is correct
- Verify Spreadsheet ID is accurate
- Ensure Google Sheets API is enabled
- Check browser console for error messages

**App not loading:**
- Ensure all files are in the same directory
- Check browser console for errors
- Try refreshing or clearing browser cache

**Mobile issues:**
- Add to home screen for best experience
- Enable notifications if prompted
- Check that service worker is registered

### Support

For issues or questions:
1. Check browser console for error messages
2. Verify Google Sheets API setup
3. Test with different browsers
4. Check network connectivity for sync issues

## Contributing

This project is open for contributions:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use and modify for your needs.

## Changelog

### Version 1.0.0
- Initial release
- Core time tracking functionality
- Google Sheets integration
- PWA support
- Bilingual interface
- Offline functionality

## Roadmap

Future enhancements planned:
- [ ] Dark mode theme
- [ ] Advanced reporting with charts
- [ ] Email notifications
- [ ] Multi-language support (Spanish, French)
- [ ] Backend API option
- [ ] Export to PDF
- [ ] Time tracking analytics
- [ ] Shift scheduling

---

**Note:** This application is designed for family use and small caregiving operations. For enterprise deployments, consider additional security measures and backend infrastructure.