/**
 * ============================================================================
 * Subtitle Generator Component
 * ============================================================================
 * 
 * Main UI component for generating and managing subtitles.
 * Handles video upload, subtitle generation, preview, and export.
 * 
 * Features:
 * - Video file selection
 * - Real-time progress tracking
 * - Live subtitle preview
 * - Export with burned-in subtitles
 * - Model selection (tiny, base, small, medium, large)
 * 
 * Usage:
 *   <SubtitleGenerator />
 */

import { useState, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core'
import { open, save } from '@tauri-apps/plugin-dialog' 
import { motion } from 'framer-motion';
import { listen } from '@tauri-apps/api/event';
import SubtitlePreview from './SubtitlePreview';

interface SubtitleSegment {
  startTime: number;
  endTime: number;
  text: string;
}

interface SubtitleResult {
  subtitle_path: string;
  segment_count: number;
  duration_seconds: number;
  language: string;
}

export default function SubtitleGenerator() {
  const [videoPath, setVideoPath] = useState<string>('');
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [subtitles, setSubtitles] = useState<SubtitleSegment[]>([]);
  const [subtitlePath, setSubtitlePath] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState<string>('');
  const [modelSize, setModelSize] = useState<string>('base');
  
  const videoRef = useRef<HTMLVideoElement>(null);

  // Select video file
  const handleSelectVideo = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{
          name: 'Video',
          extensions: ['mp4', 'mov', 'avi', 'mkv', 'webm']
        }]
      });

      if (selected) {
        setVideoPath(selected as string);
        setVideoUrl(`file://${selected}`);
        setSubtitles([]);
        setSubtitlePath('');
      }
    } catch (error) {
      console.error('Error selecting video:', error);
    }
  };

  // Generate subtitles
  const handleGenerateSubtitles = async () => {
    if (!videoPath) return;

    setIsGenerating(true);
    setProgress('Starting...');

    try {
      // Listen for progress updates
      const unlisten = await listen('subtitle_progress', (event) => {
        setProgress(event.payload as string);
      });

      const result = await invoke<SubtitleResult>('create_subtitles', {
        videoPath,
        modelSize,
      });

      setSubtitlePath(result.subtitle_path);
      
      // Parse subtitle file to get segments
      const segments = await parseSubtitleFile(result.subtitle_path);
      setSubtitles(segments);
      
      setProgress(`✓ Generated ${result.segment_count} subtitles`);
      
      unlisten();
    } catch (error) {
      console.error('Error generating subtitles:', error);
      setProgress(`Error: ${error}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Export video with subtitles
  const handleExport = async () => {
    if (!videoPath || !subtitlePath) return;

    try {
      const outputPath = await save({
        defaultPath: videoPath.replace(/\.[^.]+$/, '_subtitled.mp4'),
        filters: [{
          name: 'Video',
          extensions: ['mp4']
        }]
      });

      if (!outputPath) return;

      setIsExporting(true);
      setProgress('Exporting video...');

      await invoke('overlay_subtitles', {
        videoPath,
        subtitlePath,
        outputPath,
      });

      setProgress('✓ Export complete!');
    } catch (error) {
      console.error('Error exporting:', error);
      setProgress(`Export error: ${error}`);
    } finally {
      setIsExporting(false);
    }
  };

  // Parse ASS file into segments
  const parseSubtitleFile = async (path: string): Promise<SubtitleSegment[]> => {
    try {
      const content = await invoke<string>('read_subtitle_file', { path });
      const lines = content.split('\n');
      const segments: SubtitleSegment[] = [];
      
      let isEvents = false;
      for (const line of lines) {
        if (line.startsWith('[Events]')) {
          isEvents = true;
          continue;
        }
        
        if (isEvents && line.startsWith('Dialogue:')) {
          const parts = line.split(',');
          if (parts.length >= 10) {
            const startTime = parseAssTime(parts[1].trim());
            const endTime = parseAssTime(parts[2].trim());
            const text = parts.slice(9).join(',').trim();
            
            segments.push({ startTime, endTime, text });
          }
        }
      }
      
      return segments;
    } catch (error) {
      console.error('Error parsing subtitle file:', error);
      return [];
    }
  };

  const parseAssTime = (timestamp: string): number => {
    const [hours, minutes, seconds] = timestamp.split(':').map(Number);
    return hours * 3600 + minutes * 60 + seconds;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Subtitle Generator
          </h1>
          <p className="text-white/60">
            Generate AI-powered subtitles for your videos
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Video Preview */}
          <div className="space-y-4">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                Video Preview
              </h2>
              
              {!videoPath ? (
                <div className="aspect-video bg-black/50 rounded-xl flex items-center justify-center">
                  <button
                    onClick={handleSelectVideo}
                    className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-medium transition-colors"
                  >
                    Select Video
                  </button>
                </div>
              ) : (
                <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
                  <video
                    ref={videoRef}
                    src={videoUrl}
                    controls
                    className="w-full h-full"
                  />
                  
                  {/* Subtitle Overlay */}
                  {subtitles.length > 0 && (
                    <SubtitlePreview
                      videoRef={videoRef}
                      subtitles={subtitles}
                      style="glass"
                    />
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right: Controls */}
          <div className="space-y-4">
            {/* Model Selection */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Settings
              </h3>
              
              <div className="space-y-3">
                <label className="block">
                  <span className="text-white/80 text-sm">Model Size</span>
                  <select
                    value={modelSize}
                    onChange={(e) => setModelSize(e.target.value)}
                    className="mt-1 block w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="tiny">Tiny (fastest)</option>
                    <option value="base">Base (recommended)</option>
                    <option value="small">Small (better quality)</option>
                    <option value="medium">Medium (high quality)</option>
                    <option value="large">Large (best quality)</option>
                  </select>
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Actions
              </h3>
              
              <div className="space-y-3">
                <button
                  onClick={handleGenerateSubtitles}
                  disabled={!videoPath || isGenerating}
                  className="w-full px-6 py-3 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors"
                >
                  {isGenerating ? 'Generating...' : 'Generate Subtitles'}
                </button>

                <button
                  onClick={handleExport}
                  disabled={!subtitlePath || isExporting}
                  className="w-full px-6 py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors"
                >
                  {isExporting ? 'Exporting...' : 'Export Video'}
                </button>
              </div>

              {/* Progress */}
              {progress && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-3 bg-white/10 rounded-lg"
                >
                  <p className="text-white/80 text-sm">{progress}</p>
                </motion.div>
              )}
            </div>

            {/* Info */}
            {subtitles.length > 0 && (
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Subtitle Info
                </h3>
                
                <div className="space-y-2 text-white/80 text-sm">
                  <p>Segments: {subtitles.length}</p>
                  <p>File: {subtitlePath.split('/').pop()}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
