import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../../context/AuthContext.tsx";
import type { UserRole } from "../../types/user.ts";
import { homeForRole, isStaffRole } from "../../api/queryKeys.ts";
import { routes } from "../../routes.ts";
import Spinner from "@/components/ui/Spinner.tsx";

function LoadingScreen() {
  return (
    //todo: kom tilbage når vi har lavet en ordenlig wrapper om siden
    <div className="relative mx-auto flex min-h-screen max-w-107.5 flex-col bg-paper font-sans text-ink md:my-10 md:min-h-[calc(100vh-80px)] md:overflow-hidden md:rounded-3xl md:shadow-[0_24px_64px_rgba(18,57,74,0.16)]">
      <div className="mx-auto my-auto flex max-w-85 flex-row gap-2 px-6 py-10 items-center">
        <div className="text-center text-xl text-ink-soft">Indlæser…</div>
        <Spinner size={10} />
      </div>
    </div>
  );
}

/** Requires a session. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingScreen />;
  if (!user) {
    return (
      <Navigate to={routes.login} replace state={{ from: location.pathname }} />
    );
  }
  return children;
}

/** Requires one of the given roles. */
export function RequireRole({
  roles,
  children,
}: {
  roles: UserRole[];
  children: ReactNode;
}) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingScreen />;
  if (!user) {
    return (
      <Navigate to={routes.login} replace state={{ from: location.pathname }} />
    );
  }
  if (!roles.includes(user.role)) {
    return <Navigate to={homeForRole(user.role)} replace />;
  }
  return children;
}

/** Staff-only admin area. */
export function RequireStaff({ children }: { children: ReactNode }) {
  return (
    <RequireRole roles={["underviser", "administrator"]}>
      {children}
    </RequireRole>
  );
}

/** Guest-only login page — redirect signed-in users home. */
export function RequireGuest({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (user) {
    return <Navigate to={homeForRole(user.role)} replace />;
  }
  return children;
}

export function defaultPathForUser(role: UserRole | undefined): string {
  if (!role) return routes.login;
  return homeForRole(role);
}

export { LoadingScreen, isStaffRole, homeForRole };
