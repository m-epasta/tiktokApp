/**
 * Formatting Utilities
 * 
 * Professional formatting functions for time, file sizes, and display values
 * Version: 2.0.0
 */

import type { TimeFormat } from '../types';

/**
 * Format seconds to time string
 * 
 * @param seconds - Time in seconds
 * @param format - Output format (default: 'mm:ss')
 * @returns Formatted time string
 * 
 * @example
 * formatTime(65) // "1:05"
 * formatTime(3665, 'hh:mm:ss') // "1:01:05"
 */
export function formatTime(seconds: number, format: TimeFormat = 'mm:ss'): string {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return '0:00';
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  switch (format) {
    case 'hh:mm:ss':
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    case 'seconds':
      return `${seconds.toFixed(1)}s`;
    case 'mm:ss':
    default:
      if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      }
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
}

/**
 * Format file size to human-readable string
 * 
 * @param bytes - Size in bytes
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted size string
 * 
 * @example
 * formatFileSize(1024) // "1.00 KB"
 * formatFileSize(1536000) // "1.46 MB"
 */
export function formatFileSize(bytes: number, decimals = 2): string {
  if (!Number.isFinite(bytes) || bytes === 0) return '0 Bytes';
  if (bytes < 0) return 'Invalid size';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const size = bytes / Math.pow(k, i);

  return `${size.toFixed(dm)} ${sizes[i]}`;
}

/**
 * Format percentage with optional decimal places
 * 
 * @param value - Value (0-100)
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted percentage string
 * 
 * @example
 * formatPercentage(45.678) // "45.7%"
 * formatPercentage(100) // "100.0%"
 */
export function formatPercentage(value: number, decimals = 1): string {
  if (!Number.isFinite(value)) return '0.0%';
  const clamped = Math.max(0, Math.min(100, value));
  return `${clamped.toFixed(decimals)}%`;
}

/**
 * Format number with thousands separators
 * 
 * @param value - Number to format
 * @param locale - Locale for formatting (default: 'en-US')
 * @returns Formatted number string
 * 
 * @example
 * formatNumber(1234567) // "1,234,567"
 * formatNumber(1234567.89, 'fr-FR') // "1 234 567,89"
 */
export function formatNumber(value: number, locale = 'en-US'): string {
  if (!Number.isFinite(value)) return '0';
  return new Intl.NumberFormat(locale).format(value);
}

/**
 * Truncate string with ellipsis
 * 
 * @param str - String to truncate
 * @param maxLength - Maximum length
 * @param ellipsis - Ellipsis string (default: '...')
 * @returns Truncated string
 * 
 * @example
 * truncate("Long filename.mp4", 15) // "Long filena..."
 */
export function truncate(str: string, maxLength: number, ellipsis = '...'): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - ellipsis.length) + ellipsis;
}

/**
 * Get file name from path
 * 
 * @param path - File path
 * @returns File name without path
 * 
 * @example
 * getFileName("/path/to/video.mp4") // "video.mp4"
 */
export function getFileName(path: string): string {
  return path.split(/[\\/]/).pop() || path;
}

/**
 * Get file extension from path
 * 
 * @param path - File path
 * @returns File extension (lowercase, without dot)
 * 
 * @example
 * getFileExtension("video.MP4") // "mp4"
 */
export function getFileExtension(path: string): string {
  const fileName = getFileName(path);
  const lastDot = fileName.lastIndexOf('.');
  return lastDot === -1 ? '' : fileName.slice(lastDot + 1).toLowerCase();
}

/**
 * Format log message with timestamp
 * 
 * @param message - Log message
 * @param includeTime - Include timestamp (default: true)
 * @returns Formatted log message
 * 
 * @example
 * formatLogMessage("Processing complete") // "[14:30:45] Processing complete"
 */
export function formatLogMessage(message: string, includeTime = true): string {
  if (!includeTime) return message;
  
  const now = new Date();
  const time = now.toLocaleTimeString('en-US', { 
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  
  return `[${time}] ${message}`;
}

/**
 * Parse log message to extract structured data
 * 
 * @param message - Raw log message
 * @returns Parsed log data
 */
export function parseLogMessage(message: string): {
  timestamp?: string;
  level?: 'info' | 'warn' | 'error' | 'debug';
  content: string;
} {
  // Extract timestamp [HH:MM:SS]
  const timestampMatch = message.match(/^\[(\d{2}:\d{2}:\d{2})\]/);
  const timestamp = timestampMatch?.[1];
  
  // Extract log level
  let level: 'info' | 'warn' | 'error' | 'debug' | undefined;
  if (message.includes('ERROR') || message.includes('❌')) level = 'error';
  else if (message.includes('WARN') || message.includes('⚠️')) level = 'warn';
  else if (message.includes('DEBUG')) level = 'debug';
  else level = 'info';
  
  // Remove timestamp from content
  const content = timestamp ? message.slice(timestamp.length + 3).trim() : message;
  
  return { timestamp, level, content };
}

/**
 * Format duration in a human-friendly way
 * 
 * @param seconds - Duration in seconds
 * @returns Human-friendly duration string
 * 
 * @example
 * formatDuration(65) // "1 minute 5 seconds"
 * formatDuration(3665) // "1 hour 1 minute"
 */
export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0 seconds';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
  if (minutes > 0) parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
  if (secs > 0 && hours === 0) parts.push(`${secs} second${secs !== 1 ? 's' : ''}`);
  
  return parts.join(' ') || '0 seconds';
}
