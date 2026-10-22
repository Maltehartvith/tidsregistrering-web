import { useState } from "react";
import { MailX, Pencil, PlusCircle, Trash2 } from "lucide-react";
import AdminPageWrapper from "@/pages/admin/components/AdminPageWrapper";
import { InvitePersonForm } from "@/pages/admin/directory/InvitePersonForm";
import { Button } from "@/components/ui/Button";
import { GhostBlock } from "@/components/ui/Ghost";
import Input from "@/components/ui/Input";
import { useAuth } from "@/context/AuthContext";
import { useCatalog } from "@/context/CatalogContext";
import { useCourses } from "@/context/CoursesContext";
import { useUsers } from "@/context/UsersContext";
import { isAdministrator, isStaffRole } from "@/api/queryKeys";
import { useActorLabel } from "@/domain/actor";
import { withFeedback } from "@/hooks/queryHelpers";
import { useHoldQuery } from "@/hooks/queryGate";
import {
  useCancelInvite,
  useDeleteUser,
  useDirectoryQuery,
} from "@/hooks/users";
import { educationName } from "@/domain/totals";
import { staffCourseIds, staffCoursesWrite } from "@/domain/userCourses";
import { ADMIN_ROLES } from "@/data/constants";
import { Field } from "@/components/ui/Field";
import { Selector } from "@/components/ui/Selector";
import ToggleButton from "@/components/ui/ToggleButton";
import type { CourseMap } from "@/types/course";
import type { CategoriesMap, EducationsMap } from "@/types/domain";
import type { AdminRoleKey, User, UserRole } from "@/types/user";

const roleLabel: Record<User["role"], string> = {
  kursist: "Kursist",
  underviser: "Underviser",
  administrator: "Administrator",
};

function registeredHours(user: User, categories: CategoriesMap) {
  const sums = new Map<string, number>();
  for (const course of user.courses) {
    for (const row of course.categories) {
      const hours = Number(row.hours);
      if (!hours) continue;
      sums.set(row.id, (sums.get(row.id) ?? 0) + hours);
    }
  }
  const known = Object.values(categories)
    .filter((category) => (sums.get(category.id) ?? 0) > 0)
    .map((category) => ({
      id: category.id,
      label: category.short || category.label,
      color: category.color,
      hours: sums.get(category.id) ?? 0,
    }));
  const knownIds = new Set(known.map((row) => row.id));
  for (const course of user.courses) {
    for (const row of course.categories) {
      if (knownIds.has(row.id) || !Number(row.hours)) continue;
      known.push({
        id: row.id,
        label: row.short || "Kategori",
        color: "#6B6B6B",
        hours: sums.get(row.id) ?? 0,
      });
      knownIds.add(row.id);
    }
  }
  return known;
}

const activeGroups: { role: UserRole; title: string }[] = [
  { role: "administrator", title: "Administratorer" },
  { role: "underviser", title: "Undervisere" },
  { role: "kursist", title: "Kursister" },
];

export function DirectoryPage() {
  const actor = useActorLabel();
  const { user } = useAuth();
  const { CATEGORIES, educations } = useCatalog({
    categories: true,
    educations: true,
  });
  const { courses } = useCourses();
  const { updateUser, deleteUser: deleteStaff, isSaving } = useUsers();
  useHoldQuery("directory");
  const { data: people, isLoading } = useDirectoryQuery();
  const cancelInvite = useCancelInvite();
  const deleteUser = useDeleteUser();
  const [query, setQuery] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [inviteRole, setInviteRole] = useState<UserRole | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<AdminRoleKey>("underviser");
  const [editAllCourses, setEditAllCourses] = useState(false);
  const [editCourseIds, setEditCourseIds] = useState<string[]>([]);
  const [editError, setEditError] = useState("");
  const [confirmStaffId, setConfirmStaffId] = useState<string | null>(null);
  const isAdmin = isAdministrator(user?.role);

  const visible = people.filter((person) => {
    if (person.status === "invited") {
      return isAdmin || person.invitedByUserId === user?.id;
    }
    return person.status === "active";
  });
  const q = query.trim().toLowerCase();
  const filtered = visible.filter(
    (person) =>
      !q ||
      person.name.toLowerCase().includes(q) ||
      person.email.toLowerCase().includes(q),
  );
  const active = filtered.filter((person) => person.status === "active");
  const invited = filtered.filter((person) => person.status === "invited");

  const cancel = async (person: User) => {
    await cancelInvite.mutateAsync(
      withFeedback(person.id, {
        toastSuccessMessage: `Invitation til ${person.name} annulleret`,
        logArgs: {
          userId: person.id,
          description: `${actor} annullerede invitationen til ${person.name}`,
        },
      }),
    );
  };

  const startEdit = (person: User) => {
    if (!isStaffRole(person.role)) return;
    setEditingId(person.id);
    setEditRole(person.role);
    setEditAllCourses(!!person.allCourses);
    setEditCourseIds(staffCourseIds(person));
    setEditError("");
  };

  const saveEdit = async (person: User) => {
    if (!editAllCourses && editCourseIds.length === 0) {
      setEditError('Vælg mindst ét hold, eller sæt "Alle hold".');
      return;
    }
    try {
      await updateUser(
        person.id,
        {
          role: editRole,
          allCourses: editAllCourses,
          courses: editAllCourses ? [] : staffCoursesWrite(editCourseIds),
        },
        {
          toastSuccessMessage: `Adgang opdateret for ${person.name}`,
          logArgs: {
            description: `${actor} ændrede adgangen for ${person.name}: ${ADMIN_ROLES[editRole].label}`,
          },
        },
      );
      setEditingId(null);
    } catch {
      /* mutationen viser allerede fejl-toast */
    }
  };

  const removeStaff = async (person: User) => {
    await deleteStaff(person.id, {
      toastSuccessMessage: `${person.name} fjernet`,
      logArgs: {
        description: `${actor} fjernede ${person.name}s adgang (${roleLabel[person.role]})`,
      },
    });
    setConfirmStaffId(null);
  };

  const remove = async (person: User) => {
    await deleteUser.mutateAsync(
      withFeedback(person.id, {
        toastSuccessMessage: `${person.name} slettet`,
        logArgs: {
          description: `${actor} slettede den inviterede bruger ${person.name}`,
        },
      }),
    );
    setConfirmDeleteId(null);
  };

  return (
    <AdminPageWrapper
      title="Brugere"
      subtitle={
        isAdmin
          ? "Alle aktive og inviterede brugere"
          : "Aktive brugere på dine hold, og invitationer du selv har sendt"
      }
    >
      <div className="mb-4 flex flex-wrap gap-2">
        <Button
          variant={inviteRole === "kursist" ? "primary" : "secondary"}
          size="small"
          onClick={() => setInviteRole(inviteRole === "kursist" ? null : "kursist")}
        >
          <PlusCircle size={14} /> Inviter kursist
        </Button>
        {isAdmin && (
          <>
            <Button
              variant={inviteRole === "underviser" ? "primary" : "secondary"}
              size="small"
              onClick={() =>
                setInviteRole(inviteRole === "underviser" ? null : "underviser")
              }
            >
              <PlusCircle size={14} /> Inviter underviser
            </Button>
            <Button
              variant={inviteRole === "administrator" ? "primary" : "secondary"}
              size="small"
              onClick={() =>
                setInviteRole(
                  inviteRole === "administrator" ? null : "administrator",
                )
              }
            >
              <PlusCircle size={14} /> Inviter administrator
            </Button>
          </>
        )}
      </div>
      {inviteRole && (
        <InvitePersonForm
          key={inviteRole}
          role={inviteRole}
          people={people}
          onClose={() => setInviteRole(null)}
        />
      )}
      <Input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Søg på navn eller email"
        className="mb-4"
      />
      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <GhostBlock key={index} className="h-16 w-full rounded-lg!" />
          ))}
        </div>
      ) : (
        <>
          <Section title={`Aktive (${active.length})`} />
          <div className="flex flex-col gap-6">
            {activeGroups.map((group) => {
              const members = active.filter((person) => person.role === group.role);
              return (
                <div key={group.role}>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.04em] text-ink-soft">
                    {group.title} ({members.length})
                  </h3>
                  {members.length === 0 ? (
                    <p className="text-[13px] text-ink-soft">Ingen.</p>
                  ) : (
                    <div className="flex flex-col gap-2 md:flex-row md:flex-wrap">
                      {members.map((person) => (
                        <PersonCard
                          key={person.id}
                          person={person}
                          categories={CATEGORIES}
                          courses={courses}
                          educations={educations}
                          canManage={isAdmin && person.id !== user?.id}
                          editing={editingId === person.id}
                          editRole={editRole}
                          editAllCourses={editAllCourses}
                          editCourseIds={editCourseIds}
                          editError={editError}
                          confirming={confirmStaffId === person.id}
                          saving={isSaving}
                          onStartEdit={() => startEdit(person)}
                          onCancelEdit={() => setEditingId(null)}
                          onSave={() => saveEdit(person)}
                          onRole={(role) => setEditRole(role)}
                          onAllCourses={setEditAllCourses}
                          onToggleCourse={(id) =>
                            setEditCourseIds((current) =>
                              current.includes(id)
                                ? current.filter((courseId) => courseId !== id)
                                : [...current, id],
                            )
                          }
                          onAskRemove={() => setConfirmStaffId(person.id)}
                          onCancelRemove={() => setConfirmStaffId(null)}
                          onRemove={() => removeStaff(person)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <Section title={`Inviterede (${invited.length})`} />
          {invited.length === 0 ? (
            <p className="text-[13px] text-ink-soft">Ingen ventende invitationer.</p>
          ) : (
          <div className="flex flex-col gap-2 md:flex-row md:flex-wrap">
          {invited.map((person) => (
            <article
              key={person.id}
              className="w-full rounded-lg border border-border bg-card px-4 py-3 md:w-80 md:flex-1"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold">{person.name}</div>
                  <div className="mt-px text-xs text-ink-soft">
                    {person.email} · {roleLabel[person.role]} ·{" "}
                    {person.invitePending
                      ? "Invitation afventer svar"
                      : "Invitation annulleret"}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {person.invitePending && (
                    <Button
                      variant="secondary"
                      size="small"
                      onClick={() => cancel(person)}
                      disabled={cancelInvite.isPending}
                    >
                      <MailX size={14} /> Annuller invitation
                    </Button>
                  )}
                  {confirmDeleteId === person.id ? (
                    <>
                      <Button
                        variant="primary"
                        size="small"
                        onClick={() => remove(person)}
                        disabled={deleteUser.isPending}
                      >
                        Slet
                      </Button>
                      <Button
                        variant="secondary"
                        size="small"
                        onClick={() => setConfirmDeleteId(null)}
                      >
                        Fortryd
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="secondary"
                      size="small"
                      onClick={() => setConfirmDeleteId(person.id)}
                    >
                      <Trash2 size={14} /> Slet bruger
                    </Button>
                  )}
                </div>
              </div>
            </article>
          ))}
          </div>
          )}
        </>
      )}
    </AdminPageWrapper>
  );
}

function PersonCard({
  person,
  categories,
  courses,
  educations,
  canManage,
  editing,
  editRole,
  editAllCourses,
  editCourseIds,
  editError,
  confirming,
  saving,
  onStartEdit,
  onCancelEdit,
  onSave,
  onRole,
  onAllCourses,
  onToggleCourse,
  onAskRemove,
  onCancelRemove,
  onRemove,
}: {
  person: User;
  categories: CategoriesMap;
  courses: CourseMap;
  educations: EducationsMap;
  canManage: boolean;
  editing: boolean;
  editRole: AdminRoleKey;
  editAllCourses: boolean;
  editCourseIds: string[];
  editError: string;
  confirming: boolean;
  saving: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: () => void;
  onRole: (role: AdminRoleKey) => void;
  onAllCourses: (value: boolean) => void;
  onToggleCourse: (id: string) => void;
  onAskRemove: () => void;
  onCancelRemove: () => void;
  onRemove: () => void;
}) {
  const hours = person.role === "kursist" ? registeredHours(person, categories) : [];
  const access = person.allCourses
    ? "Alle hold"
    : staffCourseIds(person)
        .map((id) => courses[id]?.label || courses[id]?.key)
        .filter(Boolean)
        .join(", ");

  return (
    <article
      className={`w-full rounded-lg border border-border bg-card px-4 py-3 md:w-72 md:flex-1 ${editing ? "md:min-w-full" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-sm font-semibold">{person.name}</div>
          <div className="mt-px text-xs text-ink-soft">{person.email}</div>
        </div>
        {canManage && isStaffRole(person.role) && !editing && (
          <div className="flex gap-1">
            <Button variant="icon" size="icon" title="Rediger rolle og hold" onClick={onStartEdit}>
              <Pencil size={14} />
            </Button>
            <Button variant="icon" size="icon" title="Fjern adgang" onClick={onAskRemove}>
              <Trash2 size={14} />
            </Button>
          </div>
        )}
      </div>
      {person.role === "kursist" ? (
        hours.length === 0 ? (
          <p className="mt-2 text-xs text-ink-soft">Ingen registrerede timer.</p>
        ) : (
          <div className="mt-2 flex flex-wrap gap-2">
            {hours.map((row) => (
              <span
                key={row.id}
                className="rounded-full border border-border px-2 py-0.5 font-mono text-[11px]"
                style={{ color: row.color }}
              >
                {row.label} {row.hours}t
              </span>
            ))}
          </div>
        )
      ) : (
        <p className="mt-2 text-xs text-ink-soft">{access || "Ingen hold"}</p>
      )}
      {confirming && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <span>Fjern adgang?</span>
          <Button variant="primary" size="small" onClick={onRemove} disabled={saving}>
            Fjern
          </Button>
          <Button variant="secondary" size="small" onClick={onCancelRemove}>
            Fortryd
          </Button>
        </div>
      )}
      {editing && isStaffRole(person.role) && (
        <div className="mt-3 border-t border-border pt-3">
          <Field label="Rolle">
            <Selector
              value={editRole}
              onChange={(event) => onRole(event.target.value as AdminRoleKey)}
              options={Object.values(ADMIN_ROLES).map((item) => ({
                label: item.label,
                value: item.key,
              }))}
            />
          </Field>
          <Field label="Adgang til hold">
            <ToggleButton
              label="Alle hold (nuværende og fremtidige)"
              checked={editAllCourses}
              onChange={onAllCourses}
              className="mb-2 flex cursor-pointer items-center justify-between text-[13px] font-semibold"
            />
            {!editAllCourses && (
              <div className="flex flex-col gap-2 rounded-sm border-[1.5px] border-border px-3 py-2.5">
                {Object.values(courses).map((course) => (
                  <label
                    key={course.id}
                    className="flex cursor-pointer items-center gap-2 text-[13px]"
                  >
                    <input
                      type="checkbox"
                      checked={editCourseIds.includes(course.id)}
                      onChange={() => onToggleCourse(course.id)}
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
          {editError && <div className="mb-3 text-xs text-[#a14b36]">{editError}</div>}
          <div className="flex gap-2">
            <Button variant="secondary" size="small" className="flex-1" onClick={onCancelEdit}>
              Annuller
            </Button>
            <Button
              variant="primary"
              size="small"
              className="flex-1"
              onClick={onSave}
              disabled={saving}
            >
              {saving ? "Gemmer…" : "Gem"}
            </Button>
          </div>
        </div>
      )}
    </article>
  );
}

function Section({ title }: { title: string }) {
  return <h2 className="mb-2 mt-4 text-sm font-semibold">{title}</h2>;
}
