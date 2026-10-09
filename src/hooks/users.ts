import type { AdminUser, AdminRoleKey, UserStatus } from "../types/user";
import * as usersApi from "../api/users";
import { queryKeys } from "../api/queryKeys";
import { useAuth } from "../context/AuthContext";
import {
  useDomainMutation,
  useDomainQuery,
  useQuerySetter,
} from "./queryHelpers";

const EMPTY: AdminUser[] = [];

type UpdateUserInput = Partial<{
  name: string;
  email: string;
  role: AdminRoleKey;
  allCourses: boolean;
  courseIds: string[];
  status: UserStatus;
  password: string;
}>;

export function useUsersQuery() {
  const { user } = useAuth();

  return useDomainQuery({
    queryKey: queryKeys.users,
    queryFn: usersApi.listUsers,
    empty: EMPTY,
    enabled: user?.role === "administrator",
  });
}

export function useUsersSetter() {
  return useQuerySetter<AdminUser[]>(queryKeys.users, EMPTY);
}

export function useCreateUser(successMessage?: string) {
  return useDomainMutation({
    mutationFn: usersApi.createUser,
    invalidateKeys: [queryKeys.users],
    successMessage,
  });
}

export function useUpdateUser(successMessage?: string) {
  return useDomainMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateUserInput }) =>
      usersApi.updateUser(id, input),
    invalidateKeys: [queryKeys.users],
    successMessage,
  });
}

export function useDeleteUser(successMessage?: string) {
  return useDomainMutation({
    mutationFn: usersApi.deleteUser,
    invalidateKeys: [queryKeys.users],
    successMessage,
  });
}

export function useResendInvite() {
  return useDomainMutation({
    mutationFn: usersApi.resendInvite,
    invalidateKeys: [],
    errorMessage: "Kunne ikke sende invitation",
  });
}
