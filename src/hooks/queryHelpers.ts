import { useCallback, type SetStateAction } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
  type QueryKey,
} from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/ui/Toast";
import { useAuditLogs } from "@/context/AuditLogsContext";
import { actorLabel } from "@/domain/actor";
import type { LogEventInput, MutationFeedback } from "@/types/log";

export type MutationCall<
  TPayload,
  TData = unknown,
> = MutationFeedback<TData> & {
  payload: TPayload;
};

export function withFeedback<TPayload, TData = unknown>(
  payload: TPayload,
  feedback?: MutationFeedback<TData> | null,
): MutationCall<TPayload, TData> {
  return {
    payload,
    toastSuccessMessage: feedback?.toastSuccessMessage,
    logArgs: feedback?.logArgs,
  };
}

function resolveMessage<TData>(
  successMessage: MutationFeedback<TData>["toastSuccessMessage"],
  data: TData,
): string | null {
  if (!successMessage) return null;
  const message =
    typeof successMessage === "function"
      ? successMessage(data)
      : successMessage;
  return message || null;
}

function resolveLogArgs<TData>(
  logArgs: MutationFeedback<TData>["logArgs"],
  data: TData,
): LogEventInput | null {
  if (!logArgs) return null;
  const resolved = typeof logArgs === "function" ? logArgs(data) : logArgs;
  return resolved ?? null;
}

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
  const active = Boolean(user) && (enabled ?? true);

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

type DomainMutationOptions<TData, TPayload> = {
  mutationFn: (payload: TPayload) => Promise<TData>;
  invalidateKeys: QueryKey[];
  errorMessage?: string;
  /** Write the mutation result into the cache before the lists refetch. */
  applyResult?: (
    queryClient: QueryClient,
    data: TData,
    payload: TPayload,
  ) => void;
};

export function useDomainMutation<TData, TPayload>({
  mutationFn,
  invalidateKeys,
  errorMessage = "Noget gik galt",
  applyResult,
}: DomainMutationOptions<TData, TPayload>) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { logEvent } = useAuditLogs();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ payload }: MutationCall<TPayload, TData>) => {
      const data = await mutationFn(payload);
      applyResult?.(queryClient, data, payload);
      await Promise.all(
        invalidateKeys.map((queryKey) =>
          queryClient.invalidateQueries({ queryKey }),
        ),
      );
      return data;
    },
    onSuccess: (data, variables) => {
      const message = resolveMessage(variables.toastSuccessMessage, data);
      if (message) showToast(message, 2200, "success");
      const logArgs = resolveLogArgs(variables.logArgs, data);
      if (logArgs) {
        void logEvent({ actor: actorLabel(user?.role), ...logArgs });
      }
    },
    onError: (err: Error) => {
      showToast(err.message || errorMessage, 3000, "error");
    },
  });
}

/** Toast and audit log for an action that is not a single mutation, such as a batch. */
export function useActionFeedback() {
  const { showToast } = useToast();
  const { logEvent } = useAuditLogs();
  const { user } = useAuth();

  return useCallback(
    (feedback?: MutationFeedback | null) => {
      const message = resolveMessage(feedback?.toastSuccessMessage, undefined);
      if (message) showToast(message, 2200, "success");
      const logArgs = resolveLogArgs(feedback?.logArgs, undefined);
      if (logArgs) {
        void logEvent({ actor: actorLabel(user?.role), ...logArgs });
      }
    },
    [logEvent, showToast, user?.role],
  );
}
