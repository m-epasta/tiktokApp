import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'

interface RequirementStatus {
  name: string
  installed: boolean
  message: string
}

interface ProgressItem {
  step: string
  timestamp: string
  step_number?: string
  details?: string
  type?: string
}

interface ErrorItem {
  error: string
  timestamp: string
}

interface LogItem {
  level: string
  timestamp: string
  message: string
}

interface CompletionItem {
  type: string
  task: string
  details: string
  timestamp: string
  icon: string
}

function useFilePolling<T>(filePath: string, parser: (line: string) => T | null, transformer: (data: T[]) => any, setter: (data: any) => void) {
  useEffect(() => {
    const interval = setInterval(() => {
      fetch(filePath)
        .then(res => res.text())
        .then(text => {
          if (text) {
            const lines = text.trim().split('\n')
            const items = lines.map(line => {
              try {
                return parser(line)
              } catch {
                return null
              }
            }).filter(Boolean) as T[]
            setter(transformer(items))
          }
        })
        .catch(() => {}) // Ignore errors if file doesn't exist
    }, 1000)
    return () => clearInterval(interval)
  }, [filePath, parser, transformer, setter])
}

function App() {
  const [requirements, setRequirements] = useState<RequirementStatus[]>([])
  const [loading, setLoading] = useState(false)
  const [projectPath, setProjectPath] = useState('')
  const [installPath, setInstallPath] = useState('')
  const [progress, setProgress] = useState<ProgressItem[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [buildStatus, setBuildStatus] = useState<string>('')
  const [logs, setLogs] = useState<LogItem[]>([])
  const [sudoPassword, setSudoPassword] = useState('')
  const [setupState, setSetupState] = useState<'idle' | 'running' | 'completed' | 'error'>('idle')
  const [currentStep, setCurrentStep] = useState<string>('')
  const [overallProgress, setOverallProgress] = useState<number>(0)
  const [completedTasks, setCompletedTasks] = useState<CompletionItem[]>([])

  async function checkRequirements() {
    setLoading(true)
    try {
      const result = await invoke<RequirementStatus[]>('check_requirements')
      setRequirements(result)
    } catch (error) {
      console.error('Error checking requirements:', error)
    } finally {
      setLoading(false)
    }
  }

  async function installRequirement(requirement: string) {
    try {
      await invoke('install_requirement', { requirement })
      // Refresh requirements after installation
      checkRequirements()
    } catch (error) {
      console.error('Error installing requirement:', error)
    }
  }

  async function startDockerService() {
    try {
      await invoke('start_docker_service')
      checkRequirements()
    } catch (error) {
      console.error('Error starting Docker service:', error)
    }
  }

  async function createProject() {
    if (!projectPath || !installPath) {
      await invoke('show_styled_popup', {
        title: 'Missing Information',
        message: 'Please provide both project and install paths.',
        popupType: 'error',
        icon: '❌'
      })
      return
    }

    try {
      await invoke('create_project_files', { projectPath, installPath })
      await invoke('show_styled_popup', {
        title: 'Project Created',
        message: 'Project files created successfully!',
        popupType: 'success',
        icon: '✅'
      })
    } catch (error) {
      console.error('Error creating project files:', error)
      const errorMessage = error instanceof Error ? error.message : String(error)

      // Add error to the errors array for display in the UI
      setErrors(prev => [...prev, `Project creation failed: ${errorMessage}`])

      await invoke('show_styled_popup', {
        title: 'Project Creation Error',
        message: `❌ Error creating project files:\n\n${errorMessage}\n\nPlease check that the paths are valid and you have write permissions.`,
        popupType: 'error',
        icon: '❌'
      })
    }
  }

  async function runBuild() {
    if (!projectPath) {
      await invoke('show_styled_popup', {
        title: 'Missing Information',
        message: 'Please provide project path.',
        popupType: 'error',
        icon: '❌'
      })
      return
    }

    setSetupState('running')
    setCurrentStep('Building TikTok application...')
    setOverallProgress(0)
    setErrors([]) // Clear previous errors

    try {
      const output = await invoke<string>('run_build_script', { path: projectPath })

      // Check if the output contains error indicators
      if (output.includes('Error') || output.includes('Failed') || output.includes('error')) {
        throw new Error(output)
      }

      setSetupState('completed')
      setOverallProgress(100)

      // Show success popup
      await invoke('show_styled_popup', {
        title: 'Build Complete',
        message: '🎉 Build completed successfully! The application is ready to launch.',
        popupType: 'success',
        icon: '✅'
      })

    } catch (error) {
      console.error('Error running build script:', error)
      setSetupState('error')
      setOverallProgress(0)

      // Extract and display detailed error information
      const errorMessage = error instanceof Error ? error.message : String(error)

      // Add error to the errors array for display in the UI
      setErrors([`Build failed: ${errorMessage}`])

      // Show detailed error popup
      await invoke('show_styled_popup', {
        title: 'Build Error',
        message: `❌ Build failed with error:\n\n${errorMessage}\n\nPlease check the logs for more details and ensure all dependencies are installed.`,
        popupType: 'error',
        icon: '❌'
      })
    }
  }

  async function launchTikTokApp() {
    try {
      await invoke('show_styled_popup', {
        title: 'Launching TikTok App',
        message: '🚀 Starting the TikTok application...',
        popupType: 'success',
        icon: '✅'
      })

      // Launch the built application
      await invoke('launch_built_app', { projectPath })

    } catch (error) {
      console.error('Error launching app:', error)
      const errorMessage = error instanceof Error ? error.message : String(error)

      // Add error to the errors array for display in the UI
      setErrors(prev => [...prev, `Launch failed: ${errorMessage}`])

      await invoke('show_styled_popup', {
        title: 'Launch Error',
        message: `❌ Could not launch the TikTok app.\n\nError: ${errorMessage}\n\nPlease ensure the build was successful and the application exists in the expected location.`,
        popupType: 'error',
        icon: '❌'
      })
    }
  }

  async function launchDockerApp() {
    try {
      await invoke('show_styled_popup', {
        title: 'Launching Docker App',
        message: '🐳 Starting the TikTok application in Docker...',
        popupType: 'success',
        icon: '✅'
      })

      // Launch the Docker container
      await invoke('launch_docker_app', { projectPath })

    } catch (error) {
      console.error('Error launching Docker app:', error)
      const errorMessage = error instanceof Error ? error.message : String(error)

      // Add error to the errors array for display in the UI
      setErrors(prev => [...prev, `Docker launch failed: ${errorMessage}`])

      await invoke('show_styled_popup', {
        title: 'Docker Launch Error',
        message: `❌ Could not launch the Docker app.\n\nError: ${errorMessage}\n\nPlease ensure Docker is running and the Docker image was built successfully.`,
        popupType: 'error',
        icon: '❌'
      })
    }
  }

  async function runFullSetup() {
    console.log('runFullSetup called')
    if (!sudoPassword) {
      console.log('No sudo password provided')
      await invoke('show_styled_popup', {
        title: 'Missing Password',
        message: 'Please enter your sudo password to continue with the installation.',
        popupType: 'error',
        icon: '❌'
      })
      return
    }

    console.log('Calling Tauri command with password length:', sudoPassword.length)
    setSetupState('running')
    setCurrentStep('Starting complete setup process...')
    setOverallProgress(0)
    setErrors([]) // Clear previous errors

    try {
      const output = await invoke<string>('run_full_setup', { sudoPassword: sudoPassword })
      console.log('Setup completed successfully:', output)
      setSetupState('completed')
      setOverallProgress(100)

      // Show styled success popup only (no browser alert)
      await invoke('show_styled_popup', {
        title: 'TikTok App Installer',
        message: '🎉 Installation completed successfully! All dependencies have been installed and configured.',
        popupType: 'success',
        icon: '✅'
      })
    } catch (error) {
      console.error('Error running full setup:', error)
      setSetupState('error')
      setOverallProgress(0)

      // Extract and display detailed error information
      const errorMessage = error instanceof Error ? error.message : String(error)

      // Add error to the errors array for display in the UI
      setErrors([`Installation failed: ${errorMessage}`])

      // Show detailed error popup
      await invoke('show_styled_popup', {
        title: 'Installation Error',
        message: `❌ Installation failed with error:\n\n${errorMessage}\n\nPlease check the logs for more details and try again.`,
        popupType: 'error',
        icon: '❌'
      })
    }
  }

  // Read progress from file
  useFilePolling('/tmp/installer_progress.json', JSON.parse, (items) => items, setProgress)

  // Update current step and progress
  useEffect(() => {
    if (progress.length > 0) {
      const lastStep = progress[progress.length - 1]
      setCurrentStep(lastStep.step)

      // Enhanced progress calculation
      if (lastStep.step_number) {
        const stepNum = parseInt(lastStep.step_number)
        if (stepNum >= 6) {
          setOverallProgress(100)
          setSetupState('completed')
        } else {
          setOverallProgress(Math.min(90, stepNum * 15))
        }
      } else {
        // Fallback
        const stepContent = lastStep.step.toLowerCase()
        if (stepContent.includes('system dependencies') || stepContent.includes('detecting system')) {
          setOverallProgress(15)
        } else if (stepContent.includes('rust') || stepContent.includes('programming language')) {
          setOverallProgress(35)
        } else if (stepContent.includes('python') || stepContent.includes('pip')) {
          setOverallProgress(55)
        } else if (stepContent.includes('node.js') || stepContent.includes('npm')) {
          setOverallProgress(75)
        } else if (stepContent.includes('tauri') || stepContent.includes('cli')) {
          setOverallProgress(90)
        } else if (stepContent.includes('verifying') || stepContent.includes('completed')) {
          setOverallProgress(95)
          if (stepContent.includes('completed successfully')) {
            setOverallProgress(100)
            setSetupState('completed')
          }
        }
      }
    }
  }, [progress])

  // Read errors from file
  useFilePolling('/tmp/installer_errors.json', JSON.parse, (items) => items.map(e => e.error), setErrors)

  // Read build status from file
  useFilePolling('/tmp/installer_build_status.json', JSON.parse, (items) => items[items.length - 1]?.status || '', setBuildStatus)

  // Read logs from file
  useFilePolling('/tmp/installer.log', (line) => {
    // Try the new format first: [LEVEL] timestamp - message
    const match1 = line.match(/^\[(\w+)\] (\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}) - (.+)$/)
    if (match1) {
      return {
        level: match1[1],
        timestamp: match1[2],
        message: match1[3]
      }
    }

    // Fallback to old format or plain text
    if (line.trim()) {
      return {
        level: 'INFO',
        timestamp: new Date().toISOString().slice(0, 19).replace('T', ' '),
        message: line.trim()
      }
    }

    return null
  }, (items) => items, setLogs)

  // Read completed tasks from file
  useFilePolling('/tmp/installer_completions.json', JSON.parse, (items) => items, setCompletedTasks)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 pt-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-4">
            TikTok App Installer
          </h1>
          <p className="text-gray-400 text-lg">
            Set up and install your TikTok application with ease
          </p>
        </div>

        {/* Quick Install Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 mb-8 text-white shadow-lg">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">🚀 Quick Install</h2>
            <p className="text-blue-100 text-lg mb-6">
              Install everything automatically with one click! This will set up all dependencies and build the TikTok app.
            </p>

            <div className="bg-white/10 rounded-lg p-4 mb-6 backdrop-blur-sm">
              <p className="text-sm text-blue-100 mb-2">This will install:</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                <span className="flex items-center">📦 System Dependencies</span>
                <span className="flex items-center">🦀 Rust Programming Language</span>
                <span className="flex items-center">🐍 Python Dependencies</span>
                <span className="flex items-center">⚛️ Node.js & React</span>
                <span className="flex items-center">🔧 Tauri CLI</span>
                <span className="flex items-center">🐳 Docker (if needed)</span>
              </div>
            </div>

            <div className="mb-6">
              <label htmlFor="quickSudoPassword" className="block text-sm font-medium text-blue-100 mb-2">
                Sudo Password (required for system installations):
              </label>
              <input
                id="quickSudoPassword"
                type="password"
                value={sudoPassword}
                onChange={(e) => setSudoPassword(e.target.value)}
                placeholder="Enter your sudo password"
                className="w-full max-w-md bg-white/20 border border-white/30 rounded-lg px-4 py-3 text-white placeholder-blue-100 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all duration-200"
              />
              <p className="text-blue-200 text-xs mt-2">
                ⚠️ This password is required for installing system packages and will be used securely.
              </p>
            </div>

            <button
              onClick={runFullSetup}
              disabled={!sudoPassword}
              className="bg-white text-blue-600 hover:bg-blue-50 disabled:bg-gray-300 disabled:text-gray-500 font-bold py-4 px-8 rounded-lg transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 text-lg"
            >
              {setupState === 'running' ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Installing...
                </span>
              ) : (
                '🎯 Install TikTok App Now'
              )}
            </button>

            <div className="mt-4 space-y-2">
              <p className="text-blue-200 text-sm">
                Installation time: 10-30 minutes depending on your system
              </p>
              <p className="text-blue-200 text-xs">
                💡 After installation completes, the TikTok app will launch automatically!
              </p>
            </div>
          </div>
        </div>

        {/* System Requirements Section */}
        <div className="bg-gray-800 rounded-2xl p-6 mb-8 shadow-glass backdrop-blur-xs bg-glass-70">
          <h2 className="text-2xl font-semibold mb-6 text-gray-100 border-b border-gray-700 pb-3">
            System Requirements Check
          </h2>
          
          <div className="flex justify-center mb-6">
            <button 
              onClick={checkRequirements} 
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Checking...
                </span>
              ) : 'Check Requirements'}
            </button>
          </div>

          {requirements.length > 0 && (
            <div className="space-y-3">
              {requirements.map((req, index) => (
                <div 
                  key={index} 
                  className={`flex items-center justify-between p-4 rounded-lg border-l-4 ${
                    req.installed 
                      ? 'bg-green-900/30 border-green-500' 
                      : 'bg-red-900/30 border-red-500'
                  } transition-all duration-200`}
                >
                  <div className="flex-1">
                    <span className="font-semibold text-gray-100">{req.name}</span>
                  </div>
                  <div className="flex-2 ml-4">
                    <span className="text-gray-300">{req.message}</span>
                  </div>
                  {!req.installed && (
                    <button 
                      onClick={() => installRequirement(req.name)}
                      className="ml-4 bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-lg transition-colors duration-200"
                    >
                      Install
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {requirements.some(r => r.name === 'Docker Service' && !r.installed) && (
            <div className="flex justify-center mt-6">
              <button 
                onClick={startDockerService} 
                className="bg-amber-500 hover:bg-amber-600 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
              >
                Start Docker Service
              </button>
            </div>
          )}
        </div>



        {/* Installation State Section */}
        {setupState !== 'idle' && (
          <div className="bg-gray-800 rounded-2xl p-6 mb-8 shadow-glass backdrop-blur-xs bg-glass-70">
            <h2 className="text-2xl font-semibold mb-6 text-gray-100 border-b border-gray-700 pb-3">
              Installation Status
            </h2>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <span className={`inline-block w-4 h-4 rounded-full mr-3 ${
                    setupState === 'running' ? 'bg-blue-500 animate-pulse' :
                    setupState === 'completed' ? 'bg-green-500' :
                    setupState === 'error' ? 'bg-red-500' :
                    'bg-gray-500'
                  }`}></span>
                  <span className="font-semibold text-gray-100">
                    {setupState === 'running' ? 'Installing...' :
                     setupState === 'completed' ? 'Installation Complete!' :
                     setupState === 'error' ? 'Installation Failed' :
                     'Ready to Install'}
                  </span>
                </div>
                <span className="text-gray-400 text-sm">{overallProgress}%</span>
              </div>

              <div className="w-full bg-gray-600 rounded-full h-3 mb-4">
                <div
                  className={`h-3 rounded-full transition-all duration-500 ${
                    setupState === 'completed' ? 'bg-green-500' :
                    setupState === 'error' ? 'bg-red-500' :
                    'bg-blue-500'
                  }`}
                  style={{width: `${overallProgress}%`}}
                ></div>
              </div>

              {currentStep && (
                <div className="p-3 bg-gray-700 rounded-lg">
                  <div className="flex items-center">
                    <span className="text-blue-400 mr-2">🔄</span>
                    <span className="text-gray-200 font-medium">{currentStep}</span>
                  </div>
                </div>
              )}
            </div>

            {setupState === 'completed' && (
              <div className="p-4 bg-green-900/30 border border-green-500 rounded-lg">
                <div className="flex items-center">
                  <span className="text-green-400 mr-2">✅</span>
                  <span className="text-green-100 font-medium">All dependencies installed successfully!</span>
                </div>
              </div>
            )}

            {setupState === 'error' && (
              <div className="p-4 bg-red-900/30 border border-red-500 rounded-lg">
                <div className="flex items-center">
                  <span className="text-red-400 mr-2">❌</span>
                  <span className="text-red-100 font-medium">Installation failed. Check the logs for details.</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Project Setup Section */}
        <div className="bg-gray-800 rounded-2xl p-6 shadow-glass backdrop-blur-xs bg-glass-70">
          <h2 className="text-2xl font-semibold mb-6 text-gray-100 border-b border-gray-700 pb-3">
            Project Setup
          </h2>

          <div className="space-y-6">
            <div>
              <label htmlFor="projectPath" className="block text-sm font-medium text-gray-300 mb-2">
                Project Path:
              </label>
              <input
                id="projectPath"
                type="text"
                value={projectPath}
                onChange={(e) => setProjectPath(e.target.value)}
                placeholder="e.g., /home/user/tiktok-project"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>

            <div>
              <label htmlFor="installPath" className="block text-sm font-medium text-gray-300 mb-2">
                Install Path:
              </label>
              <input
                id="installPath"
                type="text"
                value={installPath}
                onChange={(e) => setInstallPath(e.target.value)}
                placeholder="e.g., /home/user/tiktok-install"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button
                onClick={createProject}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
              >
                Create Project Files
              </button>
              <button
                onClick={runBuild}
                disabled={!projectPath}
                className="flex-1 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-600 disabled:text-gray-400 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 disabled:cursor-not-allowed"
              >
                {setupState === 'running' && currentStep.includes('Building') ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Building...
                  </span>
                ) : (
                  '🏗️ Build & Launch App'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Live Progress Section */}
        {progress.length > 0 && (
          <div className="bg-gray-800 rounded-2xl p-6 mb-8 shadow-glass backdrop-blur-xs bg-glass-70">
            <h2 className="text-2xl font-semibold mb-6 text-gray-100 border-b border-gray-700 pb-3">
              📋 Installation Progress
            </h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {progress.slice(-20).map((item, index) => {
                const stepNum = item.step_number ? parseInt(item.step_number) : null
                const isMainStep = item.type !== 'substep'
                const isCommand = item.step.toLowerCase().includes('executing') || item.step.toLowerCase().includes('command')

                return (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-l-4 transition-all duration-200 ${
                      isMainStep
                        ? stepNum
                          ? 'bg-blue-900/20 border-blue-500'
                          : 'bg-gray-700 border-gray-500'
                        : 'bg-gray-700/50 border-gray-600 ml-4'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          {isMainStep ? (
                            stepNum ? (
                              <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-500 text-white text-sm font-bold rounded-full mr-3">
                                {stepNum}
                              </span>
                            ) : (
                              <span className="inline-block w-8 h-8 bg-gray-500 rounded-full mr-3 flex-shrink-0"></span>
                            )
                          ) : (
                            <span className="inline-block w-5 h-5 bg-gray-400 rounded-full mr-3 ml-3 flex-shrink-0 mt-0.5"></span>
                          )}

                          <div className="flex-1">
                            <div className="flex items-center">
                              {isCommand && (
                                <span className="text-yellow-400 mr-2">⚡</span>
                              )}
                              <span className={`font-medium ${
                                isMainStep ? 'text-gray-100' : 'text-gray-300'
                              }`}>
                                {item.step}
                              </span>
                            </div>

                            {item.details && (
                              <div className="text-gray-400 text-sm mt-1 ml-8">
                                {item.details}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-gray-400 text-xs ml-4 flex-shrink-0">
                        {item.timestamp}
                      </div>
                    </div>

                    {/* Progress indicator for current step */}
                    {isMainStep && stepNum && (
                      <div className="mt-3 ml-11">
                        <div className="w-full bg-gray-600 rounded-full h-1.5">
                          <div
                            className="bg-blue-500 h-1.5 rounded-full transition-all duration-500"
                            style={{width: `${Math.min(100, (stepNum / 6) * 100)}%`}}
                          ></div>
                        </div>
                        <div className="text-gray-400 text-xs mt-1">
                          Step {stepNum} of 6
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Errors Section */}
        {errors.length > 0 && (
          <div className="bg-gray-800 rounded-2xl p-6 mb-8 shadow-glass backdrop-blur-xs bg-glass-70">
            <h2 className="text-2xl font-semibold mb-6 text-gray-100 border-b border-gray-700 pb-3">
              Installation Errors
            </h2>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {errors.map((error, index) => (
                <div key={index} className="p-3 bg-red-900/30 border border-red-500 rounded-lg">
                  <span className="text-red-100">{error}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Build Status Section */}
        {buildStatus && (
          <div className="bg-gray-800 rounded-2xl p-6 mb-8 shadow-glass backdrop-blur-xs bg-glass-70">
            <h2 className="text-2xl font-semibold mb-6 text-gray-100 border-b border-gray-700 pb-3">
              Build Status
            </h2>
            <div className={`p-4 rounded-lg ${buildStatus.includes('success') ? 'bg-green-900/30 border-green-500' : 'bg-red-900/30 border-red-500'}`}>
              <div className="text-gray-100 whitespace-pre-wrap">{buildStatus}</div>
            </div>

            {buildStatus.includes('success') && (
              <div className="mt-6 space-y-4">
                <div className="p-4 bg-blue-900/30 border border-blue-500 rounded-lg">
                  <h3 className="text-blue-100 font-semibold mb-2">🎉 Build Successful!</h3>
                  <div className="text-blue-200 text-sm space-y-1">
                    <p><strong>Application Location:</strong> src-tauri/target/release/tiktok-clip-studio</p>
                    <p><strong>Frontend Assets:</strong> dist/</p>
                    <p><strong>Launcher Script:</strong> dist/launch-tiktok-app.sh</p>
                    {buildStatus.includes('Docker') && (
                      <p><strong>Docker Image:</strong> tiktok-clip-studio</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={launchTikTokApp}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
                  >
                    🚀 Launch Native App
                  </button>
                  {buildStatus.includes('Docker') && (
                    <button
                      onClick={() => launchDockerApp()}
                      className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
                    >
                      🐳 Launch Docker App
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (projectPath) {
                        navigator.clipboard.writeText(`cd "${projectPath}/dist" && ./launch-tiktok-app.sh`)
                      }
                    }}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
                  >
                    📋 Copy Launch Command
                  </button>
                </div>

                <div className="text-center space-y-2">
                  <p className="text-gray-400 text-sm">
                    💡 Tip: You can also run the app manually from the terminal:
                  </p>
                  <code className="block p-2 bg-gray-700 rounded text-green-400 text-sm">
                    cd "{projectPath}/dist" && ./launch-tiktok-app.sh
                  </code>
                  {buildStatus.includes('Docker') && (
                    <code className="block p-2 bg-gray-700 rounded text-cyan-400 text-sm">
                      docker run --rm -it tiktok-clip-studio
                    </code>
                  )}
                </div>
              </div>
            )}

            {buildStatus.includes('failed') && (
              <div className="mt-6 space-y-4">
                <div className="p-4 bg-red-900/30 border border-red-500 rounded-lg">
                  <h3 className="text-red-100 font-semibold mb-2">❌ Build Failed</h3>
                  <div className="text-red-200 text-sm space-y-1">
                    <p><strong>Common solutions:</strong></p>
                    <ul className="list-disc list-inside space-y-1 mt-2">
                      <li>Ensure all dependencies are installed (npm install, cargo, etc.)</li>
                      <li>Check that Rust toolchain is properly configured</li>
                      <li>Verify Node.js and npm are working</li>
                      <li>Make sure you have sufficient disk space</li>
                      <li>Try running the build manually: cd "{projectPath}" && ./build.sh</li>
                    </ul>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => window.location.reload()}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
                  >
                    🔄 Retry Build
                  </button>
                  <button
                    onClick={() => {
                      if (projectPath) {
                        navigator.clipboard.writeText(`cd "${projectPath}" && ./build.sh`)
                      }
                    }}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
                  >
                    📋 Copy Manual Build Command
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Completed Tasks Section */}
        {completedTasks.length > 0 && (
          <div className="bg-gray-800 rounded-2xl p-6 mb-8 shadow-glass backdrop-blur-xs bg-glass-70">
            <h2 className="text-2xl font-semibold mb-6 text-gray-100 border-b border-gray-700 pb-3">
              ✅ Completed Tasks
            </h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {completedTasks.map((task, index) => (
                <div key={index} className="p-4 bg-green-900/20 border border-green-500 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center flex-1">
                      <span className="text-2xl mr-3">{task.icon}</span>
                      <div className="flex-1">
                        <div className="font-semibold text-green-100 mb-1">
                          {task.task}
                        </div>
                        <div className="text-green-200 text-sm">
                          {task.details}
                        </div>
                      </div>
                    </div>
                    <div className="text-green-300 text-xs ml-4 flex-shrink-0">
                      {task.timestamp}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Logs Section */}
        {logs.length > 0 && (
          <div className="bg-gray-800 rounded-2xl p-6 mb-8 shadow-glass backdrop-blur-xs bg-glass-70">
            <h2 className="text-2xl font-semibold mb-6 text-gray-100 border-b border-gray-700 pb-3">
              Installation Logs
            </h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {logs.slice(-50).map((log, index) => (
                <div key={index} className={`p-3 rounded-lg border-l-4 ${
                  log.level === 'ERROR' ? 'bg-red-900/30 border-red-500' :
                  log.level === 'SUCCESS' ? 'bg-green-900/30 border-green-500' :
                  log.level === 'INFO' ? 'bg-blue-900/30 border-blue-500' :
                  'bg-gray-700 border-gray-500'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                        log.level === 'ERROR' ? 'bg-red-500' :
                        log.level === 'SUCCESS' ? 'bg-green-500' :
                        log.level === 'INFO' ? 'bg-blue-500' :
                        'bg-gray-500'
                      }`}></span>
                      <span className="font-semibold text-gray-100">{log.level}</span>
                    </div>
                    <span className="text-gray-400 text-sm">{log.timestamp}</span>
                  </div>
                  <div className="text-gray-200 font-mono text-sm">
                    {log.message}
                  </div>
                  {log.level === 'INFO' && log.message.includes('Progress') && (
                    <div className="mt-2">
                      <div className="w-full bg-gray-600 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-12 pb-8">
          <p className="text-gray-500 text-sm">
            TikTok App Installer v1.0.0
          </p>
        </div>
      </div>
    </div>
  )
}

export default App
