import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../../context/AuthContext.tsx";
import type { UserRole } from "../../types/user.ts";
import { homeForRole, isStaffRole } from "../../api/queryKeys.ts";
import { routes } from "../../routes.ts";

function LoadingScreen() {
  return (
    <div className="relative mx-auto flex min-h-screen max-w-107.5 flex-col bg-paper font-sans text-ink md:my-10 md:min-h-[calc(100vh-80px)] md:overflow-hidden md:rounded-3xl md:shadow-[0_24px_64px_rgba(18,57,74,0.16)]">
      <div className="mx-auto mt-15 flex max-w-85 flex-col px-6">
        <div className="text-center text-[13px] text-ink-soft">
          Indlæser…
        </div>
      </div>
    </div>
  );
}

/** Requires a session (or demo mode). */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading, demoMode } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingScreen />;
  if (demoMode) return children;
  if (!user) {
    return (
      <Navigate to={routes.login} replace state={{ from: location.pathname }} />
    );
  }
  return children;
}

/** Requires one of the given roles (demo mode bypasses). */
export function RequireRole({
  roles,
  children,
}: {
  roles: UserRole[];
  children: ReactNode;
}) {
  const { user, loading, demoMode } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingScreen />;
  if (demoMode) return children;
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
  const { user, loading, demoMode } = useAuth();

  if (loading) return <LoadingScreen />;
  if (demoMode) return children;
  if (user) {
    return <Navigate to={homeForRole(user.role)} replace />;
  }
  return children;
}

export function defaultPathForUser(
  role: UserRole | undefined,
  demoMode: boolean,
): string {
  if (demoMode) return routes.student;
  if (!role) return routes.login;
  return homeForRole(role);
}

export { LoadingScreen, isStaffRole, homeForRole };
