import { describe, expect, it } from "vitest";
import { exportFilename, offeredFormats } from "./formats.ts";

describe("offeredFormats", () => {
  it("hides the MapRoulette export unless the URL asks for it", () => {
    expect(offeredFormats("?layer=pois")).not.toContain("maproulette");
    expect(offeredFormats("?layer=pois&maproulette")).toContain("maproulette");
    expect(offeredFormats("?maproulette=1")).toContain("maproulette");
  });

  it("names MapRoulette exports for what they are", () => {
    expect(exportFilename("maproulette")).toBe("maproulette_features.geojson");
    expect(exportFilename("geojson")).toBe("layercake_export.geojson");
  });
});
