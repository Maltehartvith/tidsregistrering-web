import { useState } from "react";
import { Pencil, Trash2, Check, X, ChevronDown, Mail } from "lucide-react";
import { programName } from "@/domain/totals";
import { ADMIN_ROLES } from "@/data/constants";
import { Field } from "@/components/ui/Field";
import ToggleButton from "@/components/ui/ToggleButton";
import { useCatalog } from "@/context/CatalogContext";
import { useCourses } from "@/context/CoursesContext";
import { useUsers } from "@/context/UsersContext";
import { AdminRoleKey, AdminUser } from "@/types/user";
import { useActorLabel } from "@/domain/actor";

export function UserList() {
  const actor = useActorLabel();
  const { programs } = useCatalog();
  const { courses } = useCourses();
  const { adminUsers, updateUser, deleteUser, resendInvite } = useUsers();
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

  const startEditUser = (user: AdminUser) => {
    setEditingId(user.id as string);
    setEditRole(user.role);
    setEditAllCourses(!!user.allCourses);
    setEditCourseIds((user.courseIds as string[]) || []);
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
        courseIds: editAllCourses ? [] : editCourseIds,
      },
      {
        toastSuccessMessage: `Adgang opdateret for ${user?.name}`,
        logArgs: {
          description: `${actor} ændrede adgangen for ${user?.name}: ${ADMIN_ROLES[editRole].label}, ${
            editAllCourses
              ? "alle hold"
              : editCourseIds.map((id) => courses[id]?.label || id).join(", ")
          }`,
        },
      },
    );
    setEditingId(null);
  };

  return (
    <>
      {adminUsers.map((u) => (
        <div
          className="mb-2.5 overflow-hidden rounded-[14px] border border-border bg-card"
          key={u.id}
        >
          <div
            className="border-t border-border px-4 pb-4 pt-3.5"
            style={{ borderTop: "none" }}
          >
            <div
              className="flex items-center justify-between gap-2.5 border-b border-border py-2.5 last:border-b-0"
              style={{ paddingTop: 0 }}
            >
              <div>
                <div className="text-sm font-semibold">{u.name}</div>
                <div className="mt-px text-xs text-ink-soft">{u.email}</div>
                <div
                  className="mt-px text-xs text-ink-soft"
                  style={{ marginTop: 4 }}
                >
                  {u.allCourses
                    ? "Alle hold"
                    : u.courseIds
                        .map((id) => courses[id]?.label || id)
                        .join(", ")}
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  gap: 6,
                }}
              >
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

            {u.status === "invited" && (
              <button
                className="inline-flex flex-none cursor-pointer items-center gap-1.5 rounded-full border-0 bg-primary-soft px-3 py-1.5 font-sans text-xs font-semibold text-primary"
                style={{ marginTop: 10 }}
                type="button"
                onClick={() => void resendUserInvite(u.id)}
              >
                <Mail size={14} /> Gensend invitation
              </button>
            )}

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
                    <select
                      value={editRole}
                      onChange={(e) =>
                        setEditRole(e.target.value as AdminRoleKey)
                      }
                    >
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
                  <button
                    className="flex-1 cursor-pointer rounded-[10px] border-[1.5px] border-border bg-transparent px-4 py-3 font-sans text-sm font-semibold text-ink-soft transition-opacity active:opacity-75 disabled:cursor-default disabled:opacity-45"
                    onClick={() => setEditingId(null)}
                  >
                    Annuller
                  </button>
                  <button
                    className="flex-1 cursor-pointer rounded-[10px] border-0 bg-primary px-4 py-3 font-sans text-sm font-semibold text-on-primary transition-opacity active:opacity-75 disabled:cursor-default disabled:opacity-45"
                    onClick={() => saveEditUser(u.id)}
                  >
                    Gem ændringer
                  </button>
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
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 8,
                  marginTop: 10,
                }}
              >
                <button
                  className="flex cursor-pointer rounded-lg border-[1.5px] border-border bg-paper p-1.5 text-ink-soft hover:border-primary hover:text-primary disabled:cursor-default disabled:opacity-35"
                  onClick={() => startEditUser(u)}
                  title="Rediger rolle og hold"
                >
                  <Pencil size={14} />
                </button>
                <button
                  className="flex cursor-pointer rounded-lg border-[1.5px] border-border bg-paper p-1.5 text-ink-soft hover:border-primary hover:text-primary disabled:cursor-default disabled:opacity-35"
                  onClick={() => setConfirmRemoveId(u.id)}
                  title="Fjern adgang"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </>
  );
}
