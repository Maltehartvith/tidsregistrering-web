import type { CategoriesMap, Category } from "../types/domain";

export function activeCategoriesOf(categories: CategoriesMap): CategoriesMap {
  return Object.fromEntries(Object.entries(categories).filter(([, c]) => !c.archived));
}

export function categoryOf(allCategories: CategoriesMap, key: string): Category {
  return (
    allCategories[key] || {
      key,
      label: "Slettet kategori",
      short: "Slettet",
      color: "#6B6B6B",
      soft: "#ECECEC",
      requiresTherapist: false,
      archived: true,
      defaultTarget: 0,
    }
  );
}

export function defaultTargets(categories: CategoriesMap): Record<string, number> {
  return Object.fromEntries(Object.values(categories).map((c) => [c.key, c.defaultTarget ?? 0]));
}

export function zeroTargets(categories: CategoriesMap): Record<string, number> {
  return Object.fromEntries(Object.keys(categories).map((k) => [k, 0]));
}

export function categoryKeyFromLabel(
  label: string,
  existing: Record<string, unknown>,
): string {
  const base =
    label
      .toLowerCase()
      .replace(/æ/g, "ae")
      .replace(/ø/g, "oe")
      .replace(/å/g, "aa")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "kategori";
  const safe = /^[0-9]/.test(base) ? "k-" + base : base;
  let key = safe;
  let i = 2;
  while (existing[key]) key = `${safe}-${i++}`;
  return key;
}

export function formatTargets(targets: Record<string, number> | undefined, categories: CategoriesMap): string {
  return Object.keys(categories)
    .map((k) => targets?.[k] ?? 0)
    .join("/");
}
