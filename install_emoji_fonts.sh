#!/bin/bash
# Install Emoji Fonts for Perfect Rendering
# This ensures all emojis (✨🔥💨😊🏆💡👥⏰🤔) render correctly

echo "🎨 Installing Emoji Fonts for TikTok Clip Studio"
echo "================================================"
echo ""

# Detect OS
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "📦 Detected Linux - Installing Noto Color Emoji..."
    
    # Ubuntu/Debian
    if command -v apt-get &> /dev/null; then
        sudo apt-get update
        sudo apt-get install -y fonts-noto-color-emoji fonts-noto-emoji
        echo "✓ Installed via apt-get"
    
    # Fedora/RHEL
    elif command -v dnf &> /dev/null; then
        sudo dnf install -y google-noto-emoji-color-fonts
        echo "✓ Installed via dnf"
    
    # Arch
    elif command -v pacman &> /dev/null; then
        sudo pacman -S --noconfirm noto-fonts-emoji
        echo "✓ Installed via pacman"
    
    else
        echo "⚠️  Could not detect package manager"
        echo "Please install: fonts-noto-color-emoji manually"
    fi
    
    # Update font cache
    fc-cache -f -v
    echo "✓ Font cache updated"

elif [[ "$OSTYPE" == "darwin"* ]]; then
    echo "🍎 Detected macOS - Emoji fonts already included!"
    echo "✓ macOS has built-in emoji support"

elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    echo "🪟 Detected Windows - Emoji fonts already included!"
    echo "✓ Windows has built-in emoji support (Segoe UI Emoji)"

else
    echo "❓ Unknown OS: $OSTYPE"
    echo "Please install emoji fonts manually for your system"
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
echo "✅ Font installation complete!"
echo ""
echo "🚀 Now re-export your video to see beautiful emojis!"
