import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core'
import { motion, AnimatePresence } from 'framer-motion';

interface Requirement {
  name: string;
  status: 'checking' | 'success' | 'error';
  message?: string;
}

export default function SystemCheck({ onComplete }: { onComplete: () => void }) {
  const [requirements, setRequirements] = useState<Requirement[]>([
    { name: 'Python Dependencies', status: 'checking' },
    { name: 'FFmpeg', status: 'checking' },
    { name: 'Emoji Fonts', status: 'checking' },
    { name: 'System Configuration', status: 'checking' }
  ]);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    checkRequirements();
  }, []);

  const checkRequirements = async () => {
    try {
      const output = await invoke('run_command', { command: 'verify-system' });
      const results = parseVerificationOutput(output as string);
      
      setRequirements(results);

      // If all requirements are met, show success message
    } catch (error) {
      console.error('Verification failed:', error);
      setRequirements(prev => 
        prev.map(req => ({
          ...req,
          status: 'error',
          message: 'Verification failed'
        }))
      );
    }
  };

  const installMissingRequirements = async () => {
    setInstalling(true);
    try {
      console.log('Starting Python dependencies installation...');
      // Install Python dependencies
      const pipResult = await invoke('run_command', { command: 'install-python-deps' });
      console.log('Python installation output:', pipResult);

      console.log('Starting emoji fonts installation...');
      // Install emoji fonts
      const fontsResult = await invoke('run_command', { command: 'install-emoji-fonts' });
      console.log('Emoji fonts installation output:', fontsResult);

      console.log('Rechecking requirements...');
      // Recheck requirements
      await checkRequirements();
    } catch (error) {
      console.error('Installation failed:', error);
      setRequirements(prev => 
        prev.map(req => ({
          ...req,
          status: 'error',
          message: `Installation failed: ${error}`
        }))
      );
    } finally {
      setInstalling(false);
    }
  };

  const parseVerificationOutput = (output: string): Requirement[] => {
    const lines = output.split('\n');
    const results: Requirement[] = [];

    let currentReq: Requirement | null = null;

    for (const line of lines) {
      if (line.includes('Checking Python dependencies')) {
        currentReq = { name: 'Python Dependencies', status: 'checking' };
      } else if (line.includes('Checking FFmpeg')) {
        currentReq = { name: 'FFmpeg', status: 'checking' };
      } else if (line.includes('Checking emoji fonts')) {
        currentReq = { name: 'Emoji Fonts', status: 'checking' };
      } else if (line.includes('Checking system configuration')) {
        currentReq = { name: 'System Configuration', status: 'checking' };
      }

      if (currentReq) {
        if (line.includes('✓')) {
          currentReq.status = 'success';
        } else if (line.includes('❌')) {
          currentReq.status = 'error';
          currentReq.message = line.split('❌')[1]?.trim();
        }
        results.push(currentReq);
        currentReq = null;
      }
    }

    return results;
  };

  const allSuccessful = requirements.every(req => req.status === 'success');
  const hasErrors = requirements.some(req => req.status === 'error');

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 max-w-md w-full">
        <h2 className="text-2xl font-semibold text-white mb-6">System Check</h2>
        
        <div className="space-y-4">
          {requirements.map((req) => (
            <div key={req.name} className="flex items-center justify-between">
              <span className="text-white/80">{req.name}</span>
              <div className="flex items-center gap-2">
                <AnimatePresence mode="wait">
                  {req.status === 'checking' && (
                    <motion.div
                      key="checking"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"
                    />
                  )}
                  {req.status === 'success' && (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-green-500"
                    >
                      ✓
                    </motion.div>
                  )}
                  {req.status === 'error' && (
                    <motion.div
                      key="error"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-red-500"
                    >
                      ✕
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>

        {hasErrors ? (
          <div className="mt-6 space-y-4">
            <p className="text-red-400 text-sm">
              Some requirements are missing. Click below to install them.
            </p>
            <button
              onClick={installMissingRequirements}
              disabled={installing}
              className="w-full px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-800 text-white rounded-lg transition-colors"
            >
              {installing ? 'Installing...' : 'Install Requirements'}
            </button>
          </div>
        ) : allSuccessful && (
          <div className="mt-6 space-y-4">
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-green-400 text-sm font-medium">
                ✨ All requirements are successfully installed!
              </p>
              <p className="text-green-400/80 text-xs mt-1">
                Your system is ready to use TikTok Clip Studio
              </p>
            </div>
            <button
              onClick={onComplete}
              className="w-full px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
            >
              Continue to App
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}