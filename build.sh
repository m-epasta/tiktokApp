#!/bin/bash

# Source common utilities
source "$(dirname "$0")/installer/common.sh"

show_progress "Building TikTok App..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    handle_error "package.json not found. Please run this script from the project root directory."
fi

# Clean previous builds
show_sub_progress "Cleaning previous builds..."
rm -rf dist src-tauri/target

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    show_sub_progress "Installing Node.js dependencies..."
    npm install || handle_error "Failed to install Node.js dependencies"
fi

# Run the build process
show_sub_progress "Building frontend and Tauri application..."
npm run build || handle_error "Build failed"

# Check if build was successful
if [ -d "src-tauri/target/release" ]; then
    show_sub_progress "Tauri build completed successfully!"
    show_popup "Build completed successfully!"
    print_info "Application built in src-tauri/target/release/ directory"

    # Create a convenient launcher script
    show_sub_progress "Creating launcher script..."
    cat > "dist/launch-tiktok-app.sh" << 'EOF'
#!/bin/bash
# TikTok App Launcher
cd "$(dirname "$0")"
if [ -f "../src-tauri/target/release/tiktok-clip-studio" ]; then
    echo "🚀 Launching TikTok Clip Studio..."
    ../src-tauri/target/release/tiktok-clip-studio
elif [ -f "./tiktok-clip-studio" ]; then
    echo "🚀 Launching TikTok Clip Studio..."
    ./tiktok-clip-studio
else
    echo "❌ Application not found. Please run the build script first."
    exit 1
fi
EOF
    chmod +x "dist/launch-tiktok-app.sh"

    # Check if Docker is available and build Docker image
    if command -v docker &> /dev/null; then
        show_sub_progress "Building Docker image..."
        if docker build -t tiktok-clip-studio .; then
            show_sub_progress "Docker image built successfully!"
            show_sub_progress "  • 🐳 Docker image: tiktok-clip-studio"
            show_sub_progress "  • 🚀 Run with: docker run --rm -it tiktok-clip-studio"
        else
            show_sub_progress "Docker build failed, but native build succeeded"
        fi
    fi

    # Update build status for frontend
    echo "{\"status\": \"Build completed successfully! Application ready in src-tauri/target/release/\", \"timestamp\": \"$(date '+%Y-%m-%d %H:%M:%S')\"}" >> /tmp/installer_build_status.json

    show_sub_progress "Build artifacts:"
    show_sub_progress "  • 📦 Frontend: dist/"
    show_sub_progress "  • 🚀 Application: src-tauri/target/release/tiktok-clip-studio"
    show_sub_progress "  • 🔗 Launcher: dist/launch-tiktok-app.sh"
    if command -v docker &> /dev/null; then
        show_sub_progress "  • 🐳 Docker image: tiktok-clip-studio (if built successfully)"
    fi

elif [ -d "dist" ]; then
    show_sub_progress "Frontend build completed (Tauri build may have failed)"
    show_popup "Frontend build completed!"
    print_info "Frontend built in dist/ directory"

    # Update build status for frontend only
    echo "{\"status\": \"Frontend build completed successfully! Tauri build may have failed.\", \"timestamp\": \"$(date '+%Y-%m-%d %H:%M:%S')\"}" >> /tmp/installer_build_status.json
else
    handle_error "Build failed - no output directories found"
fi
