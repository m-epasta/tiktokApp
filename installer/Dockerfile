FROM ubuntu:22.04

# Install essential packages
RUN apt-get update && apt-get install -y \
    curl \
    git \
    build-essential \
    pkg-config \
    libssl-dev \
    nodejs \
    npm \
    && rm -rf /var/lib/apt/lists/*

# Copy setup script
COPY setup_build_env.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/setup_build_env.sh

# Copy application files
WORKDIR /app
COPY . .

# Run setup script and build application
ENTRYPOINT ["/bin/bash", "-c", "\
    /usr/local/bin/setup_build_env.sh && \
    if [ $? -eq 0 ]; then \
        echo 'Setup completed successfully, building application...' && \
        ./build.sh \
    else \
        echo 'Setup failed!' && \
        exit 1 \
    fi \
"]