#!/usr/bin/env python3
"""
AI-Enhanced Whisper Transcription Engine for TikTok Clip Studio
"""

import sys
import logging
from typing import Dict, List, Optional
from collections import defaultdict
from pathlib import Path
from dataclasses import dataclass, field
from enum import Enum

try:
    from faster_whisper import WhisperModel  # type: ignore
except ImportError:
    print("ERROR: faster-whisper not installed. Run: pip install faster-whisper", file=sys.stderr)
    sys.exit(1)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stderr)]
)
logger = logging.getLogger(__name__)

# Constants
VERSION = "2.0.0"
DEFAULT_MODEL_SIZE = "base"
SUPPORTED_MODELS = ["tiny", "base", "small", "medium", "large", "large-v2", "large-v3"]
MAX_WORD_LENGTH = 100
MIN_CONFIDENCE_THRESHOLD = 0.3

class Sentiment(Enum):
    """Enumeration of supported sentiment types."""
    POSITIVE = "positive"
    NEGATIVE = "negative"
    ENERGETIC = "energetic"
    NEUTRAL = "neutral"


@dataclass
class TranscriptionStats:
    """Statistics for a transcription session."""
    total_words: int = 0
    emoji_count: int = 0
    ai_assigned_emojis: int = 0
    sentiment_distribution: Dict[str, int] = field(default_factory=lambda: {})
    language: str = "unknown"
    language_probability: float = 0.0


def format_timestamp_srt(seconds: float) -> str:
    """Convert seconds to SRT timestamp format."""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millis = int((seconds % 1) * 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"


def format_timestamp_ass(seconds: float) -> str:
    """Convert seconds to ASS timestamp format."""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    centisecs = int((seconds % 1) * 100)
    return f"{hours}:{minutes:02d}:{secs:02d}.{centisecs:02d}"


class AIEnhancer:
    """AI-Powered Text Enhancement Engine."""
    
    def __init__(self):
        # Filler/stop words
        self.filler_words = {
            "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
            "le", "la", "les", "un", "une", "des", "de", "du", "et", "ou", "mais",
            # ... (rest of your filler words remain the same)
        }
        
        # Sentiment lexicons
        self.positive_words = {
            "love", "happy", "great", "amazing", "awesome", "perfect", "best",
            "amour", "aimer", "heureux", "heureuse", "génial", "géniale", "super",
            # ... (rest of your positive words remain the same)
        }
        
        self.negative_words = {
            "hate", "sad", "bad", "terrible", "awful", "worst", "horrible",
            "détester", "triste", "mauvais", "mauvaise", "terrible", "horrible",
            # ... (rest of your negative words remain the same)
        }
        
        self.energetic_words = {
            "fire", "lit", "hot", "crazy", "wild", "insane", "explosive",
            "feu", "chaud", "chaude", "fou", "folle", "dingue", "sauvage",
            # ... (rest of your energetic words remain the same)
        }
        
        # Emoji categories
        self.emoji_categories: Dict[str, Dict[str, str]] = {
            "emotions_positive": {
                "love": "❤️", "heart": "💖", "like": "👍", "happy": "😊",
                "amour": "❤️", "coeur": "💖", "cœur": "💖", "aimer": "❤️",
                # ... (rest of your emoji mappings remain the same)
            },
            # ... (other categories remain the same)
        }
        
        # Flatten emoji map
        self.emoji_map: Dict[str, str] = {}
        for emojis in self.emoji_categories.values():
            self.emoji_map.update(emojis)
        
        # Emphasis words
        self.emphasis_words = {
            "important", "never", "always", "must", "need", "critical",
            "important", "jamais", "toujours", "doit", "besoin", "critique",
            # ... (rest of your emphasis words remain the same)
        }
        
        # Color schemes
        self.color_schemes = {
            "positive": "&H0000FFFF",
            "negative": "&H00FF8080", 
            "energetic": "&H0000FFFF",
            "neutral": "&H00FFFFFF",
            "emphasis": "&H0000FF00",
            "celebration": "&H00FF00FF"
        }
    
    def analyze_sentiment(self, words_list: List[str]) -> str:
        """Analyze sentiment of a text segment."""
        if not words_list:
            return Sentiment.NEUTRAL.value
            
        words_lower = [w.lower().strip('.,!?;:') for w in words_list if w]
        
        positive_count = sum(1 for w in words_lower if w in self.positive_words)
        negative_count = sum(1 for w in words_lower if w in self.negative_words)
        energetic_count = sum(1 for w in words_lower if w in self.energetic_words)
        
        if energetic_count >= 1:
            return Sentiment.ENERGETIC.value
        elif positive_count > negative_count and positive_count >= 1:
            return Sentiment.POSITIVE.value
        elif negative_count > positive_count and negative_count >= 1:
            return Sentiment.NEGATIVE.value
        else:
            return Sentiment.NEUTRAL.value
    
    def is_important_word(self, word: str, word_confidence: float = 1.0) -> bool:
        """Determine if a word is semantically important."""
        if not word or len(word) > MAX_WORD_LENGTH:
            return False
            
        if word in self.filler_words:
            return False
        
        if word in self.emphasis_words:
            return True
        
        if word in self.positive_words or word in self.negative_words or word in self.energetic_words:
            return True
        
        if len(word) >= 5:
            return True
        
        return False
    
    def assign_smart_emoji(self, word: str, sentiment: str = "neutral") -> str:
        """Intelligently assign emoji using pattern matching and sentiment."""
        if word in self.emoji_map:
            return self.emoji_map[word]
        
        if sentiment == "positive":
            return "✨"
        elif sentiment == "energetic":
            return "🔥"
        elif sentiment == "negative":
            return "💭"

        # Pattern matching for various word categories
        if any(pattern in word for pattern in ["ing", "ed", "run", "jump", "move", "work", "er", "ant", "ent", "courir", "sauter", "bouger", "travailler"]):
            return "💨"

        if any(pattern in word for pattern in ["achiev", "success", "complet", "finish", "accomplish", "réussir", "succès", "terminer", "accomplir"]):
            return "🏆"

        if any(pattern in word for pattern in ["learn", "know", "understand", "study", "teach", "apprendre", "savoir", "comprendre", "étudier", "enseigner"]):
            return "💡"

        if any(pattern in word for pattern in ["friend", "family", "people", "person", "team", "ami", "amis", "famille", "gens", "personne", "équipe"]):
            return "👥"

        if any(pattern in word for pattern in ["today", "tomorrow", "yesterday", "time", "moment", "aujourd'hui", "demain", "hier", "temps", "moment"]):
            return "⏰"

        if any(pattern in word for pattern in ["why", "how", "what", "question", "wonder", "pourquoi", "comment", "quoi", "question"]):
            return "🤔"

        return "✨"
    
    def get_contextual_emoji(self, word: str, prev_words: Optional[List[str]] = None, 
                            next_words: Optional[List[str]] = None) -> Optional[str]:
        """Get emoji with context awareness."""
        if word in self.emoji_map:
            return self.emoji_map[word]
        
        if prev_words:
            prev_text = ' '.join(prev_words).lower()
            if "on fire" in prev_text and word in ["fire", "hot"]:
                return "🔥"
            if "love" in prev_text and word in ["you", "it", "this"]:
                return "❤️"
        
        return None
    
    def should_emphasize(self, word: str) -> bool:
        """Check if word requires visual emphasis."""
        return word in self.emphasis_words
    
    def get_color_for_sentiment(self, sentiment: str) -> str:
        """Get ASS color code for sentiment."""
        return self.color_schemes.get(sentiment, self.color_schemes["neutral"])


def transcribe_to_srt(audio_path: str, output_path: str, model_size: str = DEFAULT_MODEL_SIZE) -> str:
    """Main transcription function with AI enhancements."""
    if not Path(audio_path).exists():
        raise FileNotFoundError(f"Audio file not found: {audio_path}")
    
    if model_size not in SUPPORTED_MODELS:
        logger.warning(f"Model '{model_size}' not in supported list. Proceeding anyway...")
    
    logger.info(f"🤖 Initializing AI-Enhanced Whisper model: {model_size}...")
    print(f"🤖 Initializing AI-Enhanced Whisper model: {model_size}...", file=sys.stderr)
        
    ai = AIEnhancer()
        
    try:
        model = WhisperModel(
            model_size, 
            device="cpu", 
            compute_type="int8",
            cpu_threads=0
        )
        logger.info("Model loaded successfully")
    except Exception as e:
        logger.error(f"Failed to load Whisper model: {e}")
        raise RuntimeError(f"Model initialization failed: {e}")
        
    print(f"Transcribing: {audio_path}...", file=sys.stderr)
        
    try:
        segments, info = model.transcribe(  # type: ignore
            audio_path,
            word_timestamps=True,
            language=None,
            vad_filter=True,
            vad_parameters=dict(min_silence_duration_ms=500)
        )
    except Exception as e:
        logger.error(f"Transcription failed: {e}")
        raise RuntimeError(f"Transcription error: {e}")
        
    logger.info(f"Detected language: {info.language} (probability: {info.language_probability:.2f})")
    print(f"Detected language: {info.language} (probability: {info.language_probability:.2f})", file=sys.stderr)
        
    stats = TranscriptionStats(
        language=info.language,
        language_probability=info.language_probability
    )
        
    ass_output = output_path.replace('.srt', '.ass')
        
    try:
        with open(ass_output, 'w', encoding='utf-8') as f:
            # ASS Header
            f.write("[Script Info]\n")
            f.write("Title: TikTok Captions\n")
            f.write("ScriptType: v4.00+\n")
            f.write("WrapStyle: 0\n")
            f.write("PlayResX: 1080\n")
            f.write("PlayResY: 1920\n")
            f.write("\n")
                
            # Styles
            f.write("[V4+ Styles]\n")
            f.write("Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\n")
                
            f.write("Style: Color1,Luckiest Guy,100,&H0000FFFF,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,6,3,5,10,10,0,1\n")
            f.write("Style: Color2,Luckiest Guy,100,&H00FF00FF,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,6,3,5,10,10,0,1\n")
            f.write("Style: Color3,Luckiest Guy,100,&H00FFFF00,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,6,3,5,10,10,0,1\n")
            f.write("Style: Color4,Luckiest Guy,100,&H0000FF00,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,6,3,5,10,10,0,1\n")
            f.write("Style: Color5,Luckiest Guy,100,&H00FF8000,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,6,3,5,10,10,0,1\n")
            f.write("Style: Color6,Luckiest Guy,100,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,6,3,5,10,10,0,1\n")

            f.write("Style: Emphasis,Luckiest Guy,110,&H0000FF00,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,7,4,5,10,10,0,1\n")
            f.write("Style: Celebration,Luckiest Guy,105,&H00FF00FF,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,6,3,5,10,10,0,1\n")
            f.write("Style: Energetic,Luckiest Guy,102,&H0000FFFF,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,6,3,5,10,10,0,1\n")
            f.write("\n")
                
            # Events
            f.write("[Events]\n")
            f.write("Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n")
                
            word_count = 0
            total_words = 0
            emoji_count = 0
            important_word_count = 0
            sentiment_stats: defaultdict[str, int] = defaultdict(int)
                
            segments_list = list(segments)
                
            for segment in segments_list:
                if hasattr(segment, 'words') and segment.words:
                    total_words += len(segment.words)
                    
            print(f"🎯 Processing {total_words} words with AI enhancements...", file=sys.stderr)
                
            for segment in segments_list:
                if hasattr(segment, 'words') and segment.words:
                    segment_words = [w.word for w in segment.words]
                    segment_sentiment = ai.analyze_sentiment(segment_words)
                    sentiment_stats[segment_sentiment] += 1
                        
                    for word in segment.words:
                        start_time = format_timestamp_ass(word.start)
                        end_time = format_timestamp_ass(word.end)
                            
                        word_clean = word.word.strip()
                        word_lower = word_clean.lower().strip('.,!?;:')
                        text_raw = word_clean.upper()

                        animation_pop = "\\t(0, 150, \\fscx125\\fscy125)"
                        text = f"{{{animation_pop}}}{text_raw}"

                        emoji = ai.get_contextual_emoji(word_lower, None, None)

                        if not emoji and ai.is_important_word(word_lower):
                            emoji = ai.assign_smart_emoji(word_lower, segment_sentiment)
                            important_word_count += 1

                        if emoji:
                            animation_emoji = "\\t(0, 150, \\fscx125\\fscy125)"
                            text += f" {{{animation_emoji}}} {emoji}"
                            emoji_count += 1

                        color_styles = ["Color1", "Color2", "Color3", "Color4", "Color5", "Color6"]
                        style = color_styles[word_count % 6]

                        if ai.should_emphasize(word_lower):
                            style = "Emphasis"
                            text = f"✨ {text} ✨"
                        elif word_lower in ["party", "celebrate", "congrats", "congratulations", "birthday",
                                          "fête", "fêter", "célébrer", "anniversaire", "félicitations"]:
                            style = "Celebration"
                        elif word_lower in ai.energetic_words:
                            style = "Energetic"

                        f.write(f"Dialogue: 0,{start_time},{end_time},{style},,0,0,0,,{text}\n")
                        word_count += 1
                        
            stats.total_words = word_count
            stats.emoji_count = emoji_count
            stats.ai_assigned_emojis = important_word_count
            stats.sentiment_distribution = dict(sentiment_stats)
                
            logger.info("AI processing complete")
            print(f"✓ AI processing complete:", file=sys.stderr)
            print(f"  • {word_count} words processed", file=sys.stderr)
            print(f"  • {emoji_count} emojis added ({important_word_count} AI-assigned to important words)", file=sys.stderr)
            print(f"  • Sentiment distribution:", file=sys.stderr)
            for sentiment, count in sentiment_stats.items():
                print(f"    - {sentiment}: {count} segments", file=sys.stderr)
                
    except IOError as e:
        logger.error(f"Failed to write subtitle file: {e}")
        raise IOError(f"Could not write to {ass_output}: {e}")
        
    logger.info(f"Transcription saved to: {ass_output}")
    logger.info(f"Generated {word_count} word-level subtitles")
    print(f"✓ Transcription saved to: {ass_output}", file=sys.stderr)
    print(f"✓ Generated {word_count} word-level subtitles", file=sys.stderr)
        
    return ass_output


def main():
    """Main entry point for the transcription service."""
    logger.info(f"AI-Enhanced Whisper Transcription Engine v{VERSION}")
        
    if len(sys.argv) < 3:
        print(f"AI-Enhanced Whisper Transcription Engine v{VERSION}", file=sys.stderr)
        print("\nUsage:", file=sys.stderr)
        print("  python3 whisper_transcribe.py <audio_file> <output_srt> [model_size]\n", file=sys.stderr)
        print("Arguments:", file=sys.stderr)
        print("  audio_file   Path to input audio file (WAV, MP3, etc.)", file=sys.stderr)
        print("  output_srt   Path for output subtitle file (.srt extension)", file=sys.stderr)
        print(f"  model_size   Whisper model size (default: {DEFAULT_MODEL_SIZE})", file=sys.stderr)
        print(f"               Options: {', '.join(SUPPORTED_MODELS)}\n", file=sys.stderr)
        print("Example:", file=sys.stderr)
        print("  python3 whisper_transcribe.py audio.wav subtitles.srt medium\n", file=sys.stderr)
        sys.exit(1)
        
    audio_file = sys.argv[1]
    output_file = sys.argv[2]
    model_size = sys.argv[3] if len(sys.argv) > 3 else DEFAULT_MODEL_SIZE
        
    try:
        result = transcribe_to_srt(audio_file, output_file, model_size)
        logger.info(f"SUCCESS: Transcription completed - {result}")
        sys.exit(0)
    except FileNotFoundError as e:
        logger.error(f"File not found: {e}")
        print(f"ERROR: {e}", file=sys.stderr)
        sys.exit(2)
    except ValueError as e:
        logger.error(f"Invalid input: {e}")
        print(f"ERROR: {e}", file=sys.stderr)
        sys.exit(3)
    except RuntimeError as e:
        logger.error(f"Runtime error: {e}")
        print(f"ERROR: {e}", file=sys.stderr)
        sys.exit(4)
    except Exception as e:
        logger.exception("Unexpected error occurred")
        print(f"FATAL ERROR: {e}", file=sys.stderr)
        sys.exit(5)


if __name__ == "__main__":
    main()