import { useEffect, useState } from "react";
import { Outlet, useNavigate, useOutletContext } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useBranding } from "@/context/BrandingContext";
import { useCatalog } from "@/context/CatalogContext";
import { useCourses } from "@/context/CoursesContext";
import { useStudents } from "@/context/StudentsContext";
import { BrandLogo, BrandName, AppTitle } from "@/components/brand/Brand";
import { BrandHeaderGhost } from "@/components/ui/Ghost";
import { Button } from "@/components/ui/Button";
import { LoadingScreen, isStaffRole } from "@/pages/auth/RequireAuth";
import { programName } from "@/domain/totals";
import { initialViewPrefs, syncViewPrefClasses } from "@/theme/viewPrefs";
import type { ViewPrefs } from "@/types/ui";
import type { Student } from "@/types/user";
import PageWrapper from "@/components/ui/PageWrapper";
import { routes } from "@/routes";

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
  const navigate = useNavigate();
  const { students, isLoading: studentsLoading, selectedStudent } =
    useStudents();
  const { isLoading: brandingLoading } = useBranding();
  const { programs, isLoading: catalogLoading } = useCatalog();
  const { courses, isLoading: coursesLoading } = useCourses();
  const [viewPrefs, setViewPrefs] = useState<ViewPrefs>(initialViewPrefs);
  const staff = isStaffRole(user?.role);

  useEffect(() => {
    syncViewPrefClasses(viewPrefs);
  }, [viewPrefs]);

  const ownStudent = students.find((s) => s.id === user?.studentId);
  const previewStudent =
    selectedStudent && students.some((s) => s.id === selectedStudent.id)
      ? selectedStudent
      : students[0];
  const student = ownStudent ?? (staff ? previewStudent : undefined);

  if (studentsLoading && !student) {
    return <LoadingScreen />;
  }
  if (!student) {
    return (
      <PageWrapper>
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-10 text-center">
          <p className="text-sm text-ink-soft">
            {staff
              ? "Ingen kursist at vise."
              : "Vi kunne ikke finde din kursistprofil."}
          </p>
          {staff && (
            <Button
              variant="secondary"
              onClick={() => navigate(routes.adminStudents)}
            >
              Tilbage til administration
            </Button>
          )}
        </div>
      </PageWrapper>
    );
  }

  const course = courses[student.courseId];
  const headerLoading = brandingLoading || coursesLoading || catalogLoading;

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
                {course
                  ? ` · ${
                      programName(course, programs)
                        ? `${programName(course, programs)} · `
                        : ""
                    }${course.label}`
                  : ""}
              </div>
              {staff && (
                <Button
                  variant="link"
                  className="mt-1"
                  onClick={() => navigate(routes.adminStudents)}
                >
                  Tilbage til administration
                </Button>
              )}
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
