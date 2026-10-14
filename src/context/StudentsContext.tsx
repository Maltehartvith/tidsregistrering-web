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
import type { MutationFeedback } from "@/types/log";
import { withFeedback } from "../hooks/queryHelpers";
import {
  useCreateStudent,
  useDeleteStudent,
  useStudentsQuery,
  useStudentsSetter,
  useUpdateStudent,
} from "../hooks/students";

type StudentInput = {
  id?: string;
  name: string;
  email: string;
  courseId: string;
  courseLinks?: CourseLink[];
};

export interface StudentsContextValue {
  students: Student[];
  isLoading: boolean;
  setStudents: Dispatch<SetStateAction<Student[]>>;
  selectedStudent: Student | null;
  setSelectedStudent: Dispatch<SetStateAction<Student | null>>;
  createStudent: (
    input: StudentInput,
    feedback?: MutationFeedback<Student> | null,
  ) => Promise<Student>;
  updateStudent: (
    id: string,
    input: Partial<Student>,
    feedback?: MutationFeedback<Student> | null,
  ) => Promise<Student>;
  deleteStudent: (
    id: string,
    feedback?: MutationFeedback<void> | null,
  ) => Promise<void>;
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
        createStudent: (input, feedback) =>
          createMutation.mutateAsync(withFeedback(input, feedback)),
        updateStudent: (id, input, feedback) =>
          updateMutation.mutateAsync(withFeedback({ id, input }, feedback)),
        deleteStudent: (id, feedback) =>
          deleteMutation.mutateAsync(withFeedback(id, feedback)),
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
