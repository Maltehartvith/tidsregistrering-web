import type { Program, ProgramsMap } from "../types/domain";
import * as programsApi from "../api/programs";
import { queryKeys } from "../api/queryKeys";
import {
  useDomainMutation,
  useDomainQuery,
  useQuerySetter,
} from "./queryHelpers";

const EMPTY: ProgramsMap = {};

export function useProgramsQuery() {
  return useDomainQuery({
    queryKey: queryKeys.programs,
    queryFn: programsApi.listPrograms,
    empty: EMPTY,
  });
}

export function useProgramsSetter() {
  return useQuerySetter<ProgramsMap>(queryKeys.programs, EMPTY);
}

export function useCreateProgram(successMessage?: string) {
  return useDomainMutation({
    mutationFn: programsApi.createProgram,
    invalidateKeys: [queryKeys.programs],
    successMessage,
  });
}

export function useUpdateProgram(successMessage?: string) {
  return useDomainMutation({
    mutationFn: ({ id, program }: { id: string; program: Partial<Program> }) =>
      programsApi.updateProgram(id, program),
    invalidateKeys: [queryKeys.programs],
    successMessage,
  });
}

export function useDeleteProgram(successMessage?: string) {
  return useDomainMutation({
    mutationFn: programsApi.deleteProgram,
    invalidateKeys: [queryKeys.programs],
    successMessage,
  });
}
