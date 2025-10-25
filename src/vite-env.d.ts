/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_NAME: string
  readonly VITE_API_URL: string
  readonly VITE_ENABLE_EMOJI_OVERLAYS: string
  readonly VITE_ENABLE_SCENE_DETECTION: string
  readonly VITE_MAX_VIDEO_SIZE: string
  readonly VITE_SUPPORTED_FORMATS: string
  readonly VITE_FFMPEG_PATH?: string
  readonly VITE_PYTHON_PATH?: string
  readonly VITE_SENTRY_DSN?: string
  readonly VITE_GA_TRACKING_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}