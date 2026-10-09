import {
  useCallback,
  type SetStateAction,
} from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryKey,
} from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/ui/Toast";

export function applyUpdater<T>(current: T, updater: SetStateAction<T>): T {
  return typeof updater === "function"
    ? (updater as (prev: T) => T)(current)
    : updater;
}

export function useQuerySetter<T>(queryKey: QueryKey, fallback: T) {
  const queryClient = useQueryClient();
  return useCallback(
    (updater: SetStateAction<T>) => {
      queryClient.setQueryData<T>(queryKey, (prev) =>
        applyUpdater(prev ?? fallback, updater),
      );
    },
    [fallback, queryClient, queryKey],
  );
}

type DomainQueryOptions<T> = {
  queryKey: QueryKey;
  queryFn: () => Promise<T>;
  empty: T;
  enabled?: boolean;
};

export function useDomainQuery<T>({
  queryKey,
  queryFn,
  empty,
  enabled,
}: DomainQueryOptions<T>) {
  const { user } = useAuth();
  const active = enabled ?? Boolean(user);

  const query = useQuery({
    queryKey,
    queryFn,
    enabled: active,
    staleTime: 30_000,
    retry: 1,
  });

  return {
    data: query.data ?? empty,
    isLoading: active && query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isFetching: query.isFetching,
  };
}

type DomainMutationOptions<TData, TVariables> = {
  mutationFn: (variables: TVariables) => Promise<TData>;
  invalidateKeys: QueryKey[];
  successMessage?: string | ((data: TData, variables: TVariables) => string);
  errorMessage?: string;
};

export function useDomainMutation<TData, TVariables>({
  mutationFn,
  invalidateKeys,
  successMessage,
  errorMessage = "Noget gik galt",
}: DomainMutationOptions<TData, TVariables>) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn,
    onSuccess: (data, variables) => {
      for (const key of invalidateKeys) {
        void queryClient.invalidateQueries({ queryKey: key });
      }
      if (successMessage) {
        const msg =
          typeof successMessage === "function"
            ? successMessage(data, variables)
            : successMessage;
        showToast(msg, 2200, "success");
      }
    },
    onError: (err: Error) => {
      showToast(err.message || errorMessage, 3000, "error");
    },
  });
}
