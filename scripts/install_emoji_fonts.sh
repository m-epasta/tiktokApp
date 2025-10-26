
#!/bin/bash
# Install Emoji Fonts for Perfect Rendering
# This ensures all emojis (✨🔥💨😊🏆💡👥⏰🤔) render correctly

# Source common utilities
source "$(dirname "$0")/../installer/common.sh"

show_progress "🎨 Installing Emoji Fonts for TikTok Clip Studio"
echo "================================================"
echo ""

# Detect OS
OS_TYPE=$(get_os)
if [ "$OS_TYPE" = "linux" ]; then
    show_progress "📦 Detected Linux - Installing Noto Color Emoji..."
    
    # Ubuntu/Debian
    if command_exists apt-get; then
        sudo apt-get update || handle_error "Failed to update package list"
        sudo apt-get install -y fonts-noto-color-emoji fonts-noto-emoji || handle_error "Failed to install emoji fonts via apt-get"
        print_success "✓ Installed via apt-get"
    
    # Fedora/RHEL
    elif command_exists dnf; then
        sudo dnf install -y google-noto-emoji-color-fonts || handle_error "Failed to install emoji fonts via dnf"
        print_success "✓ Installed via dnf"
    
    # Arch
    elif command_exists pacman; then
        sudo pacman -S --noconfirm noto-fonts-emoji || handle_error "Failed to install emoji fonts via pacman"
        print_success "✓ Installed via pacman"
    
    else
        print_warning "Could not detect package manager"
        print_info "Please install: fonts-noto-color-emoji manually"
    fi
    
    # Update font cache
    fc-cache -f -v || handle_error "Failed to update font cache"
    print_success "✓ Font cache updated"

elif [ "$OS_TYPE" = "macos" ]; then
    show_progress "🍎 Detected macOS - Emoji fonts already included!"
    print_success "✓ macOS has built-in emoji support"

elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    show_progress "🪟 Detected Windows - Emoji fonts already included!"
    print_success "✓ Windows has built-in emoji support (Segoe UI Emoji)"

else
    print_warning "Unknown OS: $OSTYPE"
    print_info "Please install emoji fonts manually for your system"
fi

echo ""
echo "================================================"
echo "🧪 Testing Emoji Rendering..."
echo ""

# Test emojis
echo "Positive: ✨ (sparkles)"
echo "Energetic: 🔥 (fire)"
echo "Negative: 💭 (thought bubble)"
echo "Movement: 💨 (dash)"
echo "Achievement: 🏆 (trophy)"
echo "Learning: 💡 (lightbulb)"
echo "People: 👥 (people)"
echo "Time: ⏰ (clock)"
echo "Thinking: 🤔 (thinking face)"

echo ""
echo "If you see boxes (□) instead of emojis above,"
echo "your terminal may not support emoji display."
echo "However, the VIDEO OUTPUT will still render correctly!"
echo ""
print_success "✅ Font installation complete!"
echo ""
print_info "🚀 Now re-export your video to see beautiful emojis!"
show_popup "Emoji fonts installed successfully!"
