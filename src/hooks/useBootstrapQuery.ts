import {
  useCallback,
  useEffect,
  useMemo,
  type Dispatch,
  type SetStateAction,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchBootstrap, type BootstrapPayload } from "../api/bootstrap.ts";
import { queryKeys } from "../api/queryKeys.ts";
import { useAuth } from "../context/AuthContext.tsx";
import {
  ADMIN_USERS_INITIAL,
  BRANDING_INITIAL,
  CATEGORIES_INITIAL,
  COURSES_INITIAL,
  INITIAL_ENTRIES,
  LEARNING_GOALS_INITIAL,
  PROGRAMS_INITIAL,
  STUDENTS_INITIAL,
} from "../data/seed.ts";

/** Demo-only snapshot. Authenticated users always load from the API. */
export const SEED_BOOTSTRAP: BootstrapPayload = {
  branding: BRANDING_INITIAL,
  categories: CATEGORIES_INITIAL,
  learningGoals: LEARNING_GOALS_INITIAL,
  programs: PROGRAMS_INITIAL,
  courses: COURSES_INITIAL,
  students: STUDENTS_INITIAL,
  entries: INITIAL_ENTRIES,
  adminUsers: ADMIN_USERS_INITIAL,
};

export const EMPTY_BOOTSTRAP: BootstrapPayload = {
  branding: {
    orgName: "",
    appTitle: "Timeregnskab",
    contactEmail: "",
    logo: "",
    primary: "#12394A",
    accent: "#C25A4C",
    background: "#ECEEEA",
  },
  categories: {},
  learningGoals: [],
  programs: {},
  courses: {},
  students: [],
  entries: [],
  adminUsers: [],
};

function applyUpdater<T>(current: T, updater: SetStateAction<T>): T {
  return typeof updater === "function"
    ? (updater as (prev: T) => T)(current)
    : updater;
}

export function useBootstrapQuery() {
  const { user, demoMode } = useAuth();
  const queryClient = useQueryClient();
  const enabled = Boolean(user) || demoMode;

  useEffect(() => {
    if (!demoMode) return;
    queryClient.setQueryData<BootstrapPayload>(
      queryKeys.bootstrap,
      (prev) => prev ?? SEED_BOOTSTRAP,
    );
  }, [demoMode, queryClient]);

  const query = useQuery({
    queryKey: queryKeys.bootstrap,
    queryFn: async () => {
      if (demoMode) return SEED_BOOTSTRAP;
      return fetchBootstrap();
    },
    enabled,
    staleTime: 30_000,
    retry: 1,
  });

  const data = query.data ?? (demoMode ? SEED_BOOTSTRAP : EMPTY_BOOTSTRAP);

  const patch = useCallback(
    <K extends keyof BootstrapPayload>(
      key: K,
      updater: SetStateAction<BootstrapPayload[K]>,
    ) => {
      queryClient.setQueryData<BootstrapPayload>(
        queryKeys.bootstrap,
        (prev) => {
          const base = prev ?? (demoMode ? SEED_BOOTSTRAP : EMPTY_BOOTSTRAP);
          return {
            ...base,
            [key]: applyUpdater(base[key], updater),
          };
        },
      );
    },
    [demoMode, queryClient],
  );

  const setters = useMemo(
    () => ({
      setBranding: ((u: SetStateAction<BootstrapPayload["branding"]>) =>
        patch("branding", u)) as Dispatch<
        SetStateAction<BootstrapPayload["branding"]>
      >,
      setCategories: ((u: SetStateAction<BootstrapPayload["categories"]>) =>
        patch("categories", u)) as Dispatch<
        SetStateAction<BootstrapPayload["categories"]>
      >,
      setLearningGoals: ((
        u: SetStateAction<BootstrapPayload["learningGoals"]>,
      ) => patch("learningGoals", u)) as Dispatch<
        SetStateAction<BootstrapPayload["learningGoals"]>
      >,
      setPrograms: ((u: SetStateAction<BootstrapPayload["programs"]>) =>
        patch("programs", u)) as Dispatch<
        SetStateAction<BootstrapPayload["programs"]>
      >,
      setCourses: ((u: SetStateAction<BootstrapPayload["courses"]>) =>
        patch("courses", u)) as Dispatch<
        SetStateAction<BootstrapPayload["courses"]>
      >,
      setStudents: ((u: SetStateAction<BootstrapPayload["students"]>) =>
        patch("students", u)) as Dispatch<
        SetStateAction<BootstrapPayload["students"]>
      >,
      setEntries: ((u: SetStateAction<BootstrapPayload["entries"]>) =>
        patch("entries", u)) as Dispatch<
        SetStateAction<BootstrapPayload["entries"]>
      >,
      setAdminUsers: ((u: SetStateAction<BootstrapPayload["adminUsers"]>) =>
        patch("adminUsers", u)) as Dispatch<
        SetStateAction<BootstrapPayload["adminUsers"]>
      >,
    }),
    [patch],
  );

  return {
    ...data,
    ...setters,
    isLoading: enabled && query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    ready: Boolean(query.data) || demoMode,
  };
}
