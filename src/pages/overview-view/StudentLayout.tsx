import { useEffect, useState } from "react";
import { Outlet, useOutletContext } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useBranding } from "@/context/BrandingContext";
import { useCatalog } from "@/context/CatalogContext";
import { useCourses } from "@/context/CoursesContext";
import { useStudents } from "@/context/StudentsContext";
import { BrandLogo, BrandName, AppTitle } from "@/components/brand/Brand";
import { BottomNavigation } from "@/components/nav/BottomNavigation";
import { BrandHeaderGhost } from "@/components/ui/Ghost";
import { LoadingScreen } from "@/pages/auth/RequireAuth";
import { programName } from "@/domain/totals";
import { initialViewPrefs, syncViewPrefClasses } from "@/theme/viewPrefs";
import type { ViewPrefs } from "@/types/ui";
import type { Student } from "@/types/user";

export type StudentOutletContext = {
  student: Student;
  viewPrefs: ViewPrefs;
  setViewPrefs: (viewPrefs: ViewPrefs) => void;
};

export function useStudentOutlet() {
  return useOutletContext<StudentOutletContext>();
}

/** Shared chrome for all student tabs — resolves student once, renders `<Outlet />`. */
export function StudentLayout() {
  const { user } = useAuth();
  const { students, isLoading: studentsLoading } = useStudents();
  const { isLoading: brandingLoading } = useBranding();
  const { programs, isLoading: catalogLoading } = useCatalog();
  const { courses, isLoading: coursesLoading } = useCourses();
  const [viewPrefs, setViewPrefs] = useState<ViewPrefs>(initialViewPrefs);

  useEffect(() => {
    syncViewPrefClasses(viewPrefs);
  }, [viewPrefs]);

  const studentId = user?.studentId || "";
  const student = students.find((s) => s.id === studentId);

  if (studentsLoading && !student) {
    return <LoadingScreen />;
  }
  if (!student) {
    return <LoadingScreen />;
  }

  const course = courses[student.courseId];
  const headerLoading = brandingLoading || coursesLoading || catalogLoading;

  return (
    <div className="relative mx-auto flex min-h-dvh max-w-107.5 flex-col bg-paper font-sans text-ink md:my-10 md:min-h-[calc(100dvh-5rem)] md:overflow-hidden md:rounded-3xl md:shadow-[0_24px_64px_rgba(18,57,74,0.16)]">
      {headerLoading && !course ? (
        <BrandHeaderGhost />
      ) : (
        <div className="px-5 pb-4.5 pt-6.5">
          <div className="flex items-center gap-2.5">
            <BrandLogo className="h-6.5 w-auto max-w-35 shrink-0 object-contain" />
            <div className="font-mono text-[0.6875rem] uppercase tracking-widest text-ink-soft">
              <BrandName />
            </div>
          </div>
          <div className="mt-2">
            <div className="mb-0.5 font-display text-[1.75rem] font-semibold leading-tight">
              <AppTitle />
            </div>
            <div className="text-[0.8125rem] text-ink-soft">
              {student.name}
              {course
                ? ` · ${
                    programName(course, programs)
                      ? `${programName(course, programs)} · `
                      : ""
                  }${course.label}`
                : ""}
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="h-3 w-0.5 shrink-0 rounded-sm bg-surplus" />
            <span className="stitch-line" />
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-5 pb-25 pt-1">
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

      <BottomNavigation />
    </div>
  );
}
