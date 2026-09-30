import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { CatalogProvider } from "@/context/CatalogContext.tsx";
import { BrandingProvider } from "@/context/BrandingContext.tsx";
import { CoursesProvider } from "@/context/CoursesContext.tsx";
import { StudentsProvider } from "@/context/StudentsContext.tsx";
import { EntriesProvider } from "@/context/EntriesContext.tsx";
import { UsersProvider } from "@/context/UsersContext.tsx";
import { AuditLogsProvider } from "@/context/AuditLogsContext.tsx";
import { useAuth } from "@/context/AuthContext.tsx";
import { useStudents } from "@/context/StudentsContext.tsx";
import { initialViewPrefs } from "@/theme/viewPrefs.ts";
import { ViewPrefs } from "@/types/ui.ts";

import { StudentView } from "@/pages/kursist/StudentView";
import { AdminCourseView } from "@/pages/admin/AdminCourseView";
import { AdminCatalogView } from "@/pages/admin/AdminCatalogView.tsx";
import { AdminDesignView } from "@/pages/admin/AdminDesignView.tsx";
import { AdminUsersView } from "@/pages/admin/AdminUsersView.tsx";
import { AdminStudentsView } from "@/pages/admin/AdminStudentsView.tsx";
import { AuthFlow } from "@/pages/auth/AuthFlow.tsx";
import { InviteAcceptPage } from "@/pages/auth/InviteAcceptPage.tsx";
import {
  LoadingScreen,
  RequireAuth,
  RequireGuest,
  RequireStaff,
  homeForRole,
} from "@/pages/auth/RequireAuth.tsx";
import { DemoSwitcher } from "@/pages/dev/DemoSwitcher.tsx";
import { useBootstrapQuery } from "@/hooks/useBootstrapQuery.ts";
import { routes } from "@/routes.ts";

function StudentRoute({
  viewPrefs,
  setViewPrefs,
}: {
  viewPrefs: ViewPrefs;
  setViewPrefs: (viewPrefs: ViewPrefs) => void;
}) {
  const { user } = useAuth();
  const { students } = useStudents();
  const studentId = user?.studentId || (import.meta.env.DEV ? "k1" : "");
  const currentStudent =
    students.find((s) => s.id === studentId) || students[0];

  if (!currentStudent) {
    return <LoadingScreen />;
  }
  return (
    <StudentView
      student={currentStudent}
      viewPrefs={viewPrefs}
      setViewPrefs={setViewPrefs}
    />
  );
}

export const TimeregistreringApp = () => {
  const { user, logout, demoMode, setDemoMode } = useAuth();
  const navigate = useNavigate();
  const bootstrap = useBootstrapQuery();
  const [viewPrefs, setViewPrefs] = useState<ViewPrefs>(initialViewPrefs);

  const {
    branding,
    setBranding,
    categories,
    setCategories,
    learningGoals,
    setLearningGoals,
    programs,
    setPrograms,
    courses,
    setCourses,
    students,
    setStudents,
    entries,
    setEntries,
    adminUsers,
    setAdminUsers,
    isLoading: bootstrapping,
    isError: bootstrapError,
    ready,
  } = bootstrap;

  useEffect(() => {
    document.title = `${branding.appTitle} · ${branding.orgName}`;
  }, [branding.appTitle, branding.orgName]);

  const needsBootstrap = Boolean(user) || demoMode;

  // Only wait for bootstrap when logged in (or demo). Guests should see login
  // immediately after /auth/me returns — bootstrap query is disabled until then.
  if (needsBootstrap && (bootstrapping || (!ready && !bootstrapError))) {
    return <LoadingScreen />;
  }

  if (needsBootstrap && bootstrapError && !demoMode) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center text-sm text-ink-soft">
        Kunne ikke hente data fra serveren. Genindlæs siden eller log ind igen.
      </div>
    );
  }

  const authenticated = needsBootstrap;

  return (
    <CatalogProvider
      categories={categories}
      learningGoals={learningGoals}
      programs={programs}
      setCategories={setCategories}
      setLearningGoals={setLearningGoals}
      setPrograms={setPrograms}
    >
      <BrandingProvider branding={branding} setBranding={setBranding}>
        <CoursesProvider courses={courses} setCourses={setCourses}>
          <StudentsProvider students={students} setStudents={setStudents}>
            <EntriesProvider entries={entries} setEntries={setEntries}>
              <UsersProvider
                adminUsers={adminUsers}
                setAdminUsers={setAdminUsers}
              >
                <AuditLogsProvider>
                  <div>
                    <DemoSwitcher />
                    {import.meta.env.DEV && authenticated && (
                      <div className="sticky top-10 z-20 mx-auto flex max-w-107.5 justify-center gap-1.5 border-b border-border bg-[#f4f3ee] p-2">
                        <button
                          type="button"
                          className="cursor-pointer rounded-full border border-border bg-card px-2.5 py-1 font-mono text-[10px] tracking-[0.04em] text-ink-soft"
                          onClick={() => {
                            setDemoMode(false);
                            void logout();
                            navigate(routes.login);
                          }}
                        >
                          LOG UD {user ? `(${user.email})` : "(demo)"}
                        </button>
                      </div>
                    )}
                    <Routes>
                      <Route
                        path={routes.login}
                        element={
                          <RequireGuest>
                            <AuthFlow
                              onLoggedIn={(role) => {
                                setDemoMode(false);
                                navigate(homeForRole(role), { replace: true });
                              }}
                              onContinueDemo={() => {
                                setDemoMode(true);
                                navigate(routes.student);
                              }}
                            />
                          </RequireGuest>
                        }
                      />
                      <Route
                        path={routes.resetPassword}
                        element={
                          <RequireGuest>
                            <AuthFlow
                              initialStep="glemt-nyt"
                              onLoggedIn={(role) => {
                                setDemoMode(false);
                                navigate(homeForRole(role), { replace: true });
                              }}
                            />
                          </RequireGuest>
                        }
                      />
                      <Route
                        path={routes.invite}
                        element={<InviteAcceptPage />}
                      />

                      <Route
                        path={routes.student}
                        element={
                          <RequireAuth>
                            <StudentRoute
                              viewPrefs={viewPrefs}
                              setViewPrefs={setViewPrefs}
                            />
                          </RequireAuth>
                        }
                      />

                      <Route
                        path={routes.adminStudents}
                        element={
                          <RequireStaff>
                            <AdminStudentsView />
                          </RequireStaff>
                        }
                      />
                      <Route
                        path="/admin/students/:studentId"
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
                      <Route
                        path="*"
                        element={
                          <Navigate
                            to={
                              authenticated
                                ? user
                                  ? homeForRole(user.role)
                                  : routes.student
                                : routes.login
                            }
                            replace
                          />
                        }
                      />
                    </Routes>
                  </div>
                </AuditLogsProvider>
              </UsersProvider>
            </EntriesProvider>
          </StudentsProvider>
        </CoursesProvider>
      </BrandingProvider>
    </CatalogProvider>
  );
};
