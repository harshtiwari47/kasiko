import fs from 'fs';
import path from 'path';
import {
  fileURLToPath
} from 'url';
import winston from 'winston';
import 'winston-daily-rotate-file'; // Side-effect import to enable daily rotation

// Get __dirname for ES modules.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a logs directory if it doesn't exist.
const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// In-memory storage for the last 50 errors.
const errorMemory = [];

/**
* Stores an error message in memory, keeping only the last 50 entries.
* @param {string} message - The error message to store.
*/
function storeErrorInMemory(message) {
  errorMemory.push(message);
  if (errorMemory.length > 50) {
    errorMemory.shift();
  }
}

/**
* Retrieve the last 50 error logs.
* @returns {string[]} - Array of error log messages.
*/
export function getLastErrors() {
  return errorMemory;
}

// Custom log format to include timestamp and error stack if available.
const customFormat = winston.format.printf(({
  timestamp, level, message, stack
}) => {
  return `[${timestamp}] ${level}: ${stack || message}`;
});

// Configure Winston logger with both console transport and daily rotating file transport.
const logger = winston.createLogger({
  level: 'error',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({
      stack: true
    }),
    customFormat
  ),
  transports: [
    // Log errors to the console with colorization.
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp(),
        winston.format.errors({
          stack: true
        }),
        customFormat
      )
    }),
    // Log errors to files with daily rotation.
    new winston.transports.DailyRotateFile({
      filename: path.join(logDir, 'errors-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d', // Keep logs for 14 days.
      level: 'error'
    })
  ],
  exitOnError: false // Prevent Winston from exiting on handled exceptions.
});

/*

// Global error handlers.
// Catch synchronous errors that aren't caught elsewhere.
process.on('uncaughtException', (error) => {
  const errorMessage = `Uncaught Exception: ${error.stack || error}`;
  logger.error(errorMessage);
  storeErrorInMemory(errorMessage);
  // Optionally, exit the process after logging if needed.
});

// Catch unhandled promise rejections.
process.on('unhandledRejection', (reason, promise) => {
  const errorMessage = `Unhandled Rejection at: ${promise} Reason: ${reason && reason.stack ? reason.stack: reason}`;
  logger.error(errorMessage);
  storeErrorInMemory(errorMessage);
  // Optionally, exit the process after logging if needed.
})

process.on('warning', (warning) => {
  if (warning.code === 'DEP0160') return; // Ignore multipleResolves deprecation warning
  console.warn(warning.name, warning.message);
});

*/

console.log("[AntiCrash] Advanced error handling initialized.");

export default logger;