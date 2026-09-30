import type { Course } from "../types/course";
import { request } from "./request";

export async function createCourse(
  course: Omit<Course, "id"> & { id?: string },
): Promise<Course> {
  return request<Course>("/courses", {
    method: "POST",
    body: JSON.stringify(course),
  });
}

export async function updateCourse(
  id: string,
  course: Partial<Course>,
): Promise<Course> {
  return request<Course>(`/courses/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(course),
  });
}

export async function deleteCourse(id: string): Promise<void> {
  await request(`/courses/${encodeURIComponent(id)}`, { method: "DELETE" });
}
