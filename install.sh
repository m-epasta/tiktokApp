#!/bin/bash

# Source common utilities
source "$(dirname "$0")/installer/common.sh"

# Initialize logging
init_step_counter
log_info "Starting TikTok App installation process"

clear
cat << "EOF"
╔════════════════════════════════════════╗
║     TikTok App Installer              ║
║     Version 1.0                       ║
╚════════════════════════════════════════╝
EOF

# Step 1: Pre-installation checks and information
show_progress "Initializing installation process..."
show_sub_progress "Checking system requirements..."
show_sub_progress "Setting up logging and progress tracking..."

# Ask for confirmation before proceeding
echo -e "\n${BLUE}This installer will perform the following steps:${NC}"
echo "  1. 📋 Check system requirements and compatibility"
echo "  2. 🐳 Set up Docker environment (if needed)"
echo "  3. 📥 Download setup scripts and application files"
echo "  4. 🔧 Configure build environment"
echo "  5. 📦 Install all required dependencies"
echo "  6. 🏗️ Build the TikTok application"
echo -e "  7. ✅ Verify installation and create shortcuts\n"

echo -e "${YELLOW}System Requirements:${NC}"
echo "  • 🌐 Internet connection (for downloading dependencies)"
echo "  • 💾 Approximately 2GB of free disk space"
echo "  • 🔐 Administrative privileges (for installing system packages)"
echo "  • ⏱️ Installation time: 10-30 minutes depending on system"

# Show OS-specific requirements
OS_TYPE=$(get_os)
show_sub_progress "Detected operating system: $OS_TYPE"

if [ "$OS_TYPE" = "macos" ]; then
    echo -e "\n${YELLOW}macOS-specific requirements:${NC}"
    echo "  • 🍺 macOS 10.15 or later"
    echo "  • 👤 Admin user account (for Homebrew installation)"
    echo "  • 🍎 Apple ID (for App Store access if needed)"
    echo "  • 🐳 Docker Desktop for Mac (will be installed if needed)"
fi

if [ "$OS_TYPE" = "linux" ]; then
    echo -e "\n${YELLOW}Linux-specific requirements:${NC}"
    echo "  • 📦 Package manager: apt (Ubuntu/Debian) or dnf (Fedora/RHEL)"
    echo "  • 🐳 Docker (will be installed if needed)"
    echo "  • 🔧 Development tools and libraries"
fi

echo -e "\n"



# Function to install Docker on macOS
install_docker_macos() {
    show_progress "Setting up Docker environment for macOS..."
    show_sub_progress "Checking Docker requirements..."
    show_sub_progress "This step is only required for macOS systems"

    # Install Homebrew silently if not present
    if ! command_exists brew; then
        show_sub_progress "Installing Homebrew package manager..."
        show_command "Installing Homebrew (required for Docker)"
        NONINTERACTIVE=1 /bin/bash -c "$(curl --proto =https --tlsv1.2 -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)" || handle_error "Failed to install Homebrew"
        show_command_result "Homebrew installed successfully"

        # Setup Homebrew environment
        if [ -f "/opt/homebrew/bin/brew" ]; then
            eval "$(/opt/homebrew/bin/brew shellenv)"
            show_sub_progress "Homebrew configured for Apple Silicon"
        elif [ -f "/usr/local/bin/brew" ]; then
            eval "$(/usr/local/bin/brew shellenv)"
            show_sub_progress "Homebrew configured for Intel Mac"
        fi
    else
        show_sub_progress "Homebrew already installed"
    fi

    # Install Docker if not present
    if ! command_exists docker; then
        show_sub_progress "Installing Docker Desktop for Mac..."
        show_command "brew install --cask docker"
        brew install --cask docker --quiet || handle_error "Failed to install Docker"
        show_command_result "Docker Desktop installed successfully"

        show_sub_progress "Starting Docker Desktop application..."
        show_sub_progress "Please wait while Docker starts up (this may take a minute)..."
        open -a Docker

        show_sub_progress "Waiting for Docker daemon to be ready..."
        for i in {1..45}; do
            if docker info &>/dev/null; then
                show_sub_progress "Docker daemon is ready!"
                show_popup "🐳 Docker is ready to use!"
                return 0
            fi
            echo -n "."
            sleep 2
        done
        handle_error "Docker failed to start. Please try running Docker Desktop manually from Applications folder."
    else
        show_sub_progress "Docker already installed"
        if ! docker info &>/dev/null; then
            show_sub_progress "Starting Docker service..."
            open -a Docker
            sleep 10
            show_sub_progress "Docker service started"
        fi
        show_popup "🐳 Docker is ready to use!"
    fi
    return 0
}

# Step 2: Create installation directory
show_progress "Creating installation directory..."
INSTALL_DIR="$HOME/.tiktok-app"
show_sub_progress "Installation directory: $INSTALL_DIR"

show_command "mkdir -p $INSTALL_DIR"
mkdir -p "$INSTALL_DIR" || handle_error "Failed to create installation directory"
show_command_result "Installation directory created successfully"

# Step 3: Check and install Docker for macOS if needed
if [ "$OS_TYPE" = "macos" ]; then
    show_progress "Checking administrative privileges..."
    show_sub_progress "Requesting sudo access for system installations..."

    show_command "sudo -v"
    sudo -v || handle_error "This installer needs admin privileges. Please run the installer with administrator access."
    show_command_result "Administrative privileges confirmed"

    # Keep sudo alive in background
    show_sub_progress "Keeping sudo session active..."
    while true; do sudo -n true; sleep 60; kill -0 "$$" || exit; done 2>/dev/null &
    show_sub_progress "Sudo session maintained in background"

    show_progress "Setting up Docker environment..."
    if ! install_docker_macos; then
        handle_error "Failed to set up Docker on macOS"
    fi
fi

# Step 4: Download setup script
show_progress "Downloading setup and configuration scripts..."
show_sub_progress "Fetching setup_build_env.sh from repository..."

show_command "curl --proto =https --tlsv1.2 -fsSL https://raw.githubusercontent.com/m-epasta/tiktokApp/main/installer/setup_build_env.sh -o $INSTALL_DIR/setup_build_env.sh"
curl --proto =https --tlsv1.2 -fsSL https://raw.githubusercontent.com/m-epasta/tiktokApp/main/installer/setup_build_env.sh -o "$INSTALL_DIR/setup_build_env.sh"

if [ $? -ne 0 ]; then
    handle_error "Failed to download setup script! Please check your internet connection."
fi
show_command_result "Setup script downloaded successfully"

show_sub_progress "Making setup script executable..."
show_command "chmod +x $INSTALL_DIR/setup_build_env.sh"
chmod +x "$INSTALL_DIR/setup_build_env.sh"
show_command_result "Setup script permissions configured"

# Step 5: Run environment setup
show_progress "Running build environment setup..."
show_sub_progress "This will install all required dependencies and tools..."
show_sub_progress "This process may take 10-20 minutes depending on your system..."

if "$INSTALL_DIR/setup_build_env.sh"; then
    show_progress "Environment setup completed successfully!"
    show_sub_progress "All dependencies and tools have been installed"
else
    handle_error "Environment setup failed! Please check the error messages above."
fi

# Step 6: Download application files
show_progress "Downloading TikTok application source code..."
show_sub_progress "Cloning repository from GitHub..."

show_command "git clone https://github.com/m-epasta/tiktokApp.git $INSTALL_DIR/app"
if ! git clone https://github.com/m-epasta/tiktokApp.git "$INSTALL_DIR/app"; then
    handle_error "Failed to download application! Please check your internet connection and try again."
fi
show_command_result "Application source code downloaded successfully"

# Step 7: Build the application
show_progress "Building TikTok application..."
show_sub_progress "Changing to application directory..."
cd "$INSTALL_DIR/app"

show_sub_progress "Running build script..."
show_command "./build.sh"
if ./build.sh; then
    show_progress "Application built successfully!"
    show_sub_progress "Build completed without errors"

    # Step 8: Installation complete
    show_progress "Installation completed successfully!"
    show_completion_popup "🎉 TikTok App installation completed successfully!"

    # Log all completed tasks for the GUI
    echo "{\"type\": \"task_completed\", \"task\": \"Installation Directory Creation\", \"details\": \"Created installation directory at $INSTALL_DIR\", \"timestamp\": \"$(date '+%Y-%m-%d %H:%M:%S')\", \"icon\": \"📁\"}" >> /tmp/installer_completions.json
    echo "{\"type\": \"task_completed\", \"task\": \"Docker Environment Setup\", \"details\": \"Docker configured and ready for use\", \"timestamp\": \"$(date '+%Y-%m-%d %H:%M:%S')\", \"icon\": \"🐳\"}" >> /tmp/installer_completions.json
    echo "{\"type\": \"task_completed\", \"task\": \"Setup Scripts Download\", \"details\": \"Downloaded and configured setup scripts\", \"timestamp\": \"$(date '+%Y-%m-%d %H:%M:%S')\", \"icon\": \"📥\"}" >> /tmp/installer_completions.json
    echo "{\"type\": \"task_completed\", \"task\": \"Build Environment Setup\", \"details\": \"All dependencies and tools installed\", \"timestamp\": \"$(date '+%Y-%m-%d %H:%M:%S')\", \"icon\": \"🔧\"}" >> /tmp/installer_completions.json
    echo "{\"type\": \"task_completed\", \"task\": \"Application Download\", \"details\": \"Downloaded TikTok app source code from GitHub\", \"timestamp\": \"$(date '+%Y-%m-%d %H:%M:%S')\", \"icon\": \"📦\"}" >> /tmp/installer_completions.json
    echo "{\"type\": \"task_completed\", \"task\": \"Application Build\", \"details\": \"Successfully built the TikTok application\", \"timestamp\": \"$(date '+%Y-%m-%d %H:%M:%S')\", \"icon\": \"🏗️\"}" >> /tmp/installer_completions.json
    echo "{\"type\": \"task_completed\", \"task\": \"Installation Complete\", \"details\": \"All components installed and verified\", \"timestamp\": \"$(date '+%Y-%m-%d %H:%M:%S')\", \"icon\": \"✅\"}" >> /tmp/installer_completions.json

    show_sub_progress "Installation summary:"
    show_sub_progress "  • 📁 Installation directory: $INSTALL_DIR/app"
    show_sub_progress "  • 🚀 Application binary: $INSTALL_DIR/app/dist/tiktok-app"
    show_sub_progress "  • 📋 Build artifacts: $INSTALL_DIR/app/dist/"

    echo -e "\n${GREEN}Installation completed!${NC}"
    echo -e "${BLUE}To run the application:${NC}"
    echo "    cd $INSTALL_DIR/app/dist"
    echo "    ./tiktok-app"
    echo -e "\n${BLUE}To run from anywhere, add the application to your PATH:${NC}"
    echo "    echo 'export PATH=\"\$PATH:$INSTALL_DIR/app/dist\"' >> ~/.bashrc"
    echo "    source ~/.bashrc"

    log_success "TikTok App installation completed successfully"
else
    handle_error "Build failed! Please check the error messages above and try again."
fi
