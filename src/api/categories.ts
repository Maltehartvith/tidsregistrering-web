import type { Category, CategoriesMap } from "../types/domain";
import { request } from "./request";

export async function createCategory(
  category: Omit<Category, "key"> & { key?: string },
): Promise<Category> {
  return request<Category>("/categories", {
    method: "POST",
    body: JSON.stringify(category),
  });
}

export async function updateCategory(
  key: string,
  category: Partial<Category>,
): Promise<Category> {
  return request<Category>(`/categories/${encodeURIComponent(key)}`, {
    method: "PATCH",
    body: JSON.stringify(category),
  });
}

export async function reorderCategories(keys: string[]): Promise<CategoriesMap> {
  return request<CategoriesMap>("/categories/order", {
    method: "PUT",
    body: JSON.stringify({ keys }),
  });
}

export async function deleteCategory(key: string): Promise<void> {
  await request(`/categories/${encodeURIComponent(key)}`, { method: "DELETE" });
}
