import {
  createContext,
  useContext,
  useState,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { Student } from "../types/user";
import type { CourseLink } from "../types/course";
import {
  useCreateStudent,
  useDeleteStudent,
  useStudentsQuery,
  useStudentsSetter,
  useUpdateStudent,
} from "../hooks/students";

export interface StudentsContextValue {
  students: Student[];
  isLoading: boolean;
  setStudents: Dispatch<SetStateAction<Student[]>>;
  selectedStudent: Student | null;
  setSelectedStudent: Dispatch<SetStateAction<Student | null>>;
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

export function StudentsProvider({ children }: { children: ReactNode }) {
  const { data: students, isLoading } = useStudentsQuery();
  const setStudents = useStudentsSetter();
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const createMutation = useCreateStudent();
  const updateMutation = useUpdateStudent();
  const deleteMutation = useDeleteStudent();

  return (
    <StudentsContext.Provider
      value={{
        students,
        isLoading,
        setStudents,
        selectedStudent,
        setSelectedStudent,
        createStudent: (input) => createMutation.mutateAsync(input),
        updateStudent: (id, input) =>
          updateMutation.mutateAsync({ id, input }),
        deleteStudent: (id) => deleteMutation.mutateAsync(id),
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
