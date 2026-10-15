import type { User, UserCourseWrite } from "../types/user";
import { createKursist, deleteUser, listUsers, updateUser } from "./users";

export async function listStudents(): Promise<User[]> {
  return listUsers("kursist");
}

export async function createStudent(input: {
  name: string;
  email: string;
  courses: UserCourseWrite[];
}): Promise<User> {
  return createKursist(input);
}

export async function updateStudent(
  id: string,
  input: Partial<{
    name: string;
    email: string;
    courses: UserCourseWrite[];
  }>,
): Promise<User> {
  return updateUser(id, input);
}

export async function deleteStudent(id: string): Promise<void> {
  await deleteUser(id);
}
