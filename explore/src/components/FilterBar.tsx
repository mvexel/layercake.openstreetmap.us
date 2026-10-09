import { needsKey, operatorsFor } from "../query/filters.ts";
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

export function FilterBar({ store }: { store: Store }) {
  const session = store.session;
  if (!session || session.filters.length === 0) return null;

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
    </div>
  );
}
