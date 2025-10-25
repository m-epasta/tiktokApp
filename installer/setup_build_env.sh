#!/bin/bash
# setup_build_env.sh - Build Environment Setup for TikTok App

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_info() { echo -e "${BLUE}INFO: $1${NC}"; }
print_error() { echo -e "${RED}ERROR: $1${NC}"; }
print_success() { echo -e "${GREEN}SUCCESS: $1${NC}"; }

# Detect OS
OS_TYPE=$(uname -s)

# Install system dependencies
case "$OS_TYPE" in
    Linux*)
        print_info "Installing Linux dependencies..."
        if command -v apt-get &>/dev/null; then
            sudo apt-get update
            sudo apt-get install -y build-essential curl wget git python3 python3-pip nodejs npm
        elif command -v dnf &>/dev/null; then
            sudo dnf install -y gcc gcc-c++ make curl wget git python3 python3-pip nodejs npm
        else
            print_error "Unsupported Linux distribution"
            exit 1
        fi
        ;;
    Darwin*)
        print_info "Installing macOS dependencies..."
        if ! command -v brew &>/dev/null; then
            /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        fi
        brew install python3 node git
        ;;
    *)
        print_error "Unsupported operating system"
        exit 1
        ;;
esac

# Install Rust if not present
if ! command -v cargo &>/dev/null; then
    print_info "Installing Rust..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source "$HOME/.cargo/env"
fi

# Install Python dependencies
print_info "Installing Python dependencies..."
python3 -m pip install --upgrade pip
python3 -m pip install -r requirements.txt

# Install Node.js dependencies
print_info "Installing Node.js dependencies..."
npm install

# Install Tauri CLI
print_info "Installing Tauri CLI..."
cargo install tauri-cli

print_success "Build environment setup completed successfully!"