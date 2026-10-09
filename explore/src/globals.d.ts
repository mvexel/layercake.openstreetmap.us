/// <reference types="vite/client" />

declare module "*.css";

interface ImportMetaEnv {
  /** Base URL of the Layercake files, without a trailing slash. */
  readonly VITE_LAYERCAKE_DATA_URL?: string;
  /** Initial map view as "lng,lat,zoom". */
  readonly VITE_LAYERCAKE_MAP_VIEW?: string;
}
