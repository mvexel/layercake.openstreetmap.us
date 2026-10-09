import { describe, expect, it } from "vitest";
import type { ColumnKind, Filter } from "../types.ts";
import {
  defaultOperator,
  filterComplete,
  filterSummary,
  filterTerms,
  needsKey,
  operatorsFor,
} from "./filters.ts";

const TEXT: ColumnKind = { kind: "text" };
const NUMBER: ColumnKind = { kind: "number" };
const TEXT_LIST: ColumnKind = { kind: "list", element: TEXT };
const NUMBER_LIST: ColumnKind = { kind: "list", element: NUMBER };
const TEXT_MAP: ColumnKind = { kind: "map", value: TEXT };
const LIST_MAP: ColumnKind = { kind: "map", value: TEXT_LIST };

const filter = (over: Partial<Filter> = {}): Filter => ({
  id: 0,
  join: "and",
  column: "name",
  kind: TEXT,
  operator: "=",
  key: "",
  value: "",
  ...over,
});

/** Compile one filter, insisting it is complete first. */
function term(over: Partial<Filter>): string {
  const f = filter(over);
  if (!filterComplete(f)) throw new Error("filter is incomplete");
  return filterTerms([f])[0] ?? "";
}

describe("compiling scalar columns", () => {
  it("quotes text literals and escapes quotes", () => {
    expect(term({ value: "O'Hare" })).toBe(`"name" = 'O''Hare'`);
  });

  it("compares numbers numerically", () => {
    expect(term({ kind: NUMBER, column: "height", value: "12" })).toBe(`"height" = 12`);
  });

  it("casts to DOUBLE for ordered comparisons on text", () => {
    expect(term({ operator: ">", value: "5" })).toBe(`TRY_CAST("name" AS DOUBLE) > 5`);
  });

  it("anchors 'starts with' and escapes wildcards the user typed", () => {
    expect(term({ operator: "starts with", value: "50%" })).toBe(
      `"name" ILIKE '50\\%%' ESCAPE '\\'`,
    );
    expect(term({ operator: "contains", value: "a_b" })).toBe(`"name" ILIKE '%a\\_b%' ESCAPE '\\'`);
  });

  it("escapes double quotes in column names", () => {
    expect(term({ column: `odd"name`, value: "x" })).toBe(`"odd""name" = 'x'`);
  });

  it("tests null on the column itself", () => {
    expect(term({ operator: "is null" })).toBe(`"name" IS NULL`);
  });
});

describe("compiling list and map columns", () => {
  it("uses list_contains for equality", () => {
    expect(term({ kind: TEXT_LIST, column: "names", value: "Paris" })).toBe(
      `list_contains("names", 'Paris')`,
    );
  });

  it("compiles against the leaf kind, not the column's own kind", () => {
    expect(term({ kind: NUMBER_LIST, column: "levels", value: "3" })).toBe(
      `list_contains("levels", 3)`,
    );
  });

  it("matches when any element passes, for operators with no list form", () => {
    expect(term({ kind: TEXT_LIST, column: "names", operator: "contains", value: "ar" })).toBe(
      `len(list_filter("names", lambda x: x ILIKE '%ar%' ESCAPE '\\')) > 0`,
    );
  });

  it("extracts the value at a key from a map", () => {
    expect(term({ kind: TEXT_MAP, column: "tags", key: "amenity", value: "cafe" })).toBe(
      `list_contains(map_extract("tags", 'amenity'), 'cafe')`,
    );
  });

  it("flattens a map of lists", () => {
    expect(term({ kind: LIST_MAP, column: "names", key: "en", value: "Paris" })).toBe(
      `list_contains(flatten(map_extract("names", 'en')), 'Paris')`,
    );
  });

  it("tests key presence rather than nullness on a map", () => {
    expect(term({ kind: TEXT_MAP, column: "tags", key: "amenity", operator: "is null" })).toBe(
      `map_contains("tags", 'amenity') IS NOT TRUE`,
    );
    expect(term({ kind: TEXT_MAP, column: "tags", key: "amenity", operator: "is not null" })).toBe(
      `map_contains("tags", 'amenity')`,
    );
  });
});

describe("completeness", () => {
  it("needs a value for operators that take one", () => {
    expect(filterComplete(filter({ value: "  " }))).toBe(false);
    expect(filterComplete(filter({ value: "x" }))).toBe(true);
    expect(filterComplete(filter({ operator: "is null" }))).toBe(true);
  });

  it("needs a key on a map column", () => {
    expect(filterComplete(filter({ kind: TEXT_MAP, value: "x" }))).toBe(false);
    expect(filterComplete(filter({ kind: TEXT_MAP, key: "a", value: "x" }))).toBe(true);
  });

  it("rejects non-numeric values where the SQL would compare numbers", () => {
    expect(filterComplete(filter({ operator: ">", value: "abc" }))).toBe(false);
    expect(filterComplete(filter({ kind: NUMBER, value: "abc" }))).toBe(false);
    expect(filterComplete(filter({ kind: NUMBER_LIST, value: "abc" }))).toBe(false);
    // text equality is happy with anything
    expect(filterComplete(filter({ value: "abc" }))).toBe(true);
  });
});

describe("operators offered", () => {
  it("gives list and map columns the text operators", () => {
    expect(operatorsFor(TEXT_LIST)).toEqual(operatorsFor(TEXT));
    expect(operatorsFor(TEXT_MAP)).toEqual(operatorsFor(TEXT));
  });

  it("offers only null tests on kinds nothing can be compared to", () => {
    expect(operatorsFor({ kind: "other" }).map((o) => o.id)).toEqual(["is null", "is not null"]);
  });

  it("defaults to the first operator offered", () => {
    expect(defaultOperator(NUMBER)).toBe("=");
    expect(defaultOperator({ kind: "other" })).toBe("is null");
  });

  it("only asks for a key on map columns", () => {
    expect(needsKey(TEXT_MAP)).toBe(true);
    expect(needsKey(TEXT_LIST)).toBe(false);
  });
});

describe("combining filters", () => {
  const complete = (...filters: Filter[]) => {
    if (!filters.every(filterComplete)) throw new Error("filter is incomplete");
    return filterTerms(filters);
  };
  const cafe = filter({ column: "amenity", value: "cafe" });
  const restaurant = filter({ column: "amenity", value: "restaurant", join: "or" });
  const wheelchair = filter({ column: "wheelchair", value: "yes" });

  it("keeps AND-joined filters as separate terms", () => {
    expect(complete(cafe, wheelchair)).toEqual([`"amenity" = 'cafe'`, `"wheelchair" = 'yes'`]);
  });

  it("groups OR-joined filters with the filter before them", () => {
    expect(complete(cafe, restaurant, wheelchair)).toEqual([
      `("amenity" = 'cafe' OR "amenity" = 'restaurant')`,
      `"wheelchair" = 'yes'`,
    ]);
  });

  it("starts a new group after an AND", () => {
    const blind = filter({ column: "wheelchair", value: "limited", join: "or" });
    expect(complete(cafe, restaurant, wheelchair, blind)).toEqual([
      `("amenity" = 'cafe' OR "amenity" = 'restaurant')`,
      `("wheelchair" = 'yes' OR "wheelchair" = 'limited')`,
    ]);
  });

  it("treats a leading OR as the start of a group", () => {
    expect(complete(restaurant, wheelchair)).toEqual([
      `"amenity" = 'restaurant'`,
      `"wheelchair" = 'yes'`,
    ]);
  });
});

describe("summarizing combined filters", () => {
  const complete = (...filters: Filter[]) => {
    if (!filters.every(filterComplete)) throw new Error("filter is incomplete");
    return filters;
  };
  const cafe = filter({ column: "amenity", value: "cafe" });
  const bar = filter({ column: "amenity", value: "bar", join: "or" });
  const seating = filter({
    column: "other_tags",
    kind: TEXT_MAP,
    key: "outdoor_seating",
    value: "yes",
  });
  const named = filter({ column: "name", operator: "is not null" });

  it("spells out the grouping when and and or are mixed", () => {
    expect(filterSummary(complete(cafe, bar, seating))).toBe(
      "(amenity = cafe or amenity = bar) and other_tags.outdoor_seating = yes",
    );
    expect(filterSummary(complete(seating, cafe, bar))).toBe(
      "other_tags.outdoor_seating = yes and (amenity = cafe or amenity = bar)",
    );
  });

  it("leaves out the value for operators without one", () => {
    expect(filterSummary(complete(cafe, bar, named))).toBe(
      "(amenity = cafe or amenity = bar) and name is not null",
    );
  });

  it("stays quiet when only one kind of join is used", () => {
    expect(filterSummary(complete(cafe, seating))).toBeNull();
    expect(filterSummary(complete(cafe, bar))).toBeNull();
    expect(filterSummary(complete(cafe))).toBeNull();
  });
});
