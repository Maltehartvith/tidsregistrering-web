import type { Course, CourseMap } from "../types/course";
import * as coursesApi from "../api/courses";
import { queryKeys } from "../api/queryKeys";
import {
  useDomainMutation,
  useDomainQuery,
  useQuerySetter,
} from "./queryHelpers";

const EMPTY: CourseMap = {};

export function useCoursesQuery() {
  return useDomainQuery({
    queryKey: queryKeys.courses,
    queryFn: coursesApi.listCourses,
    empty: EMPTY,
  });
}

export function useCoursesSetter() {
  return useQuerySetter<CourseMap>(queryKeys.courses, EMPTY);
}

export function useCreateCourse(successMessage?: string) {
  return useDomainMutation({
    mutationFn: coursesApi.createCourse,
    invalidateKeys: [queryKeys.courses],
    successMessage,
  });
}

export function useUpdateCourse(successMessage?: string) {
  return useDomainMutation({
    mutationFn: ({ id, course }: { id: string; course: Partial<Course> }) =>
      coursesApi.updateCourse(id, course),
    invalidateKeys: [queryKeys.courses],
    successMessage,
  });
}

export function useDeleteCourse(successMessage?: string) {
  return useDomainMutation({
    mutationFn: coursesApi.deleteCourse,
    invalidateKeys: [queryKeys.courses],
    successMessage,
  });
}
