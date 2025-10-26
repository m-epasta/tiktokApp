#!/bin/bash

# Source common utilities
source "$(dirname "$0")/../installer/common.sh"

# Detect OS and install FFmpeg
OS_TYPE=$(get_os)
show_progress "Installing FFmpeg..."
case "$OS_TYPE" in
    linux)
        if command_exists apt-get; then
            sudo apt-get update || handle_error "Failed to update package list"
            sudo apt-get install -y ffmpeg || handle_error "Failed to install FFmpeg via apt-get"
        elif command_exists dnf; then
            sudo dnf install -y ffmpeg || handle_error "Failed to install FFmpeg via dnf"
        else
            handle_error "Unsupported Linux distribution. Please install FFmpeg manually."
        fi
        ;;
    macos)
        if ! command_exists brew; then
            show_progress "🍺 Installing Homebrew first..."
            /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)" || handle_error "Failed to install Homebrew"
        fi
        brew install ffmpeg || handle_error "Failed to install FFmpeg via brew"
        ;;
    *)
        handle_error "Unsupported OS for FFmpeg installation"
        ;;
esac

if command_exists ffmpeg; then
    show_popup "✅ FFmpeg installed successfully!"
else
    handle_error "FFmpeg installation failed"
fi
