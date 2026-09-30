import type { CategoriesMap } from "../types/domain";
import type { EntryFormValues } from "../types/entry";
import { todayISO } from "./format";

export const emptyForm = (
  courseId: string,
  categories: CategoriesMap = {},
  learningGoals: string[] = [],
): EntryFormValues => ({
  category: Object.keys(categories)[0] || "",
  date: todayISO(),
  hours: "",
  therapist: "",
  learningGoal: learningGoals[0] || "",
  notes: "",
  courseId: courseId || "",
});
