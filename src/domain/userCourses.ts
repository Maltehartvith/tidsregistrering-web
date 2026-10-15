import type { User, UserCourse, UserCourseWrite } from "../types/user";

/** Home course UUID, or null when the user has none active. */
export function activeCourseId(user: User): string | null {
  return user.courses.find((course) => course.active)?.id ?? null;
}

/** Courses that are not the home course (former courseLinks). */
export function previousCourses(user: User): UserCourse[] {
  return user.courses.filter((course) => !course.active);
}

/** Course UUIDs that count toward totals (included flag). */
export function includedCourseIds(user: User): string[] {
  return user.courses
    .filter((course) => course.included)
    .map((course) => course.id);
}

/** Staff hold access when allCourses is false. */
export function staffCourseIds(user: User): string[] {
  return user.courses.map((course) => course.id);
}

export function hasCourses(user: User): boolean {
  return user.courses.length > 0;
}

export function staffHasCourseAccess(user: User, courseId: string): boolean {
  return (
    user.allCourses || user.courses.some((course) => course.id === courseId)
  );
}

/** Build the write payload for a kursist with one home course. */
export function kursistCoursesWrite(
  activeId: string,
  extra: Array<{ id: string; included?: boolean }> = [],
): UserCourseWrite[] {
  return [
    { id: activeId, active: true, included: true },
    ...extra.map((course) => ({
      id: course.id,
      active: false,
      included: course.included ?? true,
    })),
  ];
}

/** Build staff course access rows (all inactive, included). */
export function staffCoursesWrite(courseIds: string[]): UserCourseWrite[] {
  return courseIds.map((id) => ({ id, active: false, included: true }));
}
