/**
 * Type Definitions for TikTok Clip Studio
 * 
 * Centralized type definitions for type-safe development
 * Version: 2.0.0
 */

// ============================================================================
// Core Types
// ============================================================================

/**
 * Video clip detected by AI analysis
 */
export interface Clip {
  /** Start time in seconds */
  start_time: number;
  /** End time in seconds */
  end_time: number;
  /** Duration in seconds */
  duration: number;
  /** Quality score (0-1) from AI analysis */
  score: number;
}

/**
 * Export mode for video processing
 */
export type ExportMode = 'single' | 'clips' | 'auto-subs';

/**
 * Input source mode
 */
export type InputMode = 'file' | 'url';

/**
 * Processing stage information
 */
export interface ProcessingStage {
  /** Current stage name */
  stage: string;
  /** Progress percentage (0-100) */
  progress?: number;
  /** Additional status message */
  status?: string;
}

// ============================================================================
// YouTube Types
// ============================================================================

/**
 * YouTube video information
 */
export interface YouTubeInfo {
  /** Video title */
  title: string;
  /** Video duration in seconds */
  duration: number;
  /** Uploader name */
  uploader: string;
  /** Thumbnail URL */
  thumbnail?: string;
  /** View count */
  view_count?: number;
  /** Upload date */
  upload_date?: string;
}

/**
 * Download progress information
 */
export interface DownloadProgress {
  /** Progress percentage (0-100) */
  percentage: number;
  /** Download speed (e.g., "1.5MB/s") */
  speed?: string;
  /** Estimated time remaining */
  eta?: string;
  /** Downloaded size */
  downloaded?: string;
  /** Total size */
  total?: string;
}

// ============================================================================
// Transcription Types
// ============================================================================

/**
 * Transcription statistics
 */
export interface TranscriptionStats {
  /** Total words processed */
  total_words: number;
  /** Number of emojis added */
  emoji_count: number;
  /** AI-assigned emojis */
  ai_assigned_emojis: number;
  /** Sentiment distribution */
  sentiment_distribution: Record<string, number>;
  /** Detected language */
  language: string;
  /** Language detection probability */
  language_probability: number;
}

/**
 * Subtitle generation options
 */
export interface SubtitleOptions {
  /** Whisper model size */
  model_size?: 'tiny' | 'base' | 'small' | 'medium' | 'large' | 'large-v3';
  /** Target language (null for auto-detect) */
  language?: string | null;
  /** Enable AI enhancements */
  ai_enhanced?: boolean;
}

// ============================================================================
// Application State Types
// ============================================================================

/**
 * Application state
 */
export interface AppState {
  /** Currently selected file path */
  filePath: string | null;
  /** YouTube URL input */
  youtubeUrl: string;
  /** Processing logs */
  logs: string[];
  /** Is processing active */
  processing: boolean;
  /** Current export mode */
  mode: ExportMode;
  /** Detected clips */
  clips: Clip[];
  /** Selected clip indices */
  selectedClips: Set<number>;
  /** Is detecting clips */
  detectingClips: boolean;
  /** Input mode (file or URL) */
  inputMode: InputMode;
  /** Download progress */
  downloadProgress: number;
  /** Download status message */
  downloadStatus: string;
  /** Output file path */
  outputPath: string;
  /** Show logs panel */
  showLogs: boolean;
  /** Current processing stage */
  processingStage: string;
}

// ============================================================================
// API Response Types
// ============================================================================

/**
 * Standard API response
 */
export interface ApiResponse<T = unknown> {
  /** Success status */
  success: boolean;
  /** Response data */
  data?: T;
  /** Error message if failed */
  error?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Export result
 */
export interface ExportResult {
  /** Output file path */
  output_path: string;
  /** Processing time in seconds */
  processing_time?: number;
  /** File size in bytes */
  file_size?: number;
}

/**
 * Clip detection result
 */
export interface ClipDetectionResult {
  /** Detected clips */
  clips: Clip[];
  /** Total scenes analyzed */
  total_scenes: number;
  /** Processing time */
  processing_time: number;
}

// ============================================================================
// Event Types
// ============================================================================

/**
 * Log event payload
 */
export interface LogEvent {
  /** Log message */
  message: string;
  /** Log level */
  level?: 'info' | 'warn' | 'error' | 'debug';
  /** Timestamp */
  timestamp?: string;
}

/**
 * Progress event payload
 */
export interface ProgressEvent {
  /** Current progress (0-100) */
  progress: number;
  /** Stage name */
  stage: string;
  /** Additional details */
  details?: string;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Time format options
 */
export type TimeFormat = 'mm:ss' | 'hh:mm:ss' | 'seconds';

/**
 * Video quality preset
 */
export type VideoQuality = 'low' | 'medium' | 'high' | 'ultra';

/**
 * File filter for dialog
 */
export interface FileFilter {
  /** Filter name */
  name: string;
  /** Allowed extensions */
  extensions: string[];
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Supported video extensions
 */
export const VIDEO_EXTENSIONS = ['mp4', 'mov', 'mkv', 'avi', 'webm', 'flv', 'm4v'] as const;

/**
 * Supported audio extensions
 */
export const AUDIO_EXTENSIONS = ['mp3', 'wav', 'm4a', 'aac', 'flac', 'ogg'] as const;

/**
 * Supported subtitle extensions
 */
export const SUBTITLE_EXTENSIONS = ['srt', 'ass', 'vtt'] as const;

/**
 * Default file filters
 */
export const FILE_FILTERS = {
  video: { name: 'Video', extensions: [...VIDEO_EXTENSIONS] },
  audio: { name: 'Audio', extensions: [...AUDIO_EXTENSIONS] },
  subtitle: { name: 'Subtitle', extensions: [...SUBTITLE_EXTENSIONS] },
  all: { name: 'All Files', extensions: ['*'] },
} as const;
