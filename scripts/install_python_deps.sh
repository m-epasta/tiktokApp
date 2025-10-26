#!/bin/bash

# Source common utilities
source "$(dirname "$0")/../installer/common.sh"

show_progress "Installing Python dependencies from requirements.txt..."
pip install -r requirements.txt || handle_error "Failed to install Python dependencies"
show_popup "Python dependencies installed successfully!"
