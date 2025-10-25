/**
 * Video Processing Hook
 * 
 * Professional hook for managing video processing state and operations
 * with comprehensive error handling and progress tracking.
 */

import { useState, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';

export interface ProcessingState {
  isProcessing: boolean;
  progress: number;
  stage: string;
  error: string | null;
  result: string | null;
}

export interface ProcessingOptions {
  onProgress?: (progress: number, stage: string) => void;
  onComplete?: (result: string) => void;
  onError?: (error: string) => void;
}

export function useVideoProcessing() {
  const [state, setState] = useState<ProcessingState>({
    isProcessing: false,
    progress: 0,
    stage: '',
    error: null,
    result: null,
  });

  const updateProgress = useCallback((progress: number, stage: string) => {
    setState(prev => ({ ...prev, progress, stage }));
  }, []);

  const startProcessing = useCallback(() => {
    setState({
      isProcessing: true,
      progress: 0,
      stage: 'Starting...',
      error: null,
      result: null,
    });
  }, []);

  const completeProcessing = useCallback((result: string) => {
    setState({
      isProcessing: false,
      progress: 100,
      stage: 'Complete',
      error: null,
      result,
    });
  }, []);

  const failProcessing = useCallback((error: string) => {
    setState(prev => ({
      ...prev,
      isProcessing: false,
      error,
    }));
  }, []);

  const resetProcessing = useCallback(() => {
    setState({
      isProcessing: false,
      progress: 0,
      stage: '',
      error: null,
      result: null,
    });
  }, []);

  const exportVideo = useCallback(async (
    input: string,
    output: string,
    options?: ProcessingOptions
  ) => {
    try {
      startProcessing();
      options?.onProgress?.(10, 'Preparing export...');
      
      const result = await invoke<string>('export_tiktok', { input, output });
      
      options?.onProgress?.(100, 'Complete');
      completeProcessing(result);
      options?.onComplete?.(result);
      
      return result;
    } catch (error) {
      const errorMsg = String(error);
      failProcessing(errorMsg);
      options?.onError?.(errorMsg);
      throw error;
    }
  }, [startProcessing, completeProcessing, failProcessing]);

  const exportWithSubtitles = useCallback(async (
    input: string,
    output: string,
    subtitleFile: string,
    options?: ProcessingOptions
  ) => {
    try {
      startProcessing();
      options?.onProgress?.(10, 'Preparing export with subtitles...');
      
      const result = await invoke<string>('export_with_subs', {
        input,
        output,
        subtitleFile,
      });
      
      options?.onProgress?.(100, 'Complete');
      completeProcessing(result);
      options?.onComplete?.(result);
      
      return result;
    } catch (error) {
      const errorMsg = String(error);
      failProcessing(errorMsg);
      options?.onError?.(errorMsg);
      throw error;
    }
  }, [startProcessing, completeProcessing, failProcessing]);

  return {
    state,
    exportVideo,
    exportWithSubtitles,
    updateProgress,
    resetProcessing,
  };
}
