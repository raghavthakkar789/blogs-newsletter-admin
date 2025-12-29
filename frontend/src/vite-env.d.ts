/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_N8N_WEBHOOK_URL?: string;
  readonly VITE_N8N_NEWSLETTER_WEBHOOK_URL?: string;
  readonly VITE_API_URL?: string;
  readonly VITE_NODE_ENV?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

