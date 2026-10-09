import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { domainQueryKeys } from "./queryKeys";

/** Invalidate all domain queries (prefer targeted keys from mutation hooks). */
export function useRefreshDomainData() {
  const queryClient = useQueryClient();

  return useCallback(async () => {
    await Promise.all(
      domainQueryKeys.map((queryKey) =>
        queryClient.invalidateQueries({ queryKey }),
      ),
    );
  }, [queryClient]);
}
