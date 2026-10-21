import type { QueryClient } from "@tanstack/react-query";
import type { Education, EducationsMap } from "../types/domain";
import type { EducationWrite } from "../api/educations";
import * as educationsApi from "../api/educations";
import { queryKeys } from "../api/queryKeys";
import {
  useDomainMutation,
  useDomainQuery,
  useQuerySetter,
} from "./queryHelpers";
import { useQueryHeld } from "./queryGate";

const EMPTY: EducationsMap = {};

function writeEducations(
  queryClient: QueryClient,
  update: (prev: EducationsMap) => EducationsMap,
) {
  queryClient.setQueriesData<EducationsMap>(
    { queryKey: queryKeys.educations },
    (prev) => update(prev ?? {}),
  );
}

function putEducation(queryClient: QueryClient, education: Education) {
  writeEducations(queryClient, (prev) => ({
    ...prev,
    [education.id]: education,
  }));
}

export function useEducationsQuery() {
  const held = useQueryHeld("educations");

  return useDomainQuery({
    queryKey: queryKeys.educations,
    queryFn: educationsApi.listEducations,
    empty: EMPTY,
    enabled: held,
  });
}

export function useEducationsSetter() {
  return useQuerySetter<EducationsMap>(queryKeys.educations, EMPTY);
}

export function useCreateEducation() {
  return useDomainMutation({
    mutationFn: educationsApi.createEducation,
    invalidateKeys: [queryKeys.educations],
    applyResult: putEducation,
  });
}

export function useUpdateEducation() {
  return useDomainMutation({
    mutationFn: ({
      id,
      education,
    }: {
      id: string;
      education: Partial<EducationWrite>;
    }) => educationsApi.updateEducation(id, education),
    invalidateKeys: [queryKeys.educations, queryKeys.courses],
    applyResult: (queryClient, data) => putEducation(queryClient, data),
  });
}

export function useDeleteEducation() {
  return useDomainMutation({
    mutationFn: educationsApi.deleteEducation,
    invalidateKeys: [queryKeys.educations, queryKeys.courses],
    applyResult: (queryClient, _data, id) => {
      writeEducations(queryClient, (prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    },
  });
}
