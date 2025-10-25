//! Export Commands Module
//! 
//! Handles video export operations with professional error handling and logging.
//! Provides commands for:
//! - Standard `TikTok` format conversion
//! - Export with subtitle overlay
//! 
//! All commands are async and return structured error messages.

use crate::video::{ffmpeg, emoji_overlay};
use std::path::Path;

/// Export video to TikTok-optimized format (9:16, 60fps, H.264)
///
/// # Arguments
/// * `app` - Tauri application handle for event emission
/// * `input` - Path to input video file
/// * `output` - Path for output video file
///
/// # Returns
/// * `Ok(String)` - Success message with output path
/// * `Err(String)` - Detailed error message
///
/// # Errors
/// Returns error if:
/// - Input file doesn't exist
/// - `FFmpeg` conversion fails
/// - Output path is invalid
#[tauri::command]
pub async fn export_tiktok(
    app: tauri::AppHandle,
    input: String,
    output: String,
) -> Result<String, String> {
    log::info!("Export request: {input} -> {output}");
    
    // Validate input file exists
    if !Path::new(&input).exists() {
        let err = format!("Input file not found: {input}");
        log::error!("{err}");
        return Err(err);
    }
    
    // Perform conversion
    match ffmpeg::convert_to_tiktok(&app, &input, &output).await {
        Ok(()) => {
            log::info!("Export completed successfully: {output}");
            Ok(format!("Export complete: {output}"))
        }
        Err(e) => {
            log::error!("Export failed: {e}");
            Err(format!("Export failed: {e}"))
        }
    }
}

/// Export video with subtitle overlay
///
/// # Arguments
/// * `app` - Tauri application handle for event emission
/// * `input` - Path to input video file
/// * `output` - Path for output video file
/// * `subtitle_file` - Path to subtitle file (.ass or .srt)
///
/// # Returns
/// * `Ok(String)` - Success message with output path
/// * `Err(String)` - Detailed error message
///
/// # Errors
/// Returns error if:
/// - Input file doesn't exist
/// - Subtitle file doesn't exist
/// - `FFmpeg` conversion fails
#[tauri::command]
pub async fn export_with_subs(
    app: tauri::AppHandle,
    input: String,
    output: String,
    subtitle_file: String,
) -> Result<String, String> {
    log::info!("Export with subtitles: {input} + {subtitle_file} -> {output}");
    
    // Validate files exist
    if !Path::new(&input).exists() {
        let err = format!("Input file not found: {input}");
        log::error!("{err}");
        return Err(err);
    }
    
    if !Path::new(&subtitle_file).exists() {
        let err = format!("Subtitle file not found: {subtitle_file}");
        log::error!("{err}");
        return Err(err);
    }
    
    // Use image-based emoji overlay system for guaranteed emoji rendering
    log::info!("Using image-based emoji overlay system");
    match emoji_overlay::convert_with_emoji_overlays(&app, &input, &output, &subtitle_file).await {
        Ok(()) => {
            log::info!("Export with emoji overlays completed: {output}");
            Ok(format!("Export with emoji overlays complete: {output}"))
        }
        Err(e) => {
            log::error!("Export with emoji overlays failed: {e}");
            Err(format!("Export with emoji overlays failed: {e}"))
        }
    }
}
