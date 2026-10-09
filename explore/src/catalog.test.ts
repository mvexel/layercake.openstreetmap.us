import { describe, expect, it } from "vitest";
import { columnKind, parseBounds, parseOutline, type SchemaField } from "./catalog.ts";

const list = (element: SchemaField): SchemaField => ({
  name: "names",
  annotation: "list",
  fields: [{ name: "list", annotation: "group", fields: [element] }],
});

const map = (value: SchemaField): SchemaField => ({
  name: "tags",
  annotation: "map",
  fields: [
    {
      name: "key_value",
      annotation: "group",
      fields: [{ name: "key", type: "binary", annotation: "string" }, value],
    },
  ],
});

const text: SchemaField = { name: "element", type: "binary", annotation: "string" };

describe("columnKind", () => {
  it("reads scalars from the annotation, falling back to the physical type", () => {
    expect(columnKind(text)).toEqual({ kind: "text" });
    expect(
      columnKind({ name: "id", type: "int64", annotation: "int(bitwidth=64, issigned=true)" }),
    ).toEqual({ kind: "number" });
    expect(columnKind({ name: "h", type: "double" })).toEqual({ kind: "number" });
    expect(columnKind({ name: "when", type: "int64", annotation: "timestamp" })).toEqual({
      kind: "timestamp",
    });
    expect(
      columnKind({
        name: "when",
        type: "int64",
        annotation: "timestamp(isadjustedtoutc=true, timeunit=microseconds)",
      }),
    ).toEqual({ kind: "timestamp" });
  });

  it("descends into lists and maps", () => {
    expect(columnKind(list(text))).toEqual({ kind: "list", element: { kind: "text" } });
    expect(columnKind(map(text))).toEqual({ kind: "map", value: { kind: "text" } });
  });

  it("handles a map of lists", () => {
    expect(columnKind(map(list(text)))).toEqual({
      kind: "map",
      value: { kind: "list", element: { kind: "text" } },
    });
  });

  it("cannot filter on a plain group", () => {
    const bbox: SchemaField = {
      name: "bbox",
      annotation: "group",
      fields: [{ name: "xmin", type: "float" }],
    };
    expect(columnKind(bbox)).toEqual({ kind: "other" });
  });

  it("cannot filter on the payload of a list nested unexpectedly", () => {
    expect(columnKind({ name: "names", annotation: "list", fields: [] })).toEqual({
      kind: "list",
      element: { kind: "other" },
    });
  });
});

describe("parseBounds", () => {
  it("reads [xmin, ymin, xmax, ymax]", () => {
    expect(parseBounds([-114.05, 36.99, -109.03, 42])).toEqual({
      xmin: -114.05,
      ymin: 36.99,
      xmax: -109.03,
      ymax: 42,
    });
  });

  it("rejects anything that is not a real box", () => {
    expect(parseBounds(undefined)).toBeNull();
    expect(parseBounds([1, 2, 3])).toBeNull();
    expect(parseBounds([0, 0, "1", 1])).toBeNull();
    expect(parseBounds([1, 0, 0, 1])).toBeNull();
    expect(parseBounds([0, 0, Number.NaN, 1])).toBeNull();
  });
});

describe("parseOutline", () => {
  const ring = [
    [0, 0],
    [1, 0],
    [1, 1],
    [0, 0],
  ];

  it("accepts a MultiPolygon", () => {
    const outline = { type: "MultiPolygon", coordinates: [[ring]] };
    expect(parseOutline(outline)).toEqual(outline);
  });

  it("rejects anything else", () => {
    expect(parseOutline(undefined)).toBeNull();
    expect(parseOutline({ type: "Polygon", coordinates: [ring] })).toBeNull();
    expect(parseOutline({ type: "MultiPolygon", coordinates: [] })).toBeNull();
    expect(parseOutline({ type: "MultiPolygon", coordinates: [[ring.slice(0, 3)]] })).toBeNull();
    expect(parseOutline({ type: "MultiPolygon", coordinates: [[[[0, "x"], ...ring]]] })).toBeNull();
  });
});
