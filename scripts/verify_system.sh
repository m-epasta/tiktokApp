#!/bin/bash

# Source common utilities
source "$(dirname "$0")/../installer/common.sh"

# System Verification Script - TikTok Clip Studio v2.0.0
# Verifies all components are working correctly

set -e

show_progress "🔍 TikTok Clip Studio - System Verification"
echo "=============================================="
echo ""

ERRORS=0
WARNINGS=0

# Function to check command
check_command() {
    if command_exists "$1"; then
        print_success "✓ $1 is installed"
        return 0
    else
        print_error "✗ $1 is NOT installed"
        ((ERRORS++))
        return 1
    fi
}

# Function to check file
check_file() {
    if [ -f "$1" ]; then
        print_success "✓ Found: $1"
        return 0
    else
        print_error "✗ Missing: $1"
        ((ERRORS++))
        return 1
    fi
}

# Function to check Python module
check_python_module() {
    if python3 -c "import $1" 2>/dev/null; then
        print_success "✓ Python module: $1"
        return 0
    else
        print_error "✗ Python module missing: $1"
        ((ERRORS++))
        return 1
    fi
}

echo "📦 Checking System Dependencies..."
echo "-----------------------------------"
check_command "node"
check_command "npm"
check_command "cargo"
check_command "rustc"
check_command "python3"
check_command "ffmpeg"
check_command "pip3"
echo ""

echo "🐍 Checking Python Dependencies..."
echo "-----------------------------------"
check_python_module "faster_whisper"
echo ""

echo "📁 Checking Project Files..."
echo "-----------------------------------"
check_file "package.json"
check_file "src-tauri/Cargo.toml"
check_file "scripts/whisper_transcribe.py"
check_file "src/App.tsx"
check_file "src/main.tsx"
check_file "src/types/index.ts"
check_file "src/utils/format.ts"
echo ""

echo "🦀 Checking Rust Code..."
echo "-----------------------------------"
cd src-tauri
if cargo check --quiet 2>&1 | grep -q "error"; then
    print_error "✗ Rust code has errors"
    cargo check 2>&1 | grep "error" | head -5
    ((ERRORS++))
else
    print_success "✓ Rust code compiles"
fi

if cargo clippy --quiet 2>&1 | grep -q "warning"; then
    print_warning "⚠ Rust code has warnings"
    ((WARNINGS++))
else
    print_success "✓ No clippy warnings"
fi
cd ..
echo ""

echo "⚛️  Checking TypeScript Code..."
echo "-----------------------------------"
if [ -f "tsconfig.json" ]; then
    if npx tsc --noEmit 2>&1 | grep -q "error"; then
        print_error "✗ TypeScript has errors"
        ((ERRORS++))
    else
        print_success "✓ TypeScript compiles"
    fi
else
    print_warning "⚠ No tsconfig.json found"
    ((WARNINGS++))
fi
echo ""

echo "🐍 Checking Python Code..."
echo "-----------------------------------"
if python3 -m py_compile scripts/whisper_transcribe.py 2>/dev/null; then
    print_success "✓ Python code is valid"
else
    print_error "✗ Python code has syntax errors"
    ((ERRORS++))
fi

# Check Python script can be imported
if python3 -c "import sys; sys.path.insert(0, '.'); exec(open('scripts/whisper_transcribe.py').read())" 2>/dev/null; then
    print_success "✓ Python script is importable"
else
    print_warning "⚠ Python script has import issues (may be normal)"
    ((WARNINGS++))
fi
echo ""

echo "📚 Checking Documentation..."
echo "-----------------------------------"
check_file "README.md"
check_file "TRANSCRIPTION_README.md"
check_file "ASS_SUBTITLE_SYSTEM.md"
check_file "CHANGELOG.md"
echo ""

echo "🔧 Checking Configuration..."
echo "-----------------------------------"
if grep -q '"version": "2.0.0"' package.json; then
    print_success "✓ package.json version: 2.0.0"
else
    print_warning "⚠ package.json version mismatch"
    ((WARNINGS++))
fi

if grep -q 'version = "2.0.0"' src-tauri/Cargo.toml; then
    print_success "✓ Cargo.toml version: 2.0.0"
else
    print_warning "⚠ Cargo.toml version mismatch"
    ((WARNINGS++))
fi

if grep -q 'VERSION = "2.0.0"' scripts/whisper_transcribe.py; then
    print_success "✓ scripts/whisper_transcribe.py version: 2.0.0"
else
    print_warning "⚠ scripts/whisper_transcribe.py version mismatch"
    ((WARNINGS++))
fi
echo ""

echo "🧪 Running Quick Tests..."
echo "-----------------------------------"

# Test Python script help
if python3 scripts/whisper_transcribe.py 2>&1 | grep -q "Usage:"; then
    print_success "✓ Python script shows help"
else
    print_error "✗ Python script help not working"
    ((ERRORS++))
fi

# Test FFmpeg
if ffmpeg -version 2>&1 | grep -q "ffmpeg version"; then
    print_success "✓ FFmpeg is functional"
else
    print_error "✗ FFmpeg not working"
    ((ERRORS++))
fi
echo ""

echo "=============================================="
echo "📊 Verification Summary"
echo "=============================================="
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    show_popup "🎉 ALL CHECKS PASSED!"
    echo ""
    print_info "✅ System is ready for production"
    print_info "✅ All dependencies installed"
    print_info "✅ Code compiles successfully"
    print_info "✅ Documentation complete"
    echo ""
    print_info "🚀 Ready to run: npm run tauri:dev"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    print_warning "⚠️ PASSED WITH WARNINGS"
    echo ""
    print_info "Warnings: $WARNINGS"
    echo ""
    print_info "System is functional but has minor issues."
    print_info "Review warnings above."
    echo ""
    print_info "🚀 You can still run: npm run tauri:dev"
    exit 0
else
    handle_error "❌ VERIFICATION FAILED"
    echo ""
    print_info "Errors: $ERRORS"
    print_info "Warnings: $WARNINGS"
    echo ""
    print_info "Please fix the errors above before running the application."
    echo ""
    print_info "Common fixes:"
    print_info "  - Install missing dependencies: npm install"
    print_info "  - Install Python packages: pip3 install faster-whisper"
    print_info "  - Install FFmpeg: sudo apt install ffmpeg"
    exit 1
fi
