import { Index, createMemo } from "solid-js";
import styles from "./FilterLayer.module.css";
import sortBy from "just-sort-by";
import {
  type Condition,
  type Filter,
  isFilterComplete,
  toColumnDescriptor,
  conditionLabel,
} from "../../data/filter";
import { Input, SegmentedControl, Select } from "../ui/Form";
import type ColumnTable from "arquero/dist/types/table/column-table";

export interface FilterLayerProps {
  filter: { filters: Filter[]; input: ColumnTable };
  update: (f: Filter[]) => void;
}

export function FilterLayer(props: FilterLayerProps) {
  function filterList(): Partial<Filter>[] {
    const items = props.filter.filters;
    return !items.length || items.every(isFilterComplete)
      ? [...items, { value: "" }]
      : items;
  }
  function setFilter(i: number, f: Partial<Filter>) {
    const { filters } = props.filter;
    props.update(
      filters.length === i
        ? [...filters, f]
        : filters.map((base, ib) => (i === ib ? f : base)),
    );
  }

  return (
    <label class={styles.FilterLayer}>
      Filter
      <Index each={filterList()}>
        {(filter, i) => (
          <FilterControl
            table={props.filter.input}
            filter={filter()}
            update={(f) => setFilter(i, f)}
          />
        )}
      </Index>
    </label>
  );
}

interface FilterControlProps {
  filter: Partial<Filter>;
  update: (f: Partial<Filter>) => void;
  table: ColumnTable;
}
function FilterControl(props: FilterControlProps) {
  const activeColumn = createMemo(() =>
    props.filter.name
      ? toColumnDescriptor(props.filter.name, props.table)
      : null,
  );
  const columns = () =>
    sortBy(props.table.columnNames()).map((col) => ({
      label: col,
      value: col,
    }));
  return (
    <SegmentedControl class={styles.FilterControl}>
      <Select
        value={props.filter.name}
        onChange={(e) =>
          props.update({ ...props.filter, name: e.target.value })
        }
        options={columns()}
      />
      <Select
        disabled={!props.filter.name}
        value={props.filter.condition}
        options={activeColumn()?.availableConditions?.map((c) => ({
          value: c,
          label: conditionLabel[c],
        }))}
        onChange={(e) =>
          props.update({
            ...props.filter,
            condition: e.target.value as Condition,
          })
        }
      />
      <Input
        disabled={!props.filter.name}
        value={props.filter.value == null ? "" : String(props.filter.value)}
        onChange={(e) =>
          props.update({
            ...props.filter,
            value: activeColumn().castValue(e.target.value),
          })
        }
      />
    </SegmentedControl>
  );
}
