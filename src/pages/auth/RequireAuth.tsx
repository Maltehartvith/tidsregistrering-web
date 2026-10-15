import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../../context/AuthContext.tsx";
import type { UserRole } from "../../types/user.ts";
import { homeForRole, isStaffRole } from "../../api/queryKeys.ts";
import { routes } from "../../routes.ts";
import Spinner from "@/components/ui/Spinner.tsx";
import PageWrapper from "@/components/ui/PageWrapper.tsx";

function LoadingScreen() {
  return (
    <PageWrapper ghostNav>
      <div className="mx-auto my-auto flex max-w-85 flex-row items-center gap-2 px-6 py-10">
        <div className="text-center text-xl text-ink-soft">Indlæser…</div>
        <Spinner size={10} />
      </div>
    </PageWrapper>
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
