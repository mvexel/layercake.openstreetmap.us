import type { Geometry as GeoJSONGeometry, GeometryCollection, Position } from "geojson";

/** Layercake layers hold one geometry type each; collections never turn up. */
export type SimpleGeometry = Exclude<GeoJSONGeometry, GeometryCollection>;

/** Source columns that are plumbing rather than attributes. */
export const RESERVED_COLUMNS = ["bbox", "geometry"];

/** Feature id column, added when rows are materialized. Not stable across fetches. */
export const FID = "_fid";

export type Fid = number;

export type Bounds = { xmin: number; ymin: number; xmax: number; ymax: number };

/**
 * An area the user drew. `polygon` is present only for a drawn polygon;
 * rectangles and viewport queries are bounds-only.
 */
export type Area = { bounds: Bounds; polygon?: Position[][] };

export type DrawTool = "rectangle" | "polygon";

/** What a column holds, as far as filtering is concerned. */
export type ColumnKind =
  | { kind: "text" }
  | { kind: "number" }
  | { kind: "timestamp" }
  | { kind: "list"; element: ColumnKind }
  | { kind: "map"; value: ColumnKind }
  | { kind: "other" };

export type OperatorId =
  | "="
  | "!="
  | "contains"
  | "starts with"
  | ">"
  | ">="
  | "<"
  | "<="
  | "is null"
  | "is not null";

/**
 * How a filter combines with the one before it. OR binds tighter than AND, so
 * `a OR b AND c` reads `(a OR b) AND c`: alternatives for one condition sit
 * next to each other.
 */
export type Join = "and" | "or";

export type Filter = {
  id: number;
  join: Join;
  column: string;
  kind: ColumnKind;
  operator: OperatorId;
  key: string;
  value: string;
};

declare const complete: unique symbol;

/**
 * A filter with every input its column and operator need. Only these reach the
 * SQL layer; `filterComplete` is the only way to obtain one.
 */
export type CompleteFilter = Filter & { [complete]: true };

export type Sort = { column: string; direction: "asc" | "desc" };

/** Never null: Layercake's geometry column is non-nullable. */
export type Feature = {
  type: "Feature";
  properties: Record<string, unknown>;
  geometry: SimpleGeometry;
};

export const featureFid = (feature: Feature) => feature.properties[FID] as Fid;

export interface Layer {
  id: string;
  name: string;
  url: string;
  rows: number;
  bytes: number | null;
  columns: string[];
  kinds: Map<string, ColumnKind>;
}
