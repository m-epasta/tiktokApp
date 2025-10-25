#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
#![warn(clippy::all, clippy::pedantic, clippy::nursery)]
#![allow(clippy::module_name_repetitions)]

//! `TikTok` Clip Studio - Professional Video Editing Suite
//!
//! A production-grade application for creating engaging `TikTok` content with:
//! - AI-powered transcription and subtitle generation
//! - Intelligent clip detection and scene analysis
//! - `YouTube` video downloading and processing
//! - Professional video format conversion
//!
//! Version: 2.0.0
//! License: MIT

// Module declarations
mod ai;
mod commands;
mod subtitle;
mod video;

// Import commands
use commands::subtitle as subtitle_cmd;
use commands::{clips, export, transcribe, youtube};

/// Application version
pub const VERSION: &str = env!("CARGO_PKG_VERSION");

/// Application name
pub const APP_NAME: &str = "TikTok Clip Studio";

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Initialize logging
    env_logger::Builder::from_default_env()
        .filter_level(log::LevelFilter::Info)
        .init();

    log::info!("{APP_NAME} v{VERSION} starting...");

    // Build and run application
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            export::export_tiktok,
            export::export_with_subs,
            transcribe::generate_subtitles,
            transcribe::export_with_auto_subs,
            clips::detect_clips,
            clips::extract_and_export_clip,
            clips::batch_export_clips,
            youtube::download_youtube,
            youtube::get_youtube_info,
            youtube::download_and_export,
            subtitle_cmd::create_subtitles,
            subtitle_cmd::overlay_subtitles,
            subtitle_cmd::generate_and_overlay_subtitles,
            subtitle_cmd::read_subtitle_file,
        ])
        .run(tauri::generate_context!())
        .unwrap_or_else(|err| {
            log::error!("Fatal error running application: {err}");
            std::process::exit(1);
        });
}

fn main() {
    run();
}
