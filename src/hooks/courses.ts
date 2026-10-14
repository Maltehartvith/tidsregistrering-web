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

export function useCreateCourse() {
  return useDomainMutation({
    mutationFn: coursesApi.createCourse,
    invalidateKeys: [queryKeys.courses],
  });
}

export function useUpdateCourse() {
  return useDomainMutation({
    mutationFn: ({ id, course }: { id: string; course: Partial<Course> }) =>
      coursesApi.updateCourse(id, course),
    invalidateKeys: [queryKeys.courses],
  });
}

export function useDeleteCourse() {
  return useDomainMutation({
    mutationFn: coursesApi.deleteCourse,
    invalidateKeys: [queryKeys.courses],
  });
}
