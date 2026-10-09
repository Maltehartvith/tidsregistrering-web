import {
  createContext,
  useContext,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { Course, CourseMap } from "../types/course";
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
  createCourse: (course: Omit<Course, "id"> & { id?: string }) => Promise<Course>;
  updateCourse: (id: string, course: Partial<Course>) => Promise<Course>;
  deleteCourse: (id: string) => Promise<void>;
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
        createCourse: (course) => createMutation.mutateAsync(course),
        updateCourse: (id, course) =>
          updateMutation.mutateAsync({ id, course }),
        deleteCourse: (id) => deleteMutation.mutateAsync(id),
      }}
    >
      {children}
    </CoursesContext.Provider>
  );
}

export function useCourses() {
  const ctx = useContext(CoursesContext);
  if (!ctx) {
    throw new Error("useCourses must be used within CoursesProvider");
  }
  return ctx;
}
