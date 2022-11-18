/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly GOOGLE_MAPS_API_KEY: string;
  readonly CONTENT_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare const API_VERSION: string;
