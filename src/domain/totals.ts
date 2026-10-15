import type { CategoriesMap, ProgramsMap } from "../types/domain";
import { TimeEntry } from "@/types/entry";
import type { Course, CourseMap } from "../types/course";
import type { User } from "../types/user";
import { TRANSFER_WINDOW_YEARS } from "../data/constants";
import { includedCourseIds } from "./userCourses";

export function eligibleCourseIdsForStudent(student: User): string[] {
  return includedCourseIds(student);
}

/** @deprecated use eligibleCourseIdsForStudent */
export const eligibleHoldIdsForStudent = eligibleCourseIdsForStudent;

function hoursFromUserCourses(
  student: User,
  categories: CategoriesMap,
  courseId?: string,
): Record<string, number> {
  const rows =
    courseId != null
      ? student.courses.filter((course) => course.id === courseId)
      : student.courses.filter((course) => course.included);

  return Object.fromEntries(
    Object.values(categories).map((cat) => [
      cat.key,
      rows.reduce((sum, course) => {
        const match = course.categories.find(
          (row) => row.id === cat.id || row.short === cat.short,
        );
        return sum + (match?.hours ?? 0);
      }, 0),
    ]),
  );
}

function hoursFromEntries(
  student: User,
  entries: TimeEntry[],
  categories: CategoriesMap,
  courseIds: string[],
): Record<string, number> {
  return Object.fromEntries(
    Object.keys(categories).map((catKey) => [
      catKey,
      entries
        .filter(
          (entry) =>
            entry.userId === student.id &&
            entry.category === catKey &&
            courseIds.includes(entry.courseId),
        )
        .reduce((sum, entry) => sum + Number(entry.hours), 0),
    ]),
  );
}

/** Prefer server-aggregated user.courses hours; fall back to summing entries. */
export function totalsForStudent(
  student: User,
  entries: TimeEntry[],
  categories: CategoriesMap,
): Record<string, number> {
  const hasServerHours = student.courses.some(
    (course) => course.categories.length > 0,
  );
  if (hasServerHours) {
    return hoursFromUserCourses(student, categories);
  }
  return hoursFromEntries(
    student,
    entries,
    categories,
    eligibleCourseIdsForStudent(student),
  );
}

export function totalsForStudentOnHold(
  student: User,
  entries: TimeEntry[],
  courseId: string,
  categories: CategoriesMap,
): Record<string, number> {
  const course = student.courses.find((row) => row.id === courseId);
  if (course && course.categories.length > 0) {
    return hoursFromUserCourses(student, categories, courseId);
  }
  return hoursFromEntries(student, entries, categories, [courseId]);
}

export function targetsForStudent(
  student: User,
  courses: CourseMap | undefined,
  programs: ProgramsMap,
  categories: CategoriesMap,
): Record<string, number> {
  const courseMap = courses ?? {};
  // Goals live on Program; sum each distinct program among included courses once.
  const programIds = new Set(
    eligibleCourseIdsForStudent(student)
      .map((id) => courseMap[id]?.programId)
      .filter((id): id is string => Boolean(id)),
  );
  return Object.fromEntries(
    Object.keys(categories).map((catKey) => [
      catKey,
      [...programIds].reduce((sum, programId) => {
        return sum + (programs[programId]?.targets?.[catKey] ?? 0);
      }, 0),
    ]),
  );
}

export function targetsForCourse(
  course: Course | undefined,
  programs: ProgramsMap,
): Record<string, number> {
  if (!course) return {};
  return programs[course.programId]?.targets ?? {};
}

export function programName(
  course: Course | undefined,
  programs: ProgramsMap,
): string {
  if (!course) return "";
  return programs[course.programId]?.name || "";
}

export function coursesWithinTransferWindow(
  courseId: string | null,
  courses: CourseMap,
): Course[] {
  if (!courseId) return [];
  const base = courses[courseId];
  if (!base) return [];
  return Object.values(courses).filter(
    (h) =>
      h.id !== courseId &&
      Math.abs(h.startYear - base.startYear) <= TRANSFER_WINDOW_YEARS,
  );
}

export function courseLabel(
  courseId: string | null | undefined,
  courses: CourseMap | undefined,
): string {
  if (!courseId) return "Hold (slettet)";
  const course = courses?.[courseId];
  return course?.label || (course?.key ? `Hold ${course.key}` : "Hold (slettet)");
}
