# TikTok App Environment Configuration

# Add local bin directories to PATH
export PATH="$HOME/.local/bin:$PATH"
export PATH="$HOME/.cargo/bin:$PATH"

# Application specific environment variables
export TIKTOK_APP_HOME="$HOME/.tiktok-app"
export FFMPEG_PATH="/usr/local/bin/ffmpeg"
export PYTHON_PATH="/usr/bin/python3"

# Useful aliases for development
alias tiktok-dev='cd $TIKTOK_APP_HOME && npm run tauri:dev'
alias tiktok-build='cd $TIKTOK_APP_HOME && npm run build'
alias tiktok-test='cd $TIKTOK_APP_HOME && npm run test'

# Load Rust environment if it exists
[ -f "$HOME/.cargo/env" ] && source "$HOME/.cargo/env"