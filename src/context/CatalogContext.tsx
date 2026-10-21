import {
  createContext,
  useContext,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { CategoriesMap, EducationsMap, Category, Education } from "../types/domain";
import type { CategoryWrite } from "../api/categories";
import type { EducationWrite } from "../api/educations";
import type { MutationFeedback } from "@/types/log";
import { withFeedback } from "../hooks/queryHelpers";
import { useHoldQuery } from "@/hooks/queryGate";
import { activeCategoriesOf } from "../domain/catalog";
import {
  useCategoriesQuery,
  useCategoriesSetter,
  useCreateCategory,
  useDeleteCategory,
  useReorderCategories,
  useUpdateCategory,
} from "../hooks/categories";
import {
  useCreateLearningGoal,
  useDeleteLearningGoal,
  useLearningGoalsQuery,
  useLearningGoalsSetter,
  useRenameLearningGoal,
  useReorderLearningGoals,
} from "../hooks/learningGoals";
import {
  useCreateEducation,
  useDeleteEducation,
  useEducationsQuery,
  useEducationsSetter,
  useUpdateEducation,
} from "../hooks/educations";

export interface CatalogContextValue {
  CATEGORIES: CategoriesMap;
  ALL_CATEGORIES: CategoriesMap;
  LEARNING_GOALS: string[];
  educations: EducationsMap;
  isLoading: boolean;
  setCategories: Dispatch<SetStateAction<CategoriesMap>>;
  setLearningGoals: Dispatch<SetStateAction<string[]>>;
  setEducations: Dispatch<SetStateAction<EducationsMap>>;
  createCategory: (
    category: CategoryWrite,
    feedback?: MutationFeedback<Category> | null,
  ) => Promise<Category>;
  updateCategory: (
    key: string,
    category: Partial<CategoryWrite>,
    feedback?: MutationFeedback<Category> | null,
  ) => Promise<Category>;
  reorderCategories: (
    keys: string[],
    feedback?: MutationFeedback<CategoriesMap> | null,
  ) => Promise<void>;
  deleteCategory: (
    key: string,
    feedback?: MutationFeedback<void> | null,
  ) => Promise<void>;
  createLearningGoal: (
    text: string,
    feedback?: MutationFeedback<string[]> | null,
  ) => Promise<void>;
  renameLearningGoal: (
    from: string,
    to: string,
    feedback?: MutationFeedback<string[]> | null,
  ) => Promise<string[]>;
  reorderLearningGoals: (
    goals: string[],
    feedback?: MutationFeedback<string[]> | null,
  ) => Promise<void>;
  deleteLearningGoal: (
    text: string,
    feedback?: MutationFeedback<string[]> | null,
  ) => Promise<void>;
  createEducation: (
    education: EducationWrite,
    feedback?: MutationFeedback<Education> | null,
  ) => Promise<Education>;
  updateEducation: (
    id: string,
    education: Partial<EducationWrite>,
    feedback?: MutationFeedback<Education> | null,
  ) => Promise<Education>;
  deleteEducation: (
    id: string,
    feedback?: MutationFeedback<void> | null,
  ) => Promise<void>;
  isSaving: boolean;
}

const CatalogContext = createContext<CatalogContextValue | null>(null);

export function CatalogProvider({ children }: { children: ReactNode }) {
  const categoriesQuery = useCategoriesQuery();
  const learningGoalsQuery = useLearningGoalsQuery();
  const educationsQuery = useEducationsQuery();

  const setCategories = useCategoriesSetter();
  const setLearningGoals = useLearningGoalsSetter();
  const setEducations = useEducationsSetter();

  const createCategoryMutation = useCreateCategory();
  const updateCategoryMutation = useUpdateCategory();
  const reorderCategoriesMutation = useReorderCategories();
  const deleteCategoryMutation = useDeleteCategory();

  const createLearningGoalMutation = useCreateLearningGoal();
  const renameLearningGoalMutation = useRenameLearningGoal();
  const reorderLearningGoalsMutation = useReorderLearningGoals();
  const deleteLearningGoalMutation = useDeleteLearningGoal();

  const createEducationMutation = useCreateEducation();
  const updateEducationMutation = useUpdateEducation();
  const deleteEducationMutation = useDeleteEducation();

  const categories = categoriesQuery.data;
  const learningGoals = learningGoalsQuery.data;
  const educations = educationsQuery.data;

  return (
    <CatalogContext.Provider
      value={{
        CATEGORIES: activeCategoriesOf(categories),
        ALL_CATEGORIES: categories,
        LEARNING_GOALS: learningGoals,
        educations,
        isLoading:
          categoriesQuery.isLoading ||
          learningGoalsQuery.isLoading ||
          educationsQuery.isLoading,
        setCategories,
        setLearningGoals,
        setEducations,
        createCategory: (category, feedback) =>
          createCategoryMutation.mutateAsync(withFeedback(category, feedback)),
        updateCategory: (key, category, feedback) =>
          updateCategoryMutation.mutateAsync(
            withFeedback({ key, category }, feedback),
          ),
        reorderCategories: async (keys, feedback) => {
          await reorderCategoriesMutation.mutateAsync(
            withFeedback(keys, feedback),
          );
        },
        deleteCategory: (key, feedback) =>
          deleteCategoryMutation.mutateAsync(withFeedback(key, feedback)),
        createLearningGoal: async (text, feedback) => {
          await createLearningGoalMutation.mutateAsync(
            withFeedback(text, feedback),
          );
        },
        renameLearningGoal: (from, to, feedback) =>
          renameLearningGoalMutation.mutateAsync(
            withFeedback({ from, to }, feedback),
          ),
        reorderLearningGoals: async (goals, feedback) => {
          await reorderLearningGoalsMutation.mutateAsync(
            withFeedback(goals, feedback),
          );
        },
        deleteLearningGoal: async (text, feedback) => {
          await deleteLearningGoalMutation.mutateAsync(
            withFeedback(text, feedback),
          );
        },
        createEducation: (education, feedback) =>
          createEducationMutation.mutateAsync(
            withFeedback(education, feedback),
          ),
        updateEducation: (id, education, feedback) =>
          updateEducationMutation.mutateAsync(
            withFeedback({ id, education }, feedback),
          ),
        deleteEducation: (id, feedback) =>
          deleteEducationMutation.mutateAsync(withFeedback(id, feedback)),
        isSaving:
          createCategoryMutation.isPending ||
          updateCategoryMutation.isPending ||
          reorderCategoriesMutation.isPending ||
          deleteCategoryMutation.isPending ||
          createLearningGoalMutation.isPending ||
          renameLearningGoalMutation.isPending ||
          reorderLearningGoalsMutation.isPending ||
          deleteLearningGoalMutation.isPending ||
          createEducationMutation.isPending ||
          updateEducationMutation.isPending ||
          deleteEducationMutation.isPending,
      }}
    >
      {children}
    </CatalogContext.Provider>
  );
}

export type CatalogScope = {
  categories?: boolean;
  educations?: boolean;
  goals?: boolean;
};

export function useCatalog(scope: CatalogScope = {}) {
  useHoldQuery("categories", scope.categories === true);
  useHoldQuery("educations", scope.educations === true);
  useHoldQuery("learningGoals", scope.goals === true);
  const ctx = useContext(CatalogContext);
  if (!ctx) {
    throw new Error("useCatalog must be used within CatalogProvider");
  }
  return ctx;
}
