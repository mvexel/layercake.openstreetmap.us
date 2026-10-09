/**
 * Build-time settings for hosting the explorer somewhere other than
 * layercake.openstreetmap.us. The defaults are the official deployment's.
 */
const env = import.meta.env;

/** Origin of the Layercake docs site; empty when the explorer is part of it. */
export const SITE_URL = env.VITE_LAYERCAKE_SITE_URL ?? "";

export const REPO_URL = env.VITE_LAYERCAKE_REPO_URL ?? "https://github.com/osmus/layercake";

/** Set on deployments that are not OpenStreetMap US's, which then say so above the header. */
export const UNOFFICIAL = env.VITE_LAYERCAKE_UNOFFICIAL === "true";

/** What sets an unofficial deployment apart, shown in its notice. */
export const UNOFFICIAL_DETAIL = env.VITE_LAYERCAKE_UNOFFICIAL_DETAIL ?? "";

export const OFFICIAL_URL = "https://openstreetmap.us/our-work/layercake/";
