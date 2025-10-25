#!/bin/bash
# Fix Emoji Rendering Issue
# This script removes cached subtitle files so new exports use the fixed emoji system

echo "🔧 TikTok Clip Studio - Emoji Fix Utility"
echo "=========================================="
echo ""

# Find and remove cached ASS files
echo "🔍 Looking for cached subtitle files..."

# Common locations
LOCATIONS=(
    "$HOME/Bureau"
    "$HOME/Desktop"
    "$HOME/Downloads"
    "$HOME/Documents"
    "/tmp"
)

COUNT=0

for location in "${LOCATIONS[@]}"; do
    if [ -d "$location" ]; then
        # Find ASS files modified in last 24 hours
        while IFS= read -r -d '' file; do
            echo "  Found: $file"
            read -p "  Delete this file? (y/n) " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                rm "$file"
                echo "  ✓ Deleted"
                ((COUNT++))
            else
                echo "  ⊘ Skipped"
            fi
        done < <(find "$location" -maxdepth 1 -name "*_audio.ass" -mtime -1 -print0 2>/dev/null)
    fi
done

echo ""
echo "=========================================="
echo "✓ Cleanup complete!"
echo "  Removed $COUNT cached subtitle file(s)"
echo ""
echo "📝 Next steps:"
echo "  1. Re-export your video"
echo "  2. New subtitles will use simple Unicode symbols (★, ►, •, etc.)"
echo "  3. No more font warnings!"
echo ""
