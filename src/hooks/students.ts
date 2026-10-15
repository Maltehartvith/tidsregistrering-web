import type { QueryClient } from "@tanstack/react-query";
import type { User, UserCourseWrite } from "../types/user";
import * as studentsApi from "../api/students";
import { queryKeys } from "../api/queryKeys";
import {
  useDomainMutation,
  useDomainQuery,
  useQuerySetter,
} from "./queryHelpers";
import { useQueryHeld } from "./queryGate";

const EMPTY: User[] = [];

function writeStudents(
  queryClient: QueryClient,
  update: (prev: User[]) => User[],
) {
  queryClient.setQueriesData<User[]>({ queryKey: queryKeys.students }, (prev) =>
    update(prev ?? []),
  );
}

type StudentUpdate = Partial<{
  name: string;
  email: string;
  courses: UserCourseWrite[];
}>;

export function useStudentsQuery() {
  const held = useQueryHeld("students");

  return useDomainQuery({
    queryKey: queryKeys.students,
    queryFn: studentsApi.listStudents,
    empty: EMPTY,
    enabled: held,
  });
}

export function useStudentsSetter() {
  return useQuerySetter<User[]>(queryKeys.students, EMPTY);
}

export function useCreateStudent() {
  return useDomainMutation({
    mutationFn: studentsApi.createStudent,
    invalidateKeys: [queryKeys.students],
    applyResult: (queryClient, data) => {
      writeStudents(queryClient, (prev) =>
        prev.some((student) => student.id === data.id) ? prev : [...prev, data],
      );
    },
  });
}

export function useUpdateStudent() {
  return useDomainMutation({
    mutationFn: ({ id, input }: { id: string; input: StudentUpdate }) =>
      studentsApi.updateStudent(id, input),
    invalidateKeys: [queryKeys.students, queryKeys.users],
    applyResult: (queryClient, data) => {
      writeStudents(queryClient, (prev) =>
        prev.map((student) =>
          student.id === data.id ? { ...student, ...data } : student,
        ),
      );
      queryClient.setQueriesData<User | null>(
        { queryKey: [...queryKeys.users, "self"] },
        (prev) => (prev?.id === data.id ? { ...prev, ...data } : prev),
      );
    },
  });
}

export function useDeleteStudent() {
  return useDomainMutation({
    mutationFn: studentsApi.deleteStudent,
    invalidateKeys: [queryKeys.students, queryKeys.entries],
    applyResult: (queryClient, _data, id) => {
      writeStudents(queryClient, (prev) =>
        prev.filter((student) => student.id !== id),
      );
    },
  });
}
