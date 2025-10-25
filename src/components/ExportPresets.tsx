/**
 * Export Presets Component
 * 
 * Professional export presets for different platforms and use cases
 */

import { motion } from 'framer-motion';

export interface ExportPreset {
  id: string;
  name: string;
  description: string;
  icon: string;
  settings: {
    resolution: string;
    fps: number;
    quality: 'low' | 'medium' | 'high' | 'ultra';
    format: string;
  };
}

export const EXPORT_PRESETS: ExportPreset[] = [
  {
    id: 'tiktok',
    name: 'TikTok Optimized',
    description: '9:16 vertical, 60fps, perfect for TikTok',
    icon: '🎵',
    settings: {
      resolution: '1080x1920',
      fps: 60,
      quality: 'high',
      format: 'mp4',
    },
  },
  {
    id: 'instagram-reel',
    name: 'Instagram Reels',
    description: '9:16 vertical, optimized for Instagram',
    icon: '📸',
    settings: {
      resolution: '1080x1920',
      fps: 30,
      quality: 'high',
      format: 'mp4',
    },
  },
  {
    id: 'youtube-shorts',
    name: 'YouTube Shorts',
    description: '9:16 vertical, YouTube Shorts format',
    icon: '▶️',
    settings: {
      resolution: '1080x1920',
      fps: 60,
      quality: 'ultra',
      format: 'mp4',
    },
  },
  {
    id: 'facebook-story',
    name: 'Facebook Story',
    description: '9:16 vertical, Facebook Stories',
    icon: '👥',
    settings: {
      resolution: '1080x1920',
      fps: 30,
      quality: 'medium',
      format: 'mp4',
    },
  },
  {
    id: 'high-quality',
    name: 'High Quality',
    description: 'Maximum quality, larger file size',
    icon: '⭐',
    settings: {
      resolution: '1080x1920',
      fps: 60,
      quality: 'ultra',
      format: 'mp4',
    },
  },
  {
    id: 'fast-export',
    name: 'Fast Export',
    description: 'Quick processing, smaller file',
    icon: '⚡',
    settings: {
      resolution: '1080x1920',
      fps: 30,
      quality: 'medium',
      format: 'mp4',
    },
  },
];

interface ExportPresetsProps {
  selectedPreset: string;
  onSelectPreset: (presetId: string) => void;
}


export default function ExportPresets({ selectedPreset, onSelectPreset }: ExportPresetsProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-white/80">Export Presets</h3>
      <div className="grid grid-cols-2 gap-3">
        {EXPORT_PRESETS.map((preset) => (
          <motion.button
            key={preset.id}
            onClick={() => onSelectPreset(preset.id)}
            className={`
              relative p-4 rounded-xl text-left transition-all
              ${
                selectedPreset === preset.id
                  ? 'bg-gradient-to-br from-purple-500/30 to-pink-500/30 border-2 border-purple-400'
                  : 'bg-white/5 border-2 border-white/10 hover:border-white/20'
              }
            `}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="text-3xl mb-2">{preset.icon}</div>
            <div className="text-sm font-semibold text-white mb-1">{preset.name}</div>
            <div className="text-xs text-white/60">{preset.description}</div>
            <div className="mt-2 flex gap-2 flex-wrap">
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                {preset.settings.fps}fps
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                {preset.settings.quality}
              </span>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
