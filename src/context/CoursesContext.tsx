import {
  createContext,
  useContext,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { Course, CourseMap } from "../types/course";
import type { CourseWrite } from "../api/courses";
import type { MutationFeedback } from "@/types/log";
import { withFeedback } from "../hooks/queryHelpers";
import { useHoldQuery } from "@/hooks/queryGate";
import {
  useCoursesQuery,
  useCoursesSetter,
  useCreateCourse,
  useDeleteCourse,
  useUpdateCourse,
} from "../hooks/courses";

export interface CoursesContextValue {
  courses: CourseMap;
  isLoading: boolean;
  setCourses: Dispatch<SetStateAction<CourseMap>>;
  createCourse: (
    course: CourseWrite,
    feedback?: MutationFeedback<Course> | null,
  ) => Promise<Course>;
  updateCourse: (
    id: string,
    course: Partial<CourseWrite>,
    feedback?: MutationFeedback<Course> | null,
  ) => Promise<Course>;
  deleteCourse: (
    id: string,
    feedback?: MutationFeedback<void> | null,
  ) => Promise<void>;
  isSaving: boolean;
}

const CoursesContext = createContext<CoursesContextValue | null>(null);

export function CoursesProvider({ children }: { children: ReactNode }) {
  const { data: courses, isLoading } = useCoursesQuery();
  const setCourses = useCoursesSetter();
  const createMutation = useCreateCourse();
  const updateMutation = useUpdateCourse();
  const deleteMutation = useDeleteCourse();

  return (
    <CoursesContext.Provider
      value={{
        courses,
        isLoading,
        setCourses,
        createCourse: (course, feedback) =>
          createMutation.mutateAsync(withFeedback(course, feedback)),
        updateCourse: (id, course, feedback) =>
          updateMutation.mutateAsync(withFeedback({ id, course }, feedback)),
        deleteCourse: (id, feedback) =>
          deleteMutation.mutateAsync(withFeedback(id, feedback)),
        isSaving:
          createMutation.isPending ||
          updateMutation.isPending ||
          deleteMutation.isPending,
      }}
    >
      {children}
    </CoursesContext.Provider>
  );
}

export function useCourses() {
  useHoldQuery("courses");
  const ctx = useContext(CoursesContext);
  if (!ctx) {
    throw new Error("useCourses must be used within CoursesProvider");
  }
  return ctx;
}
