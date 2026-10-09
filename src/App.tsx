import { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import { AppRouter } from "@/AppRouter";
import { ToastProvider } from "@/components/ui/Toast";
import { AuthProvider } from "@/context/AuthContext";
import { AuditLogsProvider } from "@/context/AuditLogsContext";
import { BrandingProvider, useBranding } from "@/context/BrandingContext";
import { CatalogProvider } from "@/context/CatalogContext";
import { CoursesProvider } from "@/context/CoursesContext";
import { EntriesProvider } from "@/context/EntriesContext";
import { StudentsProvider } from "@/context/StudentsContext";
import { UsersProvider } from "@/context/UsersContext";

function DocumentTitle() {
  const { appTitle, orgName } = useBranding();
  useEffect(() => {
    document.title = `${appTitle} · ${orgName}`;
  }, [appTitle, orgName]);
  return null;
}

/** Root composition: router + auth + domain providers. */
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <BrandingProvider>
            <CatalogProvider>
              <CoursesProvider>
                <StudentsProvider>
                  <EntriesProvider>
                    <UsersProvider>
                      <AuditLogsProvider>
                        <DocumentTitle />
                        <AppRouter />
                      </AuditLogsProvider>
                    </UsersProvider>
                  </EntriesProvider>
                </StudentsProvider>
              </CoursesProvider>
            </CatalogProvider>
          </BrandingProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
