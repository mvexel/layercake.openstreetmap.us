import { OFFICIAL_URL, REPO_URL, UNOFFICIAL, UNOFFICIAL_DETAIL } from "../site.ts";

/** Says, unmissably, that an unofficial deployment is not the OpenStreetMap US Layercake. */
export function UnofficialNotice() {
  if (!UNOFFICIAL) return null;

  return (
    <div class="unofficial-notice" role="note">
      <strong>Unofficial fork &mdash; this is not the OpenStreetMap US Layercake.</strong>{" "}
      {UNOFFICIAL_DETAIL ? `${UNOFFICIAL_DETAIL} ` : null}
      Its data can differ from the official extracts (<a href={REPO_URL}>source</a>).{" "}
      <a href={OFFICIAL_URL}>Use the official Layercake from OpenStreetMap US &rarr;</a>
    </div>
  );
}
