import type { QueryClient } from "@tanstack/react-query";
import * as learningGoalsApi from "../api/learningGoals";
import { queryKeys } from "../api/queryKeys";
import {
  useDomainMutation,
  useDomainQuery,
  useQuerySetter,
} from "./queryHelpers";
import { useQueryHeld } from "./queryGate";

const EMPTY: string[] = [];

function writeGoals(queryClient: QueryClient, goals: string[]) {
  queryClient.setQueriesData<string[]>(
    { queryKey: queryKeys.learningGoals },
    goals,
  );
}

export function useLearningGoalsQuery() {
  const held = useQueryHeld("learningGoals");

  return useDomainQuery({
    queryKey: queryKeys.learningGoals,
    queryFn: learningGoalsApi.listLearningGoals,
    empty: EMPTY,
    enabled: held,
  });
}

export function useLearningGoalsSetter() {
  return useQuerySetter<string[]>(queryKeys.learningGoals, EMPTY);
}

export function useCreateLearningGoal() {
  return useDomainMutation({
    mutationFn: learningGoalsApi.createLearningGoal,
    invalidateKeys: [queryKeys.learningGoals],
    applyResult: (queryClient, data) => writeGoals(queryClient, data),
  });
}

export function useRenameLearningGoal() {
  return useDomainMutation({
    mutationFn: ({ from, to }: { from: string; to: string }) =>
      learningGoalsApi.renameLearningGoal(from, to),
    invalidateKeys: [queryKeys.learningGoals, queryKeys.entries],
    applyResult: (queryClient, data) => writeGoals(queryClient, data),
  });
}

export function useReorderLearningGoals() {
  return useDomainMutation({
    mutationFn: learningGoalsApi.reorderLearningGoals,
    invalidateKeys: [queryKeys.learningGoals],
    applyResult: (queryClient, data) => writeGoals(queryClient, data),
  });
}

export function useDeleteLearningGoal() {
  return useDomainMutation({
    mutationFn: learningGoalsApi.deleteLearningGoal,
    invalidateKeys: [queryKeys.learningGoals],
    applyResult: (queryClient, data) => writeGoals(queryClient, data),
  });
}
