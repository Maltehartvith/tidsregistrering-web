import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { AdminCourseView } from "@/pages/admin/AdminCourseView";
import { AdminCatalogView } from "@/pages/admin/AdminCatalogView";
import { AdminDesignView } from "@/pages/admin/AdminDesignView";
import { AdminUsersView } from "@/pages/admin/AdminUsersView";
import { AdminStudentsView } from "@/pages/admin/AdminStudentsView";
import { LoginView } from "@/pages/login-view/LoginView";
import { InviteAcceptPage } from "@/pages/login-view/InviteAcceptPage";
import {
  RequireAuth,
  RequireGuest,
  RequireStaff,
  homeForRole,
} from "@/pages/auth/RequireAuth";
import { StudentLayout } from "@/pages/overview-view/StudentLayout";
import { OverviewTab } from "@/pages/overview-view/OverviewTab";
import { CreateEntryTab } from "@/pages/overview-view/CreateEntryTab";
import { HistoryTab } from "@/pages/overview-view/HistoryTab";
import { SettingsTab } from "@/pages/overview-view/SettingsTab";
import { routes } from "@/routes";

function FallbackRedirect() {
  const { user } = useAuth();

  return (
    <Navigate
      to={user ? homeForRole(user.role) : routes.login}
      replace
    />
  );
}

/** Declares the app route tree. Path strings live in `routes.ts`. */
export function AppRouter() {
  const navigate = useNavigate();

  const onLoggedIn = (role: Parameters<typeof homeForRole>[0]) => {
    navigate(homeForRole(role), { replace: true });
  };

  return (
    <Routes>
      <Route
        path={routes.login}
        element={
          <RequireGuest>
            <LoginView onLoggedIn={onLoggedIn} />
          </RequireGuest>
        }
      />
      <Route
        path={routes.resetPassword}
        element={
          <RequireGuest>
            <LoginView initialStep="glemt-nyt" onLoggedIn={onLoggedIn} />
          </RequireGuest>
        }
      />
      <Route path={routes.invite} element={<InviteAcceptPage />} />

      <Route
        element={
          <RequireAuth>
            <StudentLayout />
          </RequireAuth>
        }
      >
        <Route path={routes.studentOverview} element={<OverviewTab />} />
        <Route path={routes.studentCreateEntry} element={<CreateEntryTab />} />
        <Route path={routes.studentHistory} element={<HistoryTab />} />
        <Route path={routes.studentSettings} element={<SettingsTab />} />
      </Route>

      <Route
        path={routes.adminStudents}
        element={
          <RequireStaff>
            <AdminStudentsView />
          </RequireStaff>
        }
      />
      <Route
        path={routes.adminStudentDetail}
        element={
          <RequireStaff>
            <AdminStudentsView />
          </RequireStaff>
        }
      />
      <Route
        path={routes.adminCourses}
        element={
          <RequireStaff>
            <AdminCourseView />
          </RequireStaff>
        }
      />
      <Route
        path={routes.adminCatalog}
        element={
          <RequireStaff>
            <AdminCatalogView />
          </RequireStaff>
        }
      />
      <Route
        path={routes.adminDesign}
        element={
          <RequireStaff>
            <AdminDesignView />
          </RequireStaff>
        }
      />
      <Route
        path={routes.adminUsers}
        element={
          <RequireStaff>
            <AdminUsersView />
          </RequireStaff>
        }
      />

      <Route path="*" element={<FallbackRedirect />} />
    </Routes>
  );
}
