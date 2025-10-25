import { useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import './App.css'

interface RequirementStatus {
  name: string
  installed: boolean
  message: string
}

function App() {
  const [requirements, setRequirements] = useState<RequirementStatus[]>([])
  const [loading, setLoading] = useState(false)
  const [projectPath, setProjectPath] = useState('')
  const [installPath, setInstallPath] = useState('')

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
      alert('Please provide both project and install paths')
      return
    }

    try {
      await invoke('create_project_files', { projectPath, installPath })
      alert('Project files created successfully!')
    } catch (error) {
      console.error('Error creating project files:', error)
      alert('Error creating project files')
    }
  }

  async function runBuild() {
    if (!projectPath) {
      alert('Please provide project path')
      return
    }

    try {
      const output = await invoke<string>('run_build_script', { path: projectPath })
      alert(`Build completed! Output:\n${output}`)
    } catch (error) {
      console.error('Error running build script:', error)
      alert('Error running build script')
    }
  }

  return (
    <div className="container">
      <h1>TikTok App Installer</h1>

      <div className="section">
        <h2>System Requirements Check</h2>
        <button onClick={checkRequirements} disabled={loading}>
          {loading ? 'Checking...' : 'Check Requirements'}
        </button>

        {requirements.length > 0 && (
          <div className="requirements-list">
            {requirements.map((req, index) => (
              <div key={index} className={`requirement ${req.installed ? 'installed' : 'missing'}`}>
                <span className="requirement-name">{req.name}</span>
                <span className="requirement-status">{req.message}</span>
                {!req.installed && (
                  <button onClick={() => installRequirement(req.name)}>
                    Install
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {requirements.some(r => r.name === 'Docker Service' && !r.installed) && (
          <button onClick={startDockerService} className="docker-start-btn">
            Start Docker Service
          </button>
        )}
      </div>

      <div className="section">
        <h2>Project Setup</h2>
        <div className="form-group">
          <label htmlFor="projectPath">Project Path:</label>
          <input
            id="projectPath"
            type="text"
            value={projectPath}
            onChange={(e) => setProjectPath(e.target.value)}
            placeholder="e.g., /home/user/tiktok-project"
          />
        </div>

        <div className="form-group">
          <label htmlFor="installPath">Install Path:</label>
          <input
            id="installPath"
            type="text"
            value={installPath}
            onChange={(e) => setInstallPath(e.target.value)}
            placeholder="e.g., /home/user/tiktok-install"
          />
        </div>

        <div className="button-group">
          <button onClick={createProject}>Create Project Files</button>
          <button onClick={runBuild}>Run Build Script</button>
        </div>
      </div>
    </div>
  )
}

export default App
