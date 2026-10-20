import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { CoursesPage } from "@/pages/admin/courses/CoursesPage";
import { CatalogPage } from "@/pages/admin/catalog/CatalogPage";
import { DesignPage } from "@/pages/admin/design/DesignPage";
import { UsersPage } from "@/pages/admin/users/UsersPage";
import { LoginView } from "@/pages/login-view/LoginView";
import { InviteAcceptPage } from "@/pages/login-view/InviteAcceptPage";
import {
  RequireAuth,
  RequireGuest,
  RequireRole,
  RequireStaff,
  homeForRole,
} from "@/pages/auth/RequireAuth";
import { StudentLayout } from "@/pages/overview-view/StudentLayout";
import { OverviewTab } from "@/pages/overview-view/OverviewTab";
import { CreateEntryTab } from "@/pages/overview-view/CreateEntryTab";
import { HistoryTab } from "@/pages/overview-view/HistoryTab";
import { SettingsTab } from "@/pages/overview-view/SettingsTab";
import { routes } from "@/routes";
import { StudentsPage } from "@/pages/admin/students/StudentsPage";

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
            <StudentsPage />
          </RequireStaff>
        }
      />
      <Route
        path={routes.adminStudentDetail}
        element={
          <RequireStaff>
            <StudentsPage />
          </RequireStaff>
        }
      />
      <Route
        path={routes.adminCourses}
        element={
          <RequireStaff>
            <CoursesPage />
          </RequireStaff>
        }
      />
      <Route
        path={routes.adminCatalog}
        element={
          <RequireStaff>
            <CatalogPage />
          </RequireStaff>
        }
      />
      <Route
        path={routes.adminDesign}
        element={
          <RequireRole roles={["administrator"]}>
            <DesignPage />
          </RequireRole>
        }
      />
      <Route
        path={routes.adminUsers}
        element={
          <RequireRole roles={["administrator"]}>
            <UsersPage />
          </RequireRole>
        }
      />

      <Route path="*" element={<FallbackRedirect />} />
    </Routes>
  );
}
