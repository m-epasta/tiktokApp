#!/usr/bin/env python3
"""
Generate FFmpeg overlay commands for emojis
Reads ASS file and creates overlay filter for each emoji
"""

import sys
import re
import json
from pathlib import Path
from typing import List, Dict, TypedDict

class EmojiData(TypedDict):
    """Type definition for emoji data structure"""
    emoji: str
    start: str
    end: str
    text: str

def parse_ass_file(ass_file: str) -> List[EmojiData]:
    """Parse ASS file and extract emoji positions and timings."""
    emojis_data: List[EmojiData] = []
    
    with open(ass_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Extract events
    events_section = content.split('[Events]')[1] if '[Events]' in content else ""
    
    for line in events_section.split('\n'):
        if line.startswith('Dialogue:'):
            parts = line.split(',', 9)
            if len(parts) < 10:
                continue
            
            start_time = parts[1]  # Format: 0:00:00.00
            end_time = parts[2]
            text = parts[9]
            
            # Find emojis in text (Unicode range for emojis AND escaped sequences)
            emoji_pattern = re.compile(
                r"("
                r"[\U0001F600-\U0001F64F]"  # emoticons
                r"|[\U0001F300-\U0001F5FF]"  # symbols & pictographs
                r"|[\U0001F680-\U0001F6FF]"  # transport & map symbols
                r"|[\U0001F1E0-\U0001F1FF]"  # flags
                r"|[\U00002702-\U000027B0]"
                r"|[\U000024C2-\U0001F251]"
                r"|\\u[0-9a-fA-F]{4}"  # escaped Unicode sequences like \u1234
                r"|\\U[0-9a-fA-F]{8}"  # escaped Unicode sequences like \U00012345
                r"|\\ud[89a-fA-F][0-9a-fA-F]{2}"  # surrogate pairs like \ud83d\udc4d
                r")+", flags=re.UNICODE
            )
            
            emojis: List[str] = emoji_pattern.findall(text)
            
            for emoji in emojis:
                emojis_data.append({
                    'emoji': emoji,
                    'start': start_time,
                    'end': end_time,
                    'text': text
                })
    
    return emojis_data

def time_to_seconds(time_str: str) -> float:
    """Convert ASS time format (0:00:00.00) to seconds."""
    parts = time_str.split(':')
    hours = int(parts[0])
    minutes = int(parts[1])
    seconds = float(parts[2])
    return hours * 3600 + minutes * 60 + seconds

def generate_overlay_filter(emojis_data: List[EmojiData], emoji_images_dir: str = "emoji_images") -> str:
    """
    Generate FFmpeg overlay filter for all emojis.
    
    Returns complex filter string for FFmpeg.
    """
    # Load emoji map
    map_file = Path(emoji_images_dir) / "emoji_map.json"
    if not map_file.exists():
        print(f"Error: {map_file} not found. Run emoji_to_image.py first!")
        return ""
    
    with open(map_file, 'r', encoding='utf-8') as f:
        emoji_map: Dict[str, str] = json.load(f)
    
    # Build overlay filter
    overlays: List[str] = []
    
    for i, data in enumerate(emojis_data):
        emoji: str = data['emoji']
        
        # Convert escaped Unicode sequences back to actual emojis
        try:
            # Handle \u and \U sequences
            emoji = emoji.encode().decode('unicode-escape')
        except (UnicodeDecodeError, UnicodeEncodeError):
            # If decoding fails, use the original emoji
            pass
        
        if emoji not in emoji_map:
            print(f"Warning: Emoji '{emoji}' not found in emoji map")
            continue
        
        image_path = emoji_map[emoji]
        start_sec = time_to_seconds(data['start'])
        end_sec = time_to_seconds(data['end'])
        
        # Position: right side of text, centered vertically
        # x=W/2+100, y=H/2 (center of screen, offset to right)
        overlay = f"movie={image_path}:loop=0,setpts=PTS-STARTPTS+{start_sec}/TB[emoji{i}];"
        overlay += f"[v{i}][emoji{i}]overlay=x=W/2+100:y=H/2:enable='between(t,{start_sec},{end_sec})'[v{i+1}]"
        
        overlays.append(overlay)
    
    if not overlays:
        return ""
    
    # Combine all overlays
    filter_complex = ";".join(overlays)
    return filter_complex

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 generate_emoji_overlays.py <ass_file>")
        sys.exit(1)
    
    ass_file = sys.argv[1]
    
    print(f"📄 Parsing: {ass_file}")
    emojis_data = parse_ass_file(ass_file)
    
    print(f"✓ Found {len(emojis_data)} emoji instances")
    
    if emojis_data:
        filter_str = generate_overlay_filter(emojis_data)
        
        # Save to file
        output_file = ass_file.replace('.ass', '_emoji_filter.txt')
        with open(output_file, 'w') as f:
            f.write(filter_str)
        
        print(f"✓ Overlay filter saved to: {output_file}")
    else:
        print("⚠ No emojis found in subtitle file")
