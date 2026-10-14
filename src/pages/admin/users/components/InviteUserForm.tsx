import { useState } from "react";
import { PlusCircle, ChevronDown } from "lucide-react";
import { programName } from "@/domain/totals";
import { ADMIN_ROLES } from "@/data/constants";
import { Field } from "@/components/ui/Field";
import ToggleButton from "@/components/ui/ToggleButton";
import { useCatalog } from "@/context/CatalogContext";
import { useCourses } from "@/context/CoursesContext";
import { useUsers } from "@/context/UsersContext";
import { AdminRoleKey } from "@/types/user";
import { useActorLabel } from "@/domain/actor";

export function InviteUserForm() {
  const actor = useActorLabel();
  const { programs } = useCatalog();
  const { courses } = useCourses();
  const { adminUsers, createUser } = useUsers();
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
        courseIds: allCourses ? [] : courseIds,
        status: "invited",
      },
      {
        logArgs: {
          description: `${actor} inviterede ${trimmedName} (${ADMIN_ROLES[role as AdminRoleKey].label}) med adgang til ${allCourses ? "alle hold" : courseIds.map((id) => courses[id]?.label || id).join(", ")}`,
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
      <div className="mt-5.5 flex items-center justify-between">
        <div
          className="mb-2.5 mt-5.5 font-display text-[15px] font-semibold text-ink"
          style={{ margin: 0 }}
        >
          Brugere
        </div>
        {!showInvite && (
          <button
            className="inline-flex flex-none cursor-pointer items-center gap-1.5 rounded-full border-0 bg-primary-soft px-3 py-1.5 font-sans text-xs font-semibold text-primary"
            onClick={() => {
              setShowInvite(true);
              resetForm();
            }}
          >
            <PlusCircle size={14} /> Inviter
          </button>
        )}
      </div>

      {showInvite && (
        <div className="mb-2.5 overflow-hidden rounded-[14px] border border-border bg-card">
          <div
            className="border-t border-border px-4 pb-4 pt-3.5"
            style={{ borderTop: "none", paddingTop: 16 }}
          >
            <div className="flex gap-3">
              <Field label="Navn">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Fulde navn"
                />
              </Field>
              <Field label="Email">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="navn@dispuk.dk"
                />
              </Field>
            </div>
            <Field label="Rolle">
              <div className="relative">
                <select value={role} onChange={(e) => setRole(e.target.value)}>
                  <option value="underviser">Underviser</option>
                  <option value="administrator">Administrator</option>
                </select>
                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft"
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
            <div className="mt-4.5 flex gap-2.5">
              <button
                className="flex-1 cursor-pointer rounded-[10px] border-[1.5px] border-border bg-transparent px-4 py-3 font-sans text-sm font-semibold text-ink-soft transition-opacity active:opacity-75 disabled:cursor-default disabled:opacity-45"
                onClick={() => {
                  setShowInvite(false);
                  resetForm();
                }}
              >
                Annuller
              </button>
              <button
                className="flex-1 cursor-pointer rounded-[10px] border-0 bg-primary px-4 py-3 font-sans text-sm font-semibold text-on-primary transition-opacity active:opacity-75 disabled:cursor-default disabled:opacity-45"
                onClick={sendInvite}
              >
                Send invitation
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
