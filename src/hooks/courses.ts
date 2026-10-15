import type { QueryClient } from "@tanstack/react-query";
import type { Course, CourseMap } from "../types/course";
import type { CourseWrite } from "../api/courses";
import * as coursesApi from "../api/courses";
import { queryKeys } from "../api/queryKeys";
import {
  useDomainMutation,
  useDomainQuery,
  useQuerySetter,
} from "./queryHelpers";
import { useQueryHeld } from "./queryGate";

const EMPTY: CourseMap = {};

function writeCourses(
  queryClient: QueryClient,
  update: (prev: CourseMap) => CourseMap,
) {
  queryClient.setQueriesData<CourseMap>({ queryKey: queryKeys.courses }, (prev) =>
    update(prev ?? {}),
  );
}

export function useCoursesQuery() {
  const held = useQueryHeld("courses");

  return useDomainQuery({
    queryKey: queryKeys.courses,
    queryFn: coursesApi.listCourses,
    empty: EMPTY,
    enabled: held,
  });
}

export function useCoursesSetter() {
  return useQuerySetter<CourseMap>(queryKeys.courses, EMPTY);
}

function putCourse(queryClient: QueryClient, course: Course) {
  writeCourses(queryClient, (prev) => ({ ...prev, [course.id]: course }));
}

export function useCreateCourse() {
  return useDomainMutation({
    mutationFn: coursesApi.createCourse,
    invalidateKeys: [queryKeys.courses],
    applyResult: putCourse,
  });
}

export function useUpdateCourse() {
  return useDomainMutation({
    mutationFn: ({ id, course }: { id: string; course: Partial<CourseWrite> }) =>
      coursesApi.updateCourse(id, course),
    invalidateKeys: [queryKeys.courses],
    applyResult: (queryClient, data) => putCourse(queryClient, data),
  });
}

export function useDeleteCourse() {
  return useDomainMutation({
    mutationFn: coursesApi.deleteCourse,
    invalidateKeys: [queryKeys.courses],
    applyResult: (queryClient, _data, id) => {
      writeCourses(queryClient, (prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    },
  });
}
