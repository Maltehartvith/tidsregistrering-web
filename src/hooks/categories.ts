import type { Category, CategoriesMap } from "../types/domain";
import * as categoriesApi from "../api/categories";
import { queryKeys } from "../api/queryKeys";
import {
  useDomainMutation,
  useDomainQuery,
  useQuerySetter,
} from "./queryHelpers";

const EMPTY: CategoriesMap = {};

export function useCategoriesQuery() {
  return useDomainQuery({
    queryKey: queryKeys.categories,
    queryFn: categoriesApi.listCategories,
    empty: EMPTY,
  });
}

export function useCategoriesSetter() {
  return useQuerySetter<CategoriesMap>(queryKeys.categories, EMPTY);
}

export function useCreateCategory(successMessage?: string) {
  return useDomainMutation({
    mutationFn: categoriesApi.createCategory,
    invalidateKeys: [queryKeys.categories],
    successMessage,
  });
}

export function useUpdateCategory(successMessage?: string) {
  return useDomainMutation({
    mutationFn: ({
      key,
      category,
    }: {
      key: string;
      category: Partial<Category>;
    }) => categoriesApi.updateCategory(key, category),
    invalidateKeys: [queryKeys.categories],
    successMessage,
  });
}

export function useReorderCategories(successMessage?: string) {
  return useDomainMutation({
    mutationFn: categoriesApi.reorderCategories,
    invalidateKeys: [queryKeys.categories],
    successMessage,
  });
}

export function useDeleteCategory(successMessage?: string) {
  return useDomainMutation({
    mutationFn: categoriesApi.deleteCategory,
    invalidateKeys: [queryKeys.categories],
    successMessage,
  });
}
