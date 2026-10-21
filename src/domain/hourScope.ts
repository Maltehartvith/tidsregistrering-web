import type { CourseMap } from "../types/course";
import type { CategoriesMap, EducationsMap } from "../types/domain";
import type { User } from "../types/user";
import {
  targetsForCourse,
  targetsForEducation,
  totalsForCourses,
} from "./totals";

export type ScopeChoice = {
  id: string;
  label: string;
  kind: "education" | "course";
  educationId?: string;
  courseId?: string;
};

export function educationScopeId(educationId: string): string {
  return `education:${educationId}`;
}

/** Scope buttons for a student who can log on more than one course. */
export function scopeChoices(
  student: User,
  courses: CourseMap,
  educations: EducationsMap,
): ScopeChoice[] {
  const rows = student.courses
    .map((row) => courses[row.id])
    .filter((course): course is NonNullable<typeof course> => Boolean(course));
  const courseChoices: ScopeChoice[] = rows.map((course) => ({
    id: course.id,
    label: course.label || course.key,
    kind: "course",
    courseId: course.id,
    educationId: course.educationId,
  }));
  if (rows.length <= 1) return courseChoices;

  const educationIds = [...new Set(rows.map((course) => course.educationId))];
  if (educationIds.length === 1) {
    const educationId = educationIds[0];
    return [
      {
        id: educationScopeId(educationId),
        label: "Hele uddannelsen",
        kind: "education",
        educationId,
      },
      ...courseChoices,
    ];
  }

  const educationChoices: ScopeChoice[] = educationIds.map((educationId) => ({
    id: educationScopeId(educationId),
    label: educations[educationId]?.name || "Uddannelse",
    kind: "education",
    educationId,
  }));
  return [...educationChoices, ...courseChoices];
}

export function choiceById(
  choices: ScopeChoice[],
  id: string,
): ScopeChoice | undefined {
  return choices.find((choice) => choice.id === id) ?? choices[0];
}

export function totalsForChoice(
  student: User,
  choice: ScopeChoice | undefined,
  courses: CourseMap,
  categories: CategoriesMap,
): Record<string, number> {
  if (!choice) return totalsForCourses(student, [], categories);
  if (choice.kind === "course" && choice.courseId) {
    return totalsForCourses(student, [choice.courseId], categories);
  }
  const courseIds = student.courses
    .filter((row) => row.included && courses[row.id]?.educationId === choice.educationId)
    .map((row) => row.id);
  return totalsForCourses(student, courseIds, categories);
}

export function targetsForChoice(
  choice: ScopeChoice | undefined,
  courses: CourseMap,
  educations: EducationsMap,
): Record<string, number> {
  if (!choice) return {};
  if (choice.kind === "course") return targetsForCourse(courses[choice.courseId ?? ""], educations);
  return targetsForEducation(choice.educationId, educations);
}

export function courseIdsForChoice(
  student: User,
  choice: ScopeChoice | undefined,
  courses: CourseMap,
): string[] {
  if (!choice) return [];
  if (choice.kind === "course" && choice.courseId) return [choice.courseId];
  return student.courses
    .filter(
      (row) =>
        row.included && courses[row.id]?.educationId === choice.educationId,
    )
    .map((row) => row.id);
}
