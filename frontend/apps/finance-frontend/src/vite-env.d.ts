/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FINANCE_API?: string;
  // add more env variables as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
