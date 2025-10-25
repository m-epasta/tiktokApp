// ============================================================================
// Subtitle Generation Module
// ============================================================================
// 
// This module handles automatic subtitle generation using Whisper AI.
// It processes video/audio files and generates time-synced captions.
//
// Features:
// - Word-level timing accuracy
// - Automatic phrase segmentation
// - SRT format output
// - ASS format with styling
// - Emoji support via image-based rendering
//
// Usage:
//   let result = generate_subtitles(&app, "video.mp4", "base").await?;
//   println!("Subtitles: {}", result.subtitle_path);

use serde::{Deserialize, Serialize};
use std::path::Path;
use tauri::Emitter;
use tokio::process::Command;

/// Subtitle generation result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubtitleResult {
    /// Path to generated subtitle file (.srt or .ass)
    pub subtitle_path: String,
    
    /// Total number of subtitle segments
    pub segment_count: usize,
    
    /// Total duration in seconds
    pub duration_seconds: f64,
    
    /// Language detected (e.g. "en", "fr")
    pub language: String,
}

/// Individual subtitle segment with timing
#[derive(Debug, Clone, Serialize, Deserialize)]
#[allow(dead_code)]
pub struct SubtitleSegment {
    /// Start time in milliseconds
    pub start_time_ms: u64,
    
    /// End time in milliseconds
    pub end_time_ms: u64,
    
    /// Subtitle text
    pub text: String,
    
    /// Confidence score (0.0 - 1.0)
    pub confidence: f32,
}

/// Generate subtitles from video/audio file using Whisper
///
/// # Arguments
/// * `app` - Tauri app handle for progress updates
/// * `video_path` - Path to input video or audio file
/// * `model_size` - Whisper model size ("tiny", "base", "small", "medium", "large")
///
/// # Returns
/// * `Ok(SubtitleResult)` - Success with subtitle file path and metadata
/// * `Err(String)` - Detailed error message
///
/// # Example
/// ```rust
/// let result = generate_subtitles(&app, "video.mp4", "base").await?;
/// println!("Generated {} segments", result.segment_count);
/// ```
pub async fn generate_subtitles(
    app: &tauri::AppHandle,
    video_path: &str,
    model_size: &str,
) -> Result<SubtitleResult, String> {
    log::info!("Starting subtitle generation: {video_path}");
    let _ = app.emit("subtitle_progress", "Starting subtitle generation...");
    
    // Validate input file
    if !Path::new(video_path).exists() {
        return Err(format!("Video file not found: {video_path}"));
    }
    
    // Step 1: Extract audio from video
    let _ = app.emit("subtitle_progress", "Extracting audio...");
    let audio_path = extract_audio_for_transcription(app, video_path).await?;
    
    // Step 2: Run Whisper transcription
    let _ = app.emit("subtitle_progress", "Transcribing with AI...");
    let subtitle_path = run_whisper_transcription(app, &audio_path, model_size).await?;
    
    // Step 3: Parse and validate output
    let _ = app.emit("subtitle_progress", "Validating subtitles...");
    let result = parse_subtitle_file(&subtitle_path)?;
    
    // Cleanup temporary audio file
    let _ = tokio::fs::remove_file(&audio_path).await;
    
    log::info!("Subtitle generation complete: {} segments", result.segment_count);
    let _ = app.emit("subtitle_progress", "Complete!");
    
    Ok(result)
}

/// Extract audio from video in Whisper-compatible format
async fn extract_audio_for_transcription(
    app: &tauri::AppHandle,
    video_path: &str,
) -> Result<String, String> {
    let audio_path = format!("{}_audio.wav", video_path.replace(".mp4", ""));
    
    let args = vec![
        "-y",
        "-i", video_path,
        "-vn",                  // No video
        "-acodec", "pcm_s16le", // 16-bit PCM
        "-ar", "16000",         // 16kHz sample rate (Whisper default)
        "-ac", "1",             // Mono
        &audio_path,
    ];
    
    let output = Command::new("ffmpeg")
        .args(&args)
        .output()
        .await
        .map_err(|e| format!("Failed to extract audio: {e}"))?;
    
    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("FFmpeg audio extraction failed: {stderr}"));
    }
    
    let _ = app.emit("subtitle_progress", "Audio extracted");
    Ok(audio_path)
}

/// Run Whisper transcription using Python script
async fn run_whisper_transcription(
    app: &tauri::AppHandle,
    audio_path: &str,
    model_size: &str,
) -> Result<String, String> {
    let output_path = audio_path.replace(".wav", ".srt");
    
    let output = Command::new("python3")
        .args([
            "whisper_transcribe.py",
            audio_path,
            &output_path,
            model_size,
        ])
        .output()
        .await
        .map_err(|e| format!("Failed to run Whisper: {e}"))?;
    
    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Whisper transcription failed: {stderr}"));
    }
    
    // Check if ASS file was generated (preferred format)
    let ass_path = audio_path.replace(".wav", ".ass");
    if Path::new(&ass_path).exists() {
        let _ = app.emit("subtitle_progress", "Transcription complete (ASS format)");
        Ok(ass_path)
    } else if Path::new(&output_path).exists() {
        let _ = app.emit("subtitle_progress", "Transcription complete (SRT format)");
        Ok(output_path)
    } else {
        Err("No subtitle file generated".to_string())
    }
}

/// Parse subtitle file and extract metadata
fn parse_subtitle_file(subtitle_path: &str) -> Result<SubtitleResult, String> {
    let content = std::fs::read_to_string(subtitle_path)
        .map_err(|e| format!("Failed to read subtitle file: {e}"))?;
    
    let path = std::path::Path::new(subtitle_path);
    
    // Count segments (simple heuristic) - using case-insensitive comparison
    let segment_count = if path.extension().is_some_and(|ext| ext.eq_ignore_ascii_case("srt")) {
        content.lines().filter(|line| line.contains("-->")).count()
    } else {
        content.lines().filter(|line| line.starts_with("Dialogue:")).count()
    };
    
    Ok(SubtitleResult {
        subtitle_path: subtitle_path.to_string(),
        segment_count,
        duration_seconds: 0.0, // TODO: Calculate from last timestamp
        language: "auto".to_string(),
    })
}

/// Overlay subtitles onto video using `FFmpeg`
///
/// # Arguments
/// * `app` - Tauri app handle for progress updates
/// * `video_path` - Path to input video
/// * `subtitle_path` - Path to subtitle file (.srt or .ass)
/// * `output_path` - Path for output video
///
/// # Returns
/// * `Ok(())` - Success
/// * `Err(String)` - Detailed error message
pub async fn overlay_subtitles(
    app: &tauri::AppHandle,
    video_path: &str,
    subtitle_path: &str,
    output_path: &str,
) -> Result<(), String> {
    log::info!("Overlaying subtitles: {video_path} + {subtitle_path}");
    
    // Check if subtitles contain emojis - if so, use image-based rendering
    let content = std::fs::read_to_string(subtitle_path)
        .map_err(|e| format!("Failed to read subtitle file: {e}"))?;
    
    let has_emojis = content.contains("\\u") || content.contains("\\U") ||
        content.chars().any(|c| {
            matches!(c as u32,
                0x1F300..=0x1F9FF | // Emoticons, symbols, pictographs (main range)
                0x2600..=0x26FF |   // Miscellaneous symbols
                0x2700..=0x27BF |   // Dingbats
                0xFE00..=0xFE0F     // Variation selectors
            )
        });
    
    if has_emojis {
        log::info!("Emojis detected - using image-based rendering");
        let _ = app.emit("subtitle_progress", "Emojis detected - using advanced rendering...");
        return crate::video::emoji_overlay::convert_with_emoji_overlays(
            app,
            video_path,
            output_path,
            subtitle_path,
        ).await;
    }
    
    // Standard subtitle rendering (no emojis)
    let _ = app.emit("subtitle_progress", "Burning subtitles into video...");
    
    // Escape subtitle path for FFmpeg
    let sub_escaped = subtitle_path
        .replace('\\', "\\\\")
        .replace(':', "\\:")
        .replace('\'', "\\'");
    
    // Build filter based on subtitle format
    let filter = if std::path::Path::new(subtitle_path)
        .extension()
        .is_some_and(|ext| ext.eq_ignore_ascii_case("ass")) {
        format!("ass='{sub_escaped}'")
    } else {
        format!("subtitles='{sub_escaped}'")
    };
    
    let args = vec![
        "-y",
        "-i", video_path,
        "-vf", &filter,
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "20",
        "-c:a", "copy", // Copy audio without re-encoding
        output_path,
    ];
    
    let mut child = Command::new("ffmpeg")
        .args(&args)
        .stderr(std::process::Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to start FFmpeg: {e}"))?;
    
    // Stream progress
    if let Some(stderr) = child.stderr.take() {
        use tokio::io::{AsyncBufReadExt, BufReader};
        let mut reader = BufReader::new(stderr).lines();
        
        while let Ok(Some(line)) = reader.next_line().await {
            if line.contains("time=") {
                let _ = app.emit("subtitle_progress", format!("Encoding: {}", line.trim()));
            }
        }
    }
    
    let status = child.wait().await
        .map_err(|e| format!("FFmpeg process error: {e}"))?;
    
    if status.success() {
        log::info!("Subtitle overlay complete: {output_path}");
        let _ = app.emit("subtitle_progress", "Complete!");
        Ok(())
    } else {
        Err(format!("FFmpeg exited with status: {status}"))
    }
}
