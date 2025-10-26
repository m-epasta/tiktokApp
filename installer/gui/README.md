# TikTok App Installer GUI

A Tauri-based graphical user interface for the TikTok App installation process.

## How to Run the App

### Prerequisites
- Rust (for Tauri backend)
- Node.js and npm (for frontend)
- Tauri CLI: `cargo install tauri-cli`

### Running the Installer GUI

1. Navigate to the installer GUI directory:
   ```bash
   cd installer/gui
   ```

2. Install frontend dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run tauri:dev
   ```

   This will start both the frontend (Vite) and the Tauri backend, opening the GUI in a new window.

### Features
- **System Requirements Check**: Verify Docker, Git, Node.js, npm, Rust, Python3, FFmpeg, and other dependencies
- **Individual Dependency Installation**: Install missing dependencies one by one with sudo password support
- **Complete Setup Process**: One-click installation of all required dependencies and tools with sudo password handling
- **Live Progress Tracking**: Real-time updates on installation steps with timestamps
- **Error Display**: Clear error messages with timestamps and context
- **Build Status**: Visual indicators for build success/failure
- **Installation Logs**: Detailed logs with color-coded levels (INFO, SUCCESS, ERROR)
- **Project Creation**: Copy project files to specified directories
- **Build Script Execution**: Run the build process with live monitoring
- **Sudo Password Management**: Secure password input for system-level installations

### Usage
1. Open the app using the command above
2. Check system requirements and install missing dependencies individually or use "Complete Setup"
3. Set project and install paths
4. Create project files
5. Run the build script
6. Monitor progress, errors, and logs in real-time

### Complete Setup Process
The "Complete Setup Process" section automatically installs:
- System dependencies (build-essential, curl, wget, git, python3, nodejs, npm)
- Rust programming language
- Python dependencies (faster-whisper, torch, torchaudio, numpy)
- Node.js dependencies (React, Tauri, etc.)
- Tauri CLI
- Docker (if needed)

**Note**: The Complete Setup Process requires your sudo password for installing system packages. Enter your password in the provided field before running the setup.

The GUI provides a user-friendly interface for the entire installation process, with live updates and comprehensive logging.
