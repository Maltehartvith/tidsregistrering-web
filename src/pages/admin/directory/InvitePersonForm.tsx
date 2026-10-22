import { useState } from "react";
import { educationName } from "@/domain/totals";
import { staffCoursesWrite } from "@/domain/userCourses";
import { useActorLabel } from "@/domain/actor";
import { useCatalog } from "@/context/CatalogContext";
import { useCourses } from "@/context/CoursesContext";
import { useUsers } from "@/context/UsersContext";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import Input from "@/components/ui/Input";
import ToggleButton from "@/components/ui/ToggleButton";
import type { User, UserRole } from "@/types/user";

const inviteLabel: Record<UserRole, string> = {
  kursist: "kursist",
  underviser: "underviser",
  administrator: "administrator",
};

type InvitePersonFormProps = {
  role: UserRole;
  people: User[];
  onClose: () => void;
};

export function InvitePersonForm({ role, people, onClose }: InvitePersonFormProps) {
  const actor = useActorLabel();
  const { educations } = useCatalog({ educations: true });
  const { courses } = useCourses();
  const { createUser, isSaving } = useUsers();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [allCourses, setAllCourses] = useState(false);
  const [courseIds, setCourseIds] = useState<string[]>([]);
  const [formError, setFormError] = useState("");
  const isStudent = role === "kursist";

  const toggleCourse = (id: string) => {
    setCourseIds((current) =>
      current.includes(id) ? current.filter((courseId) => courseId !== id) : [...current, id],
    );
  };

  const sendInvite = async () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    if (!trimmedName || !trimmedEmail) {
      setFormError("Udfyld både navn og email.");
      return;
    }
    if (!allCourses && courseIds.length === 0) {
      setFormError(
        isStudent
          ? "Vælg mindst ét hold."
          : 'Vælg mindst ét hold, eller sæt "Alle hold".',
      );
      return;
    }
    if (
      people.some(
        (person) => person.email.toLowerCase() === trimmedEmail.toLowerCase(),
      )
    ) {
      setFormError("Der findes allerede en bruger med denne email.");
      return;
    }
    const courseNames = courseIds
      .map((id) => courses[id]?.label || courses[id]?.key || "hold")
      .join(", ");
    try {
      await createUser(
        {
          name: trimmedName,
          email: trimmedEmail,
          role,
          status: "invited",
          allCourses: !isStudent && allCourses,
          courses: isStudent
            ? courseIds.map((id) => ({ id, active: true, included: true }))
            : allCourses
              ? []
              : staffCoursesWrite(courseIds),
        },
        {
          toastSuccessMessage: `Invitation sendt til ${trimmedEmail}`,
          logArgs: {
            description: `${actor} inviterede ${trimmedName} som ${inviteLabel[role]}${
              allCourses && !isStudent ? " med adgang til alle hold" : ` på ${courseNames}`
            }`,
          },
        },
      );
      onClose();
    } catch {
      /* mutationen viser allerede fejl-toast */
    }
  };

  return (
    <div className="mb-4 rounded-lg border border-border bg-card p-4">
      <div className="mb-3 text-sm font-semibold">
        Inviter {inviteLabel[role]}
      </div>
      <div className="flex flex-col gap-3 md:flex-row">
        <Field label="Navn" className="mb-3.5 flex-1">
          <Input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Fulde navn"
          />
        </Field>
        <Field label="Email" className="mb-3.5 flex-1">
          <Input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="navn@email.dk"
          />
        </Field>
      </div>
      <Field label={isStudent ? "Hold" : "Adgang til hold"}>
        {!isStudent && (
          <ToggleButton
            label="Alle hold (nuværende og fremtidige)"
            checked={allCourses}
            onChange={setAllCourses}
            className={`flex cursor-pointer items-center justify-between text-[13px] font-semibold ${allCourses ? "mb-0" : "mb-2.5"}`}
          />
        )}
        {(isStudent || !allCourses) && (
          <div className="flex flex-col gap-2 rounded-sm border-[1.5px] border-border bg-card px-3 py-2.5">
            {Object.values(courses).map((course) => (
              <label
                key={course.id}
                className="flex cursor-pointer items-center gap-2 text-[13px] text-ink"
              >
                <input
                  type="checkbox"
                  checked={courseIds.includes(course.id)}
                  onChange={() => toggleCourse(course.id)}
                />
                <span>
                  {course.label}
                  {educationName(course, educations)
                    ? ` · ${educationName(course, educations)}`
                    : ""}
                </span>
              </label>
            ))}
          </div>
        )}
      </Field>
      {formError && (
        <div className="-mt-1.5 mb-3 text-xs text-[#a14b36]">{formError}</div>
      )}
      <div className="mt-4 flex gap-2">
        <Button variant="secondary" className="flex-1" onClick={onClose}>
          Annuller
        </Button>
        <Button
          variant="primary"
          className="flex-1"
          onClick={sendInvite}
          disabled={isSaving}
          aria-busy={isSaving}
        >
          {isSaving ? "Sender…" : "Send invitation"}
        </Button>
      </div>
    </div>
  );
}
