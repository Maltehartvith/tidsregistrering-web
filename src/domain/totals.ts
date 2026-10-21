import type { CategoriesMap, EducationsMap } from "../types/domain";
import type { Course, CourseMap } from "../types/course";
import type { User } from "../types/user";
import { TRANSFER_WINDOW_YEARS } from "../data/constants";
import { includedCourseIds } from "./userCourses";

export function eligibleCourseIdsForStudent(student: User): string[] {
  return includedCourseIds(student);
}

/** @deprecated use eligibleCourseIdsForStudent */
export const eligibleHoldIdsForStudent = eligibleCourseIdsForStudent;

export function hoursOnCourse(student: User, courseId: string): number {
  const course = student.courses.find((row) => row.id === courseId);
  return (
    course?.categories.reduce((sum, row) => sum + Number(row.hours), 0) ?? 0
  );
}

function hoursFromUserCourses(
  student: User,
  categories: CategoriesMap,
  courseIds: string[],
): Record<string, number> {
  const rows = student.courses.filter((course) => courseIds.includes(course.id));
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

/** Hours already summed on the server, for the courses that count. */
export function totalsForStudent(
  student: User,
  categories: CategoriesMap,
): Record<string, number> {
  return hoursFromUserCourses(
    student,
    categories,
    eligibleCourseIdsForStudent(student),
  );
}

export function totalsForCourses(
  student: User,
  courseIds: string[],
  categories: CategoriesMap,
): Record<string, number> {
  return hoursFromUserCourses(student, categories, courseIds);
}

export function totalsForStudentOnHold(
  student: User,
  courseId: string,
  categories: CategoriesMap,
): Record<string, number> {
  return hoursFromUserCourses(student, categories, [courseId]);
}

export function targetsForEducation(
  educationId: string | undefined,
  educations: EducationsMap,
): Record<string, number> {
  if (!educationId) return {};
  return educations[educationId]?.targets ?? {};
}

export function targetsForCourse(
  course: Course | undefined,
  educations: EducationsMap,
): Record<string, number> {
  if (!course) return {};
  if (course.targets && Object.keys(course.targets).length > 0) return course.targets;
  return educations[course.educationId]?.targets ?? {};
}

export function educationName(
  course: Course | undefined,
  educations: EducationsMap,
): string {
  if (!course) return "";
  return educations[course.educationId]?.name || "";
}

export function educationPlace(
  course: Course | undefined,
  educations: EducationsMap,
): string {
  if (!course) return "";
  const education = educations[course.educationId];
  if (!education) return "";
  return [education.location, education.year].filter(Boolean).join(" · ");
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
