import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { SessionUser } from "../types/user.ts";
import * as api from "../api/auth.ts";
import { queryKeys } from "../api/queryKeys.ts";

interface AuthContextValue {
  user: SessionUser | null;
  loading: boolean;
  demoMode: boolean;
  setDemoMode: (value: boolean) => void;
  login: (
    email: string,
    password: string,
    rememberMe?: boolean,
  ) => Promise<SessionUser>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  demoMode: false,
  setDemoMode: () => {},
  login: async () => {
    throw new Error("AuthProvider missing");
  },
  logout: async () => {},
  refresh: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [demoMode, setDemoMode] = useState(false);

  const meQuery = useQuery({
    queryKey: queryKeys.me,
    queryFn: api.getMe,
    staleTime: 60_000,
    retry: false,
  });

  const login = useCallback(
    async (email: string, password: string, rememberMe = true) => {
      const user = await api.login(email, password, rememberMe);
      setDemoMode(false);
      queryClient.setQueryData(queryKeys.me, user);
      return user;
    },
    [queryClient],
  );

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } finally {
      setDemoMode(false);
      queryClient.setQueryData(queryKeys.me, null);
      queryClient.removeQueries({ queryKey: queryKeys.bootstrap });
    }
  }, [queryClient]);

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.me });
  }, [queryClient]);

  const user = meQuery.data ?? null;

  return (
    <AuthContext.Provider
      value={{
        user: demoMode ? null : user,
        loading: meQuery.isLoading,
        demoMode,
        setDemoMode,
        login,
        logout,
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
