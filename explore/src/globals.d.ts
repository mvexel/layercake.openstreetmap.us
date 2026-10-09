/// <reference types="vite/client" />

declare module "*.css";

interface ImportMetaEnv {
  /** Base URL of the Layercake files, without a trailing slash. */
  readonly VITE_LAYERCAKE_DATA_URL?: string;
  /** Initial map view as "lng,lat,zoom". */
  readonly VITE_LAYERCAKE_MAP_VIEW?: string;
  /** Origin of the docs site that Docs and layer links point at. */
  readonly VITE_LAYERCAKE_SITE_URL?: string;
  /** Repository the GitHub link points at. */
  readonly VITE_LAYERCAKE_REPO_URL?: string;
  /** "true" on deployments that are not OpenStreetMap US's. */
  readonly VITE_LAYERCAKE_UNOFFICIAL?: string;
  /** Extra sentence for the unofficial notice. */
  readonly VITE_LAYERCAKE_UNOFFICIAL_DETAIL?: string;
}
