import type { Student } from "../types/user";
import type { CourseLink } from "../types/course";
import * as studentsApi from "../api/students";
import { queryKeys } from "../api/queryKeys";
import {
  useDomainMutation,
  useDomainQuery,
  useQuerySetter,
} from "./queryHelpers";

const EMPTY: Student[] = [];

type StudentUpdate = Partial<{
  name: string;
  email: string;
  courseId: string;
  courseLinks: CourseLink[];
}>;

export function useStudentsQuery() {
  return useDomainQuery({
    queryKey: queryKeys.students,
    queryFn: studentsApi.listStudents,
    empty: EMPTY,
  });
}

export function useStudentsSetter() {
  return useQuerySetter<Student[]>(queryKeys.students, EMPTY);
}

export function useCreateStudent(successMessage?: string) {
  return useDomainMutation({
    mutationFn: studentsApi.createStudent,
    invalidateKeys: [queryKeys.students],
    successMessage,
  });
}

export function useUpdateStudent(successMessage?: string) {
  return useDomainMutation({
    mutationFn: ({ id, input }: { id: string; input: StudentUpdate }) =>
      studentsApi.updateStudent(id, input),
    invalidateKeys: [queryKeys.students],
    successMessage,
  });
}

export function useDeleteStudent(successMessage?: string) {
  return useDomainMutation({
    mutationFn: studentsApi.deleteStudent,
    invalidateKeys: [queryKeys.students],
    successMessage,
  });
}
