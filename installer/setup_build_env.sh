#!/bin/bash
# setup_build_env.sh - Build Environment Setup for TikTok App

set -e

# Source common utilities
source "$(dirname "$0")/common.sh"

# Initialize logging
init_step_counter
log_info "Starting TikTok App build environment setup"

# Detect OS
OS_TYPE=$(get_os)
log_info "Detected operating system: $OS_TYPE"

# Step 1: System dependencies installation
show_progress "Detecting system package manager and preparing for installation..."
show_sub_progress "Operating System: $OS_TYPE"
show_sub_progress "Checking available package managers..."

case "$OS_TYPE" in
    linux)
        show_sub_progress "Linux system detected"
        if command_exists apt-get; then
            show_sub_progress "Using apt-get package manager (Ubuntu/Debian)"
            show_command "sudo apt-get update"
            sudo apt-get update || handle_error "Failed to update package list"
            show_command_result "Package list updated successfully"

            show_sub_progress "Installing essential build tools and dependencies..."
            show_command "sudo apt-get install -y build-essential curl wget git python3 python3-pip nodejs npm"
            sudo apt-get install -y build-essential curl wget git python3 python3-pip nodejs npm || handle_error "Failed to install Linux dependencies"
            show_command_result "Linux dependencies installed successfully"

        elif command_exists dnf; then
            show_sub_progress "Using dnf package manager (Fedora/RHEL)"
            show_command "sudo dnf install -y gcc gcc-c++ make curl wget git python3 python3-pip nodejs npm"
            sudo dnf install -y gcc gcc-c++ make curl wget git python3 python3-pip nodejs npm || handle_error "Failed to install Linux dependencies"
            show_command_result "Linux dependencies installed successfully"

        else
            handle_error "Unsupported Linux distribution - no apt-get or dnf found"
        fi
        ;;
    macos)
        show_sub_progress "macOS system detected"
        if ! command_exists brew; then
            show_sub_progress "Homebrew not found, installing..."
            show_command "Installing Homebrew"
            /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)" || handle_error "Failed to install Homebrew"
            show_command_result "Homebrew installed successfully"

            # Setup Homebrew environment
            if [ -f "/opt/homebrew/bin/brew" ]; then
                eval "$(/opt/homebrew/bin/brew shellenv)"
                show_sub_progress "Added Homebrew to PATH (/opt/homebrew/bin)"
            elif [ -f "/usr/local/bin/brew" ]; then
                eval "$(/usr/local/bin/brew shellenv)"
                show_sub_progress "Added Homebrew to PATH (/usr/local/bin)"
            fi
        else
            show_sub_progress "Homebrew already installed"
        fi

        show_sub_progress "Installing macOS dependencies via Homebrew..."
        show_command "brew install python3 node git"
        brew install python3 node git || handle_error "Failed to install macOS dependencies"
        show_command_result "macOS dependencies installed successfully"
        ;;
    *)
        handle_error "Unsupported operating system: $OS_TYPE"
        ;;
esac

# Step 2: Rust installation
if ! command_exists cargo; then
    show_progress "Installing Rust programming language..."
    show_sub_progress "Rust is required for Tauri development"
    show_sub_progress "Downloading and running rustup installer..."

    show_command "curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y"
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y || handle_error "Failed to install Rust"
    show_command_result "Rust installed successfully"

    show_sub_progress "Loading Rust environment..."
    source "$HOME/.cargo/env"
    show_sub_progress "Rust environment loaded"

    # Verify Rust installation
    show_sub_progress "Verifying Rust installation..."
    show_command "cargo --version"
    cargo --version || handle_error "Rust installation verification failed"
    show_command_result "Rust version: $(cargo --version)"
else
    show_progress "Rust already installed"
    show_sub_progress "Current Rust version: $(cargo --version)"
fi

# Step 3: Python dependencies
show_progress "Setting up Python environment..."
show_sub_progress "Upgrading pip package manager..."

show_command "python3 -m pip install --upgrade pip"
python3 -m pip install --upgrade pip || handle_error "Failed to upgrade pip"
show_command_result "pip upgraded to latest version"

show_sub_progress "Installing Python dependencies from requirements.txt..."
show_command "python3 -m pip install -r requirements.txt"
python3 -m pip install -r requirements.txt || handle_error "Failed to install Python dependencies"
show_command_result "Python dependencies installed successfully"

# Step 4: Node.js dependencies
show_progress "Setting up Node.js environment..."
show_sub_progress "Installing Node.js dependencies from package.json..."

show_command "npm install"
npm install || handle_error "Failed to install Node.js dependencies"
show_command_result "Node.js dependencies installed successfully"

# Step 5: Tauri CLI installation
show_progress "Installing Tauri CLI..."
show_sub_progress "Tauri CLI is required for building the desktop application"

show_command "cargo install tauri-cli"
cargo install tauri-cli || handle_error "Failed to install Tauri CLI"
show_command_result "Tauri CLI installed successfully"

# Step 6: Verification
show_progress "Verifying installation..."
show_sub_progress "Checking all installed components..."

# Verify all components
show_sub_progress "Verifying system dependencies..."
if [ "$OS_TYPE" = "linux" ]; then
    command -v gcc >/dev/null 2>&1 || handle_error "gcc not found"
    command -v python3 >/dev/null 2>&1 || handle_error "python3 not found"
    command -v node >/dev/null 2>&1 || handle_error "node not found"
    command -v npm >/dev/null 2>&1 || handle_error "npm not found"
elif [ "$OS_TYPE" = "macos" ]; then
    command -v python3 >/dev/null 2>&1 || handle_error "python3 not found"
    command -v node >/dev/null 2>&1 || handle_error "node not found"
    command -v git >/dev/null 2>&1 || handle_error "git not found"
fi

show_sub_progress "Verifying Rust installation..."
command -v cargo >/dev/null 2>&1 || handle_error "cargo not found"

show_sub_progress "Verifying Tauri CLI installation..."
command -v tauri >/dev/null 2>&1 || handle_error "tauri CLI not found"

show_sub_progress "All components verified successfully!"

# Final success message with detailed completion tracking
show_completion_popup "🎉 Build environment setup completed successfully!"

log_success "TikTok App build environment setup completed successfully"

# Log all completed tasks for the GUI
echo "{\"type\": \"task_completed\", \"task\": \"System Dependencies Installation\", \"details\": \"build-essential, curl, wget, git, python3, nodejs, npm\", \"timestamp\": \"$(date '+%Y-%m-%d %H:%M:%S')\", \"icon\": \"📦\"}" >> /tmp/installer_completions.json
echo "{\"type\": \"task_completed\", \"task\": \"Rust Programming Language\", \"details\": \"Rust toolchain and cargo package manager\", \"timestamp\": \"$(date '+%Y-%m-%d %H:%M:%S')\", \"icon\": \"🦀\"}" >> /tmp/installer_completions.json
echo "{\"type\": \"task_completed\", \"task\": \"Python Dependencies\", \"details\": \"pip upgrade and requirements.txt packages\", \"timestamp\": \"$(date '+%Y-%m-%d %H:%M:%S')\", \"icon\": \"🐍\"}" >> /tmp/installer_completions.json
echo "{\"type\": \"task_completed\", \"task\": \"Node.js Dependencies\", \"details\": \"npm install and all React/Tauri dependencies\", \"timestamp\": \"$(date '+%Y-%m-%d %H:%M:%S')\", \"icon\": \"⚛️\"}" >> /tmp/installer_completions.json
echo "{\"type\": \"task_completed\", \"task\": \"Tauri CLI Installation\", \"details\": \"Tauri development tools and CLI\", \"timestamp\": \"$(date '+%Y-%m-%d %H:%M:%S')\", \"icon\": \"🔧\"}" >> /tmp/installer_completions.json
echo "{\"type\": \"task_completed\", \"task\": \"System Verification\", \"details\": \"All components verified and working\", \"timestamp\": \"$(date '+%Y-%m-%d %H:%M:%S')\", \"icon\": \"✅\"}" >> /tmp/installer_completions.json

show_sub_progress "Installation summary:"
show_sub_progress "  • System dependencies: ✅ Installed"
show_sub_progress "  • Rust programming language: ✅ Installed"
show_sub_progress "  • Python dependencies: ✅ Installed"
show_sub_progress "  • Node.js dependencies: ✅ Installed"
show_sub_progress "  • Tauri CLI: ✅ Installed"
show_sub_progress "  • All verifications: ✅ Passed"

log_info "Build environment setup completed successfully"
