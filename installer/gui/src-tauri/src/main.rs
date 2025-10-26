// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::process::Command;
use tauri::{command, WebviewWindowBuilder, Window};

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

    // Check Node.js
    let node_status = Command::new("node")
        .arg("--version")
        .output()
        .is_ok();

    requirements.push(RequirementStatus {
        name: "Node.js".to_string(),
        installed: node_status,
        message: if node_status {
            "Node.js is installed".to_string()
        } else {
            "Node.js needs to be installed".to_string()
        },
    });

    // Check npm
    let npm_status = Command::new("npm")
        .arg("--version")
        .output()
        .is_ok();

    requirements.push(RequirementStatus {
        name: "npm".to_string(),
        installed: npm_status,
        message: if npm_status {
            "npm is installed".to_string()
        } else {
            "npm needs to be installed".to_string()
        },
    });

    // Check Rust
    let rust_status = Command::new("cargo")
        .arg("--version")
        .output()
        .is_ok();

    requirements.push(RequirementStatus {
        name: "Rust".to_string(),
        installed: rust_status,
        message: if rust_status {
            "Rust is installed".to_string()
        } else {
            "Rust needs to be installed".to_string()
        },
    });

    // Check Python3
    let python_status = Command::new("python3")
        .arg("--version")
        .output()
        .is_ok();

    requirements.push(RequirementStatus {
        name: "Python3".to_string(),
        installed: python_status,
        message: if python_status {
            "Python3 is installed".to_string()
        } else {
            "Python3 needs to be installed".to_string()
        },
    });

    // Check FFmpeg
    let ffmpeg_status = Command::new("ffmpeg")
        .arg("-version")
        .output()
        .is_ok();

    requirements.push(RequirementStatus {
        name: "FFmpeg".to_string(),
        installed: ffmpeg_status,
        message: if ffmpeg_status {
            "FFmpeg is installed".to_string()
        } else {
            "FFmpeg needs to be installed".to_string()
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
        "Node.js" => {
            #[cfg(target_os = "linux")]
            {
                Command::new("curl")
                    .args(["-fsSL", "https://deb.nodesource.com/setup_lts.x", "|", "sudo", "-E", "bash", "-"])
                    .output()
                    .map_err(|e| e.to_string())?;

                Command::new("sudo")
                    .args(["apt-get", "install", "-y", "nodejs"])
                    .output()
                    .map_err(|e| e.to_string())?;
            }
            Ok(true)
        }
        "npm" => {
            // npm comes with Node.js
            Ok(true)
        }
        "Rust" => {
            Command::new("curl")
                .args(["--proto", "=https", "--tlsv1.2", "-sSf", "https://sh.rustup.rs", "|", "sh", "-s", "--", "-y"])
                .output()
                .map_err(|e| e.to_string())?;
            Ok(true)
        }
        "Python3" => {
            #[cfg(target_os = "linux")]
            {
                Command::new("sudo")
                    .args(["apt-get", "install", "-y", "python3", "python3-pip"])
                    .output()
                    .map_err(|e| e.to_string())?;
            }
            Ok(true)
        }
        "FFmpeg" => {
            #[cfg(target_os = "linux")]
            {
                Command::new("sudo")
                    .args(["apt-get", "install", "-y", "ffmpeg"])
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
    println!("Creating project files in: {}", project_path);
    println!("Installation path: {}", install_path);

    // Create project directory if it doesn't exist
    std::fs::create_dir_all(&project_path)
        .map_err(|e| {
            println!("Failed to create project directory: {}", e);
            format!("Failed to create project directory '{}': {}", project_path, e)
        })?;

    // Create installation directory if it doesn't exist
    std::fs::create_dir_all(&install_path)
        .map_err(|e| {
            println!("Failed to create installation directory: {}", e);
            format!("Failed to create installation directory '{}': {}", install_path, e)
        })?;

    // Copy project files to the project directory
    let source_files = [
        "build.sh",
        "Dockerfile",
        "package.json",
        "requirements.txt",
        "install.sh",
    ];

    let mut copied_files = Vec::new();
    let mut failed_files = Vec::new();

    for file in source_files.iter() {
        let source = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
            .parent()
            .ok_or("Cannot find parent directory")?
            .parent()
            .ok_or("Cannot find project root")?
            .join(file);

        let destination = std::path::Path::new(&project_path).join(file);

        println!("Copying {} -> {}", source.display(), destination.display());

        if source.exists() {
            match std::fs::copy(&source, &destination) {
                Ok(_) => {
                    copied_files.push(file.to_string());
                    println!("Successfully copied: {}", file);
                },
                Err(e) => {
                    let error_msg = format!("Failed to copy {}: {}", file, e);
                    failed_files.push(error_msg.clone());
                    println!("Error copying {}: {}", file, e);
                }
            }
        } else {
            let error_msg = format!("Source file not found: {}", source.display());
            failed_files.push(error_msg.clone());
            println!("Source file not found: {}", source.display());
        }
    }

    if !failed_files.is_empty() {
        let error_summary = format!(
            "Failed to copy some files:\n{}\nSuccessfully copied: {}",
            failed_files.join("\n"),
            copied_files.join(", ")
        );
        println!("{}", error_summary);
        return Err(error_summary);
    }

    println!("Project files created successfully. Copied files: {}", copied_files.join(", "));
    Ok(())
}

#[command]
async fn run_build_script(path: String) -> Result<String, String> {
    // First ensure we're in the project directory
    std::env::set_current_dir(&path)
        .map_err(|e| format!("Failed to change to project directory: {}", e))?;

    println!("Running build script in directory: {:?}", std::env::current_dir());

    let output = Command::new("bash")
        .arg("-c")
        .arg("./build.sh")
        .output()
        .map_err(|e| format!("Failed to run build script: {}", e))?;

    // Combine stdout and stderr for complete output
    let stdout = String::from_utf8_lossy(&output.stdout);
    let stderr = String::from_utf8_lossy(&output.stderr);

    let full_output = format!("{}\n{}", stdout, stderr);

    println!("Build script output: {}", full_output);

    // Check if the command was successful
    if output.status.success() {
        Ok(full_output)
    } else {
        let error_msg = format!("Build script failed with exit code: {:?}\nOutput: {}",
                               output.status.code(), full_output);
        println!("Build error: {}", error_msg);
        Err(error_msg)
    }
}

#[command]
async fn launch_docker_app(project_path: String) -> Result<(), String> {
    println!("Attempting to launch Docker app from project path: {}", project_path);

    // Check if Docker image exists
    let check_image = Command::new("docker")
        .args(["images", "-q", "tiktok-clip-studio"])
        .output()
        .map_err(|e| format!("Failed to check Docker images: {}", e))?;

    if check_image.stdout.is_empty() {
        return Err("Docker image 'tiktok-clip-studio' not found. Please ensure the Docker build was successful.".to_string());
    }

    println!("Found Docker image, launching container");

    // Launch the Docker container with proper display and audio support
    let output = Command::new("docker")
        .args([
            "run",
            "--rm",
            "-it",
            "--name", "tiktok-clip-studio-running",
            // Display and GUI support
            "-e", "DISPLAY=:0",
            "-v", "/tmp/.X11-unix:/tmp/.X11-unix:rw",
            // Audio support
            "-e", "PULSE_SERVER=unix:/run/user/1000/pulse/native",
            "-v", "/run/user/1000/pulse:/run/user/1000/pulse:ro",
            // Network and permissions
            "--net", "host",
            "--privileged",
            // Mount project directory for any file access
            "-v", &format!("{}:/app/project:ro", project_path),
            "tiktok-clip-studio"
        ])
        .spawn()
        .map_err(|e| format!("Failed to launch Docker container: {}", e))?;

    println!("Docker container launched successfully with PID: {:?}", output.id());

    Ok(())
}

#[command]
async fn launch_built_app(project_path: String) -> Result<(), String> {
    use std::path::Path;

    println!("Attempting to launch app from project path: {}", project_path);

    // First try to use the launcher script (recommended)
    let launcher_path = Path::new(&project_path).join("dist").join("launch-tiktok-app.sh");
    println!("Checking launcher script at: {:?}", launcher_path);

    if launcher_path.exists() {
        println!("Found launcher script, using it to launch app");
        #[cfg(unix)]
        {
            Command::new("chmod")
                .args(["+x", launcher_path.to_str().unwrap()])
                .output()
                .map_err(|e| format!("Failed to make launcher executable: {}", e))?;
        }

        Command::new("bash")
            .arg(launcher_path.to_str().unwrap())
            .spawn()
            .map_err(|e| format!("Failed to launch application with launcher: {}", e))?;

        return Ok(());
    }

    // Fallback: Try to find the Tauri executable directly
    let tauri_app_path = Path::new(&project_path).join("src-tauri").join("target").join("release").join("tiktok-clip-studio");
    println!("Checking Tauri app at: {:?}", tauri_app_path);

    if tauri_app_path.exists() {
        println!("Found Tauri executable, launching directly");
        #[cfg(unix)]
        {
            Command::new("chmod")
                .args(["+x", tauri_app_path.to_str().unwrap()])
                .output()
                .map_err(|e| format!("Failed to make app executable: {}", e))?;
        }

        Command::new(tauri_app_path)
            .spawn()
            .map_err(|e| format!("Failed to launch Tauri application: {}", e))?;

        return Ok(());
    }

    // Last resort: Check if there's a binary in dist
    let dist_app_path = Path::new(&project_path).join("dist").join("tiktok-clip-studio");
    println!("Checking dist app at: {:?}", dist_app_path);

    if dist_app_path.exists() {
        println!("Found app in dist directory");
        #[cfg(unix)]
        {
            Command::new("chmod")
                .args(["+x", dist_app_path.to_str().unwrap()])
                .output()
                .map_err(|e| format!("Failed to make app executable: {}", e))?;
        }

        Command::new(dist_app_path)
            .spawn()
            .map_err(|e| format!("Failed to launch application from dist: {}", e))?;

        return Ok(());
    }

    // If we get here, no executable was found
    let error_msg = format!(
        "Built application not found. Checked locations:\n\
         - Launcher script: {:?}\n\
         - Tauri executable: {:?}\n\
         - Dist executable: {:?}\n\
         Please ensure the build was successful and the application was built correctly.",
        launcher_path, tauri_app_path, dist_app_path
    );

    println!("{}", error_msg);
    Err(error_msg)
}

#[command]
async fn run_full_setup(sudoPassword: String) -> Result<String, String> {
    println!("Tauri command run_full_setup called with password length: {}", sudoPassword.len());

    // Write progress updates to file
    let progress_file = "/tmp/installer_progress.json";
    let error_file = "/tmp/installer_errors.json";
    let log_file = "/tmp/installer.log";

    // Clear previous files
    std::fs::write(progress_file, "").map_err(|e| format!("Failed to clear progress file: {}", e))?;
    std::fs::write(error_file, "").map_err(|e| format!("Failed to clear error file: {}", e))?;
    std::fs::write(log_file, "").map_err(|e| format!("Failed to clear log file: {}", e))?;

    // Helper function to log messages
    let log = |level: &str, message: &str| {
        let timestamp = std::process::Command::new("date")
            .arg("+%Y-%m-%d %H:%M:%S")
            .output()
            .ok()
            .and_then(|output| String::from_utf8(output.stdout).ok())
            .unwrap_or_else(|| "unknown".to_string())
            .trim().to_string();

        let log_entry = format!("[{}] {} - {}\n", level, timestamp, message);
        std::fs::write(log_file, log_entry).ok();
        println!("{}", log_entry.trim());
    };

    // Helper function to update progress
    let update_progress = |step: &str| {
        let timestamp = std::process::Command::new("date")
            .arg("+%Y-%m-%d %H:%M:%S")
            .output()
            .ok()
            .and_then(|output| String::from_utf8(output.stdout).ok())
            .unwrap_or_else(|| "unknown".to_string())
            .trim().to_string();

        let progress_entry = format!("{{\"step\": \"{}\", \"timestamp\": \"{}\", \"step_number\": \"1\"}}\n", step, timestamp);
        std::fs::write(progress_file, progress_entry).ok();
    };

    // Install system dependencies
    #[cfg(target_os = "linux")]
    {
        log("INFO", "Starting system dependencies installation");
        update_progress("Installing system dependencies...");

        log("INFO", "Updating package list");
        let output = Command::new("echo")
            .args([sudoPassword.as_str(), "|", "sudo", "-S", "apt-get", "update"])
            .output()
            .map_err(|e| format!("Failed to update package list: {}", e))?;

        if !output.status.success() {
            let error_msg = format!("Package update failed: {}", String::from_utf8_lossy(&output.stderr));
            std::fs::write(error_file, format!("{{\"error\": \"{}\", \"timestamp\": \"$(date '+%Y-%m-%d %H:%M:%S')\"}}", error_msg)).ok();
            return Err(error_msg);
        }

        log("SUCCESS", "Package list updated successfully");
        log("INFO", "Installing system packages");
        let output = Command::new("echo")
            .args([sudoPassword.as_str(), "|", "sudo", "-S", "apt-get", "install", "-y", "build-essential", "curl", "wget", "git", "python3", "python3-pip", "nodejs", "npm"])
            .output()
            .map_err(|e| format!("Failed to install system dependencies: {}", e))?;

        if !output.status.success() {
            let error_msg = format!("System dependencies installation failed: {}", String::from_utf8_lossy(&output.stderr));
            std::fs::write(error_file, format!("{{\"error\": \"{}\", \"timestamp\": \"$(date '+%Y-%m-%d %H:%M:%S')\"}}", error_msg)).ok();
            return Err(error_msg);
        }

        log("SUCCESS", "System dependencies installed successfully");
    }

    // Install Rust
    log("INFO", "Installing Rust programming language");
    update_progress("Installing Rust programming language...");

    let output = Command::new("curl")
        .args(["--proto", "=https", "--tlsv1.2", "-sSf", "https://sh.rustup.rs", "|", "sh", "-s", "--", "-y"])
        .output()
        .map_err(|e| format!("Failed to install Rust: {}", e))?;

    if !output.status.success() {
        let error_msg = format!("Rust installation failed: {}", String::from_utf8_lossy(&output.stderr));
        std::fs::write(error_file, format!("{{\"error\": \"{}\", \"timestamp\": \"$(date '+%Y-%m-%d %H:%M:%S')\"}}", error_msg)).ok();
        return Err(error_msg);
    }

    log("SUCCESS", "Rust installed successfully");

    // Install Python dependencies
    log("INFO", "Installing Python dependencies");
    update_progress("Installing Python dependencies...");

    let output = Command::new("python3")
        .args(["-m", "pip", "install", "--upgrade", "pip"])
        .output()
        .map_err(|e| format!("Failed to upgrade pip: {}", e))?;

    if !output.status.success() {
        let error_msg = format!("Pip upgrade failed: {}", String::from_utf8_lossy(&output.stderr));
        std::fs::write(error_file, format!("{{\"error\": \"{}\", \"timestamp\": \"$(date '+%Y-%m-%d %H:%M:%S')\"}}", error_msg)).ok();
        return Err(error_msg);
    }

    let output = Command::new("python3")
        .args(["-m", "pip", "install", "-r", "requirements.txt"])
        .output()
        .map_err(|e| format!("Failed to install Python dependencies: {}", e))?;

    if !output.status.success() {
        let error_msg = format!("Python dependencies installation failed: {}", String::from_utf8_lossy(&output.stderr));
        std::fs::write(error_file, format!("{{\"error\": \"{}\", \"timestamp\": \"$(date '+%Y-%m-%d %H:%M:%S')\"}}", error_msg)).ok();
        return Err(error_msg);
    }

    log("SUCCESS", "Python dependencies installed successfully");

    // Install Node.js dependencies
    log("INFO", "Installing Node.js dependencies");
    update_progress("Installing Node.js dependencies...");

    let output = Command::new("npm")
        .arg("install")
        .output()
        .map_err(|e| format!("Failed to install Node.js dependencies: {}", e))?;

    if !output.status.success() {
        let error_msg = format!("Node.js dependencies installation failed: {}", String::from_utf8_lossy(&output.stderr));
        std::fs::write(error_file, format!("{{\"error\": \"{}\", \"timestamp\": \"$(date '+%Y-%m-%d %H:%M:%S')\"}}", error_msg)).ok();
        return Err(error_msg);
    }

    log("SUCCESS", "Node.js dependencies installed successfully");

    // Install Tauri CLI
    log("INFO", "Installing Tauri CLI");
    update_progress("Installing Tauri CLI...");

    let output = Command::new("cargo")
        .args(["install", "tauri-cli"])
        .output()
        .map_err(|e| format!("Failed to install Tauri CLI: {}", e))?;

    if !output.status.success() {
        let error_msg = format!("Tauri CLI installation failed: {}", String::from_utf8_lossy(&output.stderr));
        std::fs::write(error_file, format!("{{\"error\": \"{}\", \"timestamp\": \"$(date '+%Y-%m-%d %H:%M:%S')\"}}", error_msg)).ok();
        return Err(error_msg);
    }

    log("SUCCESS", "Tauri CLI installed successfully");
    log("SUCCESS", "Full setup completed successfully!");
    update_progress("Setup completed successfully!");

    Ok("Full setup completed successfully!".to_string())
}

#[command]
async fn show_styled_popup(window: Window, title: String, message: String, popup_type: String, icon: String) -> Result<(), String> {
    use std::process::Command;

    // Use system commands to show native dialogs
    let result = match popup_type.as_str() {
        "success" => {
            // Try macOS first, then Linux GUI tools, fallback to echo
            Command::new("osascript")
                .args(&["-e", &format!("display dialog \"{}\" with title \"{}\" buttons {{\"OK\"}} default button \"OK\"", message, title)])
                .output()
                .or_else(|_| {
                    Command::new("zenity")
                        .args(&["--info", "--title", &title, "--text", &message])
                        .output()
                })
                .or_else(|_| {
                    Command::new("kdialog")
                        .args(&["--msgbox", &message])
                        .output()
                })
                .or_else(|_| {
                    Command::new("echo")
                        .arg(&format!("[SUCCESS] {}: {}", title, message))
                        .output()
                })
        }
        "error" => {
            // Try macOS first, then Linux GUI tools, fallback to echo
            Command::new("osascript")
                .args(&["-e", &format!("display dialog \"{}\" with title \"{}\" buttons {{\"OK\"}} default button \"OK\" with icon stop", message, title)])
                .output()
                .or_else(|_| {
                    Command::new("zenity")
                        .args(&["--error", "--title", &title, "--text", &message])
                        .output()
                })
                .or_else(|_| {
                    Command::new("kdialog")
                        .args(&["--error", &message])
                        .output()
                })
                .or_else(|_| {
                    Command::new("echo")
                        .arg(&format!("[ERROR] {}: {}", title, message))
                        .output()
                })
        }
        _ => {
            // Default to info dialog
            Command::new("osascript")
                .args(&["-e", &format!("display dialog \"{}\" with title \"{}\" buttons {{\"OK\"}} default button \"OK\"", message, title)])
                .output()
                .or_else(|_| {
                    Command::new("zenity")
                        .args(&["--info", "--title", &title, "--text", &message])
                        .output()
                })
                .or_else(|_| {
                    Command::new("kdialog")
                        .args(&["--msgbox", &message])
                        .output()
                })
                .or_else(|_| {
                    Command::new("echo")
                        .arg(&format!("[INFO] {}: {}", title, message))
                        .output()
                })
        }
    };

    match result {
        Ok(_) => Ok(()),
        Err(e) => Err(format!("Failed to show dialog: {}", e))
    }
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            check_requirements,
            install_requirement,
            start_docker_service,
            create_project_files,
            run_build_script,
            launch_built_app,
            launch_docker_app,
            run_full_setup,
            show_styled_popup
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
