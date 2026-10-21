import { useEffect, useState } from "react";
import { Outlet, useOutletContext } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useBranding } from "@/context/BrandingContext";
import { useCatalog } from "@/context/CatalogContext";
import { useCourses } from "@/context/CoursesContext";
import { BrandLogo, BrandName, AppTitle } from "@/components/brand/Brand";
import { BrandHeaderGhost } from "@/components/ui/Ghost";
import { LoadingScreen } from "@/pages/auth/RequireAuth";
import { useOwnUserQuery } from "@/hooks/users";
import { educationName } from "@/domain/totals";
import { activeCourseIds, hasCourses } from "@/domain/userCourses";
import { initialViewPrefs, syncViewPrefClasses } from "@/theme/viewPrefs";
import type { ViewPrefs } from "@/types/ui";
import type { User } from "@/types/user";
import PageWrapper from "@/components/ui/PageWrapper";

export type StudentOutletContext = {
  student: User;
  viewPrefs: ViewPrefs;
  setViewPrefs: (viewPrefs: ViewPrefs) => void;
};

export function useStudentOutlet() {
  return useOutletContext<StudentOutletContext>();
}

export { hasCourses as hasHold };

/** Shared chrome for all student tabs — resolves student once, renders `<Outlet />`. */
export function StudentLayout() {
  const { user } = useAuth();
  const ownUser = useOwnUserQuery(Boolean(user));
  const { isLoading: brandingLoading } = useBranding();
  const { educations, isLoading: catalogLoading } = useCatalog({
    educations: true,
  });
  const { courses, isLoading: coursesLoading } = useCourses();
  const [viewPrefs, setViewPrefs] = useState<ViewPrefs>(initialViewPrefs);

  useEffect(() => {
    syncViewPrefClasses(viewPrefs);
  }, [viewPrefs]);

  if (!user) return <LoadingScreen />;

  const profile = ownUser.data;
  const profileLoading = ownUser.isLoading;
  if (profileLoading && !profile) return <LoadingScreen />;

  const student = profile ?? user;
  const enrolled = hasCourses(student);
  const loggingCourses = activeCourseIds(student)
    .map((id) => courses[id])
    .filter((course) => Boolean(course));
  const course = loggingCourses[0];
  const headerLoading =
    enrolled &&
    (brandingLoading || coursesLoading || catalogLoading) &&
    loggingCourses.length === 0;

  return (
    <PageWrapper>
      {headerLoading && !course ? (
        <BrandHeaderGhost />
      ) : (
        <div className="shrink-0 px-5 pb-4.5 pt-6.5 md:px-10">
          <div className="flex flex-row justify-between items-center gap-2.5">
            <div>
              <div className="mb-0.5 font-display text-[1.75rem] font-semibold leading-tight">
                <AppTitle />
              </div>
              <div className="text-[0.8125rem] wrap-break-word text-ink-soft">
                {student.name}
                {loggingCourses.length > 0
                  ? ` · ${
                      loggingCourses.length === 1 &&
                      educationName(course, educations)
                        ? `${educationName(course, educations)} · `
                        : ""
                    }${loggingCourses.map((item) => item.label).join(", ")}`
                  : ""}
              </div>
            </div>
            <div className="flex flex-row items-center gap-2.5">
              <BrandLogo className="h-6.5 w-auto max-w-35 shrink-0 object-contain" />
              <div className="font-mono text-[0.6875rem] uppercase tracking-widest text-ink-soft">
                <BrandName />
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="h-3 w-0.5 shrink-0 rounded-sm bg-surplus" />
            <span className="stitch-line" />
          </div>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="min-h-full px-5 pb-6 pt-1 md:px-10">
          <Outlet
            context={
              {
                student,
                viewPrefs,
                setViewPrefs,
              } satisfies StudentOutletContext
            }
          />
        </div>
      </div>
    </PageWrapper>
  );
}
