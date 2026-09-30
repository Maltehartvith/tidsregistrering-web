import { useState } from "react";
import {
  PlusCircle,
  Pencil,
  Trash2,
  Check,
  X,
  ChevronDown,
  Mail,
  Users2,
} from "lucide-react";
import { programName } from "../../domain/totals";
import { ADMIN_ROLES } from "../../data/seed";
import { Field } from "../../components/ui/Field";
import { useCatalog } from "../../context/CatalogContext";
import { useCourses } from "../../context/CoursesContext";
import { useUsers } from "../../context/UsersContext";

import { BrandLogo } from "../../components/brand/Brand";

import { AdminTabs } from "./AdminTabs";
import { routes } from "@/routes";
import { useNavigate } from "react-router-dom";
import { LogEventArgs } from "@/types/log";
import { AdminRoleKey, AdminUser } from "@/types/user";

type AdminUsersViewProps = {
  onLog: (log: LogEventArgs) => void;
};
export const AdminUsersView = ({ onLog }: AdminUsersViewProps) => {
  const navigate = useNavigate();
  const { programs } = useCatalog();
  const { courses } = useCourses();
  const { adminUsers, createUser, updateUser, deleteUser, resendInvite } =
    useUsers();
  const [showInvite, setShowInvite] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("underviser");
  const [allCourses, setAllHolds] = useState(false);
  const [courseIds, setHoldIds] = useState<string[]>([]);
  const [formError, setFormError] = useState("");
  const [toast, setToast] = useState("");
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<AdminRoleKey>("underviser" as AdminRoleKey);
  const [editAllCourses, setEditAllCourses] = useState(false);
  const [editCourseIds, setEditCourseIds] = useState<string[]>([]);
  const [editError, setEditError] = useState("");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2600);
  };

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
    const created = await createUser({
      name: trimmedName,
      email: trimmedEmail,
      role: role as AdminRoleKey,
      allCourses,
      courseIds: allCourses ? [] : courseIds,
      status: "invited",
    });
    onLog({
      actor: "Administrator",
      description: `Administrator inviterede ${trimmedName} (${ADMIN_ROLES[role as AdminRoleKey].label}) med adgang til ${allCourses ? "alle hold" : courseIds.map((id) => courses[id]?.label || id).join(", ")}`,
    });
    if (
      import.meta.env.DEV &&
      "inviteToken" in created &&
      (created as { inviteToken?: string }).inviteToken
    ) {
      const token = (created as { inviteToken?: string }).inviteToken!;
      showToast(`Invitation sendt (dev-link i konsollen)`);
      console.log(
        `[invite] ${trimmedEmail} → ${window.location.origin}/invite?token=${token}`,
      );
    } else {
      showToast(`Invitation sendt til ${trimmedEmail}`);
    }
    resetForm();
    setShowInvite(false);
  };

  const resendUserInvite = async (userId: string) => {
    const user = adminUsers.find((u) => u.id === userId);
    try {
      const result = await resendInvite(userId);
      if (import.meta.env.DEV && result.inviteToken) {
        console.log(
          `[invite] ${user?.email} → ${window.location.origin}/invite?token=${result.inviteToken}`,
        );
      }
      onLog({
        actor: "Administrator",
        description: `Administrator gensendte invitation til ${user?.name || userId}`,
      });
      showToast(`Invitation gensendt til ${user?.email}`);
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : "Kunne ikke sende invitation.",
      );
    }
  };

  const removeUser = async (userId: string) => {
    const user = adminUsers.find((u) => u.id === userId);
    await deleteUser(userId);
    onLog({
      actor: "Administrator",
      description: `Administrator fjernede ${user?.name || userId}s adgang (${ADMIN_ROLES[user?.role as keyof typeof ADMIN_ROLES]?.label || user?.role})`,
    });
    showToast(`${user?.name} fjernet`);
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
    await updateUser(userId, {
      role: editRole as AdminRoleKey,
      allCourses: editAllCourses,
      courseIds: editAllCourses ? [] : editCourseIds,
    });
    onLog({
      actor: "Administrator",
      description: `Administrator ændrede adgangen for ${user?.name}: ${ADMIN_ROLES[editRole].label}, ${
        editAllCourses
          ? "alle hold"
          : editCourseIds.map((id) => courses[id]?.label || id).join(", ")
      }`,
    });
    showToast(`Adgang opdateret for ${user?.name}`);
    setEditingId(null);
  };

  return (
    <div className="relative mx-auto flex min-h-screen max-w-[430px] flex-col bg-[var(--paper)] font-sans text-[var(--ink)] md:my-10 md:min-h-[calc(100vh-80px)] md:max-w-[900px] md:overflow-hidden md:rounded-3xl md:shadow-[0_24px_64px_rgba(18,57,74,0.16)]">
      <div className="px-5 pb-[18px] pt-[26px]">
        <div className="flex items-center gap-2.5">
          <BrandLogo className="h-[26px] w-auto max-w-[140px] shrink-0 object-contain" />
          <div className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.1em] text-[var(--ink-soft)]">
            Administrator
          </div>
        </div>
        <div className="mt-2 flex items-start justify-between">
          <div>
            <div className="mb-0.5 font-[family-name:var(--font-display)] text-[28px] font-semibold">
              Administratorer
            </div>
            <div className="text-[13px] text-[var(--ink-soft)]">
              Inviter og administrer administratorer og undervisere
            </div>
          </div>
          <button
            className="flex cursor-pointer rounded-lg border-[1.5px] border-[var(--border)] bg-[var(--paper)] p-1.5 text-[var(--ink-soft)] hover:border-[var(--blue)] hover:text-[var(--blue)] disabled:cursor-default disabled:opacity-35"
            onClick={() => navigate(routes.adminStudents)}
            title="Kursistvisning"
          >
            <Users2 size={16} />
          </button>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <span className="h-3 w-0.5 shrink-0 rounded-sm bg-[var(--surplus)]" />
          <span className="stitch-line" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-25 pt-1">
        <AdminTabs />

        <p className="mb-3.5 text-[13px] leading-normal text-[var(--ink-soft)]">
          <strong>Administrator</strong>:{" "}
          {ADMIN_ROLES.administrator.description}
        </p>
        <p
          className="mb-3.5 text-[13px] leading-normal text-[var(--ink-soft)]"
          style={{ marginTop: -8 }}
        >
          <strong>Underviser</strong>: {ADMIN_ROLES.underviser.description}
        </p>

        <div className="mt-[22px] flex items-center justify-between">
          <div
            className="mb-2.5 mt-[22px] font-[family-name:var(--font-display)] text-[15px] font-semibold text-[var(--ink)]"
            style={{ margin: 0 }}
          >
            Brugere
          </div>
          {!showInvite && (
            <button
              className="inline-flex flex-none cursor-pointer items-center gap-1.5 rounded-full border-0 bg-[var(--blue-soft)] px-3 py-1.5 font-sans text-xs font-semibold text-[var(--blue)]"
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
          <div className="mb-2.5 overflow-hidden rounded-[14px] border border-[var(--border)] bg-[var(--card)]">
            <div
              className="border-t border-[var(--border)] px-4 pb-4 pt-3.5"
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
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  >
                    <option value="underviser">Underviser</option>
                    <option value="administrator">Administrator</option>
                  </select>
                  <ChevronDown
                    size={16}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ink-soft)]"
                  />
                </div>
              </Field>
              <Field label="Adgang til hold">
                <label
                  className="mb-1 flex cursor-pointer items-center justify-between text-[13px] font-semibold"
                  style={{ marginBottom: allCourses ? 0 : 10 }}
                >
                  <span>Alle hold (nuværende og fremtidige)</span>
                  <span
                    className={`switch ${allCourses ? "on" : ""}`}
                    onClick={() => setAllHolds(!allCourses)}
                  >
                    <span className="absolute top-[3px] left-[3px] h-[18px] w-[18px] rounded-full bg-[var(--card)] transition-[left] duration-150" />
                  </span>
                </label>
                {!allCourses && (
                  <div className="flex flex-col gap-2 rounded-[10px] border-[1.5px] border-[var(--border)] bg-[var(--card)] px-3 py-2.5">
                    {Object.values(courses).map((course) => (
                      <label
                        key={course.id}
                        className="flex cursor-pointer items-center gap-2 text-[13px] text-[var(--ink)]"
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
              <div className="mt-[18px] flex gap-2.5">
                <button
                  className="flex-1 cursor-pointer rounded-[10px] border-[1.5px] border-[var(--border)] bg-transparent px-4 py-3 font-sans text-sm font-semibold text-[var(--ink-soft)] transition-opacity active:opacity-75 disabled:cursor-default disabled:opacity-45"
                  onClick={() => {
                    setShowInvite(false);
                    resetForm();
                  }}
                >
                  Annuller
                </button>
                <button
                  className="flex-1 cursor-pointer rounded-[10px] border-0 bg-[var(--blue)] px-4 py-3 font-sans text-sm font-semibold text-[#fafaf7] transition-opacity active:opacity-75 disabled:cursor-default disabled:opacity-45"
                  onClick={sendInvite}
                >
                  Send invitation
                </button>
              </div>
            </div>
          </div>
        )}

        {adminUsers.map((u) => (
          <div
            className="mb-2.5 overflow-hidden rounded-[14px] border border-[var(--border)] bg-[var(--card)]"
            key={u.id}
          >
            <div
              className="border-t border-[var(--border)] px-4 pb-4 pt-3.5"
              style={{ borderTop: "none" }}
            >
              <div
                className="flex items-center justify-between gap-2.5 border-b border-[var(--border)] py-2.5 last:border-b-0"
                style={{ paddingTop: 0 }}
              >
                <div>
                  <div className="text-sm font-semibold">{u.name}</div>
                  <div className="mt-px text-xs text-[var(--ink-soft)]">
                    {u.email}
                  </div>
                  <div
                    className="mt-px text-xs text-[var(--ink-soft)]"
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
                  <span className="shrink-0 rounded-full border border-[var(--blue)] px-2 py-0.5 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.04em] text-[var(--blue)]">
                    {ADMIN_ROLES[u.role]?.label || u.role}
                  </span>
                  {u.status === "active" ? (
                    <span
                      className="flex items-center gap-1 font-[family-name:var(--font-mono)] text-[11px] font-semibold"
                      style={{ color: "var(--surplus)" }}
                    >
                      <Check size={12} /> Aktiv
                    </span>
                  ) : (
                    <span
                      className="flex items-center gap-1 font-[family-name:var(--font-mono)] text-[11px] font-semibold"
                      style={{ color: "var(--ink-soft)" }}
                    >
                      <Mail size={12} /> Invitation sendt
                    </span>
                  )}
                </div>
              </div>

              {u.status === "invited" && (
                <button
                  className="inline-flex flex-none cursor-pointer items-center gap-1.5 rounded-full border-0 bg-[var(--blue-soft)] px-3 py-1.5 font-sans text-xs font-semibold text-[var(--blue)]"
                  style={{ marginTop: 10 }}
                  type="button"
                  onClick={() => void resendUserInvite(u.id)}
                >
                  <Mail size={14} /> Gensend invitation
                </button>
              )}

              {editingId === u.id && (
                <div
                  className="border-t border-[var(--border)] px-4 pb-4 pt-3.5"
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
                        onChange={(e) => setEditRole(e.target.value as AdminRoleKey)}
                      >
                        <option value="underviser">Underviser</option>
                        <option value="administrator">Administrator</option>
                      </select>
                      <ChevronDown
                        size={16}
                        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ink-soft)]"
                      />
                    </div>
                  </Field>
                  <Field label="Adgang til hold">
                    <label
                      className="mb-1 flex cursor-pointer items-center justify-between text-[13px] font-semibold"
                      style={{ marginBottom: editAllCourses ? 0 : 10 }}
                    >
                      <span>Alle hold (nuværende og fremtidige)</span>
                      <span
                        className={`switch ${editAllCourses ? "on" : ""}`}
                        onClick={() => setEditAllCourses(!editAllCourses)}
                      >
                        <span className="absolute top-[3px] left-[3px] h-[18px] w-[18px] rounded-full bg-[var(--card)] transition-[left] duration-150" />
                      </span>
                    </label>
                    {!editAllCourses && (
                      <div className="flex flex-col gap-2 rounded-[10px] border-[1.5px] border-[var(--border)] bg-[var(--card)] px-3 py-2.5">
                        {Object.values(courses).map((course) => (
                          <label
                            key={course.id}
                            className="flex cursor-pointer items-center gap-2 text-[13px] text-[var(--ink)]"
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
                  <div className="mt-[18px] flex gap-2.5">
                    <button
                      className="flex-1 cursor-pointer rounded-[10px] border-[1.5px] border-[var(--border)] bg-transparent px-4 py-3 font-sans text-sm font-semibold text-[var(--ink-soft)] transition-opacity active:opacity-75 disabled:cursor-default disabled:opacity-45"
                      onClick={() => setEditingId(null)}
                    >
                      Annuller
                    </button>
                    <button
                      className="flex-1 cursor-pointer rounded-[10px] border-0 bg-[var(--blue)] px-4 py-3 font-sans text-sm font-semibold text-[#fafaf7] transition-opacity active:opacity-75 disabled:cursor-default disabled:opacity-45"
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
                    className="flex cursor-pointer rounded-lg border-[1.5px] border-[var(--border)] bg-[var(--paper)] p-1.5 text-[var(--ink-soft)] hover:border-[var(--blue)] hover:text-[var(--blue)] disabled:cursor-default disabled:opacity-35"
                    onClick={() => removeUser(u.id)}
                  >
                    <Check size={14} />
                  </button>
                  <button
                    className="flex cursor-pointer rounded-lg border-[1.5px] border-[var(--border)] bg-[var(--paper)] p-1.5 text-[var(--ink-soft)] hover:border-[var(--blue)] hover:text-[var(--blue)] disabled:cursor-default disabled:opacity-35"
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
                    className="flex cursor-pointer rounded-lg border-[1.5px] border-[var(--border)] bg-[var(--paper)] p-1.5 text-[var(--ink-soft)] hover:border-[var(--blue)] hover:text-[var(--blue)] disabled:cursor-default disabled:opacity-35"
                    onClick={() => startEditUser(u)}
                    title="Rediger rolle og hold"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    className="flex cursor-pointer rounded-lg border-[1.5px] border-[var(--border)] bg-[var(--paper)] p-1.5 text-[var(--ink-soft)] hover:border-[var(--blue)] hover:text-[var(--blue)] disabled:cursor-default disabled:opacity-35"
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
      </div>

      {toast && (
        <div className="fixed bottom-[84px] left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-[var(--ink)] px-[18px] py-2.5 text-[13px] text-[var(--card)] shadow-[0_6px_18px_rgba(0,0,0,0.18)]">
          <Check size={14} /> {toast}
        </div>
      )}
    </div>
  );
};

/* ---------------------------------------------------------------
   Administrator: kategorier og læringsmål
--------------------------------------------------------------- */
