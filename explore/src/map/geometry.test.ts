import { describe, expect, it } from "vitest";
import { type Feature, FID, type SimpleGeometry } from "../types.ts";
import { bbox, collapseZoom, outsideMask, renderable } from "./geometry.ts";

const feature = (fid: number, geometry: SimpleGeometry): Feature => ({
  type: "Feature",
  properties: { [FID]: fid, name: "Somewhere" },
  geometry,
});

const square = (size: number): SimpleGeometry => ({
  type: "Polygon",
  coordinates: [
    [
      [0, 0],
      [size, 0],
      [size, size],
      [0, size],
      [0, 0],
    ],
  ],
});

describe("bbox", () => {
  it("walks nesting of any depth", () => {
    expect(bbox({ type: "Point", coordinates: [1, 2] })).toEqual({
      xmin: 1,
      ymin: 2,
      xmax: 1,
      ymax: 2,
    });
    expect(
      bbox({
        type: "MultiPolygon",
        coordinates: [
          [
            [
              [0, 0],
              [1, 3],
              [-2, 1],
              [0, 0],
            ],
          ],
        ],
      }),
    ).toEqual({ xmin: -2, ymin: 0, xmax: 1, ymax: 3 });
  });
});

describe("collapseZoom", () => {
  it("is higher for smaller features", () => {
    const big = collapseZoom(bbox(square(1)));
    const small = collapseZoom(bbox(square(0.001)));
    expect(small).toBeGreaterThan(big);
  });

  it("is 0 for a feature with no extent", () => {
    expect(collapseZoom({ xmin: 1, ymin: 1, xmax: 1, ymax: 1 })).toBe(0);
  });
});

describe("renderable", () => {
  it("keeps only the properties the style reads", () => {
    const [out] = renderable([feature(7, { type: "Point", coordinates: [0, 0] })]);
    expect(out?.properties).toEqual({ [FID]: 7 });
  });

  it("adds a dot sharing the polygon's fid when it can collapse", () => {
    const out = renderable([feature(3, square(0.0001))]);
    expect(out).toHaveLength(2);
    expect(out[0]?.properties._collapseZoom).toBeGreaterThan(0);
    expect(out[1]?.properties).toMatchObject({ [FID]: 3, _dot: true });
    expect(out[1]?.geometry.type).toBe("Point");
  });

  it("leaves polygons that are never small on screen alone", () => {
    expect(renderable([feature(4, square(40))])).toHaveLength(1);
  });
});

describe("data bounds", () => {
  const UTAH = { xmin: -114, ymin: 37, xmax: -109, ymax: 42 };

  it("masks the world with a hole at the bounds", () => {
    const [outer, hole] = outsideMask(UTAH).geometry.coordinates;
    expect(outer).toHaveLength(5);
    expect(hole).toEqual([
      [-114, 37],
      [-114, 42],
      [-109, 42],
      [-109, 37],
      [-114, 37],
    ]);
  });
});
