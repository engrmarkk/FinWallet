const fs = require('fs');
const path = require('path');
const { formatDate } = require('./appUtil');

class Logger {
  constructor(logFilePath = process.env.LOG_FILE_PATH || null) {
    this.logFilePath = logFilePath;

    if (this.logFilePath) {
      this.ensureLogFile();
    }
  }

  ensureLogFile() {
    try {
      const dir = path.dirname(this.logFilePath);

      // Ensure directory exists
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Touch file if it doesn't exist
      if (!fs.existsSync(this.logFilePath)) {
        fs.writeFileSync(this.logFilePath, '');
      }

      this.fileWriteEnabled = true;
    } catch (err) {
      console.error(`[LOGGER] Could not set log file: ${err.message}`);
      this.fileWriteEnabled = false;
    }
  }

  logToFile(level, message) {
    if (!this.fileWriteEnabled) return false;

    const logEntry = `[${formatDate(new Date())}] [${level.toUpperCase()}] ${message}\n`;

    try {
      fs.appendFileSync(this.logFilePath, logEntry);
      return true;
    } catch (err) {
      console.error(`[LOGGER] File write failed: ${err.message}`);
      this.fileWriteEnabled = false;
      return false;
    }
  }

  log(level, ...args) {
    const message = args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : a)).join(' ');

    const fileWritten = this.logToFile(level, message);

    // fallback to console if file write is disabled or failed
    if (!fileWritten) {
      console[level] ? console[level](message) : console.log(message);
    }
  }

  info(...args) {
    this.log('info', ...args);
  }
  warn(...args) {
    this.log('warn', ...args);
  }
  error(...args) {
    this.log('error', ...args);
  }
}

module.exports = Logger;
