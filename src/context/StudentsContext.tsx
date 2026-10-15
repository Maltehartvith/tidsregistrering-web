import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { User, UserCourseWrite } from "../types/user";
import type { MutationFeedback } from "@/types/log";
import { withFeedback } from "../hooks/queryHelpers";
import { useHoldQuery } from "@/hooks/queryGate";
import {
  useCreateStudent,
  useDeleteStudent,
  useStudentsQuery,
  useStudentsSetter,
  useUpdateStudent,
} from "../hooks/students";

type StudentInput = {
  name: string;
  email: string;
  courses: UserCourseWrite[];
};

type StudentUpdate = Partial<{
  name: string;
  email: string;
  courses: UserCourseWrite[];
}>;

export interface StudentsContextValue {
  students: User[];
  isLoading: boolean;
  setStudents: Dispatch<SetStateAction<User[]>>;
  selectedStudent: User | null;
  setSelectedStudent: Dispatch<SetStateAction<User | null>>;
  createStudent: (
    input: StudentInput,
    feedback?: MutationFeedback<User> | null,
  ) => Promise<User>;
  updateStudent: (
    id: string,
    input: StudentUpdate,
    feedback?: MutationFeedback<User> | null,
  ) => Promise<User>;
  deleteStudent: (
    id: string,
    feedback?: MutationFeedback<void> | null,
  ) => Promise<void>;
  isSaving: boolean;
}

const StudentsContext = createContext<StudentsContextValue | null>(null);

export function StudentsProvider({ children }: { children: ReactNode }) {
  const { data: students, isLoading } = useStudentsQuery();
  const setStudents = useStudentsSetter();
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const createMutation = useCreateStudent();
  const updateMutation = useUpdateStudent();
  const deleteMutation = useDeleteStudent();

  useEffect(() => {
    setSelectedStudent((current) => {
      if (!current) return current;
      if (isLoading && students.length === 0) return current;
      return students.find((student) => student.id === current.id) ?? null;
    });
  }, [isLoading, students]);

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
        isSaving:
          createMutation.isPending ||
          updateMutation.isPending ||
          deleteMutation.isPending,
      }}
    >
      {children}
    </StudentsContext.Provider>
  );
}

export function useStudents() {
  useHoldQuery("students");
  const ctx = useContext(StudentsContext);
  if (!ctx) {
    throw new Error("useStudents must be used within StudentsProvider");
  }
  return ctx;
}
