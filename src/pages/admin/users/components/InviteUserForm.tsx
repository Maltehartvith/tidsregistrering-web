import { useState } from "react";
import { PlusCircle, ChevronDown, User } from "lucide-react";
import { programName } from "@/domain/totals";
import { ADMIN_ROLES } from "@/data/constants";
import { Field } from "@/components/ui/Field";
import ToggleButton from "@/components/ui/ToggleButton";
import { useCatalog } from "@/context/CatalogContext";
import { useCourses } from "@/context/CoursesContext";
import { useUsers } from "@/context/UsersContext";
import { AdminRoleKey } from "@/types/user";
import { useActorLabel } from "@/domain/actor";
import { staffCoursesWrite } from "@/domain/userCourses";
import SectionHeader from "../../components/SectionHeader";
import { Button } from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Selector } from "@/components/ui/Selector";

export function InviteUserForm() {
  const actor = useActorLabel();
  const { programs } = useCatalog({ programs: true });
  const { courses } = useCourses();
  const { adminUsers, createUser, isSaving } = useUsers();
  const [showInvite, setShowInvite] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("underviser");
  const [allCourses, setAllHolds] = useState(false);
  const [courseIds, setHoldIds] = useState<string[]>([]);
  const [formError, setFormError] = useState("");

  const resetForm = () => {
    setName("");
    setEmail("");
    setRole("underviser");
    setAllHolds(false);
    setHoldIds([]);
    setFormError("");
  };

  const toggleHold = (id: string) => {
    setHoldIds((prev) =>
      prev.includes(id) ? prev.filter((h) => h !== id) : [...prev, id],
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
      setFormError('Vælg mindst ét hold, eller sæt "Alle hold".');
      return;
    }
    if (
      adminUsers.some(
        (u) => u.email.toLowerCase() === trimmedEmail.toLowerCase(),
      )
    ) {
      setFormError(
        "Der er allerede en administrator eller underviser med denne email.",
      );
      return;
    }
    const created = await createUser(
      {
        name: trimmedName,
        email: trimmedEmail,
        role: role as AdminRoleKey,
        allCourses,
        courses: allCourses ? [] : staffCoursesWrite(courseIds),
        status: "invited",
      },
      {
        logArgs: {
          description: `${actor} inviterede ${trimmedName} (${ADMIN_ROLES[role as AdminRoleKey].label}) med adgang til ${allCourses ? "alle hold" : courseIds.map((id) => courses[id]?.label || courses[id]?.key || "hold").join(", ")}`,
        },
        toastSuccessMessage: (result) =>
          import.meta.env.DEV && result.inviteToken
            ? "Invitation sendt (dev-link i konsollen)"
            : `Invitation sendt til ${trimmedEmail}`,
      },
    );
    if (import.meta.env.DEV && created.inviteToken) {
      console.log(
        `[invite] ${trimmedEmail} → ${window.location.origin}/invite?token=${created.inviteToken}`,
      );
    }
    resetForm();
    setShowInvite(false);
  };

  return (
    <>
      <div className="mt-5.5 flex items-center justify-between mb-2">
        <SectionHeader icon={<User size={20} />} title="Brugere" />

        {!showInvite && (
          <Button
            variant="pill"
            size="small"
            onClick={() => {
              setShowInvite(true);
              resetForm();
            }}
          >
            <PlusCircle size={14} /> Inviter
          </Button>
        )}
      </div>

      {showInvite && (
        <div className="mb-2.5 overflow-hidden rounded-[14px] border border-border bg-card">
          <div className="p-4">
            <div className="flex gap-3">
              <Field label="Navn">
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Fulde navn"
                />
              </Field>
              <Field label="Email">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="navn@dispuk.dk"
                />
              </Field>
            </div>
            <Field label="Rolle">
              <div className="relative">
                <Selector
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  options={Object.values(ADMIN_ROLES).map((role) => ({
                    label: role.label,
                    value: role.key,
                  }))}
                />
              </div>
            </Field>
            <Field label="Adgang til hold">
              <ToggleButton
                label="Alle hold (nuværende og fremtidige)"
                checked={allCourses}
                onChange={setAllHolds}
                className={`flex cursor-pointer items-center justify-between text-[13px] font-semibold ${allCourses ? "mb-0" : "mb-2.5"}`}
              />
              {!allCourses && (
                <div className="flex flex-col gap-2 rounded-[10px] border-[1.5px] border-border bg-card px-3 py-2.5">
                  {Object.values(courses).map((course) => (
                    <label
                      key={course.id}
                      className="flex cursor-pointer items-center gap-2 text-[13px] text-ink"
                    >
                      <input
                        type="checkbox"
                        checked={courseIds.includes(course.id)}
                        onChange={() => toggleHold(course.id)}
                      />
                      <span>
                        {course.label}
                        {programName(course, programs)
                          ? ` · ${programName(course, programs)}`
                          : ""}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </Field>
            {formError && (
              <div className="-mt-1.5 mb-3 text-xs text-[#a14b36]">
                {formError}
              </div>
            )}
            <div className="mt-4.5 flex justify-center  gap-2.5">
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => {
                  setShowInvite(false);
                  resetForm();
                }}
              >
                Annuller
              </Button>
              <Button
                variant="primary"
                className="w-full"
                onClick={sendInvite}
                disabled={isSaving}
                aria-busy={isSaving}
              >
                {isSaving ? "Sender…" : "Send invitation"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
