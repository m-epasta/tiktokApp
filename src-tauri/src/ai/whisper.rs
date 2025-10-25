use tauri::{AppHandle, Manager};
use tokio::process::Command;

/// Transcribes audio using the AI-enhanced whisper script and returns the path to the ASS file.
#[tauri::command]
pub async fn transcribe_with_faster_whisper(
    app: &AppHandle,
    audio_path: &str,
    model: &str,
) -> Result<String, String> {
    // Resolve the path to the transcription script
    let script_path = app
        .path()
        .resolve(
            "../scripts/whisper_transcribe.py",
            tauri::path::BaseDirectory::Resource,
        )
        .map_err(|_| "failed to resolve whisper_transcribe.py resource".to_string())?;

    // Define the output path for the subtitles (the script will convert .srt to .ass)
    let srt_path = audio_path.replace(".wav", ".srt");
    let ass_path = audio_path.replace(".wav", ".ass");

    // Execute the python script
    let output = Command::new("python3")
        .arg(script_path)
        .arg(audio_path)
        .arg(&srt_path)
        .arg(model)
        .output()
        .await
        .map_err(|e| format!("Failed to execute whisper script: {e}"))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!(
            "Whisper script failed with status {}: {}\nStdout: {}",
            output.status,
            stderr,
            String::from_utf8_lossy(&output.stdout)
        ));
    }

    // The script saves the file to ass_path, so we return that path
    Ok(ass_path)
}
