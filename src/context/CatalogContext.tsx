import {
  createContext,
  useCallback,
  useContext,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { CategoriesMap, ProgramsMap, Category, Program } from "../types/domain";
import { activeCategoriesOf } from "../domain/catalog";
import { useAuth } from "./AuthContext";
import { useRefreshBootstrap } from "../api/refresh";
import * as categoriesApi from "../api/categories";
import * as learningGoalsApi from "../api/learningGoals";
import * as programsApi from "../api/programs";

export interface CatalogContextValue {
  CATEGORIES: CategoriesMap;
  ALL_CATEGORIES: CategoriesMap;
  LEARNING_GOALS: string[];
  programs: ProgramsMap;
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

export function CatalogProvider({
  categories,
  learningGoals,
  programs,
  setCategories,
  setLearningGoals,
  setPrograms,
  children,
}: {
  categories: CategoriesMap;
  learningGoals: string[];
  programs: ProgramsMap;
  setCategories: Dispatch<SetStateAction<CategoriesMap>>;
  setLearningGoals: Dispatch<SetStateAction<string[]>>;
  setPrograms: Dispatch<SetStateAction<ProgramsMap>>;
  children: ReactNode;
}) {
  const { demoMode } = useAuth();
  const refresh = useRefreshBootstrap();

  const createCategory = useCallback(
    async (category: Omit<Category, "key"> & { key?: string }) => {
      if (demoMode) {
        const key = category.key || `cat${Date.now().toString(36)}`;
        const created = { ...category, key } as Category;
        setCategories((prev) => ({ ...prev, [key]: created }));
        return created;
      }
      const created = await categoriesApi.createCategory(category);
      await refresh();
      return created;
    },
    [demoMode, refresh, setCategories],
  );

  const updateCategory = useCallback(
    async (key: string, category: Partial<Category>) => {
      if (demoMode) {
        const updated = { ...categories[key], ...category, key } as Category;
        setCategories((prev) => ({ ...prev, [key]: updated }));
        return updated;
      }
      const updated = await categoriesApi.updateCategory(key, category);
      await refresh();
      return updated;
    },
    [categories, demoMode, refresh, setCategories],
  );

  const reorderCategories = useCallback(
    async (keys: string[]) => {
      if (demoMode) {
        const next: CategoriesMap = {};
        for (const key of keys) {
          if (categories[key]) next[key] = categories[key];
        }
        setCategories(next);
        return;
      }
      await categoriesApi.reorderCategories(keys);
      await refresh();
    },
    [categories, demoMode, refresh, setCategories],
  );

  const deleteCategoryFn = useCallback(
    async (key: string) => {
      if (demoMode) {
        setCategories((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
        return;
      }
      await categoriesApi.deleteCategory(key);
      await refresh();
    },
    [demoMode, refresh, setCategories],
  );

  const createLearningGoal = useCallback(
    async (text: string) => {
      if (demoMode) {
        setLearningGoals((prev) => [...prev, text]);
        return;
      }
      const goals = await learningGoalsApi.createLearningGoal(text);
      setLearningGoals(goals);
    },
    [demoMode, setLearningGoals],
  );

  const renameLearningGoal = useCallback(
    async (from: string, to: string) => {
      if (demoMode) {
        const next = learningGoals.map((g) => (g === from ? to : g));
        setLearningGoals(next);
        return next;
      }
      const goals = await learningGoalsApi.renameLearningGoal(from, to);
      setLearningGoals(goals);
      await refresh();
      return goals;
    },
    [demoMode, learningGoals, refresh, setLearningGoals],
  );

  const reorderLearningGoals = useCallback(
    async (goals: string[]) => {
      if (demoMode) {
        setLearningGoals(goals);
        return;
      }
      const next = await learningGoalsApi.reorderLearningGoals(goals);
      setLearningGoals(next);
    },
    [demoMode, setLearningGoals],
  );

  const deleteLearningGoalFn = useCallback(
    async (text: string) => {
      if (demoMode) {
        setLearningGoals((prev) => prev.filter((g) => g !== text));
        return;
      }
      const goals = await learningGoalsApi.deleteLearningGoal(text);
      setLearningGoals(goals);
    },
    [demoMode, setLearningGoals],
  );

  const createProgram = useCallback(
    async (program: Omit<Program, "id"> & { id?: string }) => {
      if (demoMode) {
        const id = program.id || `p${Date.now().toString(36)}`;
        const created = { ...program, id };
        setPrograms((prev) => ({ ...prev, [id]: created }));
        return created;
      }
      const created = await programsApi.createProgram(program);
      await refresh();
      return created;
    },
    [demoMode, refresh, setPrograms],
  );

  const updateProgram = useCallback(
    async (id: string, program: Partial<Program>) => {
      if (demoMode) {
        const updated = { ...programs[id], ...program, id };
        setPrograms((prev) => ({ ...prev, [id]: updated }));
        return updated;
      }
      const updated = await programsApi.updateProgram(id, program);
      await refresh();
      return updated;
    },
    [demoMode, programs, refresh, setPrograms],
  );

  const deleteProgramFn = useCallback(
    async (id: string) => {
      if (demoMode) {
        setPrograms((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
        return;
      }
      await programsApi.deleteProgram(id);
      await refresh();
    },
    [demoMode, refresh, setPrograms],
  );

  return (
    <CatalogContext.Provider
      value={{
        CATEGORIES: activeCategoriesOf(categories),
        ALL_CATEGORIES: categories,
        LEARNING_GOALS: learningGoals,
        programs,
        setCategories,
        setLearningGoals,
        setPrograms,
        createCategory,
        updateCategory,
        reorderCategories,
        deleteCategory: deleteCategoryFn,
        createLearningGoal,
        renameLearningGoal,
        reorderLearningGoals,
        deleteLearningGoal: deleteLearningGoalFn,
        createProgram,
        updateProgram,
        deleteProgram: deleteProgramFn,
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
