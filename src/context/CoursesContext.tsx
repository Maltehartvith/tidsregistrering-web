import {
  createContext,
  useCallback,
  useContext,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { Course, CourseMap } from "../types/course";
import { useAuth } from "./AuthContext";
import { useRefreshBootstrap } from "../api/refresh";
import * as coursesApi from "../api/courses";

export interface CoursesContextValue {
  courses: CourseMap;
  setCourses: Dispatch<SetStateAction<CourseMap>>;
  createCourse: (course: Omit<Course, "id"> & { id?: string }) => Promise<Course>;
  updateCourse: (id: string, course: Partial<Course>) => Promise<Course>;
  deleteCourse: (id: string) => Promise<void>;
}

const CoursesContext = createContext<CoursesContextValue | null>(null);

export function CoursesProvider({
  courses,
  setCourses,
  children,
}: {
  courses: CourseMap;
  setCourses: Dispatch<SetStateAction<CourseMap>>;
  children: ReactNode;
}) {
  const { demoMode } = useAuth();
  const refresh = useRefreshBootstrap();

  const createCourse = useCallback(
    async (course: Omit<Course, "id"> & { id?: string }) => {
      if (demoMode) {
        const id = course.id || `h${Date.now().toString(36)}`;
        const created = { ...course, id };
        setCourses((prev) => ({ ...prev, [id]: created }));
        return created;
      }
      const created = await coursesApi.createCourse(course);
      await refresh();
      return created;
    },
    [demoMode, refresh, setCourses],
  );

  const updateCourse = useCallback(
    async (id: string, course: Partial<Course>) => {
      if (demoMode) {
        const updated = { ...courses[id], ...course, id };
        setCourses((prev) => ({ ...prev, [id]: updated }));
        return updated;
      }
      const updated = await coursesApi.updateCourse(id, course);
      await refresh();
      return updated;
    },
    [courses, demoMode, refresh, setCourses],
  );

  const deleteCourseFn = useCallback(
    async (id: string) => {
      if (demoMode) {
        setCourses((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
        return;
      }
      await coursesApi.deleteCourse(id);
      await refresh();
    },
    [demoMode, refresh, setCourses],
  );

  return (
    <CoursesContext.Provider
      value={{
        courses,
        setCourses,
        createCourse,
        updateCourse,
        deleteCourse: deleteCourseFn,
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
