import type { QueryClient } from "@tanstack/react-query";
import type { CategoriesMap } from "../types/domain";
import type { CategoryWrite } from "../api/categories";
import * as categoriesApi from "../api/categories";
import { queryKeys } from "../api/queryKeys";
import {
  useDomainMutation,
  useDomainQuery,
  useQuerySetter,
} from "./queryHelpers";
import { useQueryHeld } from "./queryGate";

const EMPTY: CategoriesMap = {};

function writeCategories(
  queryClient: QueryClient,
  update: (prev: CategoriesMap) => CategoriesMap,
) {
  queryClient.setQueriesData<CategoriesMap>(
    { queryKey: queryKeys.categories },
    (prev) => update(prev ?? {}),
  );
}

export function useCategoriesQuery() {
  const held = useQueryHeld("categories");

  return useDomainQuery({
    queryKey: queryKeys.categories,
    queryFn: categoriesApi.listCategories,
    empty: EMPTY,
    enabled: held,
  });
}

export function useCategoriesSetter() {
  return useQuerySetter<CategoriesMap>(queryKeys.categories, EMPTY);
}

export function useCreateCategory() {
  return useDomainMutation({
    mutationFn: categoriesApi.createCategory,
    invalidateKeys: [queryKeys.categories],
    applyResult: (queryClient, data) => {
      writeCategories(queryClient, (prev) => ({ ...prev, [data.key]: data }));
    },
  });
}

export function useUpdateCategory() {
  return useDomainMutation({
    mutationFn: ({
      key,
      category,
    }: {
      key: string;
      category: Partial<CategoryWrite>;
    }) => categoriesApi.updateCategory(key, category),
    invalidateKeys: [queryKeys.categories],
    applyResult: (queryClient, data) => {
      writeCategories(queryClient, (prev) => ({ ...prev, [data.key]: data }));
    },
  });
}

export function useReorderCategories() {
  return useDomainMutation({
    mutationFn: categoriesApi.reorderCategories,
    invalidateKeys: [queryKeys.categories],
    applyResult: (queryClient, data) => {
      writeCategories(queryClient, () => data);
    },
  });
}

export function useDeleteCategory() {
  return useDomainMutation({
    mutationFn: categoriesApi.deleteCategory,
    invalidateKeys: [queryKeys.categories],
    applyResult: (queryClient, _data, key) => {
      writeCategories(queryClient, (prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    },
  });
}
