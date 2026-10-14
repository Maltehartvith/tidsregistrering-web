import { useLayoutEffect, useState } from "react";
import * as XLSX from "xlsx";
import { useNavigate } from "react-router-dom";
import {
  PlusCircle,
  Trash2,
  Check,
  X,
  AlertTriangle,
  ChevronDown,
  ArrowRightLeft,
  User,
  Upload,
  FileSpreadsheet,
} from "lucide-react";
import { useCatalog } from "@/context/CatalogContext";
import { useCourses } from "@/context/CoursesContext";
import { useStudents } from "@/context/StudentsContext";
import { useEntries } from "@/context/EntriesContext";
import { useUsers } from "@/context/UsersContext";
import { zeroTargets, formatTargets } from "@/domain/catalog";
import { coursesWithinTransferWindow, programName } from "@/domain/totals";
import { ADMIN_ROLES } from "@/data/constants";
import { Field } from "@/components/ui/Field";
import ToggleButton from "@/components/ui/ToggleButton";
import { routes } from "@/routes";
import { Student } from "@/types/user";
import { useActorLabel } from "@/domain/actor";
import { useActionFeedback } from "@/hooks/queryHelpers";

type CourseCardProps = {
  courseId: string;
  isOpen: boolean;
  onToggle: () => void;
};

type AddResult = {
  error?: string;
  duplicate?: { name: string; email: string };
  added?: { name: string; email: string };
};

type ImportResult = {
  courseId?: string;
  error?: string;
  fileName?: string;
  added?: Student[];
  duplicates?: { name: string; email: string }[];
  skipped?: { name: string; email: string }[];
};

export function CourseCard({ courseId, isOpen, onToggle }: CourseCardProps) {
  const navigate = useNavigate();
  const actor = useActorLabel();
  const recordFeedback = useActionFeedback();
  const { CATEGORIES, programs } = useCatalog();
  const {
    courses,
    updateCourse,
    deleteCourse: deleteCourseApi,
  } = useCourses();
  const { students, createStudent, updateStudent } = useStudents();
  const { entries } = useEntries();
  const { adminUsers, updateUser } = useUsers();

  const [draftOn, setDraftOn] = useState(false);
  const [draftFrom, setDraftFrom] = useState("");
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importingCourseId, setImportingCourseId] = useState<string | null>(
    null,
  );
  const [addName, setAddName] = useState<string | null>(null);
  const [addEmail, setAddEmail] = useState<string | null>(null);
  const [addResult, setAddResult] = useState<AddResult | null>(null);
  const [confirmDeleteCourseId, setConfirmDeleteCourseId] = useState<
    string | null
  >(null);
  const [confirmRemoveCourseId, setConfirmRemoveCourseId] = useState<
    string | null
  >(null);
  const [editProgramId, setEditProgramId] = useState<string | null>(null);
  const [editTargets, setEditTargets] = useState(zeroTargets(CATEGORIES));
  const [addUserId, setAddUserId] = useState<string | null>(null);
  const [transferSourceId, setTransferSourceId] = useState("");
  const [confirmTransferRoster, setConfirmTransferRoster] = useState(false);

  // Reset the panel's local state every time the card is opened.
  useLayoutEffect(() => {
    if (!isOpen) return;
    setDraftOn(false);
    setDraftFrom(coursesWithinTransferWindow(courseId, courses)[0]?.id || "");
    setImportResult(null);
    setAddResult(null);
    setAddName("");
    setAddEmail("");
    setEditProgramId(
      courses[courseId]?.programId || Object.keys(programs)[0] || "",
    );
    setEditTargets({
      ...zeroTargets(CATEGORIES),
      ...(courses[courseId]?.targets || {}),
    });
    setAddUserId("");
    setTransferSourceId("");
    setConfirmTransferRoster(false);
    // Only on open/close — not on every catalog/course change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const h = courses[courseId];
  if (!h) return null;

  const saveCourseProgram = async () => {
    const course = courses[courseId];
    if (!course || !editProgramId) return;

    await updateCourse(
      courseId,
      {
        programId: editProgramId,
        targets: editTargets,
      },
      {
        toastSuccessMessage: `Uddannelse og delmål gemt for ${course.label}`,
        logArgs: {
          courseId,
          description: `${actor} satte ${course.label} til uddannelsen "${programs[editProgramId]?.name}" med delmål ${formatTargets(editTargets, CATEGORIES)}`,
        },
      },
    );
  };

  const transferRoster = async () => {
    if (!transferSourceId) return;
    const sourceCourseId = transferSourceId;
    const targetCourseId = courseId;
    const sourceLabel = courses[sourceCourseId].label;
    const targetLabel = courses[targetCourseId].label;
    const moved = students.filter((s) => s.courseId === sourceCourseId);
    await Promise.all(
      moved.map((s) => {
        const restLinks = (s.courseLinks || []).filter(
          (l) => l.courseId !== sourceCourseId && l.courseId !== targetCourseId,
        );
        return updateStudent(s.id, {
          courseId: targetCourseId,
          courseLinks: [
            ...restLinks,
            { courseId: sourceCourseId, included: true },
          ],
        });
      }),
    );
    recordFeedback({
      toastSuccessMessage: `${moved.length} kursister overført til ${targetLabel}`,
      logArgs: {
        courseId: targetCourseId,
        description: `${actor} overførte ${moved.length} kursister fra ${sourceLabel} til ${targetLabel} (timer fra ${sourceLabel} tæller fortsat med)`,
      },
    });
    setTransferSourceId("");
    setConfirmTransferRoster(false);
  };

  const addUserToCourse = async () => {
    if (!addUserId) return;
    const user = adminUsers.find((u) => u.id === addUserId);
    if (!user || user.allCourses || (user.courseIds || []).includes(courseId)) {
      setAddUserId("");
      return;
    }
    await updateUser(
      user.id,
      {
        courseIds: [...(user.courseIds || []), courseId],
      },
      {
        toastSuccessMessage: `${user.name} har nu adgang til ${courses[courseId].label}`,
        logArgs: {
          courseId,
          description: `${actor} gav ${user.name} (${ADMIN_ROLES[user.role]?.label || user.role}) adgang til ${courses[courseId].label}`,
        },
      },
    );
    setAddUserId("");
  };

  const removeUserFromCourse = async (userId: string) => {
    const user = adminUsers.find((u) => u.id === userId);
    await updateUser(
      userId,
      {
        courseIds: (user?.courseIds || []).filter((id) => id !== courseId),
      },
      {
        toastSuccessMessage: `${user?.name} har ikke længere adgang til ${courses[courseId].label}`,
        logArgs: {
          courseId,
          description: `${actor} fjernede ${user?.name}s adgang til ${courses[courseId].label}`,
        },
      },
    );
  };

  const deleteCourse = async () => {
    const currentMembers = students.filter((s) => s.courseId === courseId);
    if (currentMembers.length > 0) return;
    const holdBeingDeleted = courses[courseId];
    const linkedElsewhere = students.filter((s) =>
      (s.courseLinks || []).some((l) => l.courseId === courseId),
    ).length;
    await deleteCourseApi(courseId);
    await Promise.all(
      adminUsers
        .filter((u) => (u.courseIds || []).includes(courseId))
        .map((u) =>
          updateUser(u.id, {
            courseIds: u.courseIds.filter((id) => id !== courseId),
          }),
        ),
    );
    recordFeedback({
      toastSuccessMessage: `${holdBeingDeleted.label} slettet`,
      logArgs: {
        description: `${actor} slettede ${holdBeingDeleted.label} permanent — jf. GDPR${
          linkedElsewhere > 0
            ? `. ${linkedElsewhere} kursist(er) på andre hold har fortsat gyldige timer herfra; holdnavnet vises nu som "(slettet)" i deres historik`
            : ""
        }`,
      },
    });
    onToggle();
    setConfirmDeleteCourseId(null);
  };

  const applyToCourse = async () => {
    const members = students.filter((s) => s.courseId === courseId);
    await Promise.all(
      members.map((s) => {
        const existing = s.courseLinks || [];
        if (draftOn) {
          const already = existing.some((l) => l.courseId === draftFrom);
          const updated = already
            ? existing.map((l) =>
                l.courseId === draftFrom ? { ...l, included: true } : l,
              )
            : [...existing, { courseId: draftFrom, included: true }];
          return updateStudent(s.id, { courseLinks: updated });
        }
        return updateStudent(s.id, {
          courseLinks: existing.map((l) =>
            l.courseId === draftFrom ? { ...l, included: false } : l,
          ),
        });
      }),
    );
    recordFeedback({
      toastSuccessMessage: draftOn
        ? `Anvendt på ${members.length} kursister i ${courses[courseId].label}`
        : `Slået fra for ${members.length} kursister i ${courses[courseId].label}`,
      logArgs: {
        courseId,
        description: draftOn
          ? `${actor} anvendte timeoverførsel fra ${courses[draftFrom]?.label || draftFrom} på hele ${courses[courseId].label} (${members.length} kursister)`
          : `${actor} slog timeoverførsel fra ${courses[draftFrom]?.label || draftFrom} fra for hele ${courses[courseId].label} (${members.length} kursister)`,
      },
    });
    onToggle();
  };

  const removeFromCourse = async (fromCourseId: string) => {
    let hoursWithdrawnTotal = 0;
    let affectedCount = 0;
    const members = students.filter((s) => s.courseId === courseId);
    await Promise.all(
      members.map((s) => {
        const existing = s.courseLinks || [];
        const link = existing.find((l) => l.courseId === fromCourseId);
        if (!link) return Promise.resolve();
        affectedCount += 1;
        if (link.included) {
          hoursWithdrawnTotal += entries
            .filter((e) => e.studentId === s.id && e.courseId === fromCourseId)
            .reduce((sum, e) => sum + Number(e.hours), 0);
        }
        return updateStudent(s.id, {
          courseLinks: existing.filter((l) => l.courseId !== fromCourseId),
        });
      }),
    );
    recordFeedback({
      toastSuccessMessage: `Overførsel fjernet helt — ${hoursWithdrawnTotal} timer trukket tilbage for ${affectedCount} kursister`,
      logArgs: {
        courseId,
        description: `${actor} fjernede timeoverførslen fra ${courses[fromCourseId]?.label || fromCourseId} helt for ${courses[courseId].label} (${affectedCount} kursister berørt, ${hoursWithdrawnTotal} timer trukket ud af regnskabet igen)`,
      },
    });
    setConfirmRemoveCourseId(null);
    onToggle();
  };

  const addSingleStudent = async () => {
    if (!addName || !addEmail) {
      setAddResult({ error: "Udfyld både navn og email." });
      return;
    }
    const name = addName.trim();
    const email = addEmail.trim();
    const exists = students.some(
      (s) => s.email.toLowerCase() === email.toLowerCase(),
    );
    if (exists) {
      setAddResult({ duplicate: { name, email } });
      return;
    }
    await createStudent(
      {
        name,
        email,
        courseId,
        courseLinks: [],
      },
      {
        toastSuccessMessage: `${name} tilføjet til ${courses[courseId].label}`,
        logArgs: (student) => ({
          studentId: student.id,
          courseId,
          description: `${actor} tilføjede ${name} til ${courses[courseId].label}`,
        }),
      },
    );
    setAddResult({ added: { name, email } });
    setAddName("");
    setAddEmail("");
  };

  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target?.files?.[0];
    event.target.value = "";
    if (!file) return;
    setImportingCourseId(courseId);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

        const added: Student[] = [];
        const duplicates: { name: string; email: string }[] = [];
        const skipped: { name: string; email: string }[] = [];
        const knownEmails = new Set(students.map((s) => s.email.toLowerCase()));

        for (const row of rows) {
          const rowData = Object.fromEntries(
            Object.entries(row as Record<string, unknown>).map(
              ([key, value]) => [key.trim().toLowerCase(), value],
            ),
          );
          const name = String(rowData["navn"] ?? rowData["name"] ?? "").trim();
          const email = String(
            rowData["email"] ?? rowData["e-mail"] ?? rowData["mail"] ?? "",
          ).trim();
          if (!name || !email) {
            skipped.push({ name, email });
            continue;
          }
          if (knownEmails.has(email.toLowerCase())) {
            duplicates.push({ name, email });
            continue;
          }
          const created = await createStudent({
            name,
            email,
            courseId,
            courseLinks: [],
          });
          knownEmails.add(email.toLowerCase());
          added.push(created);
        }

        if (added.length > 0) {
          recordFeedback({
            logArgs: {
              courseId,
              description: `${actor} importerede ${added.length} kursister til ${courses[courseId].label} fra Excel`,
            },
          });
        }
        setImportResult({
          added,
          duplicates,
          skipped,
        });
      } catch (err) {
        setImportResult({ error: "Fejl ved import af Excel-fil" });
      }
      setImportingCourseId(null);
    };
    reader.readAsArrayBuffer(file);
  };

  const members = students.filter((s) => s.courseId === h.id);
  const onCount = members.filter((s) =>
    (s.courseLinks || []).some((l) => l.included),
  ).length;
  const windowCourses = coursesWithinTransferWindow(h.id, courses);

  return (
    <div
      className="mb-2.5 overflow-hidden rounded-[14px] border border-border bg-card"
      key={h.id}
      id={`hold-card-${h.id}`}
    >
      <button
        className="flex w-full cursor-pointer items-center gap-2.5 border-0 bg-transparent px-4 py-3.5 text-left font-sans"
        onClick={onToggle}
      >
        <div>
          <div className="text-sm font-semibold">{h.label}</div>
          <div className="mt-px text-xs text-ink-soft">
            {programName(h, programs) ? `${programName(h, programs)} · ` : ""}
            Oprettet {h.startYear} · {members.length} kursister
          </div>
        </div>
        {onCount > 0 && (
          <span
            className="flex items-center gap-1 font-mono text-[11px] font-semibold"
            style={{ color: "var(--secondary)" }}
          >
            <ArrowRightLeft size={12} /> {onCount}/{members.length} overfører
          </span>
        )}
        <ChevronDown
          size={16}
          className={`shrink-0 text-ink-soft transition-transform duration-150 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="border-t border-border px-4 pb-4 pt-3.5">
          <Field
            label="Uddannelse"
            hint="Hvilken uddannelse hører dette hold under?"
          >
            <div className="relative">
              <select
                value={editProgramId ?? ""}
                onChange={(e) => setEditProgramId(e.target.value)}
              >
                {Object.values(programs).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft"
              />
            </div>
          </Field>
          <Field
            label="Courseets delmål"
            hint="Hvor mange timer bidrager netop dette hold/år med i hver kategori?"
          >
            <div className="flex gap-3">
              {Object.values(CATEGORIES).map((c) => (
                <div key={c.key} style={{ flex: 1 }}>
                  <label
                    className="mt-1 block text-[11px] text-ink-soft"
                    style={{ display: "block", marginBottom: 4 }}
                  >
                    {c.short}
                  </label>
                  <input
                    type="number"
                    value={editTargets[c.key] ?? 0}
                    onChange={(e) =>
                      setEditTargets({
                        ...editTargets,
                        [c.key]: Number(e.target.value),
                      })
                    }
                  />
                </div>
              ))}
            </div>
          </Field>
          <button
            className="inline-flex flex-none cursor-pointer items-center gap-1.5 rounded-full border-0 bg-primary-soft px-3 py-1.5 font-sans text-xs font-semibold text-primary"
            style={{ marginBottom: 16 }}
            onClick={saveCourseProgram}
          >
            Gem uddannelse og delmål
          </button>

          <div
            className="mb-1.5 block text-xs font-semibold text-ink-soft"
            style={{ marginBottom: 8 }}
          >
            Administratorer og undervisere på dette hold
          </div>
          {adminUsers
            .filter(
              (u) => u.allCourses || (u.courseIds || []).includes(h.id),
            )
            .map((u) => (
              <div
                className="flex items-center justify-between gap-2.5 border-b border-border py-2.5 last:border-b-0"
                key={u.id}
              >
                <div>
                  <div
                    className="text-sm font-semibold"
                    style={{ fontSize: 13 }}
                  >
                    {u.name}
                  </div>
                  <div className="mt-px text-xs text-ink-soft">
                    {ADMIN_ROLES[u.role]?.label || u.role}
                    {u.allCourses ? " · Alle hold" : ""}
                  </div>
                </div>
                {u.allCourses ? (
                  <span className="shrink-0 rounded-full border border-primary px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.04em] text-primary">
                    Alle hold
                  </span>
                ) : (
                  <button
                    className="flex cursor-pointer rounded-lg border-[1.5px] border-border bg-paper p-1.5 text-ink-soft hover:border-primary hover:text-primary disabled:cursor-default disabled:opacity-35"
                    onClick={() => removeUserFromCourse(u.id)}
                    title="Fjern adgang til dette hold"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
          {adminUsers.filter(
            (u) => u.allCourses || (u.courseIds || []).includes(h.id),
          ).length === 0 && (
            <p
              className="mt-1 block text-[11px] text-ink-soft"
              style={{ marginBottom: 10 }}
            >
              Ingen administratorer eller undervisere har adgang til dette hold
              endnu.
            </p>
          )}
          {adminUsers.filter(
            (u) => !u.allCourses && !(u.courseIds || []).includes(h.id),
          ).length > 0 && (
            <div className="mt-3.5 flex flex-wrap items-center gap-2">
              <div className="relative" style={{ flex: 1 }}>
                <select
                  value={addUserId ?? ""}
                  onChange={(e) => setAddUserId(e.target.value)}
                >
                  <option value="">Vælg administrator eller underviser…</option>
                  {adminUsers
                    .filter(
                      (u) =>
                        !u.allCourses && !(u.courseIds || []).includes(h.id),
                    )
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} · {ADMIN_ROLES[u.role]?.label || u.role}
                      </option>
                    ))}
                </select>
                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft"
                />
              </div>
              <button
                className="inline-flex flex-none cursor-pointer items-center gap-1.5 rounded-full border-0 bg-primary-soft px-3 py-1.5 font-sans text-xs font-semibold text-primary"
                onClick={addUserToCourse}
              >
                <PlusCircle size={14} /> Giv adgang
              </button>
            </div>
          )}
          <div
            className="mt-4 flex items-center gap-2"
            style={{ margin: "16px 0" }}
          >
            <span className="stitch-line" />
          </div>

          <div
            className="mb-1.5 block text-xs font-semibold text-ink-soft"
            style={{ marginBottom: 4 }}
          >
            Overfør kursister fra et andet hold
          </div>
          <p
            className="mt-1 block text-[11px] text-ink-soft"
            style={{ marginBottom: 10 }}
          >
            Til når en hel årgang rykker videre til dette hold (fx fra år 1 til
            år 2). Flytter kursisterne hertil og viderefører automatisk deres
            optjente timer fra kildeholdet.
          </p>
          <div className="relative" style={{ marginBottom: 10 }}>
            <select
              value={transferSourceId}
              onChange={(e) => {
                setTransferSourceId(e.target.value);
                setConfirmTransferRoster(false);
              }}
            >
              <option value="">Vælg kildehold…</option>
              {Object.values(courses)
                .filter((src) => src.id !== h.id)
                .map((src) => (
                  <option key={src.id} value={src.id}>
                    {src.label} (
                    {students.filter((s) => s.courseId === src.id).length}{" "}
                    kursister)
                  </option>
                ))}
            </select>
            <ChevronDown
              size={16}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft"
            />
          </div>
          {transferSourceId &&
            (confirmTransferRoster ? (
              <div className="mb-1">
                <div className="flex items-start gap-1.5 py-2 text-xs leading-normal text-secondary">
                  <AlertTriangle size={14} />
                  {
                    students.filter((s) => s.courseId === transferSourceId)
                      .length
                  }{" "}
                  kursister flyttes fra {courses[transferSourceId].label} til{" "}
                  {h.label}, og {courses[transferSourceId].label} beholdes som
                  tidligere hold, så deres timer fortsætter med at tælle.
                </div>
                <div
                  className="mt-4.5 flex gap-2.5"
                  style={{ marginTop: 10 }}
                >
                  <button
                    className="flex-1 cursor-pointer rounded-[10px] border-[1.5px] border-border bg-transparent px-4 py-3 font-sans text-sm font-semibold text-ink-soft transition-opacity active:opacity-75 disabled:cursor-default disabled:opacity-45"
                    onClick={() => setConfirmTransferRoster(false)}
                  >
                    Annuller
                  </button>
                  <button
                    className="flex-1 cursor-pointer rounded-[10px] border-0 bg-primary px-4 py-3 font-sans text-sm font-semibold text-on-primary transition-opacity active:opacity-75 disabled:cursor-default disabled:opacity-45"
                    onClick={transferRoster}
                  >
                    Ja, overfør kursisterne
                  </button>
                </div>
              </div>
            ) : (
              <button
                className="flex-1 cursor-pointer rounded-[10px] border-0 bg-primary px-4 py-3 font-sans text-sm font-semibold text-on-primary transition-opacity active:opacity-75 disabled:cursor-default disabled:opacity-45"
                style={{ width: "100%", marginBottom: 16 }}
                onClick={() => setConfirmTransferRoster(true)}
                disabled={
                  students.filter((s) => s.courseId === transferSourceId)
                    .length === 0
                }
              >
                <ArrowRightLeft size={14} /> Overfør{" "}
                {
                  students.filter((s) => s.courseId === transferSourceId)
                    .length
                }{" "}
                kursister til {h.label}
              </button>
            ))}

          <div
            className="mt-4 flex items-center gap-2"
            style={{ margin: "16px 0" }}
          >
            <span className="stitch-line" />
          </div>

          <div
            className="mb-1.5 block text-xs font-semibold text-ink-soft"
            style={{ marginBottom: 8 }}
          >
            Tilføj en enkelt kursist
          </div>
          <div className="flex gap-3">
            <Field label="Navn">
              <input
                type="text"
                value={addName ?? ""}
                onChange={(e) => setAddName(e.target.value)}
                placeholder="Fulde navn"
              />
            </Field>
            <Field label="Email">
              <input
                type="email"
                value={addEmail ?? ""}
                onChange={(e) => setAddEmail(e.target.value)}
                placeholder="navn@email.dk"
              />
            </Field>
          </div>
          <button
            className="inline-flex flex-none cursor-pointer items-center gap-1.5 rounded-full border-0 bg-primary-soft px-3 py-1.5 font-sans text-xs font-semibold text-primary"
            onClick={addSingleStudent}
          >
            <User size={14} /> Tilføj kursist
          </button>

          {addResult && (
            <div className="mb-1">
              {addResult.error && (
                <div className="flex items-start gap-1.5 py-2 text-xs leading-normal text-secondary">
                  <AlertTriangle size={14} /> {addResult.error}
                </div>
              )}
              {addResult.duplicate && (
                <div className="flex items-start gap-1.5 py-2 text-xs leading-normal text-secondary">
                  <AlertTriangle size={14} />{" "}
                  {addResult.duplicate?.name || addResult.duplicate?.email}{" "}
                  findes allerede som kursist og blev ikke oprettet på ny.
                </div>
              )}
              {addResult.added && (
                <div className="flex items-start gap-1.5 py-2 text-xs leading-normal text-ink">
                  <Check size={14} /> {addResult.added?.name} tilføjet til{" "}
                  {h.label}.
                </div>
              )}
            </div>
          )}

          <div
            className="mt-4 flex items-center gap-2"
            style={{ margin: "16px 0" }}
          >
            <span className="stitch-line" />
          </div>

          <div
            className="mb-1.5 block text-xs font-semibold text-ink-soft"
            style={{ marginBottom: 8 }}
          >
            Tilføj flere kursister
          </div>
          <label className="inline-flex w-auto flex-none cursor-pointer items-center gap-2 rounded-[10px] border-[1.5px] border-border bg-transparent px-4 py-3 font-sans text-sm font-semibold text-ink-soft transition-opacity active:opacity-75 disabled:cursor-default disabled:opacity-45">
            <Upload size={14} />
            {importingCourseId === h.id ? "Importerer..." : "Importér fra Excel"}
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              style={{ display: "none" }}
              onChange={handleImportFile}
            />
          </label>
          <p
            className="mt-1 block text-[11px] text-ink-soft"
            style={{ margin: "6px 0 16px" }}
          >
            Filen skal have kolonnerne "Navn" og "Email". Kursister der allerede
            findes (samme email), bliver ikke oprettet på ny.
          </p>

          {importResult && importResult.courseId === h.id && (
            <div className="mb-1">
              {importResult.error ? (
                <div className="flex items-start gap-1.5 py-2 text-xs leading-normal text-secondary">
                  <AlertTriangle size={14} /> Kunne ikke læse "
                  {importResult.fileName}". Tjek at filen er en gyldig Excel-
                  eller CSV-fil.
                </div>
              ) : (
                <>
                  <div className="flex items-start gap-1.5 py-2 text-xs leading-normal text-ink">
                    <FileSpreadsheet size={14} />{" "}
                    {importResult.added?.length ?? 0} kursister importeret fra "
                    {importResult.fileName}".
                  </div>
                  {(importResult.duplicates?.length ?? 0) > 0 && (
                    <div className="flex items-start gap-1.5 py-2 text-xs leading-normal text-secondary">
                      <AlertTriangle size={14} />
                      {importResult.duplicates?.length ?? 0} findes allerede og
                      blev ikke oprettet:{" "}
                      {importResult.duplicates
                        ?.map((d) => d.name || d.email)
                        .join(", ")}
                    </div>
                  )}
                  {(importResult.skipped?.length ?? 0) > 0 && (
                    <div className="flex items-start gap-1.5 py-2 text-xs leading-normal text-secondary">
                      <AlertTriangle size={14} />
                      {importResult.skipped?.length ?? 0} rækker manglede navn
                      eller email og blev sprunget over.
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          <div
            className="mt-4 flex items-center gap-2"
            style={{ margin: "6px 0 16px" }}
          >
            <span className="stitch-line" />
          </div>

          <ToggleButton
            label="Overfør timer fra andet hold for hele holdet"
            checked={draftOn}
            onChange={setDraftOn}
          />
          {draftOn && (
            <Field
              label="Overfør fra hold"
              hint={
                windowCourses.length === 0
                  ? "Ingen hold inden for 5-års-vinduet."
                  : undefined
              }
            >
              <div className="relative">
                <select
                  value={draftFrom}
                  onChange={(e) => setDraftFrom(e.target.value)}
                >
                  {windowCourses.map((oh) => (
                    <option key={oh.id} value={oh.id}>
                      {oh.label} · {oh.startYear}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft"
                />
              </div>
            </Field>
          )}
          <p className="mb-3.5 text-[13px] leading-normal text-ink-soft">
            Denne indstilling anvendes på alle {members.length} kursister i{" "}
            {h.label}.
          </p>
          <button
            className="flex-1 cursor-pointer rounded-[10px] border-0 bg-primary px-4 py-3 font-sans text-sm font-semibold text-on-primary transition-opacity active:opacity-75 disabled:cursor-default disabled:opacity-45"
            style={{ width: "100%" }}
            onClick={applyToCourse}
          >
            Anvend på hele holdet
          </button>

          {draftFrom &&
            members.some((s) =>
              (s.courseLinks || []).some((l) => l.courseId === draftFrom),
            ) &&
            (confirmRemoveCourseId === draftFrom ? (
              <div className="mb-1">
                <div className="flex items-start gap-1.5 py-2 text-xs leading-normal text-secondary">
                  <AlertTriangle size={14} />
                  Sikker på at overførslen fra{" "}
                  {courses[draftFrom]?.label || draftFrom} skal fjernes helt for
                  hele {h.label}? Timerne trækkes automatisk ud af regnskabet
                  igen for alle berørte kursister.
                </div>
                <div
                  className="mt-4.5 flex gap-2.5"
                  style={{ marginTop: 10 }}
                >
                  <button
                    className="flex-1 cursor-pointer rounded-[10px] border-[1.5px] border-border bg-transparent px-4 py-3 font-sans text-sm font-semibold text-ink-soft transition-opacity active:opacity-75 disabled:cursor-default disabled:opacity-45"
                    onClick={() => setConfirmRemoveCourseId(null)}
                  >
                    Annuller
                  </button>
                  <button
                    className="flex-1 cursor-pointer rounded-[10px] border-0 bg-primary px-4 py-3 font-sans text-sm font-semibold text-on-primary transition-opacity active:opacity-75 disabled:cursor-default disabled:opacity-45"
                    onClick={() => removeFromCourse(draftFrom)}
                  >
                    Ja, fjern helt
                  </button>
                </div>
              </div>
            ) : (
              <button
                className="flex-1 cursor-pointer rounded-[10px] border-[1.5px] border-border bg-transparent px-4 py-3 font-sans text-sm font-semibold text-ink-soft transition-opacity active:opacity-75 disabled:cursor-default disabled:opacity-45"
                style={{
                  width: "100%",
                  marginTop: 10,
                  color: "var(--secondary)",
                  borderColor: "var(--secondary)",
                }}
                onClick={() => setConfirmRemoveCourseId(draftFrom as string)}
                title="Brug denne hvis overførslen ved en fejl blev sat op med det forkerte hold"
              >
                <Trash2 size={14} /> Fjern denne overførsel helt for hele holdet
              </button>
            ))}

          <div
            className="mt-4 flex items-center gap-2"
            style={{ margin: "20px 0" }}
          >
            <span className="stitch-line" />
          </div>

          <div
            className="mb-2.5 mt-5.5 font-display text-[15px] font-semibold text-ink"
            style={{ color: "var(--secondary)", marginTop: 0 }}
          >
            <AlertTriangle
              size={14}
              style={{ verticalAlign: -2, marginRight: 6 }}
            />
            Faresone
          </div>

          {members.length > 0 ? (
            <>
              <p
                className="mb-3.5 text-[13px] leading-normal text-ink-soft"
                style={{ marginTop: -6 }}
              >
                Holdet kan ikke slettes, så længe der er {members.length}{" "}
                kursister tilknyttet. Flyt dem til et andet hold, eller slet dem
                permanent, én for én, fra deres kursistdetalje — klik på en
                kursist herunder for at gå direkte dertil.
              </p>
              <div
                className="flex flex-col gap-2 rounded-[10px] border-[1.5px] border-border bg-card px-3 py-2.5"
                style={{ marginBottom: 12 }}
              >
                {members.map((m) => (
                  <button
                    key={m.id}
                    className="mt-3.5 cursor-pointer border-0 bg-transparent text-center font-sans text-[13px] font-semibold text-primary"
                    style={{ margin: 0, textAlign: "left" }}
                    onClick={() => navigate(routes.adminStudent(m.id))}
                  >
                    {m.name}
                  </button>
                ))}
              </div>
            </>
          ) : confirmDeleteCourseId === h.id ? (
            <div className="my-4.5 mb-1.5 rounded-xl border-[1.5px] border-dashed border-border p-3.5">
              <div
                className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-soft"
                style={{ color: "var(--secondary)" }}
              >
                Bekræft sletning
              </div>
              <p
                className="mb-3.5 text-[13px] leading-normal text-ink-soft"
                style={{ margin: "6px 0 10px" }}
              >
                {h.label} slettes permanent. Kursister, der historisk har fået
                overført timer herfra til et andet, aktivt hold, beholder deres
                timer — holdnavnet vises blot som "(slettet)" i deres historik.
              </p>
              <div className="mt-4.5 flex gap-2.5">
                <button
                  className="flex-1 cursor-pointer rounded-[10px] border-[1.5px] border-border bg-transparent px-4 py-3 font-sans text-sm font-semibold text-ink-soft transition-opacity active:opacity-75 disabled:cursor-default disabled:opacity-45"
                  onClick={() => setConfirmDeleteCourseId(null)}
                >
                  Annuller
                </button>
                <button
                  className="flex-1 cursor-pointer rounded-[10px] border-0 bg-primary px-4 py-3 font-sans text-sm font-semibold text-on-primary transition-opacity active:opacity-75 disabled:cursor-default disabled:opacity-45"
                  style={{
                    background: "var(--secondary)",
                    borderColor: "var(--secondary)",
                  }}
                  onClick={deleteCourse}
                >
                  Ja, slet permanent
                </button>
              </div>
            </div>
          ) : (
            <button
              className="flex-1 cursor-pointer rounded-[10px] border-[1.5px] border-border bg-transparent px-4 py-3 font-sans text-sm font-semibold text-ink-soft transition-opacity active:opacity-75 disabled:cursor-default disabled:opacity-45"
              style={{
                width: "100%",
                color: "var(--secondary)",
                borderColor: "var(--secondary)",
              }}
              onClick={() => setConfirmDeleteCourseId(h.id)}
            >
              <Trash2 size={14} /> Slet hold permanent (GDPR)
            </button>
          )}
        </div>
      )}
    </div>
  );
}
