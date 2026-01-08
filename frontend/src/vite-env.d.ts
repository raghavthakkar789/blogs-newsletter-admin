/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Backend API Configuration
  readonly VITE_API_URL?: string;
  
  // Authentication
  readonly VITE_ADMIN_TOKEN?: string;
  readonly VITE_ADMIN_EMAIL?: string;
  readonly VITE_ADMIN_NAME?: string;
  
  // Environment
  readonly VITE_NODE_ENV?: string;
  
  // AI Content Generation (Optional)
  readonly VITE_N8N_WEBHOOK_URL?: string;
  readonly VITE_N8N_NEWSLETTER_WEBHOOK_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

