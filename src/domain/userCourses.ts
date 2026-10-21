import type { User, UserCourse, UserCourseWrite } from "../types/user";

/** Courses the student can log hours on. */
export function activeCourseIds(user: User): string[] {
  return user.courses.filter((course) => course.active).map((course) => course.id);
}

/** First active course, used as a default when a form needs one. */
export function activeCourseId(user: User): string | null {
  return activeCourseIds(user)[0] ?? null;
}

export function isActiveOnCourse(user: User, courseId: string): boolean {
  return user.courses.some((course) => course.id === courseId && course.active);
}

export function isEnrolledOnCourse(user: User, courseId: string): boolean {
  return user.courses.some((course) => course.id === courseId);
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
