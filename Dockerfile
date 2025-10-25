# Build stage
FROM rust:1.73-bookworm as builder

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libwebkit2gtk-4.0-dev \
    build-essential \
    curl \
    wget \
    file \
    libssl-dev \
    libgtk-3-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev \
    npm \
    python3 \
    python3-pip \
    ffmpeg

# Install Node.js
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs

# Create app directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
COPY requirements.txt ./

# Install dependencies
RUN npm install
RUN pip3 install -r requirements.txt

# Copy the rest of the application
COPY . .

# Install Tauri CLI
RUN cargo install tauri-cli

# Build the application
RUN npm run build
RUN cargo tauri build

# The build artifacts will be in /app/src-tauri/target/release/