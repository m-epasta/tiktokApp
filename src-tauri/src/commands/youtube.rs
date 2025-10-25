// YouTube download commands
use crate::video::youtube;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VideoInfo {
    pub title: String,
    pub duration: f64,
    pub uploader: String,
}

#[tauri::command]
pub async fn download_youtube(
    app: tauri::AppHandle,
    url: String,
) -> Result<String, String> {
    // Download to a temp directory
    let temp_dir = std::env::temp_dir()
        .join("tiktok-studio-downloads")
        .to_string_lossy()
        .to_string();

    let video_path = youtube::download_youtube_video(&app, &url, &temp_dir).await?;

    Ok(video_path)
}

#[tauri::command]
pub async fn get_youtube_info(
    app: tauri::AppHandle,
    url: String,
) -> Result<VideoInfo, String> {
    let info = youtube::get_video_info(&app, &url).await?;

    Ok(VideoInfo {
        title: info.title,
        duration: info.duration,
        uploader: info.uploader,
    })
}

#[tauri::command]
pub async fn download_and_export(
    app: tauri::AppHandle,
    url: String,
    output: String,
    with_subtitles: Option<bool>,
) -> Result<String, String> {
    // Step 1: Download from YouTube
    let video_path = download_youtube(app.clone(), url).await?;

    // Step 2: Export to TikTok format
    if with_subtitles.unwrap_or(false) {
        crate::commands::transcribe::export_with_auto_subs(
            app,
            video_path.clone(),
            output,
            Some("base".to_string()),
        )
        .await?;
    } else {
        crate::video::ffmpeg::convert_to_tiktok(&app, &video_path, &output).await?;
    }

    // Step 3: Clean up downloaded file
    let _ = tokio::fs::remove_file(&video_path).await;

    Ok("YouTube video processed successfully".to_string())
}
