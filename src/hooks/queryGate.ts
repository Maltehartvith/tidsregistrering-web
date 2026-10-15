import { useEffect, useSyncExternalStore } from "react";

/** Domains that stay idle until a screen actually reads them. */
export type QueryGate =
  | "categories"
  | "learningGoals"
  | "programs"
  | "courses"
  | "students"
  | "entries"
  | "users";

const counts: Record<QueryGate, number> = {
  categories: 0,
  learningGoals: 0,
  programs: 0,
  courses: 0,
  students: 0,
  entries: 0,
  users: 0,
};

const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Keep a domain query alive while this component is mounted. */
export function useHoldQuery(gate: QueryGate, active = true) {
  useEffect(() => {
    if (!active) return;
    counts[gate] += 1;
    if (counts[gate] === 1) emit();
    return () => {
      counts[gate] -= 1;
      if (counts[gate] === 0) emit();
    };
  }, [active, gate]);
}

export function useQueryHeld(gate: QueryGate) {
  return useSyncExternalStore(
    subscribe,
    () => counts[gate] > 0,
    () => false,
  );
}
