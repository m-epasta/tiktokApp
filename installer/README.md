# TikTok App Installer

A user-friendly installer for the TikTok App that handles all dependencies and setup automatically.

## Installation

### For both macOS and Linux:

```bash
# Download the installer
curl -fsSL https://raw.githubusercontent.com/m-epasta/tiktokApp/main/install.sh -o install.sh

# Make it executable
chmod +x install.sh

# Run the installer
./install.sh
```

### macOS Prerequisites

If you're on macOS, you might need to install some prerequisites first:

1. Install Homebrew (if not already installed):
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

2. Install Docker Desktop for Mac:
   - Download from [Docker Desktop](https://www.docker.com/products/docker-desktop)
   - Or install via Homebrew:
```bash
brew install --cask docker
```

3. Start Docker Desktop:
   - Open Docker Desktop from your Applications folder
   - Wait for the Docker engine to start (whale icon in menu bar should stop animating)

## System Requirements

- **Operating System**: Linux or macOS
- **Disk Space**: Minimum 2GB free space
- **Memory**: 4GB RAM recommended
- **Internet**: Active internet connection required
- **Permissions**: Administrative privileges (for installing dependencies)

## What Gets Installed?

The installer will set up:

1. **Development Environment**
   - Docker (if not already installed)
   - Git (if not already installed)

2. **Application Components**
   - App core files
   - Required dependencies
   - Build tools and configurations

## Installation Process

1. **Environment Check**
   - Verifies system requirements
   - Checks existing installations

2. **Dependency Setup**
   - Installs missing dependencies
   - Configures development environment

3. **Application Installation**
   - Downloads application files
   - Builds from source
   - Creates desktop shortcuts

4. **Verification**
   - Tests installation
   - Confirms everything is working

## Troubleshooting

### Common Issues

1. **Docker Installation Fails**
   - Ensure you have admin privileges
   - Check internet connection
   
   For Linux:
   - Try running: `sudo systemctl start docker`
   
   For macOS:
   - Open Docker Desktop from Applications
   - Check Docker Desktop status in menu bar
   - Run: `docker ps` to verify Docker is running

2. **Build Process Fails**
   - Ensure enough disk space
   - Check Docker daemon is running
   - Verify internet connection

3. **Permission Issues**
   For Linux:
   - Run: `sudo usermod -aG docker $USER`
   - Log out and log back in
   
   For macOS:
   - Ensure you have admin rights on your Mac
   - Open System Settings > Privacy & Security
   - Allow Docker Desktop access if prompted

### Error Codes

- `E001`: Docker installation failed
- `E002`: Insufficient disk space
- `E003`: Network connectivity issues
- `E004`: Build process error

## Additional Notes

- Installation directory: `~/.tiktok-app`
- Logs location: `~/.tiktok-app/logs`
- Configuration file: `~/.tiktok-app/config.json`

### macOS-Specific Notes

- Docker Desktop must be running before installation
- If you see a security prompt about Docker.app, click "Open"
- Installation requires approximately 5GB of free space in your home directory
- The app creates a directory in your home folder at `~/.tiktok-app`
- To update Docker on macOS: `brew upgrade docker`
- To start Docker on login:
  1. Open Docker Desktop
  2. Click the whale icon in the menu bar
  3. Go to Preferences > General
  4. Check "Start Docker Desktop when you log in"

## Need Help?

If you encounter any issues:

1. Check the logs in `~/.tiktok-app/logs`
2. Visit our [Issues Page](https://github.com/m-epasta/tiktokApp/issues)

## Uninstallation

To remove the application:

```bash
rm -rf ~/.tiktok-app
```

To remove Docker and Git:

On Linux:
```bash
sudo apt remove docker docker-engine docker.io containerd runc
sudo apt remove git
```

On macOS:
```bash
# Remove Docker Desktop
brew uninstall --cask docker

# Remove Git
brew uninstall git

# Optional: Remove Homebrew if no longer needed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/uninstall.sh)"
```

## License

This installer is distributed under the MIT License. See `LICENSE` file for more information.

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.
