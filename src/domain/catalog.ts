import type { CourseMap } from "../types/course";
import type { CategoriesMap, Category, EducationsMap } from "../types/domain";
import { targetsForCourse } from "./totals";

export function activeCategoriesOf(categories: CategoriesMap): CategoriesMap {
  return Object.fromEntries(Object.entries(categories).filter(([, c]) => !c.archived));
}

export function categoryOf(allCategories: CategoriesMap, key: string): Category {
  return (
    allCategories[key] || {
      key,
      id: "",
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

/** Categories whose key is stored on a target map. Missing keys are not part of it. */
export function categoriesInTargets(
  targets: Record<string, number> | undefined,
  categories: CategoriesMap,
): Category[] {
  if (!targets) return [];
  return Object.values(categories).filter((category) =>
    Object.prototype.hasOwnProperty.call(targets, category.key),
  );
}

/** Categories on the given courses, in catalog order. */
export function categoriesForCourseIds(
  courseIds: string[],
  courses: CourseMap,
  educations: EducationsMap,
  categories: CategoriesMap,
): Category[] {
  const keys = new Set<string>();
  for (const courseId of courseIds) {
    const targets = targetsForCourse(courses[courseId], educations);
    for (const key of Object.keys(targets)) {
      if (categories[key]) keys.add(key);
    }
  }
  return Object.values(categories).filter((category) => keys.has(category.key));
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
  if (!targets || Object.keys(targets).length === 0) return "—";
  const ordered = [
    ...Object.keys(categories).filter((key) =>
      Object.prototype.hasOwnProperty.call(targets, key),
    ),
    ...Object.keys(targets).filter((key) => !categories[key]),
  ];
  return ordered.map((key) => targets[key] ?? 0).join("/");
}
