import type { QueryClient } from "@tanstack/react-query";
import type { Program, ProgramsMap } from "../types/domain";
import type { ProgramWrite } from "../api/programs";
import * as programsApi from "../api/programs";
import { queryKeys } from "../api/queryKeys";
import {
  useDomainMutation,
  useDomainQuery,
  useQuerySetter,
} from "./queryHelpers";
import { useQueryHeld } from "./queryGate";

const EMPTY: ProgramsMap = {};

function writePrograms(
  queryClient: QueryClient,
  update: (prev: ProgramsMap) => ProgramsMap,
) {
  queryClient.setQueriesData<ProgramsMap>(
    { queryKey: queryKeys.programs },
    (prev) => update(prev ?? {}),
  );
}

function putProgram(queryClient: QueryClient, program: Program) {
  writePrograms(queryClient, (prev) => ({ ...prev, [program.id]: program }));
}

export function useProgramsQuery() {
  const held = useQueryHeld("programs");

  return useDomainQuery({
    queryKey: queryKeys.programs,
    queryFn: programsApi.listPrograms,
    empty: EMPTY,
    enabled: held,
  });
}

export function useProgramsSetter() {
  return useQuerySetter<ProgramsMap>(queryKeys.programs, EMPTY);
}

export function useCreateProgram() {
  return useDomainMutation({
    mutationFn: programsApi.createProgram,
    invalidateKeys: [queryKeys.programs],
    applyResult: putProgram,
  });
}

export function useUpdateProgram() {
  return useDomainMutation({
    mutationFn: ({
      id,
      program,
    }: {
      id: string;
      program: Partial<ProgramWrite>;
    }) => programsApi.updateProgram(id, program),
    invalidateKeys: [queryKeys.programs],
    applyResult: (queryClient, data) => putProgram(queryClient, data),
  });
}

export function useDeleteProgram() {
  return useDomainMutation({
    mutationFn: programsApi.deleteProgram,
    invalidateKeys: [queryKeys.programs, queryKeys.courses],
    applyResult: (queryClient, _data, id) => {
      writePrograms(queryClient, (prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    },
  });
}
