import { useState } from "react";
import { Pencil, Trash2, Check, X, ChevronDown, Mail } from "lucide-react";
import { programName } from "@/domain/totals";
import { ADMIN_ROLES } from "@/data/constants";
import { Field } from "@/components/ui/Field";
import ToggleButton from "@/components/ui/ToggleButton";
import { useCatalog } from "@/context/CatalogContext";
import { useCourses } from "@/context/CoursesContext";
import { useUsers } from "@/context/UsersContext";
import { isStaffRole } from "@/api/queryKeys";
import { AdminRoleKey, User } from "@/types/user";
import { useActorLabel } from "@/domain/actor";
import { staffCourseIds, staffCoursesWrite } from "@/domain/userCourses";
import { Button } from "@/components/ui/Button";
import { Selector } from "@/components/ui/Selector";
import { GhostBlock } from "@/components/ui/Ghost";

export function UserList() {
  const actor = useActorLabel();
  const { programs } = useCatalog({ programs: true });
  const { courses } = useCourses();
  const {
    adminUsers,
    updateUser,
    deleteUser,
    resendInvite,
    isSaving,
    isLoading,
  } = useUsers();
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<AdminRoleKey>(
    "underviser" as AdminRoleKey,
  );
  const [editAllCourses, setEditAllCourses] = useState(false);
  const [editCourseIds, setEditCourseIds] = useState<string[]>([]);
  const [editError, setEditError] = useState("");

  const resendUserInvite = async (userId: string) => {
    const user = adminUsers.find((u) => u.id === userId);
    try {
      const result = await resendInvite(userId, {
        toastSuccessMessage: `Invitation gensendt til ${user?.email}`,
        logArgs: {
          description: `${actor} gensendte invitation til ${user?.name || userId}`,
        },
      });
      if (import.meta.env.DEV && result.inviteToken) {
        console.log(
          `[invite] ${user?.email} → ${window.location.origin}/invite?token=${result.inviteToken}`,
        );
      }
    } catch {
      /* mutationen viser allerede fejl-toast */
    }
  };

  const removeUser = async (userId: string) => {
    const user = adminUsers.find((u) => u.id === userId);
    await deleteUser(userId, {
      toastSuccessMessage: `${user?.name} fjernet`,
      logArgs: {
        description: `${actor} fjernede ${user?.name || userId}s adgang (${ADMIN_ROLES[user?.role as keyof typeof ADMIN_ROLES]?.label || user?.role})`,
      },
    });
    setConfirmRemoveId(null);
  };

  const startEditUser = (user: User) => {
    if (!isStaffRole(user.role)) return;
    setEditingId(user.id);
    setEditRole(user.role);
    setEditAllCourses(!!user.allCourses);
    setEditCourseIds(staffCourseIds(user));
    setEditError("");
  };

  const toggleEditHold = (id: string) => {
    setEditCourseIds((prev) =>
      prev.includes(id) ? prev.filter((h) => h !== id) : [...prev, id],
    );
  };

  const saveEditUser = async (userId: string) => {
    if (!editAllCourses && editCourseIds.length === 0) {
      setEditError('Vælg mindst ét hold, eller sæt "Alle hold".');
      return;
    }
    const user = adminUsers.find((u) => u.id === userId);
    await updateUser(
      userId,
      {
        role: editRole as AdminRoleKey,
        allCourses: editAllCourses,
        courses: editAllCourses ? [] : staffCoursesWrite(editCourseIds),
      },
      {
        toastSuccessMessage: `Adgang opdateret for ${user?.name}`,
        logArgs: {
          description: `${actor} ændrede adgangen for ${user?.name}: ${ADMIN_ROLES[editRole].label}, ${
            editAllCourses
              ? "alle hold"
              : editCourseIds
                  .map((id) => courses[id]?.label || courses[id]?.key || "hold")
                  .join(", ")
          }`,
        },
      },
    );
    setEditingId(null);
  };

  return (
    <>
      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 10 }).map((_, index) => (
            <div key={index}>
              <GhostBlock className="h-33 w-full rounded-lg!" />
            </div>
          ))}
        </div>
      ) : (
        <div>
          {adminUsers.map((u) => (
            <div
              className="mb-2.5 overflow-hidden rounded-lg border border-border bg-card p-4"
              key={u.id}
            >
              <div className="flex items-center justify-between gap-2.5">
                <div>
                  <div className="text-sm font-semibold">{u.name}</div>
                  <div className="mt-px text-xs text-ink-soft">{u.email}</div>
                  <div
                    className="mt-px text-xs text-ink-soft"
                    style={{ marginTop: 4 }}
                  >
                    {u.allCourses
                      ? "Alle hold"
                      : staffCourseIds(u)
                          .map(
                            (id) =>
                              courses[id]?.label || courses[id]?.key || "hold",
                          )
                          .join(", ")}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="shrink-0 rounded-full border border-primary px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.04em] text-primary">
                    {ADMIN_ROLES[u.role]?.label || u.role}
                  </span>
                  {u.status === "active" ? (
                    <span
                      className="flex items-center gap-1 font-mono text-[11px] font-semibold"
                      style={{ color: "var(--surplus)" }}
                    >
                      <Check size={12} /> Aktiv
                    </span>
                  ) : (
                    <span
                      className="flex items-center gap-1 font-mono text-[11px] font-semibold"
                      style={{ color: "var(--ink-soft)" }}
                    >
                      <Mail size={12} /> Invitation sendt
                    </span>
                  )}
                </div>
              </div>

              {editingId === u.id && (
                <div
                  className="border-t border-border px-4 pb-4 pt-3.5"
                  style={{
                    borderTop: "1px solid var(--border)",
                    marginTop: 10,
                    paddingTop: 14,
                    paddingLeft: 0,
                    paddingRight: 0,
                    paddingBottom: 0,
                  }}
                >
                  <Field label="Rolle">
                    <div className="relative">
                      <Selector
                        value={editRole}
                        onChange={(e) =>
                          setEditRole(e.target.value as AdminRoleKey)
                        }
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
                      checked={editAllCourses}
                      onChange={setEditAllCourses}
                      className={`flex cursor-pointer items-center justify-between text-[13px] font-semibold ${editAllCourses ? "mb-0" : "mb-2.5"}`}
                    />
                    {!editAllCourses && (
                      <div className="flex flex-col gap-2 rounded-[10px] border-[1.5px] border-border bg-card px-3 py-2.5">
                        {Object.values(courses).map((course) => (
                          <label
                            key={course.id}
                            className="flex cursor-pointer items-center gap-2 text-[13px] text-ink"
                          >
                            <input
                              type="checkbox"
                              checked={editCourseIds.includes(course.id)}
                              onChange={() => toggleEditHold(course.id)}
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
                  {editError && (
                    <div className="-mt-1.5 mb-3 text-xs text-[#a14b36]">
                      {editError}
                    </div>
                  )}
                  <div className="mt-4.5 flex gap-2.5">
                    <Button
                      variant="secondary"
                      className="flex-1"
                      onClick={() => setEditingId(null)}
                    >
                      Annuller
                    </Button>
                    <Button
                      variant="primary"
                      className="flex-1"
                      onClick={() => saveEditUser(u.id)}
                      disabled={isSaving}
                      aria-busy={isSaving}
                    >
                      {isSaving ? "Gemmer…" : "Gem ændringer"}
                    </Button>
                  </div>
                </div>
              )}

              {confirmRemoveId === u.id ? (
                <div
                  className="flex items-center gap-1.5 text-xs"
                  style={{ marginTop: 10, justifyContent: "flex-end" }}
                >
                  <span>Fjern adgang?</span>
                  <button
                    className="flex cursor-pointer rounded-lg border-[1.5px] border-border bg-paper p-1.5 text-ink-soft hover:border-primary hover:text-primary disabled:cursor-default disabled:opacity-35"
                    onClick={() => removeUser(u.id)}
                  >
                    <Check size={14} />
                  </button>
                  <button
                    className="flex cursor-pointer rounded-lg border-[1.5px] border-border bg-paper p-1.5 text-ink-soft hover:border-primary hover:text-primary disabled:cursor-default disabled:opacity-35"
                    onClick={() => setConfirmRemoveId(null)}
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : editingId === u.id ? null : (
                <div className="flex flex-end justify-between gap-2 mt-2">
                  <div>
                    {u.status === "invited" && (
                      <Button
                        variant="pill"
                        size="xsmall"
                        onClick={() => void resendUserInvite(u.id)}
                      >
                        <Mail size={14} /> Gensend invitation
                      </Button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => startEditUser(u)}
                      variant="icon"
                      size="icon"
                      title="Rediger rolle og hold"
                    >
                      <Pencil size={14} />
                    </Button>
                    <Button
                      variant="icon"
                      size="icon"
                      onClick={() => setConfirmRemoveId(u.id)}
                      title="Fjern adgang"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
