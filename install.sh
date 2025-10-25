#!/bin/bash

# Colors for better readability
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

clear
cat << "EOF"
╔════════════════════════════════════════╗
║     TikTok App Installer              ║
║     Version 1.0                       ║
╚════════════════════════════════════════╝
EOF

# Ask for confirmation before proceeding
echo -e "\n${BLUE}This installer will:${NC}"
echo "  • Set up the required development environment"
echo "  • Install necessary dependencies (Docker, Git)"
echo "  • Download and build the TikTok App"
echo -e "  • Create the application in your home directory\n"

echo -e "${YELLOW}Requirements:${NC}"
echo "  • Internet connection"
echo "  • Approximately 2GB of free disk space"
echo "  • Administrative privileges (for installing dependencies)"

# Show macOS-specific requirements
if [ "$(uname -s)" = "Darwin" ]; then
    echo -e "\n${YELLOW}macOS-specific requirements:${NC}"
    echo "  • macOS 10.15 or later"
    echo "  • Admin user account (for Homebrew installation)"
    echo "  • Apple ID (for App Store access if needed)"
fi
echo -e "\n"

print_info() { echo -e "${BLUE}INFO: $1${NC}"; }
print_error() { echo -e "${RED}ERROR: $1${NC}"; }
print_success() { echo -e "${GREEN}SUCCESS: $1${NC}"; }
print_warning() { echo -e "${YELLOW}WARNING: $1${NC}"; }

# Function to handle errors and cleanup
handle_error() {
    print_error "$1"
    print_info "Cleaning up..."
    rm -rf "$INSTALL_DIR"
    exit 1
}

# Function to get OS type
get_os() {
    case "$(uname -s)" in
        Linux*)     echo "linux";;
        Darwin*)    echo "macos";;
        *)         echo "unknown";;
    esac
}

# Function to install Docker on macOS
install_docker_macos() {
    print_info "Setting up Docker for macOS..."
    
    # Install Homebrew silently if not present
    if ! command -v brew &> /dev/null; then
        NONINTERACTIVE=1 /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)" || handle_error "Failed to install Homebrew"
        eval "$(/opt/homebrew/bin/brew shellenv)" || eval "$(/usr/local/bin/brew shellenv)"
    fi

    # Install Docker if not present
    if ! command -v docker &> /dev/null; then
        brew install --cask docker --quiet || handle_error "Failed to install Docker"
        open -a Docker
        
        print_info "Starting Docker (this might take a minute)..."
        for i in {1..45}; do
            if docker info &>/dev/null; then
                print_success "Docker is ready!"
                return 0
            fi
            echo -n "."
            sleep 2
        done
        handle_error "Docker failed to start. Please try running Docker Desktop manually."
    else
        if ! docker info &>/dev/null; then
            open -a Docker
            print_info "Waiting for Docker to start..."
            sleep 10
        fi
        print_success "Docker is ready!"
    fi
    return 0
}

# Ensure we have sudo access early
if [ "$OS_TYPE" = "macos" ]; then
    sudo -v || handle_error "This installer needs admin privileges"
    # Keep sudo alive
    while true; do sudo -n true; sleep 60; kill -0 "$$" || exit; done 2>/dev/null &
fi

# Create installation directory
INSTALL_DIR="$HOME/.tiktok-app"
mkdir -p "$INSTALL_DIR" || handle_error "Failed to create installation directory"

# Show progress
total_steps=5
current_step=0

# Check and install Docker for macOS if needed
OS_TYPE=$(get_os)
if [ "$OS_TYPE" = "macos" ]; then
    show_progress "🐳 Setting up Docker for macOS..."
    if ! install_docker_macos; then
        print_error "Failed to set up Docker on macOS"
        exit 1
    fi
fi

show_progress() {
    current_step=$((current_step + 1))
    echo -e "\n${BLUE}[${current_step}/${total_steps}]${NC} $1"
}

# Download setup script
show_progress "📥 Downloading setup script..."
curl -fsSL https://raw.githubusercontent.com/m-epasta/tiktokApp/main/installer/setup_build_env.sh -o "$INSTALL_DIR/setup_build_env.sh"

if [ $? -ne 0 ]; then
    print_error "Failed to download setup script!"
    exit 1
fi

# Make script executable
chmod +x "$INSTALL_DIR/setup_build_env.sh"

show_progress "🔧 Setting up your environment..."
if "$INSTALL_DIR/setup_build_env.sh"; then
    print_success "✅ Environment setup completed successfully!"
    
    show_progress "📦 Downloading application files..."
    # Clone the repository
    if ! git clone https://github.com/m-epasta/tiktokApp.git "$INSTALL_DIR/app"; then
        print_error "Failed to download application!"
        exit 1
    fi
    
    cd "$INSTALL_DIR/app"
    
    show_progress "🏗️ Building your application..."
    if ./build.sh; then
        print_success "🎉 Installation completed successfully!"
        print_info "You can find the application in: $INSTALL_DIR/app/dist"
        print_info "To run the application, execute:"
        echo "    cd $INSTALL_DIR/app/dist"
        echo "    ./tiktok-app"
    else
        print_error "Build failed! Please check the error messages above."
        exit 1
    fi
else
    print_error "Environment setup failed! Please check the error messages above."
    exit 1
fi