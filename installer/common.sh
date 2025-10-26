#!/bin/bash
# Common utilities for installer scripts

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Enhanced Logging functions with detailed step-by-step tracking
LOG_FILE="/tmp/installer.log"
PROGRESS_FILE="/tmp/installer_progress.json"
ERROR_FILE="/tmp/installer_errors.json"
STEP_COUNTER_FILE="/tmp/installer_step_counter.txt"

# Initialize step counter
init_step_counter() {
    echo "0" > "$STEP_COUNTER_FILE"
}

# Get current step number
get_current_step() {
    if [ -f "$STEP_COUNTER_FILE" ]; then
        cat "$STEP_COUNTER_FILE"
    else
        echo "0"
    fi
}

# Increment step counter
increment_step() {
    current=$(get_current_step)
    next=$((current + 1))
    echo "$next" > "$STEP_COUNTER_FILE"
    echo "$next"
}

# Detailed logging functions
log_info() {
    echo "[INFO] $(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE"
}

log_error() {
    echo "[ERROR] $(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE"
    echo "{\"error\": \"$1\", \"timestamp\": \"$(date '+%Y-%m-%d %H:%M:%S')\", \"step\": \"$(get_current_step)\"}" >> "$ERROR_FILE"
}

log_success() {
    echo "[SUCCESS] $(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE"
}

log_debug() {
    echo "[DEBUG] $(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE"
}

log_step() {
    step_num=$(increment_step)
    echo "[STEP $step_num] $(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE"
    echo "{\"step\": \"$step_num: $1\", \"timestamp\": \"$(date '+%Y-%m-%d %H:%M:%S')\", \"step_number\": \"$step_num\"}" >> "$PROGRESS_FILE"
}

# UX friendly indicators with enhanced logging
print_info() {
    echo -e "${BLUE}INFO:${NC} $1"
    log_info "$1"
}

print_error() {
    echo -e "${RED}ERROR:${NC} $1"
    log_error "$1"
}

print_success() {
    echo -e "${GREEN}SUCCESS:${NC} $1"
    log_success "$1"
}

print_warning() {
    echo -e "${YELLOW}WARNING:${NC} $1"
    log_info "WARNING: $1"
}

# Enhanced progress indicator with detailed steps
show_progress() {
    step_num=$(increment_step)
    echo -e "${BLUE}[STEP $step_num]${NC} $1"
    log_step "$1"
    # Update progress file for frontend with more details
    echo "{\"step\": \"$step_num: $1\", \"timestamp\": \"$(date '+%Y-%m-%d %H:%M:%S')\", \"step_number\": \"$step_num\", \"details\": \"$(echo "$1" | sed 's/^[0-9]*: //')\"}" >> "$PROGRESS_FILE"
}

# Detailed progress with sub-steps
show_sub_progress() {
    echo -e "${BLUE}  →${NC} $1"
    log_info "Sub-step: $1"
    # Update progress file for frontend
    echo "{\"step\": \"$(get_current_step): $1\", \"timestamp\": \"$(date '+%Y-%m-%d %H:%M:%S')\", \"type\": \"substep\"}" >> "$PROGRESS_FILE"
}

# Show command execution details
show_command() {
    echo -e "${YELLOW}EXECUTING:${NC} $1"
    log_info "Executing command: $1"
}

# Show command result
show_command_result() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}COMMAND SUCCESS:${NC} $1"
        log_success "Command completed successfully: $1"
    else
        echo -e "${RED}COMMAND FAILED:${NC} $1"
        log_error "Command failed: $1"
    fi
}

# Error handling
handle_error() {
    print_error "$1"
    log_error "$1"
    # Update error file for frontend
    echo "{\"error\": \"$1\", \"timestamp\": \"$(date '+%Y-%m-%d %H:%M:%S')\"}" >> /tmp/installer_errors.json
    # Custom styled popup if Tauri is available
    if command -v tauri &> /dev/null; then
        show_error_popup "$1"
    fi
    exit 1
}

# Enhanced popup with styled dialog
show_popup() {
    print_success "$1"
    if command -v tauri &> /dev/null; then
        # Use custom styled popup instead of basic tauri dialog
        tauri command show_styled_popup --title "TikTok App Installer" --message "$1" --type "success" --icon "✅" 2>/dev/null || {
            # Fallback to basic dialog if custom command fails
            tauri dialog --title "Installation Success" --message "$1" --type info
        }
    fi
}

# Enhanced popup with task completion tracking
show_completion_popup() {
    print_success "$1"

    # Log the completion for the GUI to display
    echo "{\"type\": \"completion\", \"message\": \"$1\", \"timestamp\": \"$(date '+%Y-%m-%d %H:%M:%S')\", \"icon\": \"✅\"}" >> /tmp/installer_completions.json

    if command -v tauri &> /dev/null; then
        # Use custom styled popup instead of basic tauri dialog
        tauri command show_styled_popup --title "TikTok App Installer" --message "$1" --type "success" --icon "✅" 2>/dev/null || {
            # Fallback to basic dialog if custom command fails
            tauri dialog --title "Installation Success" --message "$1" --type info
        }
    fi
}

# Enhanced error popup
show_error_popup() {
    print_error "$1"
    if command -v tauri &> /dev/null; then
        # Use custom styled error popup
        tauri command show_styled_popup --title "Installation Error" --message "$1" --type "error" --icon "❌" 2>/dev/null || {
            # Fallback to basic dialog if custom command fails
            tauri dialog --title "Installation Error" --message "$1" --type error
        }
    fi
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Detect OS
get_os() {
    case "$(uname -s)" in
        Linux*)     echo "linux";;
        Darwin*)    echo "macos";;
        *)         echo "unknown";;
    esac
}
