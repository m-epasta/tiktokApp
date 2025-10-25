// YouTube video downloader using yt-dlp
use std::path::PathBuf;
use std::process::Stdio;
use tauri::Emitter;
use tokio::process::Command;

/// Downloads a `YouTube` video using yt-dlp
/// Returns the path to the downloaded video file
/// 
/// Prerequisites: Install yt-dlp
/// - pip install yt-dlp
/// - or: sudo apt install yt-dlp
pub async fn download_youtube_video(
    app: &tauri::AppHandle,
    url: &str,
    output_dir: &str,
) -> Result<String, String> {
    let _ = app.emit("export_log", format!("Downloading from YouTube: {url}"));

    // Check if yt-dlp is installed
    let check = Command::new("yt-dlp")
        .arg("--version")
        .output()
        .await;

    if check.is_err() {
        return Err("yt-dlp not found. Install it with: pip install yt-dlp".to_string());
    }

    // Create output directory if it doesn't exist
    std::fs::create_dir_all(output_dir)
        .map_err(|e| format!("Failed to create output directory: {e}"))?;

    // Output template: video title with safe filename
    let output_template = format!("{output_dir}/%(title)s.%(ext)s");

    let _ = app.emit("export_log", "Starting download...");

    // Run yt-dlp to download the video
    let child = Command::new("yt-dlp")
        .args([
            url,
            "-f", "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best", // Best MP4 quality
            "-o", &output_template,
            "--no-playlist", // Don't download playlists
            "--progress",    // Show progress
            "--newline",     // Progress on new lines (easier to parse)
        ])
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to start yt-dlp: {e}"))?;

    // Wait for process to complete
    let output = child
        .wait_with_output()
        .await
        .map_err(|e| format!("yt-dlp process error: {e}"))?;

    // Log stdout
    if !output.stdout.is_empty() {
        let stdout_str = String::from_utf8_lossy(&output.stdout);
        for line in stdout_str.lines() {
            let _ = app.emit("export_log", line);
        }
    }

    // Log stderr
    if !output.stderr.is_empty() {
        let stderr_str = String::from_utf8_lossy(&output.stderr);
        for line in stderr_str.lines() {
            let _ = app.emit("export_log", &format!("yt-dlp: {line}"));
        }
    }

    if !output.status.success() {
        let error_msg = if output.stderr.is_empty() {
            "YouTube download failed. Check the URL and try again.".to_string()
        } else {
            format!("YouTube download failed: {}", String::from_utf8_lossy(&output.stderr))
        };
        return Err(error_msg);
    }

    // Find the downloaded file
    let downloaded_file = find_latest_video_file(output_dir)?;

    let _ = app.emit(
        "export_log",
        format!("✓ Downloaded: {}", downloaded_file.file_name().unwrap().to_string_lossy()),
    );

    Ok(downloaded_file.to_string_lossy().to_string())
}

/// Finds the most recently created video file in a directory
fn find_latest_video_file(dir: &str) -> Result<PathBuf, String> {
    let entries = std::fs::read_dir(dir)
        .map_err(|e| format!("Failed to read directory: {e}"))?;

    let mut video_files: Vec<PathBuf> = entries
        .filter_map(std::result::Result::ok)
        .map(|e| e.path())
        .filter(|p| {
            p.is_file()
                && p.extension()
                    .and_then(|ext| ext.to_str())
                    .is_some_and(|ext| {
                        matches!(
                            ext.to_lowercase().as_str(),
                            "mp4" | "mkv" | "webm" | "mov" | "avi"
                        )
                    })
        })
        .collect();

    // Sort by modification time (most recent first)
    video_files.sort_by_key(|path| {
        std::fs::metadata(path)
            .and_then(|m| m.modified())
            .ok()
    });

    video_files
        .last()
        .cloned()
        .ok_or_else(|| "No video file found after download".to_string())
}

/// Gets video information without downloading
pub async fn get_video_info(
    app: &tauri::AppHandle,
    url: &str,
) -> Result<VideoInfo, String> {
    let _ = app.emit("export_log", "Fetching video info...");

    let output = Command::new("yt-dlp")
        .args([
            url,
            "--dump-json",
            "--no-playlist",
        ])
        .output()
        .await
        .map_err(|e| format!("Failed to get video info: {e}"))?;

    if !output.status.success() {
        return Err("Failed to fetch video information".to_string());
    }

    let json_str = String::from_utf8_lossy(&output.stdout);
    let info: serde_json::Value = serde_json::from_str(&json_str)
        .map_err(|e| format!("Failed to parse video info: {e}"))?;

    Ok(VideoInfo {
        title: info["title"].as_str().unwrap_or("Unknown").to_string(),
        duration: info["duration"].as_f64().unwrap_or(0.0),
        uploader: info["uploader"].as_str().unwrap_or("Unknown").to_string(),
    })
}

#[derive(Debug, Clone)]
pub struct VideoInfo {
    pub title: String,
    pub duration: f64,
    pub uploader: String,
}
