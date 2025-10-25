use tauri::{command, Manager};use tauri::{command, Manager};

use serde::{Deserialize, Serialize};use serde::{Deserialize, Serialize};

use std::process::Command;use std::process::Command;



#[derive(Debug, Serialize, Deserialize)]#[derive(Debug, Serialize, Deserialize)]

pub struct InstallStatus {pub struct InstallStatus {

    docker: bool,    docker: bool,

    git: bool,    git: bool,

    disk_space: bool,    disk_space: bool,

    docker_running: bool,    docker_running: bool,

}}



#[derive(Debug, Serialize, Deserialize)]#[derive(Debug, Serialize, Deserialize)]

pub struct RequirementStatus {pub struct RequirementStatus {

    name: String,    name: String,

    installed: bool,    installed: bool,

    message: String,    message: String,

}}



#[command]#[command]

pub async fn check_requirements() -> Result<Vec<RequirementStatus>, String> {pub async fn check_requirements() -> Result<Vec<RequirementStatus>, String> {

    let mut requirements = Vec::new();    let mut requirements = Vec::new();

        

    // Check Docker    // Check Docker

    let docker_status = Command::new("docker")    let docker_status = Command::new("docker")

        .arg("--version")        .arg("--version")

        .output()        .output()

        .is_ok();        .is_ok();

        

    requirements.push(RequirementStatus {    requirements.push(RequirementStatus {

        name: "Docker".to_string(),        name: "Docker".to_string(),

        installed: docker_status,        installed: docker_status,

        message: if docker_status {        message: if docker_status {

            "Docker is installed".to_string()            "Docker is installed".to_string()

        } else {        } else {

            "Docker needs to be installed".to_string()            "Docker needs to be installed".to_string()

        },        },

    });    });

        

    // Check Git    // Check Git

    let git_status = Command::new("git")    let git_status = Command::new("git")

        .arg("--version")        .arg("--version")

        .output()        .output()

        .is_ok();        .is_ok();

        

    requirements.push(RequirementStatus {    requirements.push(RequirementStatus {

        name: "Git".to_string(),        name: "Git".to_string(),

        installed: git_status,        installed: git_status,

        message: if git_status {        message: if git_status {

            "Git is installed".to_string()            "Git is installed".to_string()

        } else {        } else {

            "Git needs to be installed".to_string()            "Git needs to be installed".to_string()

        },        },

    });    });

        

    // Check Docker running    // Check Docker running

    let docker_running = Command::new("docker")    let docker_running = Command::new("docker")

        .args(["info"])        .args(["info"])

        .output()        .output()

        .is_ok();        .is_ok();

        

    requirements.push(RequirementStatus {    requirements.push(RequirementStatus {

        name: "Docker Service".to_string(),        name: "Docker Service".to_string(),

        installed: docker_running,        installed: docker_running,

        message: if docker_running {        message: if docker_running {

            "Docker service is running".to_string()            "Docker service is running".to_string()

        } else {        } else {

            "Docker service needs to be started".to_string()            "Docker service needs to be started".to_string()

        },        },

    });    });

        

    Ok(requirements)    Ok(requirements)

}}



#[command]#[command]

pub async fn install_requirement(requirement: &str) -> Result<bool, String> {pub async fn install_requirement(requirement: &str) -> Result<bool, String> {

    match requirement {    match requirement {

        "Docker" => {        "Docker" => {

            #[cfg(target_os = "linux")]            #[cfg(target_os = "linux")]

            {            {

                let install_script = include_str!("../scripts/install_docker.sh");                let install_script = include_str!("../scripts/install_docker.sh");

                std::fs::write("/tmp/install_docker.sh", install_script)                std::fs::write("/tmp/install_docker.sh", install_script)

                    .map_err(|e| e.to_string())?;                    .map_err(|e| e.to_string())?;

                Command::new("chmod")                Command::new("chmod")

                    .args(["+x", "/tmp/install_docker.sh"])                    .args(["+x", "/tmp/install_docker.sh"])

                    .output()                    .output()

                    .map_err(|e| e.to_string())?;                    .map_err(|e| e.to_string())?;

                Command::new("/tmp/install_docker.sh")                Command::new("/tmp/install_docker.sh")

                    .output()                    .output()

                    .map_err(|e| e.to_string())?;                    .map_err(|e| e.to_string())?;

            }            }

            Ok(true)            Ok(true)

        }        }

        "Git" => {        "Git" => {

            #[cfg(target_os = "linux")]            #[cfg(target_os = "linux")]

            {            {

                Command::new("sudo")                Command::new("sudo")

                    .args(["apt-get", "update"])                    .args(["apt-get", "update"])

                    .output()                    .output()

                    .map_err(|e| e.to_string())?;                    .map_err(|e| e.to_string())?;

                Command::new("sudo")                Command::new("sudo")

                    .args(["apt-get", "install", "-y", "git"])                    .args(["apt-get", "install", "-y", "git"])

                    .output()                    .output()

                    .map_err(|e| e.to_string())?;                    .map_err(|e| e.to_string())?;

            }            }

            Ok(true)            Ok(true)

        }        }

        _ => Err("Unsupported requirement".to_string()),        _ => Err("Unsupported requirement".to_string()),

    }    }

}}



#[command]#[command]

pub async fn start_docker_service() -> Result<bool, String> {pub async fn start_docker_service() -> Result<bool, String> {

    #[cfg(target_os = "linux")]    #[cfg(target_os = "linux")]

    {    {

        Command::new("sudo")        Command::new("sudo")

            .args(["systemctl", "start", "docker"])            .args(["systemctl", "start", "docker"])

            .output()            .output()

            .map_err(|e| e.to_string())?;            .map_err(|e| e.to_string())?;

    }    }

    Ok(true)    Ok(true)

}}



#[command]#[command]

pub async fn create_project_files(project_path: &str, install_path: &str) -> Result<(), String> {pub async fn create_project_files(project_path: &str, install_path: &str) -> Result<(), String> {

    // Create project directory if it doesn't exist    // Create project directory if it doesn't exist

    std::fs::create_dir_all(project_path)    std::fs::create_dir_all(project_path)

        .map_err(|e| format!("Failed to create project directory: {}", e))?;        .map_err(|e| format!("Failed to create project directory: {}", e))?;



    // Create installation directory if it doesn't exist    // Create installation directory if it doesn't exist

    std::fs::create_dir_all(install_path)    std::fs::create_dir_all(install_path)

        .map_err(|e| format!("Failed to create installation directory: {}", e))?;        .map_err(|e| format!("Failed to create installation directory: {}", e))?;



    // Copy project files to the project directory    // Copy project files to the project directory

    // You might want to customize this based on your needs    // You might want to customize this based on your needs

    let source_files = [    let source_files = [

        "build.sh",        "build.sh",

        "Dockerfile",        "Dockerfile",

        "package.json",        "package.json",

        "requirements.txt",        "requirements.txt",

        // Add other files and directories as needed        // Add other files and directories as needed

    ];    ];



    for file in source_files.iter() {    for file in source_files.iter() {

        let source = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))        let source = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))

            .parent()            .parent()

            .ok_or("Cannot find parent directory")?            .ok_or("Cannot find parent directory")?

            .parent()            .parent()

            .ok_or("Cannot find project root")?            .ok_or("Cannot find project root")?

            .join(file);            .join(file);



        let destination = std::path::Path::new(project_path).join(file);        let destination = std::path::Path::new(project_path).join(file);



        if source.exists() {        if source.exists() {

            std::fs::copy(&source, &destination)            std::fs::copy(&source, &destination)

                .map_err(|e| format!("Failed to copy {}: {}", file, e))?;                .map_err(|e| format!("Failed to copy {}: {}", file, e))?;

        }        }

    }    }



    Ok(())    Ok(())

}}



#[command]#[command]

pub async fn run_build_script(path: &str) -> Result<String, String> {pub async fn run_build_script(path: &str) -> Result<String, String> {

    // First ensure we're in the project directory    // First ensure we're in the project directory

    std::env::set_current_dir(path)    std::env::set_current_dir(path)

        .map_err(|e| format!("Failed to change to project directory: {}", e))?;        .map_err(|e| format!("Failed to change to project directory: {}", e))?;



    let output = Command::new("sh")    let output = Command::new("sh")

        .arg("-c")        .arg("-c")

        .arg("./build.sh")        .arg("./build.sh")

        .output()        .output()

        .map_err(|e| format!("Failed to run build script: {}", e))?;        .map_err(|e| format!("Failed to run build script: {}", e))?;

        

    Ok(String::from_utf8_lossy(&output.stdout).to_string())    Ok(String::from_utf8_lossy(&output.stdout).to_string())

}}
}