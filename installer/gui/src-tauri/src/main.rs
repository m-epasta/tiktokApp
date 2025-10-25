// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::process::Command;
use tauri::{command, WebviewWindowBuilder};

#[derive(Debug, Serialize, Deserialize)]
pub struct RequirementStatus {
    name: String,
    installed: bool,
    message: String,
}

#[command]
async fn check_requirements() -> Result<Vec<RequirementStatus>, String> {
    let mut requirements = Vec::new();

    // Check Docker
    let docker_status = Command::new("docker")
        .arg("--version")
        .output()
        .is_ok();

    requirements.push(RequirementStatus {
        name: "Docker".to_string(),
        installed: docker_status,
        message: if docker_status {
            "Docker is installed".to_string()
        } else {
            "Docker needs to be installed".to_string()
        },
    });

    // Check Git
    let git_status = Command::new("git")
        .arg("--version")
        .output()
        .is_ok();

    requirements.push(RequirementStatus {
        name: "Git".to_string(),
        installed: git_status,
        message: if git_status {
            "Git is installed".to_string()
        } else {
            "Git needs to be installed".to_string()
        },
    });

    // Check Docker running
    let docker_running = Command::new("docker")
        .args(["info"])
        .output()
        .is_ok();

    requirements.push(RequirementStatus {
        name: "Docker Service".to_string(),
        installed: docker_running,
        message: if docker_running {
            "Docker service is running".to_string()
        } else {
            "Docker service needs to be started".to_string()
        },
    });

    Ok(requirements)
}

#[command]
async fn install_requirement(requirement: String) -> Result<bool, String> {
    match requirement.as_str() {
        "Docker" => {
            #[cfg(target_os = "linux")]
            {
                let install_script = include_str!("../scripts/install_docker.sh");
                std::fs::write("/tmp/install_docker.sh", install_script)
                    .map_err(|e| e.to_string())?;

                Command::new("chmod")
                    .args(["+x", "/tmp/install_docker.sh"])
                    .output()
                    .map_err(|e| e.to_string())?;

                Command::new("bash")
                    .arg("/tmp/install_docker.sh")
                    .output()
                    .map_err(|e| e.to_string())?;
            }
            Ok(true)
        }
        "Git" => {
            #[cfg(target_os = "linux")]
            {
                Command::new("sudo")
                    .args(["apt-get", "update"])
                    .output()
                    .map_err(|e| e.to_string())?;

                Command::new("sudo")
                    .args(["apt-get", "install", "-y", "git"])
                    .output()
                    .map_err(|e| e.to_string())?;
            }
            Ok(true)
        }
        _ => Err("Unsupported requirement".to_string()),
    }
}

#[command]
async fn start_docker_service() -> Result<bool, String> {
    #[cfg(target_os = "linux")]
    {
        Command::new("sudo")
            .args(["systemctl", "start", "docker"])
            .output()
            .map_err(|e| e.to_string())?;
    }
    Ok(true)
}

#[command]
async fn create_project_files(project_path: String, install_path: String) -> Result<(), String> {
    // Create project directory if it doesn't exist
    std::fs::create_dir_all(&project_path)
        .map_err(|e| format!("Failed to create project directory: {}", e))?;

    // Create installation directory if it doesn't exist
    std::fs::create_dir_all(&install_path)
        .map_err(|e| format!("Failed to create installation directory: {}", e))?;

    // Copy project files to the project directory
    let source_files = [
        "build.sh",
        "Dockerfile",
        "package.json",
        "requirements.txt",
        "README.md",
        "install.sh",
    ];

    for file in source_files.iter() {
        let source = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
            .parent()
            .ok_or("Cannot find parent directory")?
            .parent()
            .ok_or("Cannot find project root")?
            .join(file);

        let destination = std::path::Path::new(&project_path).join(file);

        if source.exists() {
            std::fs::copy(&source, &destination)
                .map_err(|e| format!("Failed to copy {}: {}", file, e))?;
        }
    }

    Ok(())
}

#[command]
async fn run_build_script(path: String) -> Result<String, String> {
    // First ensure we're in the project directory
    std::env::set_current_dir(&path)
        .map_err(|e| format!("Failed to change to project directory: {}", e))?;

    let output = Command::new("bash")
        .arg("-c")
        .arg("./build.sh")
        .output()
        .map_err(|e| format!("Failed to run build script: {}", e))?;

    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            check_requirements,
            install_requirement,
            start_docker_service,
            create_project_files,
            run_build_script
        ])
        .setup(|app| {
            // Create the main window
            WebviewWindowBuilder::new(app, "main", tauri::WebviewUrl::default())
                .title("TikTok App Installer")
                .inner_size(800.0, 600.0)
                .min_inner_size(600.0, 400.0)
                .center()
                .build()?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
