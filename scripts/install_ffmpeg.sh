#!/bin/bash

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Detect OS and install FFmpeg
case "$(uname -s)" in
    Linux*)     
        echo "🐧 Installing FFmpeg for Linux..."
        if command_exists apt-get; then
            sudo apt-get update
            sudo apt-get install -y ffmpeg
        elif command_exists dnf; then
            sudo dnf install -y ffmpeg
        else
            echo "❌ Unsupported Linux distribution. Please install FFmpeg manually."
            exit 1
        fi
        ;;
    Darwin*)    
        echo "🍎 Installing FFmpeg for macOS..."
        if ! command_exists brew; then
            echo "🍺 Installing Homebrew first..."
            /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        fi
        brew install ffmpeg
        ;;
    MINGW*|MSYS*|CYGWIN*) 
        echo "🪟 Installing FFmpeg for Windows..."
        if ! command_exists choco; then
            echo "Installing Chocolatey package manager..."
            powershell -Command "Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))"
        fi
        choco install ffmpeg -y
        ;;
esac

if command_exists ffmpeg; then
    echo "✅ FFmpeg installed successfully!"
else
    echo "❌ FFmpeg installation failed"
    exit 1
fi