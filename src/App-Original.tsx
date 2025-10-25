import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { open } from '@tauri-apps/plugin-dialog'

function formatLog(msg: unknown) {
  if (typeof msg === 'string') return msg
  try { return JSON.stringify(msg) } catch { return String(msg) }
}

export default function App() {
  const [filePath, setFilePath] = useState<string | null>(null)
  const [logs, setLogs] = useState<string[]>([])
  const [processing, setProcessing] = useState(false)
  const dropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const unlistenPromise = listen<string>('export_log', (event) => {
      setLogs((l: string[]) => [...l, event.payload])
    })
    return () => { unlistenPromise.then((un) => un()) }
  }, [])

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (!file) return
    // Tauri file path access: we can use the path from the input element, but drag-and-drop in webview gives a path-like string in file.path on desktop
    // For MVP, we rely on the path property if present; otherwise, prompt via hidden input fallback.
    // @ts-ignore - webkitRelativePath not needed
    const anyFile = file as any
    const pathGuess = anyFile.path || anyFile.name
    setFilePath(pathGuess)
  }, [])

  const chooseFile = useCallback(async () => {
    const selected = await open({
      multiple: false,
      filters: [
        { name: 'Video', extensions: ['mp4', 'mov', 'mkv', 'avi', 'webm'] },
      ],
    })
    if (typeof selected === 'string') {
      setFilePath(selected)
    }
  }, [])

  const exportTikTok = useCallback(async () => {
    if (!filePath) return
    setProcessing(true)
    setLogs((l: string[]) => [...l, `Starting export for: ${filePath}`])
    const out = filePath.replace(/\.[^.]+$/, '') + '_tiktok.mp4'
    try {
      const res = await invoke<string>('export_tiktok', { input: filePath, output: out })
      setLogs((l: string[]) => [...l, res || 'Export complete'])
    } catch (e) {
      setLogs((l: string[]) => [...l, 'Error: ' + formatLog(e)])
    } finally {
      setProcessing(false)
    }
  }, [filePath])

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="glass-strong max-w-2xl w-full p-8"
      >
        <div className="text-center mb-6">
          <h1 className="text-3xl font-semibold text-slate-800">Short Studio MVP</h1>
          <p className="text-slate-600 mt-1">Light liquid glass UI • React + Tauri</p>
        </div>

        <div
          ref={dropRef}
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          className="glass border-dashed border-2 border-white/50 p-8 text-center cursor-pointer"
          onClick={chooseFile}
        >
          <AnimatePresence initial={false}>
            {filePath ? (
              <motion.div key="chosen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <p className="text-slate-700">Selected:</p>
                <p className="mt-1 font-medium text-slate-900 break-all">{filePath}</p>
              </motion.div>
            ) : (
              <motion.div key="prompt" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <p className="text-slate-700">Drag & drop a video here</p>
                <p className="text-slate-500 text-sm mt-1">or click to browse</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button
            className={`btn btn-primary ${!filePath || processing ? 'opacity-60 pointer-events-none' : ''}`}
            onClick={exportTikTok}
          >
            {processing ? 'Exporting…' : 'Export to TikTok'}
          </button>
          <button className="btn" onClick={() => setLogs([])}>Clear Log</button>
        </div>

        <div className="mt-6 glass p-4 max-h-48 overflow-auto">
          <div className="console">
            {logs.length === 0 ? (
              <div className="text-slate-500">Console output will appear here…</div>
            ) : (
              logs.map((l, i) => (
                <div key={i}>{l}</div>
              ))
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
