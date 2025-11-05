import { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { invoke } from '@tauri-apps/api/core'        // Changed from '/tauri'
import { listen } from '@tauri-apps/api/event'
import { open, save } from '@tauri-apps/plugin-dialog' // Changed from '/api/dialog'
import SystemCheck from './components/SystemCheck'
interface Clip {
  start_time: number
  end_time: number
  duration: number
  score: number
}

type ExportMode = 'single' | 'clips' | 'auto-subs'

function formatLog(msg: unknown) {
  if (typeof msg === 'string') return msg
  try { return JSON.stringify(msg) } catch { return String(msg) }
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export default function App() {
  const [filePath, setFilePath] = useState<string | null>(null)
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [logs, setLogs] = useState<string[]>([])
  const [processing, setProcessing] = useState(false)
  const [mode, setMode] = useState<ExportMode>('single')
  const [systemChecked, setSystemChecked] = useState(false)
  const [clips, setClips] = useState<Clip[]>([])
  const [selectedClips, setSelectedClips] = useState<Set<number>>(new Set())
  const [detectingClips, setDetectingClips] = useState(false)
  const [inputMode, setInputMode] = useState<'file' | 'url'>('file')
  const [downloadProgress, setDownloadProgress] = useState<number>(0)
  const [downloadStatus, setDownloadStatus] = useState<string>('')
  const [outputPath, setOutputPath] = useState<string>('')
  const [showLogs, setShowLogs] = useState(true)
  const [processingStage, setProcessingStage] = useState<string>('')

  useEffect(() => {
    const unlistenPromise = listen<string>('export_log', (event) => {
      const msg = event.payload
      setLogs((l) => [...l, msg])
      
      // Parse download progress from yt-dlp output
      if (msg.includes('[download]') && msg.includes('%')) {
        const match = msg.match(/(\d+\.\d+)%/)
        if (match) {
          setDownloadProgress(parseFloat(match[1]))
        }
        // Extract status (speed, ETA, etc.)
        const statusMatch = msg.match(/at\s+([\d.]+\w+\/s)/)
        if (statusMatch) {
          setDownloadStatus(`Downloading at ${statusMatch[1]}`)
        }
        setProcessingStage('Downloading video...')
      } else if (msg.includes('Downloaded:')) {
        setDownloadProgress(100)
        setDownloadStatus('Complete')
        setProcessingStage('Download complete')
      } else if (msg.includes('Extracting audio')) {
        setProcessingStage('Extracting audio...')
      } else if (msg.includes('Transcribing with Whisper')) {
        setProcessingStage('Transcribing audio with AI...')
      } else if (msg.includes('Loading Whisper model')) {
        setProcessingStage('Loading AI model...')
      } else if (msg.includes('Transcription complete')) {
        setProcessingStage('Transcription complete')
      } else if (msg.includes('Starting FFmpeg')) {
        setProcessingStage('Converting video format...')
      } else if (msg.includes('⏳ Encoding:')) {
        // Parse FFmpeg encoding progress
        const timeMatch = msg.match(/time=(\d{2}:\d{2}:\d{2})/)
        const fpsMatch = msg.match(/fps=\s*(\d+)/)
        if (timeMatch) {
          setProcessingStage(`Encoding video... (${timeMatch[1]}${fpsMatch ? ` @ ${fpsMatch[1]} fps` : ''})`)
        } else {
          setProcessingStage('Encoding video...')
        }
      } else if (msg.includes('🔍 Starting intelligent clip detection')) {
        setProcessingStage('🔍 Detecting clips intelligently...')
      } else if (msg.includes('🎬 Analyzing video for scene changes')) {
        setProcessingStage('🎬 Analyzing scenes...')
      } else if (msg.includes('📊 Found') && msg.includes('scene changes')) {
        const match = msg.match(/(\d+) scene changes/)
        if (match) {
          setProcessingStage(`📊 Analyzing... (${match[1]} scenes found)`)
        }
      } else if (msg.includes('✓ Scene detection complete')) {
        setProcessingStage('✓ Scene analysis complete')
      } else if (msg.includes('🎯 Creating clips from scene data')) {
        setProcessingStage('🎯 Creating clips...')
      } else if (msg.includes('✅ Generated') && msg.includes('clips')) {
        const match = msg.match(/(\d+) clips/)
        if (match) {
          setProcessingStage(`✅ ${match[1]} clips ready!`)
        }
      } else if (msg.includes('🚀 Starting batch export')) {
        const match = msg.match(/(\d+) clips/)
        if (match) {
          setProcessingStage(`🚀 Batch exporting ${match[1]} clips...`)
        }
      } else if (msg.includes('📦 Clip') && msg.includes('/')) {
        const match = msg.match(/Clip (\d+)\/(\d+)/)
        if (match) {
          setProcessingStage(`📦 Processing clip ${match[1]} of ${match[2]}...`)
        }
      } else if (msg.includes('✂️ Extracting clip')) {
        setProcessingStage('✂️ Extracting clip segment...')
      } else if (msg.includes('🎨 Converting to TikTok format')) {
        setProcessingStage('🎨 Converting to TikTok format...')
      } else if (msg.includes('🎉 Batch export complete')) {
        setProcessingStage('🎉 All clips exported!')
      } else if (msg.includes('Detecting scenes')) {
        setProcessingStage('Detecting clips...')
      } else if (msg.includes('Exporting clip')) {
        setProcessingStage('Exporting clips...')
      }
    })
    return () => { unlistenPromise.then((un) => un()) }
  }, [])

  const chooseFile = useCallback(async () => {
    console.log('chooseFile called')
    setLogs((l) => [...l, 'Opening file dialog...'])
    try {
      const selected = await open({
        multiple: false,
        filters: [
          { name: 'Video', extensions: ['mp4', 'mov', 'mkv', 'avi', 'webm'] },
        ],
      })
      console.log('Selected file:', selected)
      if (selected && typeof selected === 'string') {
        setFilePath(selected)
        setClips([])
        setSelectedClips(new Set())
        setLogs((l) => [...l, `✓ File selected: ${selected.split('/').pop()}`])
      } else if (selected === null) {
        console.log('User cancelled file selection')
        setLogs((l) => [...l, 'File selection cancelled'])
      }
    } catch (error) {
      console.error('Error opening file dialog:', error)
      setLogs((l) => [...l, `❌ Error opening file dialog: ${error}`])
    }
  }, [])

  const chooseOutputPath = useCallback(async () => {
    try {
      // For batch clips mode, select a directory; for single export, select a file
      if (mode === 'clips') {
        const selected = await open({
          directory: true,
          multiple: false,
          title: 'Select output directory for clips',
        })
        if (selected) {
          setOutputPath(selected as string)
          setLogs((l) => [...l, `✓ Output directory: ${selected}`])
        }
      } else {
        const selected = await save({
          defaultPath: inputMode === 'url' ? 'tiktok_export.mp4' : filePath?.replace(/\.[^.]+$/, '_tiktok.mp4'),
          filters: [
            { name: 'Video', extensions: ['mp4'] },
          ],
        })
        if (selected) {
          setOutputPath(selected)
          setLogs((l) => [...l, `✓ Output location: ${selected}`])
        }
      }
    } catch (error) {
      console.error('Error choosing output path:', error)
      setLogs((l) => [...l, `❌ Error choosing output path: ${error}`])
    }
  }, [filePath, inputMode, mode])

  const detectClips = useCallback(async () => {
    // Check if we have either a file path or YouTube URL
    if (!filePath && !youtubeUrl) {
      setLogs((l) => [...l, '❌ Please select a video file or enter a YouTube URL first'])
      return
    }
    
    setDetectingClips(true)
    setLogs((l) => [...l, '🔍 Starting clip detection...'])
    
    try {
      let videoPath = filePath
      
      // If using YouTube URL, download first
      if (!filePath && youtubeUrl) {
        setLogs((l) => [...l, '📥 Downloading YouTube video first...'])
        const downloadedPath = await invoke<string>('download_youtube', {
          url: youtubeUrl
        })
        videoPath = downloadedPath
        setFilePath(downloadedPath) // Save for future use
        setLogs((l) => [...l, `✓ Downloaded to: ${downloadedPath}`])
      }
      
      // Now detect clips
      const detected = await invoke<Clip[]>('detect_clips', {
        videoPath: videoPath,
        method: 'scene'
      })
      setClips(detected)
      setSelectedClips(new Set(detected.map((_, i) => i)))
      setLogs((l) => [...l, `✓ Found ${detected.length} clips`])
    } catch (e) {
      setLogs((l) => [...l, '❌ Error: ' + formatLog(e)])
    } finally {
      setDetectingClips(false)
    }
  }, [filePath, youtubeUrl])

  const exportSingle = useCallback(async () => {
    if (!filePath && !youtubeUrl) return
    
    // Determine output path
    let output = outputPath
    
    // If outputPath is a directory (from clips mode), generate a filename
    if (output && !output.endsWith('.mp4')) {
      const filename = filePath ? filePath.split('/').pop()?.replace(/\.[^.]+$/, '_tiktok.mp4') : `tiktok_export_${Date.now()}.mp4`
      output = `${output}/${filename}`
      setLogs((l) => [...l, `📁 Using directory, saving as: ${filename}`])
    }
    
    if (!output) {
      if (inputMode === 'url') {
        output = `/tmp/tiktok_export_${Date.now()}.mp4`
      } else if (filePath) {
        output = filePath.replace(/\.[^.]+$/, '') + '_tiktok.mp4'
      }
    }
    
    setProcessing(true)
    setDownloadProgress(0)
    setDownloadStatus('')
    setProcessingStage('Starting export...')
    
    try {
      // If YouTube URL, use download_and_export command
      if (inputMode === 'url' && youtubeUrl) {
        setLogs((l) => [...l, `Processing YouTube video: ${youtubeUrl}`])
        const res = await invoke<string>('download_and_export', {
          url: youtubeUrl,
          output,
          withSubtitles: mode === 'auto-subs'
        })
        setLogs((l) => [...l, res || 'Export complete'])
        setProcessingStage('✓ Export complete!')
      } else if (filePath) {
        // Regular file export
        setLogs((l) => [...l, `Starting export for: ${filePath.split('/').pop()}`])
        const command = mode === 'auto-subs' ? 'export_with_auto_subs' : 'export_tiktok'
        const params: any = {
          input: filePath,
          output
        }
        if (mode === 'auto-subs') {
          params.modelSize = 'base'
        }
        const res = await invoke<string>(command, params)
        setLogs((l) => [...l, res || 'Export complete'])
        setProcessingStage('✓ Export complete!')
      }
    } catch (e) {
      setLogs((l) => [...l, 'Error: ' + formatLog(e)])
    } finally {
      setProcessing(false)
    }
  }, [filePath, youtubeUrl, mode, inputMode])

  const exportClips = useCallback(async () => {
    if (!filePath || clips.length === 0) return
    setProcessing(true)
    
    // Use outputPath if set, otherwise default to a 'clips' subdirectory
    let outputDir = outputPath
    if (!outputDir) {
      outputDir = filePath.substring(0, filePath.lastIndexOf('/')) + '/clips'
      setLogs((l) => [...l, `📁 Using default output directory: ${outputDir}`])
    }
    
    const selectedClipsList = clips.filter((_, i) => selectedClips.has(i))
    
    try {
      const res = await invoke<string[]>('batch_export_clips', {
        input: filePath,
        outputDir,
        clips: selectedClipsList,
        withSubtitles: mode === 'auto-subs'
      })
      setLogs((l) => [...l, `✓ Exported ${res.length} clips`])
    } catch (e) {
      setLogs((l) => [...l, 'Error: ' + formatLog(e)])
    } finally {
      setProcessing(false)
    }
  }, [filePath, clips, selectedClips, mode, outputPath])

  const toggleClip = (index: number) => {
    setSelectedClips((prev) => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-indigo-100 select-none">
      {!systemChecked && (
        <SystemCheck onComplete={() => setSystemChecked(true)} />
      )}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="glass-strong max-w-4xl w-full p-8"
      >
        {/* Header */}
        <div className="text-center mb-6 select-none">
          <h1 className="text-4xl font-bold text-slate-800">TikTok Clip Studio</h1>
          <p className="text-slate-600 mt-2">AI-powered video clipping with auto-subtitles</p>
        </div>

        {/* Input Mode Toggle */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setInputMode('file')}
            className={`btn flex-1 ${inputMode === 'file' ? 'btn-primary' : ''}`}
          >
            📁 Local File
          </button>
          <button
            onClick={() => setInputMode('url')}
            className={`btn flex-1 ${inputMode === 'url' ? 'btn-primary' : ''}`}
          >
            🔗 YouTube URL
          </button>
        </div>

        {/* File Upload or URL Input */}
        {inputMode === 'file' ? (
          <div
            onClick={chooseFile}
            className="glass border-dashed border-2 border-white/50 p-8 text-center cursor-pointer hover:border-blue-300 transition-colors select-none"
          >
            <AnimatePresence mode="wait">
              {filePath ? (
                <motion.div key="chosen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <p className="text-slate-700 text-sm">Selected:</p>
                  <p className="mt-1 font-medium text-slate-900 break-all text-sm">{filePath.split('/').pop()}</p>
                </motion.div>
              ) : (
                <motion.div key="prompt" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <p className="text-slate-700 text-lg">📹 Click to select a video</p>
                  <p className="text-slate-500 text-sm mt-1">MP4, MOV, MKV, AVI, WebM</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <div className="glass p-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              YouTube URL
            </label>
            <input
              type="text"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full px-4 py-3 rounded-lg border-2 border-white/50 bg-white/60 focus:border-blue-400 focus:outline-none transition-colors select-text"
            />
            {youtubeUrl && (
              <p className="mt-2 text-xs text-slate-600">✓ URL entered</p>
            )}
          </div>
        )}

        {/* Output Path Selector */}
        {(filePath || youtubeUrl) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4"
          >
            <div className="glass p-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-700">Output Location</label>
                <button
                  onClick={chooseOutputPath}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  📁 Choose Location
                </button>
              </div>
              <p className="text-xs text-slate-600 break-all">
                {outputPath || (mode === 'clips' 
                  ? (filePath ? filePath.substring(0, filePath.lastIndexOf('/')) + '/clips' : '/tmp/clips')
                  : (inputMode === 'url' ? '/tmp/tiktok_export_[timestamp].mp4' : filePath?.replace(/\.[^.]+$/, '_tiktok.mp4'))
                )}
              </p>
            </div>
          </motion.div>
        )}

        {/* Mode Selection */}
        {(filePath || youtubeUrl) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-6"
          >
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => {
                  setMode('single')
                  setOutputPath('') // Clear output path when switching modes
                }}
                className={`btn flex-1 ${mode === 'single' ? 'btn-primary' : ''}`}
              >
                Single Export
              </button>
              <button
                onClick={() => {
                  setMode('clips')
                  setOutputPath('') // Clear output path when switching modes
                }}
                className={`btn flex-1 ${mode === 'clips' ? 'btn-primary' : ''}`}
              >
                Smart Clips
              </button>
              <button
                onClick={() => {
                  setMode('auto-subs')
                  setOutputPath('') // Clear output path when switching modes
                }}
                className={`btn flex-1 ${mode === 'auto-subs' ? 'btn-primary' : ''}`}
              >
                With Subtitles
              </button>
            </div>

            {/* Clip Detection */}
            {mode === 'clips' && (
              <div className="glass p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-slate-800">Detected Clips</h3>
                  <button
                    onClick={detectClips}
                    disabled={detectingClips}
                    className="btn btn-sm"
                  >
                    {detectingClips ? 'Detecting...' : clips.length > 0 ? 'Re-detect' : 'Detect Clips'}
                  </button>
                </div>

                {clips.length > 0 && (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {clips.map((clip, i) => (
                      <div
                        key={i}
                        onClick={() => toggleClip(i)}
                        className={`p-3 rounded-lg cursor-pointer transition-all ${
                          selectedClips.has(i)
                            ? 'bg-blue-100 border-2 border-blue-400'
                            : 'bg-white/50 border-2 border-transparent'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-slate-800">Clip {i + 1}</span>
                          <span className="text-sm text-slate-600">
                            {formatTime(clip.start_time)} → {formatTime(clip.end_time)}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          Duration: {clip.duration.toFixed(1)}s
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Download Progress */}
            {processing && downloadProgress > 0 && downloadProgress < 100 && (
              <div className="glass p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">Download Progress</span>
                  <span className="text-sm text-slate-600">{downloadProgress.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${downloadProgress}%` }}
                  />
                </div>
                {downloadStatus && (
                  <p className="text-xs text-slate-500 mt-2">{downloadStatus}</p>
                )}
              </div>
            )}

            {/* Processing Status */}
            {processing && processingStage && (
              <div className="glass p-4 mb-4 bg-blue-50/50">
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-800">{processingStage}</p>
                    {downloadProgress > 0 && downloadProgress < 100 && (
                      <p className="text-xs text-slate-600 mt-1">{downloadProgress.toFixed(1)}% complete</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Export Button */}
            <button
              onClick={mode === 'clips' ? exportClips : exportSingle}
              disabled={processing || (mode === 'clips' && (clips.length === 0 || selectedClips.size === 0))}
              className="btn btn-primary w-full py-3 text-lg select-none"
            >
              {processing
                ? '⏳ Processing...'
                : mode === 'clips'
                ? `🎬 Export ${selectedClips.size} Clip${selectedClips.size !== 1 ? 's' : ''}`
                : mode === 'auto-subs'
                ? '📝 Export with Subtitles'
                : '🚀 Export to TikTok'}
            </button>
          </motion.div>
        )}

        {/* Console Log */}
        <div className="mt-6 glass p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-slate-800 text-sm">Console</h3>
            <div className="flex gap-2">
              <button 
                onClick={() => setShowLogs(!showLogs)} 
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                {showLogs ? '👁️ Hide' : '👁️ Show'}
              </button>
              <button onClick={() => setLogs([])} className="text-xs text-slate-500 hover:text-slate-700">
                Clear
              </button>
            </div>
          </div>
          {showLogs && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="console text-xs max-h-64 overflow-auto"
            >
              {logs.length === 0 ? (
                <div className="text-slate-500">Output will appear here...</div>
              ) : (
                logs.map((l, i) => (
                  <div key={i} className="py-0.5">{l}</div>
                ))
              )}
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
