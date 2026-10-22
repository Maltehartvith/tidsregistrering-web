import type { QueryClient } from "@tanstack/react-query";
import type {
  AdminRoleKey,
  User,
  UserCourseWrite,
  UserStatus,
} from "../types/user";
import * as usersApi from "../api/users";
import { isStaffRole, queryKeys } from "../api/queryKeys";
import { useAuth } from "../context/AuthContext";
import {
  useDomainMutation,
  useDomainQuery,
  useQuerySetter,
} from "./queryHelpers";
import { useQueryHeld } from "./queryGate";

const EMPTY: User[] = [];

type UpdateUserInput = Partial<{
  name: string;
  email: string;
  role: AdminRoleKey;
  allCourses: boolean;
  courses: UserCourseWrite[];
  status: UserStatus;
  password: string;
}>;

function writeUsers(queryClient: QueryClient, update: (prev: User[]) => User[]) {
  queryClient.setQueriesData<User[]>({ queryKey: queryKeys.users }, (prev) => {
    if (!Array.isArray(prev)) return prev;
    return update(prev);
  });
}

export function useUsersQuery() {
  const { user } = useAuth();
  const held = useQueryHeld("users");

  return useDomainQuery({
    queryKey: queryKeys.users,
    queryFn: async () => {
      const users = await usersApi.listUsers();
      return users.filter((candidate) => isStaffRole(candidate.role));
    },
    empty: EMPTY,
    enabled: held && user?.role === "administrator",
  });
}

export function useUsersSetter() {
  return useQuerySetter<User[]>(queryKeys.users, EMPTY);
}

export function useCreateUser() {
  return useDomainMutation({
    mutationFn: usersApi.createUser,
    invalidateKeys: [queryKeys.users, queryKeys.students],
    applyResult: (queryClient, data) => {
      if (!isStaffRole(data.role)) return;
      writeUsers(queryClient, (prev) =>
        prev.some((user) => user.id === data.id) ? prev : [...prev, data],
      );
    },
  });
}

export function useUpdateUser() {
  return useDomainMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateUserInput }) =>
      usersApi.updateUser(id, input),
    invalidateKeys: [queryKeys.users],
    applyResult: (queryClient, data) => {
      writeUsers(queryClient, (prev) =>
        prev.map((user) => (user.id === data.id ? { ...user, ...data } : user)),
      );
      queryClient.setQueriesData<User | null>(
        { queryKey: [...queryKeys.users, "self"] },
        (prev) => (prev?.id === data.id ? { ...prev, ...data } : prev),
      );
    },
  });
}

export function useDeleteUser() {
  return useDomainMutation({
    mutationFn: usersApi.deleteUser,
    invalidateKeys: [queryKeys.users, queryKeys.students],
    applyResult: (queryClient, _data, id) => {
      writeUsers(queryClient, (prev) => prev.filter((user) => user.id !== id));
    },
  });
}

export function useCancelInvite() {
  return useDomainMutation({
    mutationFn: usersApi.cancelInvite,
    invalidateKeys: [queryKeys.users],
    errorMessage: "Kunne ikke annullere invitationen",
  });
}

export function useDirectoryQuery() {
  const { user } = useAuth();
  const held = useQueryHeld("directory");

  return useDomainQuery({
    queryKey: [...queryKeys.users, "directory"],
    queryFn: () => usersApi.listUsers(),
    empty: EMPTY,
    enabled: held && isStaffRole(user?.role),
  });
}

export function useResendInvite() {
  return useDomainMutation({
    mutationFn: usersApi.resendInvite,
    invalidateKeys: [],
    errorMessage: "Kunne ikke sende invitation",
  });
}

/** The signed-in person's own record, including any hold assignment. */
export function useOwnUserQuery(enabled: boolean) {
  const { user } = useAuth();

  return useDomainQuery({
    queryKey: [...queryKeys.users, "self", user?.id ?? ""],
    queryFn: async () => {
      const users = isStaffRole(user?.role)
        ? await usersApi.listUsers()
        : await usersApi.listUsers("kursist");
      return users.find((candidate) => candidate.id === user?.id) ?? null;
    },
    empty: null as User | null,
    enabled: enabled && Boolean(user),
  });
}
