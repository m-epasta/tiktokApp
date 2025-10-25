/**
 * ============================================================================
 * Subtitle Preview Component
 * ============================================================================
 *
 * Real-time subtitle preview overlay on video player.
 * Displays subtitles synchronized with video playback.
 *
 * Features:
 * - Live subtitle synchronization
 * - TikTok-style colorful word-by-word display
 * - Dynamic emoji insertion
 * - Glass morphism background
 * - Smooth fade in/out animations
 *
 * Usage:
 *   <SubtitlePreview
 *     videoRef={videoRef}
 *     subtitles={parsedSubtitles}
 *   />
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SubtitleSegment {
  startTime: number;  // in seconds
  endTime: number;    // in seconds
  text: string;
}

interface SubtitlePreviewProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  subtitles: SubtitleSegment[];
  style?: 'default' | 'glass' | 'solid' | 'tiktok';
}

export default function SubtitlePreview({
  videoRef,
  subtitles,
  style = 'tiktok'
}: SubtitlePreviewProps) {
  const [currentSubtitle, setCurrentSubtitle] = useState<string>('');

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      const currentTime = video.currentTime;

      // Find subtitle for current time
      const subtitle = subtitles.find(
        sub => currentTime >= sub.startTime && currentTime <= sub.endTime
      );

      setCurrentSubtitle(subtitle?.text || '');
    };

    video.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [videoRef, subtitles]);

  if (!currentSubtitle) return null;

  return (
    <AnimatePresence mode="wait">
      {currentSubtitle && (
        <motion.div
          key={currentSubtitle}
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          transition={{
            duration: 0.3,
            ease: [0.25, 0.46, 0.45, 0.94] // TikTok-like smooth easing
          }}
          className={getStyleClasses(style)}
        >
          <TikTokSubtitleText text={currentSubtitle} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// TikTok-style subtitle text with word-by-word color rotation and animations
function TikTokSubtitleText({ text }: { text: string }) {
  const words = text.split(' ');
  const colorPalettes = [
    // Gradient color sets for different moods
    ['text-yellow-300', 'text-pink-400', 'text-cyan-300', 'text-white'],
    ['text-green-300', 'text-blue-400', 'text-purple-400', 'text-pink-300'],
    ['text-orange-400', 'text-red-400', 'text-yellow-300', 'text-white'],
    ['text-purple-300', 'text-blue-400', 'text-cyan-300', 'text-white']
  ];

  // Select a random color palette for this subtitle
  const colors = colorPalettes[Math.floor(Math.random() * colorPalettes.length)];

  // Animation variants for words
  const wordVariants = {
    hidden: { 
      opacity: 0, 
      y: 20, 
      rotateX: -90,
      scale: 0.8 
    },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      rotateX: 0,
      scale: 1,
      transition: {
        delay: i * 0.03,
        type: 'spring',
        stiffness: 100,
        damping: 12,
        mass: 0.5
      }
    }),
    hover: {
      y: -5,
      scale: 1.1,
      transition: { 
        type: 'spring',
        stiffness: 500,
        damping: 15
      }
    }
  };

  // Check if text is mostly emojis
  const emojiCount = (text.match(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1F100}-\u{1F1FF}\u{1F200}-\u{1F2FF}\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{1F004}\u{1F0CF}\u{1F18E}\u{1F191}-\u{1F19A}\u{1F1E6}-\u{1F1FF}\u{1F201}\u{1F21A}\u{1F22F}\u{1F232}-\u{1F23A}\u{1F250}-\u{1F251}\u{1F300}-\u{1F321}\u{1F324}-\u{1F393}\u{1F396}-\u{1F397}\u{1F399}-\u{1F39B}\u{1F39E}-\u{1F3F0}\u{1F3F3}-\u{1F3F5}\u{1F3F7}-\u{1F4FD}\u{1F4FF}-\u{1F53D}\u{1F549}-\u{1F54E}\u{1F550}-\u{1F567}\u{1F56F}-\u{1F570}\u{1F573}-\u{1F57A}\u{1F587}\u{1F58A}-\u{1F58D}\u{1F590}\u{1F595}-\u{1F596}\u{1F5A4}-\u{1F5A5}\u{1F5A8}\u{1F5B1}-\u{1F5B2}\u{1F5BC}\u{1F5C2}-\u{1F5C4}\u{1F5D1}-\u{1F5D3}\u{1F5DC}-\u{1F5DE}\u{1F5E1}\u{1F5E3}\u{1F5E8}\u{1F5EF}\u{1F5F3}\u{1F5FA}-\u{1F64F}\u{1F680}-\u{1F6C5}\u{1F6CB}-\u{1F6D0}\u{1F6E0}-\u{1F6E5}\u{1F6E9}\u{1F6EB}-\u{1F6EC}\u{1F6F0}\u{1F6F3}-\u{1F6FA}\u{1F7E0}-\u{1F7EB}\u{1F90D}-\u{1F971}\u{1F973}-\u{1F976}\u{1F97A}-\u{1F9A2}\u{1F9A5}-\u{1F9AA}\u{1F9AE}-\u{1F9CA}\u{1F9CD}-\u{1F9FF}\u{1FA70}-\u{1FA73}\u{1FA78}-\u{1FA7A}\u{1FA80}-\u{1FA82}\u{1FA90}-\u{1FA95}]/gu) || []).length;
  const isMostlyEmojis = emojiCount > 0 && (emojiCount / text.length) > 0.3;

  return (
    <div className={`flex flex-wrap justify-center items-center gap-1 ${isMostlyEmojis ? 'gap-2' : 'gap-1'}`}>
      {words.map((word, index) => {
        const colorIndex = index % colors.length;
        const isEmoji = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1F100}-\u{1F1FF}\u{1F200}-\u{1F2FF}\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{1F004}\u{1F0CF}\u{1F18E}\u{1F191}-\u{1F19A}\u{1F1E6}-\u{1F1FF}\u{1F201}\u{1F21A}\u{1F22F}\u{1F232}-\u{1F23A}\u{1F250}-\u{1F251}\u{1F300}-\u{1F321}\u{1F324}-\u{1F393}\u{1F396}-\u{1F397}\u{1F399}-\u{1F39B}\u{1F39E}-\u{1F3F0}\u{1F3F3}-\u{1F3F5}\u{1F3F7}-\u{1F4FD}\u{1F4FF}-\u{1F53D}\u{1F549}-\u{1F54E}\u{1F550}-\u{1F567}\u{1F56F}-\u{1F570}\u{1F573}-\u{1F57A}\u{1F587}\u{1F58A}-\u{1F58D}\u{1F590}\u{1F595}-\u{1F596}\u{1F5A4}-\u{1F5A5}\u{1F5A8}\u{1F5B1}-\u{1F5B2}\u{1F5BC}\u{1F5C2}-\u{1F5C4}\u{1F5D1}-\u{1F5D3}\u{1F5DC}-\u{1F5DE}\u{1F5E1}\u{1F5E3}\u{1F5E8}\u{1F5EF}\u{1F5F3}\u{1F5FA}-\u{1F64F}\u{1F680}-\u{1F6C5}\u{1F6CB}-\u{1F6D0}\u{1F6E0}-\u{1F6E5}\u{1F6E9}\u{1F6EB}-\u{1F6EC}\u{1F6F0}\u{1F6F3}-\u{1F6FA}\u{1F7E0}-\u{1F7EB}\u{1F90D}-\u{1F971}\u{1F973}-\u{1F976}\u{1F97A}-\u{1F9A2}\u{1F9A5}-\u{1F9AA}\u{1F9AE}-\u{1F9CA}\u{1F9CD}-\u{1F9FF}\u{1FA70}-\u{1FA73}\u{1FA78}-\u{1FA7A}\u{1FA80}-\u{1FA82}\u{1FA90}-\u{1FA95}]/u.test(word);
        
        return (
          <motion.span
            key={`${word}-${index}`}
            custom={index}
            initial="hidden"
            animate="visible"
            whileHover="hover"
            variants={wordVariants}
            className={`
              ${colors[colorIndex]}
              ${isEmoji ? (isMostlyEmojis ? 'text-4xl md:text-5xl' : 'text-2xl') : 'text-xl md:text-3xl'}
              font-black
              uppercase
              tracking-wide
              drop-shadow-2xl
              ${isEmoji ? (isMostlyEmojis ? 'animate-bounce' : '') : ''}
              relative
              z-10
              px-1
              rounded-lg
              transform-gpu
              will-change-transform
              whitespace-nowrap
              ${isEmoji ? 'inline-flex items-center justify-center' : ''}
            `}
            style={{
              textShadow: '0 2px 10px rgba(0,0,0,0.5)',
              fontFamily: isEmoji ? 'Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif' : '"Helvetica Neue", Arial, sans-serif',
              WebkitTextStroke: isEmoji ? '1px rgba(0,0,0,0.3)' : 'none',
              lineHeight: isEmoji ? '1.2' : '1.3'
            }}
          >
            {word}
            {!isEmoji && (
              <motion.span 
                className="absolute inset-0 bg-white/10 rounded-lg -z-10"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 0.3, scale: 1.1 }}
                transition={{
                  repeat: Infinity,
                  repeatType: 'reverse',
                  duration: 1.5 + Math.random() * 1,
                  ease: 'easeInOut'
                }}
              />
            )}
          </motion.span>
        );
      })}
    </div>
  );
}

function getStyleClasses(style: 'default' | 'glass' | 'solid' | 'tiktok'): string {
  const baseClasses = 'absolute bottom-24 left-1/2 transform -translate-x-1/2 px-6 py-4 rounded-2xl max-w-[95%] md:max-w-[85%]';

  switch (style) {
    case 'tiktok':
      return `${baseClasses} bg-black/20 backdrop-blur-sm border border-white/20 shadow-2xl`;
    case 'glass':
      return `${baseClasses} bg-black/40 backdrop-blur-md border border-white/10`;
    case 'solid':
      return `${baseClasses} bg-black/80`;
    case 'default':
    default:
      return `${baseClasses} bg-black/60 backdrop-blur-sm`;
  }
}
