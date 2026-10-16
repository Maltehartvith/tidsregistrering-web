import { useState } from "react";
import { useCourses } from "@/context/CoursesContext";
import { useStudents } from "@/context/StudentsContext";
import AdminPageWrapper from "@/pages/admin/components/AdminPageWrapper";
import { ProgramsSection } from "@/pages/admin/courses/components/ProgramsSection";
import { CreateCourseForm } from "@/pages/admin/courses/components/CreateCourseForm";
import { CourseCard } from "@/pages/admin/courses/components/CourseCard";
import { GhostBlock } from "@/components/ui/Ghost";

export function CoursesPage() {
  const { courses, isLoading: isCoursesLoading } = useCourses();
  const { isLoading: isStudentsLoading } = useStudents();
  const isLoading = isCoursesLoading || isStudentsLoading;
  const [openCourseId, setOpenCourseId] = useState<string | null>(null);

  const toggleCourse = (courseId: string) =>
    setOpenCourseId(openCourseId === courseId ? null : courseId);

  return (
    <AdminPageWrapper
      title="Hold-administration"
      subtitle="Opret hold, tilføj kursister og overfør timer"
    >
      <ProgramsSection
        openCourseId={openCourseId}
        onToggleCourse={toggleCourse}
      />

      <div
        className="mt-4 flex items-center gap-2"
        style={{ margin: "16px 0" }}
      >
        <span className="stitch-line" />
      </div>

      <CreateCourseForm
        onStartCreate={() => setOpenCourseId(null)}
        onCreated={setOpenCourseId}
      />

      <p className="mb-3.5 text-[13px] leading-normal text-ink-soft">
        Når en hel årgang fortsætter under et nyt holdnavn, kan I her overføre
        timer for alle kursister i holdet på én gang, i stedet for at gøre det
        enkeltvis. Kun hold oprettet inden for 5 år vises som kilde, da
        uddannelsen forløber over op til 5 år. Er der ved en fejl blevet
        overført fra et forkert hold, kan overførslen fjernes helt igen —
        timerne trækkes automatisk ud af regnskabet.
      </p>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 10 }).map((_, index) => (
            <div key={index}>
              <GhostBlock className="h-16 w-full rounded-lg!" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {Object.values(courses).map((h) => (
            <CourseCard
              key={h.id}
              courseId={h.id}
              isOpen={openCourseId === h.id}
              onToggle={() => toggleCourse(h.id)}
            />
          ))}
        </>
      )}
    </AdminPageWrapper>
  );
}
