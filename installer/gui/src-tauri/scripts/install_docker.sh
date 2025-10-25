#!/bin/bash

# Colors for better readability
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🐳 Installing Docker..."

# Check if we're on Linux
if [ "$(uname -s)" != "Linux" ]; then
    echo -e "${RED}This script only supports Linux systems${NC}"
    exit 1
fi

# Detect the Linux distribution
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$NAME
fi

# Install Docker based on the distribution
case "$OS" in
    "Ubuntu"|"Debian GNU/Linux")
        # Remove old versions
        sudo apt-get remove -y docker docker-engine docker.io containerd runc || true
        
        # Install prerequisites
        sudo apt-get update
        sudo apt-get install -y \
            apt-transport-https \
            ca-certificates \
            curl \
            gnupg \
            lsb-release

        # Add Docker's official GPG key
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

        # Set up the stable repository
        echo \
          "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
          $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

        # Install Docker Engine
        sudo apt-get update
        sudo apt-get install -y docker-ce docker-ce-cli containerd.io
        ;;
        
    "Fedora")
        # Remove old versions
        sudo dnf remove -y docker docker-client docker-client-latest docker-common docker-latest docker-latest-logrotate docker-logrotate docker-selinux docker-engine-selinux docker-engine || true

        # Add Docker repository
        sudo dnf -y install dnf-plugins-core
        sudo dnf config-manager --add-repo https://download.docker.com/linux/fedora/docker-ce.repo

        # Install Docker Engine
        sudo dnf install -y docker-ce docker-ce-cli containerd.io
        ;;

    *)
        echo -e "${RED}Unsupported Linux distribution: $OS${NC}"
        exit 1
        ;;
esac

# Start and enable Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Add current user to docker group
sudo usermod -aG docker $USER

echo -e "${GREEN}✅ Docker has been successfully installed!${NC}"
echo -e "${YELLOW}NOTE: You may need to log out and back in for the docker group changes to take effect.${NC}"