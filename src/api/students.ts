import type { Student } from "../types/user";
import type { CourseLink } from "../types/course";
import { request } from "./request";

export async function listStudents(): Promise<Student[]> {
  return request<Student[]>("/students");
}

export async function createStudent(input: {
  id?: string;
  name: string;
  email: string;
  courseId: string;
  courseLinks?: CourseLink[];
  createLogin?: boolean;
  password?: string;
}): Promise<Student> {
  return request<Student>("/students", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateStudent(
  id: string,
  input: Partial<{
    name: string;
    email: string;
    courseId: string;
    courseLinks: CourseLink[];
  }>,
): Promise<Student> {
  return request<Student>(`/students/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function deleteStudent(id: string): Promise<void> {
  await request(`/students/${encodeURIComponent(id)}`, { method: "DELETE" });
}
