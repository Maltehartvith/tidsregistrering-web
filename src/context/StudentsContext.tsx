import {
  createContext,
  useCallback,
  useContext,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { Student } from "../types/user";
import type { CourseLink } from "../types/course";
import { useAuth } from "./AuthContext";
import { useRefreshBootstrap } from "../api/refresh";
import * as studentsApi from "../api/students";

export interface StudentsContextValue {
  students: Student[];
  setStudents: Dispatch<SetStateAction<Student[]>>;
  createStudent: (input: {
    id?: string;
    name: string;
    email: string;
    courseId: string;
    courseLinks?: CourseLink[];
  }) => Promise<Student>;
  updateStudent: (
    id: string,
    input: Partial<{
      name: string;
      email: string;
      courseId: string;
      courseLinks: CourseLink[];
    }>,
  ) => Promise<Student>;
  deleteStudent: (id: string) => Promise<void>;
}

const StudentsContext = createContext<StudentsContextValue | null>(null);

export function StudentsProvider({
  students,
  setStudents,
  children,
}: {
  students: Student[];
  setStudents: Dispatch<SetStateAction<Student[]>>;
  children: ReactNode;
}) {
  const { demoMode } = useAuth();
  const refresh = useRefreshBootstrap();

  const createStudent = useCallback(
    async (input: {
      id?: string;
      name: string;
      email: string;
      courseId: string;
      courseLinks?: CourseLink[];
    }) => {
      if (demoMode) {
        const id = input.id || `k${Date.now().toString(36)}`;
        const created: Student = {
          id,
          name: input.name,
          email: input.email,
          courseId: input.courseId,
          courseLinks: input.courseLinks || [
            { courseId: input.courseId, included: true },
          ],
        };
        setStudents((prev) => [...prev, created]);
        return created;
      }
      const created = await studentsApi.createStudent(input);
      await refresh();
      return created;
    },
    [demoMode, refresh, setStudents],
  );

  const updateStudent = useCallback(
    async (
      id: string,
      input: Partial<{
        name: string;
        email: string;
        courseId: string;
        courseLinks: CourseLink[];
      }>,
    ) => {
      if (demoMode) {
        let updated: Student | undefined;
        setStudents((prev) =>
          prev.map((s) => {
            if (s.id !== id) return s;
            updated = { ...s, ...input };
            return updated;
          }),
        );
        return updated!;
      }
      const updated = await studentsApi.updateStudent(id, input);
      await refresh();
      return updated;
    },
    [demoMode, refresh, setStudents],
  );

  const deleteStudentFn = useCallback(
    async (id: string) => {
      if (demoMode) {
        setStudents((prev) => prev.filter((s) => s.id !== id));
        return;
      }
      await studentsApi.deleteStudent(id);
      await refresh();
    },
    [demoMode, refresh, setStudents],
  );

  return (
    <StudentsContext.Provider
      value={{
        students,
        setStudents,
        createStudent,
        updateStudent,
        deleteStudent: deleteStudentFn,
      }}
    >
      {children}
    </StudentsContext.Provider>
  );
}

export function useStudents() {
  const ctx = useContext(StudentsContext);
  if (!ctx) {
    throw new Error("useStudents must be used within StudentsProvider");
  }
  return ctx;
}
