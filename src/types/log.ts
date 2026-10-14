export type LogEventArgs = {
  actor: string;
  studentId?: string | null;
  courseId?: string | null;
  description: string;
};

/** Audit fields for a mutation. The actor is filled from the signed-in user's role. */
export type LogEventInput = Omit<LogEventArgs, "actor">;

export type MutationFeedback<TData = unknown> = {
  toastSuccessMessage?: string | ((data: TData) => string) | null;
  logArgs?:
    | LogEventInput
    | ((data: TData) => LogEventInput | null | undefined)
    | null;
};
