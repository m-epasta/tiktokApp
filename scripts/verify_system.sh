#!/bin/bash

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check Python version
check_python_version() {
    if command_exists python3; then
        PY_VERSION=$(python3 --version 2>&1 | awk '{print $2}')
        echo "✓ Python $PY_VERSION"
        return 0
    elif command_exists python; then
        PY_VERSION=$(python --version 2>&1 | awk '{print $2}')
        # Check if version starts with 3
        if [[ $PY_VERSION == 3* ]]; then
            echo "✓ Python $PY_VERSION"
            return 0
        fi
    fi
    echo "❌ Python 3 not found"
    return 1
}

# Function to check ffmpeg
check_ffmpeg() {
    if command_exists ffmpeg; then
        FFMPEG_VERSION=$(ffmpeg -version | head -n1 | awk '{print $3}')
        echo "✓ FFmpeg $FFMPEG_VERSION"
        return 0
    fi
    echo "❌ FFmpeg not found"
    return 1
}
# System Verification Script - TikTok Clip Studio v2.0.0
# Verifies all components are working correctly

set -e

echo "🔍 TikTok Clip Studio - System Verification"
echo "=============================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Function to check command
check_command() {
    if command -v $1 &> /dev/null; then
        echo -e "${GREEN}✓${NC} $1 is installed"
        return 0
    else
        echo -e "${RED}✗${NC} $1 is NOT installed"
        ((ERRORS++))
        return 1
    fi
}

# Function to check file
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} Found: $1"
        return 0
    else
        echo -e "${RED}✗${NC} Missing: $1"
        ((ERRORS++))
        return 1
    fi
}

# Function to check Python module
check_python_module() {
    if python3 -c "import $1" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} Python module: $1"
        return 0
    else
        echo -e "${RED}✗${NC} Python module missing: $1"
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
check_file "whisper_transcribe.py"
check_file "src/App.tsx"
check_file "src/main.tsx"
check_file "src/types/index.ts"
check_file "src/utils/format.ts"
echo ""

echo "🦀 Checking Rust Code..."
echo "-----------------------------------"
cd src-tauri
if cargo check --quiet 2>&1 | grep -q "error"; then
    echo -e "${RED}✗${NC} Rust code has errors"
    cargo check 2>&1 | grep "error" | head -5
    ((ERRORS++))
else
    echo -e "${GREEN}✓${NC} Rust code compiles"
fi

if cargo clippy --quiet 2>&1 | grep -q "warning"; then
    echo -e "${YELLOW}⚠${NC} Rust code has warnings"
    ((WARNINGS++))
else
    echo -e "${GREEN}✓${NC} No clippy warnings"
fi
cd ..
echo ""

echo "⚛️  Checking TypeScript Code..."
echo "-----------------------------------"
if [ -f "tsconfig.json" ]; then
    if npx tsc --noEmit 2>&1 | grep -q "error"; then
        echo -e "${RED}✗${NC} TypeScript has errors"
        ((ERRORS++))
    else
        echo -e "${GREEN}✓${NC} TypeScript compiles"
    fi
else
    echo -e "${YELLOW}⚠${NC} No tsconfig.json found"
    ((WARNINGS++))
fi
echo ""

echo "🐍 Checking Python Code..."
echo "-----------------------------------"
if python3 -m py_compile whisper_transcribe.py 2>/dev/null; then
    echo -e "${GREEN}✓${NC} Python code is valid"
else
    echo -e "${RED}✗${NC} Python code has syntax errors"
    ((ERRORS++))
fi

# Check Python script can be imported
if python3 -c "import sys; sys.path.insert(0, '.'); exec(open('whisper_transcribe.py').read())" 2>/dev/null; then
    echo -e "${GREEN}✓${NC} Python script is importable"
else
    echo -e "${YELLOW}⚠${NC} Python script has import issues (may be normal)"
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
    echo -e "${GREEN}✓${NC} package.json version: 2.0.0"
else
    echo -e "${YELLOW}⚠${NC} package.json version mismatch"
    ((WARNINGS++))
fi

if grep -q 'version = "2.0.0"' src-tauri/Cargo.toml; then
    echo -e "${GREEN}✓${NC} Cargo.toml version: 2.0.0"
else
    echo -e "${YELLOW}⚠${NC} Cargo.toml version mismatch"
    ((WARNINGS++))
fi

if grep -q 'VERSION = "2.0.0"' whisper_transcribe.py; then
    echo -e "${GREEN}✓${NC} whisper_transcribe.py version: 2.0.0"
else
    echo -e "${YELLOW}⚠${NC} whisper_transcribe.py version mismatch"
    ((WARNINGS++))
fi
echo ""

echo "🧪 Running Quick Tests..."
echo "-----------------------------------"

# Test Python script help
if python3 whisper_transcribe.py 2>&1 | grep -q "Usage:"; then
    echo -e "${GREEN}✓${NC} Python script shows help"
else
    echo -e "${RED}✗${NC} Python script help not working"
    ((ERRORS++))
fi

# Test FFmpeg
if ffmpeg -version 2>&1 | grep -q "ffmpeg version"; then
    echo -e "${GREEN}✓${NC} FFmpeg is functional"
else
    echo -e "${RED}✗${NC} FFmpeg not working"
    ((ERRORS++))
fi
echo ""

echo "=============================================="
echo "📊 Verification Summary"
echo "=============================================="
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL CHECKS PASSED!${NC}"
    echo ""
    echo "✅ System is ready for production"
    echo "✅ All dependencies installed"
    echo "✅ Code compiles successfully"
    echo "✅ Documentation complete"
    echo ""
    echo "🚀 Ready to run:"
    echo "   npm run tauri:dev"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  PASSED WITH WARNINGS${NC}"
    echo ""
    echo "Warnings: $WARNINGS"
    echo ""
    echo "System is functional but has minor issues."
    echo "Review warnings above."
    echo ""
    echo "🚀 You can still run:"
    echo "   npm run tauri:dev"
    exit 0
else
    echo -e "${RED}❌ VERIFICATION FAILED${NC}"
    echo ""
    echo "Errors: $ERRORS"
    echo "Warnings: $WARNINGS"
    echo ""
    echo "Please fix the errors above before running the application."
    echo ""
    echo "Common fixes:"
    echo "  - Install missing dependencies: npm install"
    echo "  - Install Python packages: pip3 install faster-whisper"
    echo "  - Install FFmpeg: sudo apt install ffmpeg"
    exit 1
fi
