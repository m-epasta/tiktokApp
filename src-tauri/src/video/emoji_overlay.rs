// Emoji overlay system using image-based rendering
// This bypasses libass limitations and renders emojis as PNG overlays

use std::path::Path;
use tauri::Emitter;
use tokio::{
    io::{AsyncBufReadExt, BufReader},
    process::Command,
};

/// Converts video with subtitles AND emoji overlays
/// Uses image-based emoji rendering for guaranteed emoji support
pub async fn convert_with_emoji_overlays(
    app: &tauri::AppHandle,
    input: &str,
    output: &str,
    subtitle_file: &str,
) -> Result<(), String> {
    let _ = app.emit(
        "export_log",
        "🎨 Using IMAGE-BASED emoji system (guaranteed to work!)",
    );
    let _ = app.emit("export_log", "🎨 Preparing emoji overlays...");

    // Step 1: Generate emoji images if not exists
    let emoji_dir = "emoji_images";
    if Path::new(emoji_dir).exists() {
        let _ = app.emit("export_log", "✓ Emoji images already exist");
    } else {
        let _ = app.emit(
            "export_log",
            "📦 Generating emoji images (first time only)...",
        );

        let output = Command::new("python3")
            .arg("emoji_to_image.py")
            .output()
            .await
            .map_err(|e| format!("Failed to generate emoji images: {e}"))?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            let _ = app.emit("export_log", format!("❌ Error: {stderr}"));
            return Err(format!("Failed to generate emoji images: {stderr}"));
        }

        let _ = app.emit("export_log", "✓ Emoji images generated");
    }

    // Step 2: Parse ASS file and generate overlay filter
    let _ = app.emit("export_log", "🔍 Analyzing emojis in subtitles...");

    let filter_output = Command::new("python3")
        .args(["scripts/generate_emoji_overlays.py", subtitle_file])
        .output()
        .await
        .map_err(|e| format!("Failed to generate overlay filter: {e}"))?;

    if !filter_output.status.success() {
        return Err("Failed to generate emoji overlay filter".to_string());
    }

    // Step 3: Read the generated filter
    let filter_file = subtitle_file.replace(".ass", "_emoji_filter.txt");
    let emoji_filter = tokio::fs::read_to_string(&filter_file)
        .await
        .unwrap_or_default();

    // Step 4: Build FFmpeg command with both subtitles and emoji overlays
    let _ = app.emit("export_log", "🎬 Rendering video with emojis...");

    // Escape subtitle path
    let sub_escaped = subtitle_file
        .replace('\\', "\\\\")
        .replace(':', "\\:")
        .replace('\'', "\\'");

    // Complex filter: scale -> subtitles (text only) -> emoji overlays
    let filter_complex = if emoji_filter.is_empty() {
        // Fallback: just subtitles if no emojis
        format!(
            "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1,format=yuv420p,subtitles='{sub_escaped}'"
        )
    } else {
        format!(
            "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1,format=yuv420p[scaled];[scaled]subtitles='{sub_escaped}'[v0];{emoji_filter}"
        )
    };

    let args = vec![
        "-y",
        "-i",
        input,
        "-filter_complex",
        &filter_complex,
        "-map",
        "[vN]", // Use final video output from filter chain
        "-c:v",
        "libx264",
        "-preset",
        "fast",
        "-crf",
        "20",
        "-c:a",
        "aac",
        "-b:a",
        "192k",
        output,
    ];

    let mut child = Command::new("ffmpeg")
        .args(&args)
        .stderr(std::process::Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to start ffmpeg: {e}"))?;

    // Stream output
    if let Some(stderr) = child.stderr.take() {
        let mut reader = BufReader::new(stderr).lines();
        while let Ok(Some(line)) = reader.next_line().await {
            if line.contains("time=") || line.contains("frame=") {
                let _ = app.emit("export_log", format!("⏳ Encoding: {}", line.trim()));
            }
        }
    }

    let status = child
        .wait()
        .await
        .map_err(|e| format!("FFmpeg error: {e}"))?;

    if status.success() {
        let _ = app.emit("export_log", "✓ Video with emoji overlays complete!");
        Ok(())
    } else {
        Err(format!("FFmpeg failed with status: {status}"))
    }
}
