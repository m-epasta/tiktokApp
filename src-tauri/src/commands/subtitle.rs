// ============================================================================
// Subtitle Commands
// ============================================================================
//
// Tauri commands for subtitle generation and video overlay.
// These are the public API exposed to the React frontend.

use crate::subtitle::{self, SubtitleResult};

/// Generate subtitles from video file (NEW clean API)
///
/// # Arguments
/// * `app` - Tauri app handle
/// * `video_path` - Path to video file
/// * `model_size` - Whisper model ("tiny", "base", "small", "medium", "large")
///
/// # Returns
/// * `Ok(SubtitleResult)` - Subtitle file path and metadata
/// * `Err(String)` - Error message
#[tauri::command]
pub async fn create_subtitles(
    app: tauri::AppHandle,
    video_path: String,
    model_size: Option<String>,
) -> Result<SubtitleResult, String> {
    let model = model_size.unwrap_or_else(|| "base".to_string());
    subtitle::generate_subtitles(&app, &video_path, &model).await
}

/// Read subtitle file contents
///
/// # Arguments
/// * `path` - Path to subtitle file
///
/// # Returns
/// * `Ok(String)` - File contents
/// * `Err(String)` - Error message
#[tauri::command]
pub async fn read_subtitle_file(path: String) -> Result<String, String> {
    tokio::fs::read_to_string(&path)
        .await
        .map_err(|e| e.to_string())
}

/// Overlay subtitles
///
/// # Arguments
/// * `app` - Tauri app handle
/// * `video_path` - Path to input video
/// * `subtitle_path` - Path to subtitle file (.srt or .ass)
/// * `output_path` - Path for output video
///
/// # Returns
/// * `Ok(String)` - Success message
/// * `Err(String)` - Error message
#[tauri::command]
pub async fn overlay_subtitles(
    app: tauri::AppHandle,
    video_path: String,
    subtitle_path: String,
    output_path: String,
) -> Result<String, String> {
    subtitle::overlay_subtitles(&app, &video_path, &subtitle_path, &output_path).await?;
    Ok(format!("Video with subtitles saved to: {}", output_path))
}

/// Generate subtitles AND overlay them in one step
///
/// # Arguments
/// * `app` - Tauri app handle
/// * `video_path` - Path to input video
/// * `output_path` - Path for output video
/// * `model_size` - Optional Whisper model size
///
/// # Returns
/// * `Ok(String)` - Success message
/// * `Err(String)` - Error message
#[tauri::command]
pub async fn generate_and_overlay_subtitles(
    app: tauri::AppHandle,
    video_path: String,
    output_path: String,
    model_size: Option<String>,
) -> Result<String, String> {
    // Step 1: Generate subtitles
    let model = model_size.unwrap_or_else(|| "base".to_string());
    let result = subtitle::generate_subtitles(&app, &video_path, &model).await?;

    // Step 2: Overlay onto video
    subtitle::overlay_subtitles(&app, &video_path, &result.subtitle_path, &output_path).await?;

    Ok(format!(
        "Complete! {} segments generated",
        result.segment_count
    ))
}
