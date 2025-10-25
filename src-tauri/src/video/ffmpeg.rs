// FFmpeg wrapper utilities for video processing with SaaS-quality error handling
use tauri::Emitter;
use tokio::{
    io::{AsyncBufReadExt, BufReader},
    process::Command,
};

/// Converts a video to `TikTok` format (1080x1920, 9:16 aspect ratio)
/// Emits progress logs to the frontend via the app handle
pub async fn convert_to_tiktok(
    app: &tauri::AppHandle,
    input: &str,
    output: &str,
) -> Result<(), String> {
    let args = vec![
        "-y",       // Overwrite output file
        "-i",
        input,
        "-vf",
        // Scale to fit within 1080x1920 maintaining aspect, then pad to exact size
        "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1,format=yuv420p",
        "-c:v",
        "libx264",  // H.264 codec
        "-preset",
        "fast",     // Changed from "medium" to "fast" for better performance
        "-crf",
        "20",       // Quality (lower = better, 18-23 is good)
        "-c:a",
        "aac",      // Audio codec
        "-b:a",
        "192k",     // Audio bitrate
        "-progress",
        "pipe:2",   // Output progress to stderr
        output,
    ];

    let _ = app.emit("export_log", "Starting FFmpeg conversion...");

    let mut child = Command::new("ffmpeg")
        .args(&args)
        .stderr(std::process::Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to start ffmpeg: {e}"))?;

    // Stream FFmpeg stderr output to frontend
    if let Some(stderr) = child.stderr.take() {
        let mut reader = BufReader::new(stderr).lines();
        while let Ok(Some(line)) = reader.next_line().await {
            // Emit progress updates
            if line.contains("time=") || line.contains("frame=") || line.contains("fps=") {
                let _ = app.emit("export_log", format!("⏳ Encoding: {}", line.trim()));
            } else {
                let _ = app.emit("export_log", &line);
            }
        }
    }

    let status = child
        .wait()
        .await
        .map_err(|e| format!("Failed to wait for ffmpeg: {e}"))?;

    if status.success() {
        let _ = app.emit("export_log", format!("✓ Export complete: {output}"));
        Ok(())
    } else {
        Err(format!("FFmpeg exited with status: {status}"))
    }
}

/// Converts a video to `TikTok` format WITH subtitle overlay
/// Subtitles are burned into the video permanently
/// Uses ASS format for precise center positioning
pub async fn convert_with_subtitles(
    app: &tauri::AppHandle,
    input: &str,
    output: &str,
    subtitle_file: &str,
) -> Result<(), String> {
    // Escape subtitle path for FFmpeg filter (proper escaping for all special chars)
    let sub_escaped = subtitle_file
        .replace('\\', "\\\\")
        .replace(':', "\\:")
        .replace('\'', "\\'")
        .replace('[', "\\[")
        .replace(']', "\\]");
    
    // NUCLEAR OPTION: Use subtitles filter with explicit font file path
    // This bypasses fontconfig and directly loads the emoji font
    let filter_string = format!(
        "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1,format=yuv420p,subtitles='{sub_escaped}':fontsdir=/usr/share/fonts/truetype/noto"
    );

    let args = vec![
        "-y",
        "-i",
        input,
        "-vf",
        &filter_string,
        "-c:v",
        "libx264",
        "-preset",
        "fast",  // Changed from "medium" to "fast" for better performance
        "-crf",
        "20",
        "-c:a",
        "aac",
        "-b:a",
        "192k",
        "-progress",
        "pipe:2",  // Output progress to stderr
        output,
    ];

    let _ = app.emit("export_log", "Starting FFmpeg with subtitles...");

    let mut child = Command::new("ffmpeg")
        .args(&args)
        .stderr(std::process::Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to start ffmpeg: {e}"))?;

    if let Some(stderr) = child.stderr.take() {
        let mut reader = BufReader::new(stderr).lines();
        while let Ok(Some(line)) = reader.next_line().await {
            // Emit progress updates
            if line.contains("time=") || line.contains("frame=") || line.contains("fps=") {
                let _ = app.emit("export_log", format!("⏳ Encoding: {}", line.trim()));
            } else {
                let _ = app.emit("export_log", &line);
            }
        }
    }

    let status = child.wait().await.map_err(|e| format!("Failed to wait for ffmpeg: {e}"))?;

    if status.success() {
        let _ = app.emit("export_log", format!("✓ Export with subtitles complete: {output}"));
        Ok(())
    } else {
        Err(format!("FFmpeg exited with status: {status}"))
    }
}

/// Extracts audio from video to WAV format (for Whisper transcription)
pub async fn extract_audio(
    app: &tauri::AppHandle,
    video_path: &str,
    audio_output: &str,
) -> Result<(), String> {
    let args = vec![
        "-y",
        "-i",
        video_path,
        "-vn",          // No video
        "-acodec",
        "pcm_s16le",    // 16-bit PCM (Whisper-compatible)
        "-ar",
        "16000",        // 16kHz sample rate (Whisper default)
        "-ac",
        "1",            // Mono
        audio_output,
    ];

    let _ = app.emit("export_log", "Extracting audio for transcription...");

    let mut child = Command::new("ffmpeg")
        .args(&args)
        .stderr(std::process::Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to extract audio: {e}"))?;

    if let Some(stderr) = child.stderr.take() {
        let mut reader = BufReader::new(stderr).lines();
        while let Ok(Some(line)) = reader.next_line().await {
            let _ = app.emit("export_log", &line);
        }
    }

    let status = child.wait().await.map_err(|e| format!("Failed to wait for ffmpeg: {e}"))?;

    if status.success() {
        let _ = app.emit("export_log", "✓ Audio extracted");
        Ok(())
    } else {
        Err(format!("Audio extraction failed: {status}"))
    }
}
