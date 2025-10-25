/**
 * Progress Indicator Component
 * 
 * Beautiful, animated progress indicator with stage information
 */

import { motion } from 'framer-motion';

interface ProgressIndicatorProps {
  progress: number;
  stage: string;
  isProcessing: boolean;
}

export default function ProgressIndicator({ progress, stage, isProcessing }: ProgressIndicatorProps) {
  if (!isProcessing && progress === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50"
    >
      <div className="bg-black/90 backdrop-blur-xl border border-white/20 rounded-2xl p-6 min-w-[400px] shadow-2xl">
        {/* Stage */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-white font-medium">{stage}</span>
          <span className="text-white/60 text-sm">{Math.round(progress)}%</span>
        </div>

        {/* Progress Bar */}
        <div className="relative h-3 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
          
          {/* Shimmer effect */}
          {isProcessing && progress < 100 && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              animate={{
                x: ['-100%', '200%'],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          )}
        </div>

        {/* Processing indicator */}
        {isProcessing && progress < 100 && (
          <div className="mt-3 flex items-center justify-center gap-2">
            <motion.div
              className="w-2 h-2 bg-purple-400 rounded-full"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            <motion.div
              className="w-2 h-2 bg-pink-400 rounded-full"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 0.2,
              }}
            />
            <motion.div
              className="w-2 h-2 bg-purple-400 rounded-full"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 0.4,
              }}
            />
          </div>
        )}

        {/* Complete indicator */}
        {progress === 100 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="mt-3 text-center text-green-400 font-medium"
          >
            ✓ Complete!
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
