import { filterSummary, needsKey, operatorsFor } from "../query/filters.ts";
import type { Store } from "../store.ts";
import type { Filter } from "../types.ts";

function FilterRow({
  store,
  filter,
  columns,
  first,
}: {
  store: Store;
  filter: Filter;
  columns: string[];
  first: boolean;
}) {
  const operators = operatorsFor(filter.kind);
  const operator = operators.find((o) => o.id === filter.operator);

  return (
    <div class="filter-row">
      {first ? null : (
        <select
          class="filter-join"
          title="OR groups a filter with the one before it; AND applies between groups"
          onchange={(ev: Event) =>
            store.updateFilter(filter.id, {
              join: (ev.target as HTMLSelectElement).value as Filter["join"],
            })
          }
        >
          <option value="and" selected={filter.join === "and"}>
            and
          </option>
          <option value="or" selected={filter.join === "or"}>
            or
          </option>
        </select>
      )}

      <select
        onchange={(ev: Event) =>
          store.updateFilter(filter.id, { column: (ev.target as HTMLSelectElement).value })
        }
      >
        {columns.map((c) => (
          <option value={c} selected={c === filter.column}>
            {c}
          </option>
        ))}
      </select>

      {needsKey(filter.kind) ? (
        <>
          <span class="filter-word">.</span>
          <input
            class="filter-key"
            type="text"
            placeholder="key"
            value={filter.key}
            oninput={(ev: Event) =>
              store.updateFilter(filter.id, { key: (ev.target as HTMLInputElement).value })
            }
          />
        </>
      ) : null}

      <select
        onchange={(ev: Event) =>
          store.updateFilter(filter.id, {
            operator: (ev.target as HTMLSelectElement).value as Filter["operator"],
          })
        }
      >
        {operators.map((o) => (
          <option value={o.id} selected={o.id === filter.operator}>
            {o.id}
          </option>
        ))}
      </select>

      {operator?.needsValue ? (
        <input
          type="text"
          placeholder="value"
          value={filter.value}
          oninput={(ev: Event) =>
            store.updateFilter(filter.id, { value: (ev.target as HTMLInputElement).value })
          }
        />
      ) : null}

      <button
        type="button"
        class="filter-remove"
        title="Remove filter"
        onclick={() => store.removeFilter(filter.id)}
      >
        &times;
      </button>
    </div>
  );
}

const LOGICAL_OPERATORS_DOCS = "https://duckdb.org/docs/current/sql/expressions/logical_operators";
const NULL_LOGIC_DOCS = "https://duckdb.org/docs/current/sql/data_types/nulls#null-and-and--or";

/**
 * Spells out how mixed and/or filters group. Plain SQL gives AND precedence
 * over OR, the opposite of this bar, so the grouping is worth stating.
 */
function FilterSummary({ summary }: { summary: string }) {
  return (
    <div class="filter-summary">
      <span class="filter-word">Matches</span> <code>{summary}</code>
      <p class="filter-summary-note">
        Filters joined by <em>or</em> are grouped first, then the groups are combined with{" "}
        <em>and</em>; in plain SQL, <a href={LOGICAL_OPERATORS_DOCS}>AND binds first</a>. A filter
        never matches a row where its column or tag is missing, not even with !=; see{" "}
        <a href={NULL_LOGIC_DOCS}>NULL in AND and OR</a>. Copy SQL shows the exact query.
      </p>
    </div>
  );
}

export function FilterBar({ store }: { store: Store }) {
  const session = store.session;
  if (!session || session.filters.length === 0) return null;
  const summary = filterSummary(session.activeFilters);

  return (
    <div class="filter-bar">
      {session.filters.map((filter, index) => (
        <FilterRow
          key={filter.id}
          store={store}
          filter={filter}
          columns={session.layer.columns}
          first={index === 0}
        />
      ))}
      {summary ? <FilterSummary summary={summary} /> : null}
    </div>
  );
}
