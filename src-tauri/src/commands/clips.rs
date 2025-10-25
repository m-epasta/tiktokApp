// Clip detection and extraction commands
use crate::video::clipper;
use serde::{Deserialize, Serialize};
use tauri::Emitter;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClipInfo {
    pub start_time: f64,
    pub end_time: f64,
    pub duration: f64,
    pub score: f64,
}

#[tauri::command]
pub async fn detect_clips(
    app: tauri::AppHandle,
    video_path: String,
    method: Option<String>, // "scene" or "time"
) -> Result<Vec<ClipInfo>, String> {
    let method = method.unwrap_or_else(|| "scene".to_string());
    
    let _ = app.emit("export_log", "🔍 Starting clip detection...");
    
    let clips = if method == "scene" {
        // Scene-based detection (intelligent)
        let min_duration = 15.0;  // 15 seconds minimum
        let max_duration = 60.0;  // 60 seconds maximum
        let threshold = 0.3;      // Scene detection sensitivity
        
        clipper::detect_clips_by_scenes(&app, &video_path, min_duration, max_duration, threshold).await?
    } else {
        // Time-based detection (fallback)
        let _ = app.emit("export_log", "📊 Getting video duration...");
        let duration = clipper::get_video_duration(&video_path).await?;
        let _ = app.emit("export_log", format!("✓ Video duration: {duration:.1}s"));
        
        clipper::detect_clips_by_time(duration, 30.0, 5.0)
    };
    
    // Convert to ClipInfo
    let clip_infos: Vec<ClipInfo> = clips.iter().map(|c| ClipInfo {
        start_time: c.start_time,
        end_time: c.end_time,
        duration: c.duration,
        score: c.score,
    }).collect();
    
    let _ = app.emit("export_log", format!("✅ Found {} clips!", clip_infos.len()));
    
    Ok(clip_infos)
}

#[tauri::command]
pub async fn extract_and_export_clip(
    app: tauri::AppHandle,
    input: String,
    output: String,
    start_time: f64,
    duration: f64,
    with_subtitles: Option<bool>,
) -> Result<String, String> {
    let _ = app.emit("export_log", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    let _ = app.emit("export_log", format!("🎥 Processing clip: {start_time:.1}s ({duration:.1}s duration)"));
    
    // Extract the clip
    clipper::extract_clip(&app, &input, &output, start_time, duration).await?;
    
    // TODO: Add subtitle support if requested
    if with_subtitles.unwrap_or(false) {
        let _ = app.emit("export_log", "ℹ️ Subtitle support coming soon");
    }
    
    let _ = app.emit("export_log", format!("✅ Clip saved to: {output}"));
    Ok(output)
}

#[tauri::command]
pub async fn batch_export_clips(
    app: tauri::AppHandle,
    input: String,
    output_dir: String,
    clips: Vec<ClipInfo>,
    with_subtitles: Option<bool>,
) -> Result<Vec<String>, String> {
    let _ = app.emit("export_log", "═══════════════════════════════════════════");
    let _ = app.emit("export_log", format!("🚀 Starting batch export: {} clips", clips.len()));
    let _ = app.emit("export_log", format!("📁 Output directory: {output_dir}"));
    let _ = app.emit("export_log", "═══════════════════════════════════════════");
    
    // Create output directory if it doesn't exist
    let _ = app.emit("export_log", "📂 Creating output directory...");
    tokio::fs::create_dir_all(&output_dir)
        .await
        .map_err(|e| format!("Failed to create output directory: {e}"))?;
    let _ = app.emit("export_log", "✓ Output directory ready");
    
    let mut exported_files = Vec::new();

    for (index, clip) in clips.iter().enumerate() {
        let _ = app.emit("export_log", format!("\n📦 Clip {}/{}: {:.1}s - {:.1}s", index + 1, clips.len(), clip.start_time, clip.end_time));
        let output_path = format!("{}/clip_{:03}.mp4", output_dir, index + 1);
        
        extract_and_export_clip(
            app.clone(),
            input.clone(),
            output_path.clone(),
            clip.start_time,
            clip.duration,
            with_subtitles,
        )
        .await?;

        exported_files.push(output_path);
    }
    
    let _ = app.emit("export_log", "\n═══════════════════════════════════════════");
    let _ = app.emit("export_log", format!("🎉 Batch export complete! {} clips exported", exported_files.len()));
    let _ = app.emit("export_log", "═══════════════════════════════════════════");

    Ok(exported_files)
}
