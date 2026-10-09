import {
  createContext,
  useContext,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { CategoriesMap, ProgramsMap, Category, Program } from "../types/domain";
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
  ) => Promise<Category>;
  updateCategory: (key: string, category: Partial<Category>) => Promise<Category>;
  reorderCategories: (keys: string[]) => Promise<void>;
  deleteCategory: (key: string) => Promise<void>;
  createLearningGoal: (text: string) => Promise<void>;
  renameLearningGoal: (from: string, to: string) => Promise<string[]>;
  reorderLearningGoals: (goals: string[]) => Promise<void>;
  deleteLearningGoal: (text: string) => Promise<void>;
  createProgram: (
    program: Omit<Program, "id"> & { id?: string },
  ) => Promise<Program>;
  updateProgram: (id: string, program: Partial<Program>) => Promise<Program>;
  deleteProgram: (id: string) => Promise<void>;
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
        createCategory: (category) =>
          createCategoryMutation.mutateAsync(category),
        updateCategory: (key, category) =>
          updateCategoryMutation.mutateAsync({ key, category }),
        reorderCategories: async (keys) => {
          await reorderCategoriesMutation.mutateAsync(keys);
        },
        deleteCategory: (key) => deleteCategoryMutation.mutateAsync(key),
        createLearningGoal: async (text) => {
          await createLearningGoalMutation.mutateAsync(text);
        },
        renameLearningGoal: (from, to) =>
          renameLearningGoalMutation.mutateAsync({ from, to }),
        reorderLearningGoals: async (goals) => {
          await reorderLearningGoalsMutation.mutateAsync(goals);
        },
        deleteLearningGoal: async (text) => {
          await deleteLearningGoalMutation.mutateAsync(text);
        },
        createProgram: (program) => createProgramMutation.mutateAsync(program),
        updateProgram: (id, program) =>
          updateProgramMutation.mutateAsync({ id, program }),
        deleteProgram: (id) => deleteProgramMutation.mutateAsync(id),
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
