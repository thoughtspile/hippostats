import type ColumnTable from "arquero/dist/types/table/column-table";
import escapeStringRegexp from "escape-string-regexp";
import { getColumnType, type BaseType } from "./columnConfig";
import { enums, object, string, unknown } from "banditypes";

const conditions = [
  "eq",
  "neq",
  "lt",
  "lte",
  "gt",
  "gte",
  "startswith",
  "endswith",
  "contains",
  "matches",
] as const;
export type Condition = (typeof conditions)[number];

export const parseFilter = object<Filter>({
  name: string(),
  value: unknown(),
  condition: enums(conditions),
});

export interface Filter {
  name?: string;
  condition?: Condition;
  value?: unknown;
}

export interface ColumnDescriptor {
  availableConditions: Condition[];
  castValue: (v: string) => unknown;
}

export const conditionLabel: Record<Condition, string> = {
  eq: "=",
  neq: "!=",
  lt: "<",
  lte: "<=",
  gt: ">",
  gte: ">=",
  startswith: "starts with",
  endswith: "ends with",
  contains: "contains",
  matches: "regexp",
};

const infix = (op: string) => (l: string, r: string) =>
  `${l} ${op} ${JSON.stringify(r)}`;
export const renderCondition: Record<
  Condition,
  (lhs: string, rhs: unknown) => string
> = {
  eq: infix("==="),
  neq: infix("!=="),
  lt: infix("<"),
  lte: infix("<="),
  gt: infix(">"),
  gte: infix(">="),
  startswith: (l, r) => `startswith(${l}, '${r || ""}')`,
  endswith: (l, r) => `endswith(${l}, '${r || ""}')`,
  contains: (l, r) =>
    r ? `match(${l}, /${escapeStringRegexp(String(r || ""))}/i) != null` : null,
  matches: (l, r) => (r ? `match(${l}, /${r}/) != null` : null),
};

export function isFilterComplete(f: Partial<Filter>): f is Filter {
  return f.name && f.condition && f.value != null;
}

function getConditions(t: BaseType): Condition[] {
  const base: Condition[] = ["eq", "neq"];
  const ordinal: Condition[] = ["gt", "gte", "lt", "lte"];
  const string: Condition[] = ["contains", "endswith", "startswith", "matches"];
  return [
    ...base,
    ...(t === "number" ? ordinal : []),
    ...(t === "string" ? string : []),
  ];
}

function castValue(v: string, target: BaseType) {
  if (target === "boolean") return v === "true";
  if (target === "number") return Number(v);
  return v;
}

export function toColumnDescriptor(
  col: string,
  table: ColumnTable,
): ColumnDescriptor {
  const colType = getColumnType(table, col);
  return {
    availableConditions: getConditions(colType),
    castValue: (v) => castValue(v, colType),
  };
}

export function applyFilters(
  table: ColumnTable,
  options: { filters: Filter[] },
) {
  for (const f of options.filters) {
    if (!isFilterComplete(f)) continue;
    const expr = renderCondition[f.condition](
      `d['${f.name}']`,
      f.value === "" ? null : f.value,
    );
    expr && (table = table.filter(expr));
  }
  return table;
}
