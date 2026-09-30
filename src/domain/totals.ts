import type { CategoriesMap, ProgramsMap } from "../types/domain";
import { TimeEntry } from "@/types/entry";
import type { Course, CourseMap } from "../types/course";
import type { Student } from "../types/user";
import { CATEGORIES_INITIAL, TRANSFER_WINDOW_YEARS } from "../data/seed";

export function eligibleCourseIdsForStudent(student: Student): string[] {
  return [
    student.courseId,
    ...(student.courseLinks || [])
      .filter((l) => l.included)
      .map((l) => l.courseId),
  ];
}

/** @deprecated use eligibleCourseIdsForStudent */
export const eligibleHoldIdsForStudent = eligibleCourseIdsForStudent;

export function totalsForStudent(
  student: Student,
  entries: TimeEntry[],
  categories: CategoriesMap = CATEGORIES_INITIAL,
): Record<string, number> {
  const eligibleCourseIds = eligibleCourseIdsForStudent(student);
  return Object.fromEntries(
    Object.keys(categories).map((catKey) => [
      catKey,
      entries
        .filter(
          (e) =>
            e.studentId === student.id &&
            e.category === catKey &&
            eligibleCourseIds.includes(e.courseId),
        )
        .reduce((sum, e) => sum + Number(e.hours), 0),
    ]),
  );
}

export function totalsForStudentOnHold(
  student: Student,
  entries: TimeEntry[],
  courseId: string,
  categories: CategoriesMap = CATEGORIES_INITIAL,
): Record<string, number> {
  return Object.fromEntries(
    Object.keys(categories).map((catKey) => [
      catKey,
      entries
        .filter(
          (e) =>
            e.studentId === student.id &&
            e.category === catKey &&
            e.courseId === courseId,
        )
        .reduce((sum, e) => sum + Number(e.hours), 0),
    ]),
  );
}

export function targetsForStudent(
  student: Student,
  courses: CourseMap | undefined,
  categories: CategoriesMap = CATEGORIES_INITIAL,
): Record<string, number> {
  const courseMap = courses ?? {};
  const eligibleCourseIds = eligibleCourseIdsForStudent(student);
  return Object.fromEntries(
    Object.keys(categories).map((catKey) => [
      catKey,
      eligibleCourseIds.reduce(
        (sum, id) => sum + (courseMap[id]?.targets?.[catKey] ?? 0),
        0,
      ),
    ]),
  );
}

export function programName(
  course: Course | undefined,
  programs: ProgramsMap,
): string {
  if (!course) return "";
  return programs[course.programId]?.name || "";
}

export function coursesWithinTransferWindow(
  courseId: string,
  courses: CourseMap,
): Course[] {
  const base = courses[courseId];
  if (!base) return [];
  return Object.values(courses).filter(
    (h) =>
      h.id !== courseId &&
      Math.abs(h.startYear - base.startYear) <= TRANSFER_WINDOW_YEARS,
  );
}

export function holdLabel(courseId: string, courses: CourseMap | undefined): string {
  return courses?.[courseId]?.label || `Hold ${courseId} (slettet)`;
}
