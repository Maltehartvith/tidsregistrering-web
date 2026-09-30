import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./queryKeys";
import { useAuth } from "../context/AuthContext";

/** After a successful API mutation, refresh bootstrap (skipped in demo mode). */
export function useRefreshBootstrap() {
  const queryClient = useQueryClient();
  const { demoMode } = useAuth();

  return useCallback(async () => {
    if (demoMode) return;
    await queryClient.invalidateQueries({ queryKey: queryKeys.bootstrap });
  }, [demoMode, queryClient]);
}
