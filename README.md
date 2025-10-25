# 🎬 TikTok Clip Studio

**Version:** 2.0.0  
**License:** MIT  
**Platform:** Windows, macOS, Linux

> A production-grade desktop application for creating engaging TikTok content with AI-powered features, professional video editing, and intelligent automation.

---

## ✨ Features

### 🎥 Video Processing
- **TikTok Format Conversion**: Automatic 9:16 aspect ratio optimization (1080x1920)
- **High-Quality Export**: H.264 encoding at 60fps with CRF 20
- **Batch Processing**: Export multiple clips simultaneously
- **Format Support**: MP4, MOV, MKV, AVI, WebM, and more

### 🤖 AI-Powered Transcription
- **Multi-Language Support**: English and French with auto-detection
- **Sentiment Analysis**: Real-time mood detection (positive, negative, energetic, neutral)
- **Smart Emoji Insertion**: 130+ contextual emoji mappings
- **Word-Level Timing**: Precise synchronization for TikTok-style captions
- **Important Word Detection**: Filters 150+ stop words, focuses on content

### ✂️ Intelligent Clip Detection
- **Scene Analysis**: AI-powered scene change detection
- **Quality Scoring**: Automatic clip ranking based on content
- **Customizable Duration**: Set minimum and maximum clip lengths
- **Batch Export**: Export all detected clips with one click

### 📥 YouTube Integration
- **Direct Download**: Download videos from YouTube URLs
- **Metadata Extraction**: Automatic title, duration, and info retrieval
- **Progress Tracking**: Real-time download speed and ETA
- **Format Selection**: Choose quality and format options

### 🎨 Professional Subtitles
- **Dynamic Styling**: Sentiment-based colors and sizes
- **ASS Format**: Advanced SubStation Alpha for maximum control
- **Emoji Support**: Universal Unicode symbols for compatibility
- **Emphasis Detection**: Automatic highlighting of important words

---

## 🚀 Quick Start

### Prerequisites

#### Required
- **Node.js** 18+ ([Download](https://nodejs.org/))
- **Rust** toolchain (stable) - `tauri-cli` installed automatically
- **FFmpeg** - Must be in system PATH
  - **Linux**: `sudo apt install ffmpeg`
  - **macOS**: `brew install ffmpeg`
  - **Windows**: [Download](https://ffmpeg.org/) and add to PATH
- **Python** 3.8+
  - Install dependencies: `pip install faster-whisper`

#### Optional
- **yt-dlp** - For YouTube download support
  - `pip install yt-dlp`

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd tiktokApp
```

2. **Install dependencies**
```bash
npm install
```

3. **Verify Python dependencies**
```bash
pip install faster-whisper yt-dlp
```

### Development

**Start development server:**
```bash
npm run tauri:dev
```

This launches:
- Vite dev server (hot reload)
- Tauri window with DevTools
- Rust backend with logging

**Development features:**
- Hot module replacement (HMR)
- React DevTools
- Rust logging to console
- Auto-reload on file changes

### Production Build

**Build for your platform:**
```bash
npm run build
```

**Output locations:**
- **Linux**: `src-tauri/target/release/bundle/deb/` or `appimage/`
- **macOS**: `src-tauri/target/release/bundle/dmg/` or `macos/`
- **Windows**: `src-tauri/target/release/bundle/msi/` or `nsis/`

**Build options:**
```bash
# Debug build (faster, larger)
npm run tauri build -- --debug

# Release build with optimizations (default)
npm run build
```

---

## 📖 Usage Guide

### Basic Workflow

1. **Launch the application**
   - Run `npm run tauri:dev` (development)
   - Or open the built executable (production)

2. **Select input source**
   - **File**: Click "Choose File" or drag & drop
   - **URL**: Switch to URL tab and paste YouTube link

3. **Choose export mode**
   - **Single Video**: Convert entire video to TikTok format
   - **Auto Clips**: AI detects and exports best clips
   - **With Subtitles**: Add AI-generated captions

4. **Process and export**
   - Click "Export" button
   - Monitor progress in real-time
   - Find output in same directory as input

### Export Modes Explained

#### 🎬 Single Video Export
Converts your video to TikTok-optimized format:
- 9:16 aspect ratio (1080x1920)
- 60fps for smooth playback
- H.264 codec for compatibility
- Optimized file size

**Use case**: Full video conversion, vlogs, tutorials

#### ✂️ Smart Clips
AI analyzes your video and creates multiple clips:
- Detects scene changes
- Scores clip quality
- Exports best segments
- Batch processing

**Use case**: Long videos, highlights, compilations

#### 📝 Auto Subtitles
Adds AI-generated word-by-word captions:
- Automatic speech recognition
- Multi-language support
- Sentiment-based styling
- Emoji insertion

**Use case**: Talking head videos, interviews, educational content

### Advanced Features

#### YouTube Download
1. Switch to "URL" tab
2. Paste YouTube video URL
3. Click "Download & Process"
4. Video downloads and processes automatically

#### Clip Selection
1. Click "Detect Clips"
2. Review detected clips with scores
3. Select/deselect clips
4. Click "Export Selected Clips"

#### Custom Output Path
1. Click "Choose Output Location"
2. Select directory
3. Files will be saved there instead

---

## 🏗️ Architecture

### Technology Stack

**Frontend:**
- React 18 with TypeScript
- Framer Motion for animations
- Tailwind CSS for styling
- Tauri API for native integration

**Backend:**
- Rust with Tauri framework
- FFmpeg for video processing
- Python for AI/ML tasks
- Async/await for concurrency

**AI/ML:**
- Whisper (faster-whisper) for transcription
- Custom sentiment analysis engine
- Scene detection algorithms
- Pattern recognition for emoji mapping

### Project Structure

```
tiktokApp/
├── src/                          # Frontend (React + TypeScript)
│   ├── App.tsx                   # Main application component
│   ├── main.tsx                  # Entry point
│   ├── types/                    # TypeScript type definitions
│   │   └── index.ts              # Centralized types
│   ├── utils/                    # Utility functions
│   │   └── format.ts             # Formatting helpers
│   └── styles/
│       └── globals.css           # Global styles (Tailwind)
│
├── src-tauri/                    # Backend (Rust)
│   ├── src/
│   │   ├── main.rs               # Application entry point
│   │   ├── commands/             # Tauri command handlers
│   │   │   ├── export.rs         # Export commands
│   │   │   ├── transcribe.rs     # Transcription commands
│   │   │   ├── clips.rs          # Clip detection commands
│   │   │   └── youtube.rs        # YouTube download commands
│   │   ├── video/                # Video processing
│   │   │   └── ffmpeg.rs         # FFmpeg integration
│   │   └── ai/                   # AI integration
│   │       └── whisper.rs        # Whisper transcription
│   ├── Cargo.toml                # Rust dependencies
│   └── tauri.conf.json           # Tauri configuration
│
├── whisper_transcribe.py         # AI transcription engine
├── TRANSCRIPTION_README.md       # Transcription documentation
└── README.md                     # This file
```

### Data Flow

```
User Input (File/URL)
    ↓
Frontend (React)
    ↓
Tauri IPC Bridge
    ↓
Rust Backend
    ├→ FFmpeg (Video Processing)
    ├→ Python Script (AI Transcription)
    └→ yt-dlp (YouTube Download)
    ↓
Progress Events
    ↓
Frontend Updates (Real-time)
    ↓
Output Files
```

---

## 🔧 Configuration

### FFmpeg Settings

Edit `src-tauri/src/video/ffmpeg.rs` to customize:
- Video codec and quality (CRF)
- Frame rate
- Resolution
- Audio settings

### Whisper Model

Edit `whisper_transcribe.py` constants:
```python
DEFAULT_MODEL_SIZE = "base"  # tiny, base, small, medium, large
SUPPORTED_MODELS = ["tiny", "base", "small", "medium", "large"]
```

### Subtitle Styling

Customize in `whisper_transcribe.py` AIEnhancer class:
- Color schemes
- Font sizes
- Emoji mappings
- Sentiment lexicons

---

## 🐛 Troubleshooting

### Common Issues

**Issue**: "FFmpeg not found"
```bash
# Verify FFmpeg installation
ffmpeg -version

# Add to PATH if needed (Linux/Mac)
export PATH="$PATH:/path/to/ffmpeg"
```

**Issue**: "Python script failed"
```bash
# Verify Python dependencies
pip install --upgrade faster-whisper

# Test script directly
python3 whisper_transcribe.py test.wav output.srt
```

**Issue**: "Tauri build fails"
```bash
# Clean and rebuild
cd src-tauri
cargo clean
cd ..
npm run build
```

**Issue**: "No emoji rendering"
```bash
# Install emoji fonts (Linux)
sudo apt-get install fonts-noto-color-emoji
```

### Debug Mode

Enable detailed logging:
```bash
# Set environment variable
export RUST_LOG=debug
npm run tauri:dev
```

### Performance Tips

1. **Use smaller Whisper model** for faster transcription
2. **Enable hardware acceleration** in FFmpeg (if available)
3. **Process shorter videos** for quicker results
4. **Close other applications** to free up resources

---

## 📊 Performance Benchmarks

| Task | Duration | Processing Time | Speed |
|------|----------|-----------------|-------|
| Video Conversion (30s) | 30s | 15s | 2x realtime |
| Transcription (30s) | 30s | 10-15s | 2-3x realtime |
| Clip Detection (5min) | 5min | 30-45s | 6-10x realtime |
| YouTube Download (10min) | 10min | 2-5min | 2-5x realtime |

*Benchmarks on: Intel i7, 16GB RAM, SSD*

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript/Rust best practices
- Add tests for new features
- Update documentation
- Use conventional commits
- Run linters before committing

---

## 📝 License

MIT License - See LICENSE file for details

---

## 🙏 Acknowledgments

- **Whisper** by OpenAI for transcription
- **FFmpeg** for video processing
- **Tauri** for desktop framework
- **yt-dlp** for YouTube downloads

---

## 📧 Support

For issues, questions, or feature requests:
- GitHub Issues: [Repository Issues]
- Documentation: This README + TRANSCRIPTION_README.md
- Version: 2.0.0

---

**Built with ❤️ for content creators**
