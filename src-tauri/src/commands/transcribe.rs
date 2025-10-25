// Transcription command - generates subtitles from video audio
use crate::ai::whisper;
use crate::video::ffmpeg;

#[tauri::command]
pub async fn generate_subtitles(
    app: tauri::AppHandle,
    video_path: String,
    model_size: Option<String>,
) -> Result<String, String> {
    // Use base model by default (good balance of speed/quality)
    let model = model_size.unwrap_or_else(|| "base".to_string());

    // Step 1: Extract audio from video
    let audio_path = video_path.replace(".mp4", "_audio.wav");
    ffmpeg::extract_audio(&app, &video_path, &audio_path).await?;

    // Step 2: Transcribe audio with faster-whisper (returns ASS file path)
    let ass_path = whisper::transcribe_with_faster_whisper(&app, &audio_path, &model).await?;

    // Step 3: Clean up temporary audio file
    let _ = tokio::fs::remove_file(&audio_path).await;

    Ok(ass_path)
}

#[tauri::command]
pub async fn export_with_auto_subs(
    app: tauri::AppHandle,
    input: String,
    output: String,
    model_size: Option<String>,
) -> Result<String, String> {
    // Generate subtitles (returns ASS file path)
    let ass_path = generate_subtitles(app.clone(), input.clone(), model_size).await?;

    // Export video with word-by-word subtitles burned in center
    ffmpeg::convert_with_subtitles(&app, &input, &output, &ass_path).await?;

    // Clean up ASS file
    let _ = tokio::fs::remove_file(&ass_path).await;

    Ok(format!("Export complete with word-by-word subtitles: {output}"))
}
