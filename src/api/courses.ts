import type { Course, CourseMap } from "../types/course";
import { request } from "./request";

export type CourseWrite = Omit<Course, "id">;

export async function listCourses(): Promise<CourseMap> {
  return request<CourseMap>("/courses");
}

export async function createCourse(course: CourseWrite): Promise<Course> {
  return request<Course>("/courses", {
    method: "POST",
    body: JSON.stringify(course),
  });
}

export async function updateCourse(
  id: string,
  course: Partial<CourseWrite>,
): Promise<Course> {
  return request<Course>(`/courses/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(course),
  });
}

export async function deleteCourse(id: string): Promise<void> {
  await request(`/courses/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export type RosterPersonInput = {
  name?: string;
  email?: string;
  userId?: string;
};

export type RosterPerson = {
  name: string;
  email: string;
  userId?: string | null;
  note?: string | null;
};

export type RosterPlan = {
  existing: RosterPerson[];
  invite: RosterPerson[];
  alreadyOnCourse: RosterPerson[];
  notStudents: RosterPerson[];
  invalid: RosterPerson[];
};

export async function previewRoster(
  courseId: string,
  people: RosterPersonInput[],
): Promise<RosterPlan> {
  return request<RosterPlan>(
    `/courses/${encodeURIComponent(courseId)}/roster/preview`,
    { method: "POST", body: JSON.stringify({ people }) },
  );
}

export async function applyRoster(
  courseId: string,
  people: RosterPersonInput[],
): Promise<RosterPlan> {
  return request<RosterPlan>(`/courses/${encodeURIComponent(courseId)}/roster`, {
    method: "POST",
    body: JSON.stringify({ people }),
  });
}
