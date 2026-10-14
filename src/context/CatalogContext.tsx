import {
  createContext,
  useContext,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { CategoriesMap, ProgramsMap, Category, Program } from "../types/domain";
import type { MutationFeedback } from "@/types/log";
import { withFeedback } from "../hooks/queryHelpers";
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
  useCreateProgram,
  useDeleteProgram,
  useProgramsQuery,
  useProgramsSetter,
  useUpdateProgram,
} from "../hooks/programs";

export interface CatalogContextValue {
  CATEGORIES: CategoriesMap;
  ALL_CATEGORIES: CategoriesMap;
  LEARNING_GOALS: string[];
  programs: ProgramsMap;
  isLoading: boolean;
  setCategories: Dispatch<SetStateAction<CategoriesMap>>;
  setLearningGoals: Dispatch<SetStateAction<string[]>>;
  setPrograms: Dispatch<SetStateAction<ProgramsMap>>;
  createCategory: (
    category: Omit<Category, "key"> & { key?: string },
    feedback?: MutationFeedback<Category> | null,
  ) => Promise<Category>;
  updateCategory: (
    key: string,
    category: Partial<Category>,
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
  createProgram: (
    program: Omit<Program, "id"> & { id?: string },
    feedback?: MutationFeedback<Program> | null,
  ) => Promise<Program>;
  updateProgram: (
    id: string,
    program: Partial<Program>,
    feedback?: MutationFeedback<Program> | null,
  ) => Promise<Program>;
  deleteProgram: (
    id: string,
    feedback?: MutationFeedback<void> | null,
  ) => Promise<void>;
}

const CatalogContext = createContext<CatalogContextValue | null>(null);

export function CatalogProvider({ children }: { children: ReactNode }) {
  const categoriesQuery = useCategoriesQuery();
  const learningGoalsQuery = useLearningGoalsQuery();
  const programsQuery = useProgramsQuery();

  const setCategories = useCategoriesSetter();
  const setLearningGoals = useLearningGoalsSetter();
  const setPrograms = useProgramsSetter();

  const createCategoryMutation = useCreateCategory();
  const updateCategoryMutation = useUpdateCategory();
  const reorderCategoriesMutation = useReorderCategories();
  const deleteCategoryMutation = useDeleteCategory();

  const createLearningGoalMutation = useCreateLearningGoal();
  const renameLearningGoalMutation = useRenameLearningGoal();
  const reorderLearningGoalsMutation = useReorderLearningGoals();
  const deleteLearningGoalMutation = useDeleteLearningGoal();

  const createProgramMutation = useCreateProgram();
  const updateProgramMutation = useUpdateProgram();
  const deleteProgramMutation = useDeleteProgram();

  const categories = categoriesQuery.data;
  const learningGoals = learningGoalsQuery.data;
  const programs = programsQuery.data;

  return (
    <CatalogContext.Provider
      value={{
        CATEGORIES: activeCategoriesOf(categories),
        ALL_CATEGORIES: categories,
        LEARNING_GOALS: learningGoals,
        programs,
        isLoading:
          categoriesQuery.isLoading ||
          learningGoalsQuery.isLoading ||
          programsQuery.isLoading,
        setCategories,
        setLearningGoals,
        setPrograms,
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
        createProgram: (program, feedback) =>
          createProgramMutation.mutateAsync(withFeedback(program, feedback)),
        updateProgram: (id, program, feedback) =>
          updateProgramMutation.mutateAsync(
            withFeedback({ id, program }, feedback),
          ),
        deleteProgram: (id, feedback) =>
          deleteProgramMutation.mutateAsync(withFeedback(id, feedback)),
      }}
    >
      {children}
    </CatalogContext.Provider>
  );
}

export function useCatalog() {
  const ctx = useContext(CatalogContext);
  if (!ctx) {
    throw new Error("useCatalog must be used within CatalogProvider");
  }
  return ctx;
}
