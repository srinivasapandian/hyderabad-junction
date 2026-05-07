/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BASE_URL: string;
  readonly VITE_E_KEY: string;
  readonly VITE_MERCHANT_SLUG: string;
  readonly VITE_RECAPTCHA_SITE_KEY: string;
  readonly VITE_PAYMENT_PROVIDER_ID: string;
  readonly VITE_GOOGLE_MAPS_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*.jpg' {
  const src: string;
  export default src;
}
declare module '*.jpeg' {
  const src: string;
  export default src;
}
declare module '*.png' {
  const src: string;
  export default src;
}
declare module '*.svg' {
  const src: string;
  export default src;
}
declare module '*.webp' {
  const src: string;
  export default src;
}
declare module '*.css' {}
