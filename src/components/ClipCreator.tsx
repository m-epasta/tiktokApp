/**
 * ============================================================================
 * Clip Creator Component
 * ============================================================================
 *
 * Intelligent clip detection and extraction from long-form videos.
 * Uses scene detection to automatically find interesting segments.
 *
 * Features:
 * - Automatic scene-based clip detection
 * - Manual time-based clip creation
 * - Batch export multiple clips
 * - Preview detected clips
 *
 * Usage:
 *   <ClipCreator />
 */

import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core'
import { open, save } from '@tauri-apps/plugin-dialog' 
import { motion } from 'framer-motion';

interface Clip {
  start_time: number;
  end_time: number;
  duration: number;
  score: number;
}

export default function ClipCreator() {
  const [videoPath, setVideoPath] = useState<string>('');
  const [clips, setClips] = useState<Clip[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState<string>('');
  const [selectedClips, setSelectedClips] = useState<Set<number>>(new Set());
  const [detectionMethod, setDetectionMethod] = useState<'scene' | 'time'>('scene');

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
        setClips([]);
        setSelectedClips(new Set());
      }
    } catch (error) {
      console.error('Error selecting video:', error);
    }
  };

  // Detect clips automatically
  const handleDetectClips = async () => {
    if (!videoPath) return;

    setIsDetecting(true);
    setProgress('Analyzing video...');

    try {
      // Listen for progress updates
      const unlisten = await (window as any).__TAURI__.event.listen('export_log', (event: any) => {
        setProgress(event.payload);
      });

      const detectedClips = await invoke<Clip[]>('detect_clips', {
        videoPath,
        method: detectionMethod,
      });

      setClips(detectedClips);
      setProgress(`✓ Found ${detectedClips.length} clips!`);

      // Select all clips by default
      setSelectedClips(new Set(detectedClips.map((_, i) => i)));

      unlisten();
    } catch (error) {
      console.error('Error detecting clips:', error);
      setProgress(`Error: ${error}`);
    } finally {
      setIsDetecting(false);
    }
  };

  // Export selected clips
  const handleExportClips = async () => {
    if (!videoPath || selectedClips.size === 0) return;

    try {
      const outputDir = await save({
        defaultPath: videoPath.replace(/\.[^.]+$/, '_clips'),
      });

      if (!outputDir) return;

      setIsExporting(true);
      setProgress('Exporting clips...');

      const unlisten = await (window as any).__TAURI__.event.listen('export_log', (event: any) => {
        setProgress(event.payload);
      });

      const selectedClipData = clips.filter((_, i) => selectedClips.has(i));

      await invoke('batch_export_clips', {
        input: videoPath,
        outputDir,
        clips: selectedClipData,
        withSubtitles: false,
      });

      setProgress(`✓ Exported ${selectedClips.size} clips!`);
      unlisten();
    } catch (error) {
      console.error('Error exporting clips:', error);
      setProgress(`Export error: ${error}`);
    } finally {
      setIsExporting(false);
    }
  };

  // Toggle clip selection
  const toggleClipSelection = (index: number) => {
    const newSelection = new Set(selectedClips);
    if (newSelection.has(index)) {
      newSelection.delete(index);
    } else {
      newSelection.add(index);
    }
    setSelectedClips(newSelection);
  };

  // Format time for display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Clip Creator
          </h1>
          <p className="text-white/60">
            Automatically detect and extract clips from long videos
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Controls */}
          <div className="space-y-4">
            {/* Video Selection */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Video Source
              </h3>

              {!videoPath ? (
                <button
                  onClick={handleSelectVideo}
                  className="w-full px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors"
                >
                  Select Video
                </button>
              ) : (
                <div className="space-y-3">
                  <p className="text-white/80 text-sm truncate">
                    {videoPath.split('/').pop()}
                  </p>
                  <button
                    onClick={handleSelectVideo}
                    className="w-full px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm transition-colors"
                  >
                    Change Video
                  </button>
                </div>
              )}
            </div>

            {/* Detection Settings */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Detection Method
              </h3>

              <div className="space-y-3">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="method"
                    value="scene"
                    checked={detectionMethod === 'scene'}
                    onChange={(e) => setDetectionMethod(e.target.value as 'scene')}
                    className="w-4 h-4 text-blue-500"
                  />
                  <div>
                    <p className="text-white font-medium">Scene Detection</p>
                    <p className="text-white/60 text-xs">Intelligent AI-based</p>
                  </div>
                </label>

                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="method"
                    value="time"
                    checked={detectionMethod === 'time'}
                    onChange={(e) => setDetectionMethod(e.target.value as 'time')}
                    className="w-4 h-4 text-blue-500"
                  />
                  <div>
                    <p className="text-white font-medium">Time-based</p>
                    <p className="text-white/60 text-xs">Fixed intervals</p>
                  </div>
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
                  onClick={handleDetectClips}
                  disabled={!videoPath || isDetecting}
                  className="w-full px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors"
                >
                  {isDetecting ? 'Detecting...' : 'Detect Clips'}
                </button>

                <button
                  onClick={handleExportClips}
                  disabled={selectedClips.size === 0 || isExporting}
                  className="w-full px-6 py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors"
                >
                  {isExporting ? 'Exporting...' : `Export ${selectedClips.size} Clips`}
                </button>
              </div>

              {/* Progress */}
              {progress && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-3 bg-white/10 rounded-lg max-h-32 overflow-y-auto"
                >
                  <p className="text-white/80 text-sm whitespace-pre-wrap">{progress}</p>
                </motion.div>
              )}
            </div>
          </div>

          {/* Right: Clip List */}
          <div className="lg:col-span-2">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">
                  Detected Clips ({clips.length})
                </h3>
                {clips.length > 0 && (
                  <button
                    onClick={() => {
                      if (selectedClips.size === clips.length) {
                        setSelectedClips(new Set());
                      } else {
                        setSelectedClips(new Set(clips.map((_, i) => i)));
                      }
                    }}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm transition-colors"
                  >
                    {selectedClips.size === clips.length ? 'Deselect All' : 'Select All'}
                  </button>
                )}
              </div>

              {clips.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-white/40 text-lg">
                    No clips detected yet
                  </p>
                  <p className="text-white/30 text-sm mt-2">
                    Select a video and click "Detect Clips" to get started
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {clips.map((clip, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => toggleClipSelection(index)}
                      className={`p-4 rounded-xl cursor-pointer transition-all ${
                        selectedClips.has(index)
                          ? 'bg-blue-500/20 border-2 border-blue-500'
                          : 'bg-white/5 border-2 border-transparent hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                            selectedClips.has(index) ? 'bg-blue-500' : 'bg-white/10'
                          }`}>
                            {selectedClips.has(index) && (
                              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <div>
                            <p className="text-white font-medium">
                              Clip {index + 1}
                            </p>
                            <p className="text-white/60 text-sm">
                              {formatTime(clip.start_time)} → {formatTime(clip.end_time)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-medium">
                            {clip.duration.toFixed(1)}s
                          </p>
                          <p className="text-white/60 text-sm">
                            Score: {(clip.score * 100).toFixed(0)}%
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
