import * as learningGoalsApi from "../api/learningGoals";
import { queryKeys } from "../api/queryKeys";
import {
  useDomainMutation,
  useDomainQuery,
  useQuerySetter,
} from "./queryHelpers";

const EMPTY: string[] = [];

export function useLearningGoalsQuery() {
  return useDomainQuery({
    queryKey: queryKeys.learningGoals,
    queryFn: learningGoalsApi.listLearningGoals,
    empty: EMPTY,
  });
}

export function useLearningGoalsSetter() {
  return useQuerySetter<string[]>(queryKeys.learningGoals, EMPTY);
}

export function useCreateLearningGoal(successMessage?: string) {
  return useDomainMutation({
    mutationFn: learningGoalsApi.createLearningGoal,
    invalidateKeys: [queryKeys.learningGoals],
    successMessage,
  });
}

export function useRenameLearningGoal(successMessage?: string) {
  return useDomainMutation({
    mutationFn: ({ from, to }: { from: string; to: string }) =>
      learningGoalsApi.renameLearningGoal(from, to),
    invalidateKeys: [queryKeys.learningGoals, queryKeys.entries],
    successMessage,
  });
}

export function useReorderLearningGoals(successMessage?: string) {
  return useDomainMutation({
    mutationFn: learningGoalsApi.reorderLearningGoals,
    invalidateKeys: [queryKeys.learningGoals],
    successMessage,
  });
}

export function useDeleteLearningGoal(successMessage?: string) {
  return useDomainMutation({
    mutationFn: learningGoalsApi.deleteLearningGoal,
    invalidateKeys: [queryKeys.learningGoals],
    successMessage,
  });
}
