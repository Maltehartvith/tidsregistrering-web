import {
  createContext,
  useContext,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { AdminUser, AdminRoleKey, UserStatus } from "../types/user";
import type { MutationFeedback } from "@/types/log";
import { withFeedback } from "../hooks/queryHelpers";
import {
  useCreateUser,
  useDeleteUser,
  useResendInvite,
  useUpdateUser,
  useUsersQuery,
  useUsersSetter,
} from "../hooks/users";

type CreatedUser = AdminUser & { inviteToken?: string; mailPreview?: boolean };
type UpdateUserInput = Partial<{
  name: string;
  email: string;
  role: AdminRoleKey;
  allCourses: boolean;
  courseIds: string[];
  status: UserStatus;
  password: string;
}>;
type InviteResult = { ok: boolean; inviteToken?: string; mailPreview?: boolean };

export interface UsersContextValue {
  adminUsers: AdminUser[];
  isLoading: boolean;
  setAdminUsers: Dispatch<SetStateAction<AdminUser[]>>;
  createUser: (
    input: {
      name: string;
      email: string;
      role: AdminRoleKey;
      allCourses?: boolean;
      courseIds?: string[];
      password?: string;
      status?: UserStatus;
    },
    feedback?: MutationFeedback<CreatedUser> | null,
  ) => Promise<CreatedUser>;
  updateUser: (
    id: string,
    input: UpdateUserInput,
    feedback?: MutationFeedback<AdminUser> | null,
  ) => Promise<AdminUser>;
  deleteUser: (
    id: string,
    feedback?: MutationFeedback<void> | null,
  ) => Promise<void>;
  resendInvite: (
    id: string,
    feedback?: MutationFeedback<InviteResult> | null,
  ) => Promise<InviteResult>;
}

const UsersContext = createContext<UsersContextValue | null>(null);

export function UsersProvider({ children }: { children: ReactNode }) {
  const { data: adminUsers, isLoading } = useUsersQuery();
  const setAdminUsers = useUsersSetter();
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const deleteMutation = useDeleteUser();
  const resendMutation = useResendInvite();

  return (
    <UsersContext.Provider
      value={{
        adminUsers,
        isLoading,
        setAdminUsers,
        createUser: (input, feedback) =>
          createMutation.mutateAsync(withFeedback(input, feedback)),
        updateUser: (id, input, feedback) =>
          updateMutation.mutateAsync(withFeedback({ id, input }, feedback)),
        deleteUser: (id, feedback) =>
          deleteMutation.mutateAsync(withFeedback(id, feedback)),
        resendInvite: (id, feedback) =>
          resendMutation.mutateAsync(withFeedback(id, feedback)),
      }}
    >
      {children}
    </UsersContext.Provider>
  );
}

export function useUsers() {
  const ctx = useContext(UsersContext);
  if (!ctx) {
    throw new Error("useUsers must be used within UsersProvider");
  }
  return ctx;
}
