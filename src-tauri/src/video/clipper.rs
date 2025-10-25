// Intelligent clip detection and extraction
use serde::{Deserialize, Serialize};
use std::process::Stdio;
use tauri::Emitter;
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::Command;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Clip {
    pub start_time: f64,
    pub end_time: f64,
    pub duration: f64,
    pub score: f64, // Quality/interest score (0-1)
}

/// Detects interesting clips in a video using scene detection
/// Returns a list of potential clips with timestamps
#[allow(clippy::too_many_lines, clippy::cast_possible_truncation, clippy::cast_sign_loss, clippy::cast_precision_loss)]
pub async fn detect_clips_by_scenes(
    app: &tauri::AppHandle,
    video_path: &str,
    min_clip_duration: f64,  // Minimum clip length in seconds (e.g., 15)
    max_clip_duration: f64,  // Maximum clip length in seconds (e.g., 60)
    scene_threshold: f64,    // Scene change sensitivity (0.1-0.9, default 0.3)
) -> Result<Vec<Clip>, String> {
    let _ = app.emit("export_log", "🔍 Starting intelligent clip detection...");
    let _ = app.emit("export_log", format!("📋 Settings: {min_clip_duration:.0}s-{max_clip_duration:.0}s clips, scene threshold: {scene_threshold:.2}"));

    let _ = app.emit("export_log", "🎬 Analyzing video for scene changes...");
    
    // Get video duration first
    let video_duration = get_video_duration(video_path).await?;
    let _ = app.emit("export_log", format!("📊 Video duration: {video_duration:.1}s"));
    
    // Use FFmpeg's scene detection filter - faster with lower resolution
    let mut child = Command::new("ffmpeg")
        .args([
            "-i",
            video_path,
            "-vf",
            &format!("scale=320:-1,select='gt(scene,{scene_threshold})',showinfo"),
            "-an",  // No audio processing
            "-f",
            "null",
            "-",
        ])
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to run scene detection: {e}"))?;

    let mut scene_times = Vec::new();
    let mut last_log_count = 0;

    // Parse FFmpeg output for scene change timestamps
    if let Some(stderr) = child.stderr.take() {
        let mut reader = BufReader::new(stderr).lines();
        while let Ok(Some(line)) = reader.next_line().await {
            // Look for lines like: "pts_time:12.345"
            if let Some(pts_idx) = line.find("pts_time:") {
                let time_str = &line[pts_idx + 9..];
                if let Some(end_idx) = time_str.find(' ') {
                    if let Ok(time) = time_str[..end_idx].parse::<f64>() {
                        scene_times.push(time);
                        
                        // Log progress every 10 scenes
                        if scene_times.len() % 10 == 0 && scene_times.len() != last_log_count {
                            let _ = app.emit("export_log", format!("📊 Found {} scene changes so far...", scene_times.len()));
                            last_log_count = scene_times.len();
                        }
                    }
                } else {
                    // If no space found, try to parse the rest of the string
                    if let Ok(time) = time_str.trim().parse::<f64>() {
                        scene_times.push(time);
                        
                        if scene_times.len() % 10 == 0 && scene_times.len() != last_log_count {
                            let _ = app.emit("export_log", format!("📊 Found {} scene changes so far...", scene_times.len()));
                            last_log_count = scene_times.len();
                        }
                    }
                }
            }
        }
    }

    let _ = child.wait().await;

    // Sort and dedup scene times (just in case)
    scene_times.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));
    scene_times.dedup();

    let _ = app.emit(
        "export_log",
        format!("✓ Scene detection complete: {} scene changes found", scene_times.len()),
    );

    // If no scene changes found, fall back to time-based detection
    if scene_times.is_empty() {
        let _ = app.emit("export_log", "⚠️ No scene changes found, using time-based detection");
        return Ok(detect_clips_by_time(video_duration, f64::midpoint(min_clip_duration, max_clip_duration), 2.0));
    }

    let _ = app.emit("export_log", "🎯 Creating clips from scene data...");
    
    // Convert scene changes into clips
    let mut clips = Vec::new();
    let mut current_start = 0.0;

    for &scene_time in &scene_times {
        let duration = scene_time - current_start;

        // If the segment is within our duration range, create a clip
        if duration >= min_clip_duration && duration <= max_clip_duration {
            clips.push(Clip {
                start_time: current_start,
                end_time: scene_time,
                duration,
                score: 0.5, // Placeholder score
            });
        } else if duration > max_clip_duration {
            // Split long segments into multiple clips
            let num_clips = (duration / max_clip_duration).ceil() as usize;
            let clip_duration = duration / num_clips as f64;

            for i in 0..num_clips {
                let start = (i as f64).mul_add(clip_duration, current_start);
                let end = start + clip_duration;
                clips.push(Clip {
                    start_time: start,
                    end_time: end,
                    duration: clip_duration,
                    score: 0.5,
                });
            }
        } else {
            // Duration is too short, do nothing and wait for the next segment.
        }
        current_start = scene_time;
    }

    // Handle the last segment from the last scene change to end of video
    let last_duration = video_duration - current_start;
    if last_duration >= min_clip_duration {
        if last_duration <= max_clip_duration {
            clips.push(Clip {
                start_time: current_start,
                end_time: video_duration,
                duration: last_duration,
                score: 0.5,
            });
        } else {
            // Split the last long segment
            let num_clips = (last_duration / max_clip_duration).ceil() as usize;
            let clip_duration = last_duration / num_clips as f64;
            
            for i in 0..num_clips {
                let start = (i as f64).mul_add(clip_duration, current_start);
                let end = if i == num_clips - 1 {
                    video_duration
                } else {
                    start + clip_duration
                };
                clips.push(Clip {
                    start_time: start,
                    end_time: end,
                    duration: end - start,
                    score: 0.5,
                });
            }
        }
    }

    let _ = app.emit(
        "export_log",
        format!("✅ Generated {} clips (total duration: {:.1}s)", clips.len(), clips.iter().map(|c| c.duration).sum::<f64>()),
    );
    
    Ok(clips)
}

/// Simple time-based clip extraction (fallback if scene detection fails)
/// Splits video into fixed-duration chunks
#[allow(clippy::while_float)]
pub fn detect_clips_by_time(
    video_duration: f64,
    clip_duration: f64, // Target clip length (e.g., 30 seconds)
    overlap: f64,       // Overlap between clips (e.g., 5 seconds)
) -> Vec<Clip> {
    let mut clips = Vec::new();
    let mut current_time = 0.0;

    while current_time < video_duration {
        let end_time = (current_time + clip_duration).min(video_duration);
        let duration = end_time - current_time;

        if duration >= 10.0 {
            // Only create clips >= 10 seconds
            clips.push(Clip {
                start_time: current_time,
                end_time,
                duration,
                score: 0.5,
            });
        }

        current_time += clip_duration - overlap;
    }

    clips
}

/// Extracts a specific clip from a video
/// Outputs a new video file with the specified time range
pub async fn extract_clip(
    app: &tauri::AppHandle,
    input_path: &str,
    output_path: &str,
    start_time: f64,
    duration: f64,
) -> Result<(), String> {
    let _ = app.emit(
        "export_log",
        format!("✂️ Extracting clip: {:.1}s → {:.1}s ({:.1}s duration)", start_time, start_time + duration, duration),
    );

    let mut child = Command::new("ffmpeg")
        .args([
            "-y",
            "-ss",
            &start_time.to_string(),
            "-i",
            input_path,
            "-t",
            &duration.to_string(),
            "-c",
            "copy", // Fast copy without re-encoding
            output_path,
        ])
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to extract clip: {e}"))?;

    if let Some(stderr) = child.stderr.take() {
        let mut reader = BufReader::new(stderr).lines();
        while let Ok(Some(line)) = reader.next_line().await {
            let _ = app.emit("export_log", &line);
        }
    }

    let status = child.wait().await.map_err(|e| format!("FFmpeg error: {e}"))?;

    if status.success() {
        let _ = app.emit("export_log", "✓ Clip extracted successfully");
        Ok(())
    } else {
        let _ = app.emit("export_log", "❌ Clip extraction failed");
        Err("Clip extraction failed".to_string())
    }
}

/// Gets video duration in seconds
pub async fn get_video_duration(video_path: &str) -> Result<f64, String> {
    let output = Command::new("ffprobe")
        .args([
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
            video_path,
        ])
        .output()
        .await
        .map_err(|e| format!("Failed to run ffprobe: {e}"))?;

    let duration_str = String::from_utf8_lossy(&output.stdout);
    duration_str
        .trim()
        .parse::<f64>()
        .map_err(|e| format!("Failed to parse duration: {e}"))
}