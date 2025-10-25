#!/bin/bash
# Test script to verify subtitle system is working correctly

echo "🧪 Testing TikTok Subtitle System..."
echo ""

# Check if Python script exists
if [ ! -f "../scripts/whisper_transcribe.py" ]; then
    echo "❌ whisper_transcribe.py not found!"
    exit 1
fi
echo "✅ Python script found"

# Check if faster-whisper is installed
python3 -c "import faster_whisper" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ faster-whisper installed"
else
    echo "❌ faster-whisper not installed. Run: pip install faster-whisper"
    exit 1
fi

# Check FFmpeg
if command -v ffmpeg &> /dev/null; then
    echo "✅ FFmpeg installed"
else
    echo "❌ FFmpeg not installed"
    exit 1
fi

# Check if app is compiled
if [ -f "src-tauri/target/debug/short-studio-mvp" ]; then
    echo "✅ App compiled (debug)"
elif [ -f "src-tauri/target/release/short-studio-mvp" ]; then
    echo "✅ App compiled (release)"
else
    echo "⚠️  App not compiled yet"
fi

echo ""
echo "📋 Configuration Check:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check ASS format settings
echo ""
echo "🎨 Subtitle Settings:"
grep -A 1 "PlayResX" whisper_transcribe.py | head -2
grep "Alignment=5" whisper_transcribe.py | head -1 | sed 's/^/  /'

echo ""
echo "🌈 Color Styles:"
grep "Style: " whisper_transcribe.py | wc -l | xargs echo "  Number of color styles:"

echo ""
echo "😊 Emoji Mappings:"
grep -c '".*":' whisper_transcribe.py | xargs echo "  Number of emoji mappings:"

echo ""
echo "📱 Video Resolution:"
grep "1080:1920" src-tauri/src/video/ffmpeg.rs | head -1 | sed 's/^/  /'

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ System Check Complete!"
echo ""
echo "📝 To test:"
echo "  1. Run: npm run tauri:dev"
echo "  2. Select a video or YouTube URL"
echo "  3. Choose 'With Subtitles' mode"
echo "  4. Export and check output"
echo ""
echo "Expected output:"
echo "  • Resolution: 1080x1920 (vertical)"
echo "  • Subtitles: Center of screen"
echo "  • Colors: Rotating through 6 colors"
echo "  • Emojis: Automatically inserted"
echo ""
