import { useState } from "react";
import {
  PlusCircle,
  Pencil,
  Trash2,
  Check,
  X,
  ChevronDown,
  ArrowLeft,
  History,
  AlertTriangle,
  Clock3,
} from "lucide-react";
import { useCatalog } from "../../context/CatalogContext";
import { useCourses } from "../../context/CoursesContext";
import { useStudents } from "../../context/StudentsContext";
import { useEntries } from "../../context/EntriesContext";
import { useAuditLogs } from "../../context/AuditLogsContext";
import { categoryOf } from "../../domain/catalog";
import {
  totalsForStudent,
  totalsForStudentOnHold,
  targetsForStudent,
  programName,
  coursesWithinTransferWindow,
  holdLabel,
} from "../../domain/totals";
import { formatLogTime } from "../../domain/format";
import { emptyForm } from "../../domain/entryForm";

import { Field } from "../../components/ui/Field";
import { CategoryCard } from "../../components/ui/CategoryCard";
import { EntryForm } from "../../components/ui/EntryForm";
import { Student } from "@/types/user";
import { TimeEntry } from "@/types/entry";
import { useNavigate } from "react-router-dom";
import { routes } from "@/routes";

type AdminDetailViewProps = {};
export const AdminDetailView = ({}: AdminDetailViewProps) => {
  const navigate = useNavigate();
  const { CATEGORIES, ALL_CATEGORIES, LEARNING_GOALS, programs } = useCatalog();
  const { courses } = useCourses();
  const {
    students,
    selectedStudent,
    updateStudent: persistStudent,
    deleteStudent: removeStudentApi,
  } = useStudents();
  const { entries, createEntry, updateEntry, deleteEntry } = useEntries();
  const { auditLogs, logEvent } = useAuditLogs();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(
    emptyForm(selectedStudent?.courseId || "", CATEGORIES, LEARNING_GOALS),
  );
  const [addingNew, setAddingNew] = useState(false);
  const [newForm, setNewForm] = useState(
    emptyForm(selectedStudent?.courseId || "", CATEGORIES, LEARNING_GOALS),
  );
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [scope, setScope] = useState("uddannelse");
  const [confirmRemoveCourseId, setConfirmRemoveCourseId] = useState<
    string | null
  >(null);
  const [showMoveHold, setShowMoveHold] = useState(false);
  const [moveTargetId, setMoveTargetId] = useState("");
  const [moveKeepAsLink, setMoveKeepAsLink] = useState(true);
  const [confirmDeleteStudent, setConfirmDeleteStudent] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editName, setEditName] = useState(selectedStudent?.name || "");
  const [editEmail, setEditEmail] = useState(selectedStudent?.email || "");
  const [profileError, setProfileError] = useState("");
  const [toast, setToast] = useState("");
  const [addcourseId, setAddcourseId] = useState("");

  if (!selectedStudent) {
    return <div>Kursist ikke fundet</div>;
  }

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  };

  const totalsWholeProgram = totalsForStudent(
    selectedStudent,
    entries,
    CATEGORIES,
  );
  const targetsWholeProgram = targetsForStudent(
    selectedStudent,
    courses,
    CATEGORIES,
  );
  const totalsThisHold = totalsForStudentOnHold(
    selectedStudent,
    entries,
    selectedStudent?.courseId || "",
    CATEGORIES,
  );
  const targetsThisHold =
    courses[selectedStudent?.courseId || ""].targets || {};
  const includedLinks = (selectedStudent?.courseLinks || []).filter(
    (l) => l.included,
  );
  const totals = scope === "hold" ? totalsThisHold : totalsWholeProgram;
  const targets = scope === "hold" ? targetsThisHold : targetsWholeProgram;
  const studentEntries = entries
    .filter((e) => e.studentId === selectedStudent.id)
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  const availableHoldsToAdd = coursesWithinTransferWindow(
    selectedStudent.courseId,
    courses,
  ).filter(
    (h) =>
      !(selectedStudent.courseLinks || []).some((l) => l.courseId === h.id),
  );

  const holdOptions = [
    courses[selectedStudent.courseId],
    ...Object.values(courses).filter((h) => h.id !== selectedStudent.courseId),
  ];

  const studentLog = auditLogs.filter(
    (log) => log.studentId === selectedStudent.id,
  );
  const patchStudent = async (patch: Partial<Student>) => {
    await persistStudent(selectedStudent.id, patch);
  };

  const startEditProfile = () => {
    setEditName(selectedStudent.name);
    setEditEmail(selectedStudent.email);
    setProfileError("");
    setEditingProfile(true);
  };

  const saveProfile = async () => {
    const trimmedName = editName.trim();
    const trimmedEmail = editEmail.trim();
    if (!trimmedName || !trimmedEmail) {
      setProfileError("Udfyld både navn og email.");
      return;
    }
    if (
      students.some(
        (s) =>
          s.id !== selectedStudent.id &&
          s.email.toLowerCase() === trimmedEmail.toLowerCase(),
      )
    ) {
      setProfileError("En anden kursist bruger allerede denne email.");
      return;
    }
    const oldName = selectedStudent.name;
    const oldEmail = selectedStudent.email;
    await patchStudent({ name: trimmedName, email: trimmedEmail });
    const changes = [];
    if (trimmedName !== oldName)
      changes.push(`navn fra "${oldName}" til "${trimmedName}"`);
    if (trimmedEmail !== oldEmail)
      changes.push(`email fra "${oldEmail}" til "${trimmedEmail}"`);
    if (changes.length > 0) {
      void logEvent({
        actor: "Administrator",
        studentId: selectedStudent.id,
        description: `Administrator ændrede ${changes.join(" og ")}`,
      });
      showToast("Oplysninger opdateret");
    }
    setEditingProfile(false);
  };

  const addHoldLink = async () => {
    if (!addcourseId) return;
    await patchStudent({
      courseLinks: [
        ...(selectedStudent.courseLinks || []),
        { courseId: addcourseId, included: true },
      ],
    });
    void logEvent({
      actor: "Administrator",
      studentId: selectedStudent.id,
      description: `Administrator tilføjede ${courses[addcourseId]?.label || addcourseId} til ${selectedStudent.name}s holdhistorik`,
    });
    showToast(`${courses[addcourseId]?.label} tilføjet`);
  };

  const toggleHoldLink = async (courseId: string) => {
    const link = (selectedStudent.courseLinks || []).find(
      (l) => l.courseId === courseId,
    );
    const nowIncluded = !link?.included;
    await patchStudent({
      courseLinks: (selectedStudent.courseLinks || []).map((l) =>
        l.courseId === courseId ? { ...l, included: nowIncluded } : l,
      ),
    });
    void logEvent({
      actor: "Administrator",
      studentId: selectedStudent.id,
      description: nowIncluded
        ? `Administrator lod timer fra ${courses[courseId]?.label || courseId} tælle med for ${selectedStudent.name}`
        : `Administrator udelod timer fra ${courses[courseId]?.label || courseId} for ${selectedStudent.name}`,
    });
  };

  const removeHoldLink = async (courseId: string) => {
    const wasIncluded = (selectedStudent.courseLinks || []).some(
      (l) => l.courseId === courseId && l.included,
    );
    const hoursFromHold = wasIncluded
      ? entries
          .filter(
            (e) =>
              e.studentId === selectedStudent.id && e.courseId === courseId,
          )
          .reduce((sum, e) => sum + Number(e.hours), 0)
      : 0;
    await patchStudent({
      courseLinks: (selectedStudent.courseLinks || []).filter(
        (l) => l.courseId !== courseId,
      ),
    });
    void logEvent({
      actor: "Administrator",
      studentId: selectedStudent.id,
      description: wasIncluded
        ? `Administrator fjernede overførslen fra ${courses[courseId]?.label || courseId} for ${selectedStudent.name} — ${hoursFromHold} timer blev trukket ud af regnskabet igen`
        : `Administrator fjernede ${courses[courseId]?.label || courseId} fra ${selectedStudent.name}s holdhistorik`,
    });
    showToast(
      wasIncluded
        ? `Overførsel fjernet — ${hoursFromHold} timer trukket tilbage`
        : `${courses[courseId]?.label || courseId} fjernet fra holdhistorik`,
    );
    setConfirmRemoveCourseId(null);
  };

  const moveToHold = async () => {
    if (!moveTargetId || moveTargetId === selectedStudent.courseId) {
      setShowMoveHold(false);
      return;
    }
    const oldcourseId = selectedStudent.courseId;
    const oldHoldLabel = courses[oldcourseId]?.label || oldcourseId;
    const newHoldLabel = courses[moveTargetId]?.label || moveTargetId;
    const restOfLinks = (selectedStudent.courseLinks || []).filter(
      (l) => l.courseId !== oldcourseId && l.courseId !== moveTargetId,
    );
    const newLinks = moveKeepAsLink
      ? [...restOfLinks, { courseId: oldcourseId, included: true }]
      : restOfLinks;
    await patchStudent({ courseId: moveTargetId, courseLinks: newLinks });
    void logEvent({
      actor: "Administrator",
      studentId: selectedStudent.id,
      description: moveKeepAsLink
        ? `Administrator flyttede ${selectedStudent.name} fra ${oldHoldLabel} til ${newHoldLabel} (${oldHoldLabel} beholdt som tidligere hold, timer tæller fortsat med)`
        : `Administrator flyttede ${selectedStudent.name} fra ${oldHoldLabel} til ${newHoldLabel} (${oldHoldLabel} fjernet helt, fx pga. fejlregistrering)`,
    });
    showToast(`${selectedStudent.name} flyttet til ${newHoldLabel}`);
    setShowMoveHold(false);
    setMoveTargetId("");
    setMoveKeepAsLink(true);
  };

  const handleDeleteStudent = async () => {
    const entryCount = entries.filter(
      (e) => e.studentId === selectedStudent.id,
    ).length;
    await removeStudentApi(selectedStudent.id);
    void logEvent({
      actor: "Administrator",
      studentId: selectedStudent.id,
      description: `Administrator slettede kursisten ${selectedStudent.name} (${selectedStudent.email}) permanent, inkl. ${entryCount} registreringer — jf. GDPR`,
    });
    navigate(-1);
  };

  const startEdit = (entry: TimeEntry) => {
    setEditingId(entry.id as string);
    setEditForm({ ...entry, hours: String(entry.hours) });
    setConfirmId(null);
    setAddingNew(false);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    await updateEntry(editingId, {
      ...editForm,
      hours: Number(editForm.hours),
    });
    void logEvent({
      actor: "Administrator",
      studentId: selectedStudent.id,
      description: `Administrator rettede en registrering for ${selectedStudent.name} (${categoryOf(ALL_CATEGORIES, editForm.category).label})`,
    });
    setEditingId(null);
    showToast("Registrering opdateret");
  };

  const removeEntry = async (id: string) => {
    const removed = entries.find((e) => e.id === id);
    await deleteEntry(id);
    if (removed) {
      void logEvent({
        actor: "Administrator",
        studentId: selectedStudent.id,
        description: `Administrator slettede en registrering på ${removed.hours} timer for ${selectedStudent.name} (${categoryOf(ALL_CATEGORIES, removed.category).label})`,
      });
    }
    setConfirmId(null);
    showToast("Registrering slettet");
  };

  const addEntry = async () => {
    if (!newForm.hours || Number(newForm.hours) <= 0) return;
    await createEntry({
      studentId: selectedStudent.id,
      ...newForm,
      hours: Number(newForm.hours),
    });
    void logEvent({
      actor: "Administrator",
      studentId: selectedStudent.id,
      description: `Administrator tilføjede ${newForm.hours} timer for ${selectedStudent.name} (${categoryOf(ALL_CATEGORIES, newForm.category).label})`,
    });
    setNewForm(emptyForm(selectedStudent.courseId, CATEGORIES, LEARNING_GOALS));
    setAddingNew(false);
    showToast("Registrering tilføjet");
  };

  const body = (
    <>
      <div className="px-5 pb-4.5 pt-6.5">
        <button
          className="inline-flex cursor-pointer items-center gap-1.5 border-0 bg-transparent p-0 font-sans text-[13px] font-semibold text-ink-soft"
          onClick={() => navigate(routes.adminStudents)}
        >
          <ArrowLeft size={15} /> Kursister
        </button>
        <div
          className="mt-2 flex items-start justify-between"
          style={{ marginTop: 10 }}
        >
          {editingProfile ? (
            <div style={{ flex: 1 }}>
              <div className="flex gap-3">
                <Field label="Navn">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                </Field>
                <Field label="Email">
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                  />
                </Field>
              </div>
              {profileError && (
                <div className="-mt-1.5 mb-3 text-xs text-terracotta">
                  {profileError}
                </div>
              )}
              <div className="mt-6 flex gap-2.5">
                <button
                  className="flex-1 cursor-pointer rounded-[10px] border-[1.5px] border-border bg-transparent px-4 py-3 font-sans text-sm font-semibold text-ink-soft transition-opacity active:opacity-75 disabled:cursor-default disabled:opacity-45"
                  onClick={() => setEditingProfile(false)}
                >
                  Annuller
                </button>
                <button
                  className="flex-1 cursor-pointer rounded-[10px] border-0 bg-blue px-4 py-3 font-sans text-sm font-semibold text-paper transition-opacity active:opacity-75 disabled:cursor-default disabled:opacity-45"
                  onClick={saveProfile}
                >
                  Gem
                </button>
              </div>
            </div>
          ) : (
            <>
              <div>
                <div
                  className="mb-0.5 font-display text-[28px] font-semibold"
                  style={{ fontSize: 22 }}
                >
                  {selectedStudent.name}
                </div>
                <div className="text-[13px] text-ink-soft">
                  {selectedStudent.email} ·{" "}
                  {courses[selectedStudent.courseId].label}
                </div>
              </div>
              <button
                className="flex cursor-pointer rounded-lg border-[1.5px] border-border bg-paper p-1.5 text-ink-soft hover:border-blue hover:text-blue disabled:cursor-default disabled:opacity-35"
                onClick={startEditProfile}
                title="Ret navn eller email"
              >
                <Pencil size={16} />
              </button>
            </>
          )}
        </div>
        <div className="mt-4 flex items-center gap-2">
          <span className="h-3 w-0.5 shrink-0 rounded-sm bg-surplus" />
          <span className="stitch-line" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-25 pt-1">
        <div className="mb-2.5 mt-5.5 font-display text-[15px] font-semibold text-ink">
          <Clock3 size={14} style={{ verticalAlign: -2, marginRight: 6 }} />
          Holdhistorik
        </div>
        <div className="mb-4 rounded-[14px] border border-border bg-card px-4.5 py-4">
          <p className="mb-3.5 text-[13px] leading-normal text-ink-soft">
            Kursister kan have gået på et andet hold eller kursus tidligere i
            uddannelsen. Her ses alle hold {selectedStudent.name} har været
            tilknyttet, og I kan bestemme hvilke af dem der skal tælle med i
            timeregnskabet. Kun hold oprettet inden for 5 år af{" "}
            {courses[selectedStudent.courseId].label} kan tilføjes, da
            uddannelsen forløber over op til 5 år.
          </p>

          <div className="flex items-center justify-between gap-2.5 border-b border-border py-2.5 last:border-b-0">
            <div>
              <div className="text-sm font-semibold" style={{ fontSize: 13 }}>
                {courses[selectedStudent.courseId].label} ·{" "}
                {courses[selectedStudent.courseId].startYear}
              </div>
              <div className="mt-px text-xs text-ink-soft">
                {programName(courses[selectedStudent.courseId], programs)
                  ? `${programName(courses[selectedStudent.courseId], programs)} · `
                  : ""}
                Nuværende hold · tæller altid med
              </div>
            </div>
            <span className="shrink-0 rounded-full border border-blue px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.04em] text-blue">
              Nuværende
            </span>
          </div>

          {showMoveHold ? (
            <div
              className="my-6 mb-1.5 rounded-xl border-[1.5px] border-dashed border-border p-3.5"
              style={{ marginTop: -6, marginBottom: 16 }}
            >
              <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-soft">
                Forkert hold tilknyttet?
              </div>
              <Field
                label="Flyt til hold"
                hint="Fx hvis kursisten ved en fejl er blevet tilknyttet det forkerte hold."
              >
                <div className="relative">
                  <select
                    value={moveTargetId}
                    onChange={(e) => setMoveTargetId(e.target.value)}
                  >
                    <option value="">Vælg hold…</option>
                    {Object.values(courses)
                      .filter((h) => h.id !== selectedStudent.courseId)
                      .map((h) => (
                        <option key={h.id} value={h.id}>
                          {h.label} · {h.startYear}
                        </option>
                      ))}
                  </select>
                  <ChevronDown
                    size={16}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft"
                  />
                </div>
              </Field>
              <label
                className="mb-1 flex cursor-pointer items-center justify-between text-[13px] font-semibold"
                style={{ marginTop: 4 }}
              >
                <span>
                  Behold {courses[selectedStudent.courseId].label} som tidligere
                  hold (timer tæller stadig med)
                </span>
                <span
                  className={`switch switch-sm ${moveKeepAsLink ? "on" : ""}`}
                  onClick={() => setMoveKeepAsLink(!moveKeepAsLink)}
                >
                  <span className="absolute top-0.75 left-0.75 h-5 w-5 rounded-full bg-card transition-[left] duration-150" />
                </span>
              </label>
              {!moveKeepAsLink && (
                <p
                  className="mt-1 block text-[11px] text-ink-soft"
                  style={{ color: "var(--terracotta)" }}
                >
                  {courses[selectedStudent.courseId].label} fjernes helt fra{" "}
                  {selectedStudent.name}s historik — brug kun dette, hvis
                  tilknytningen var en ren fejl.
                </p>
              )}
              <div className="mt-6 flex gap-2.5" style={{ marginTop: 10 }}>
                <button
                  className="flex-1 cursor-pointer rounded-[10px] border-[1.5px] border-border bg-transparent px-4 py-3 font-sans text-sm font-semibold text-ink-soft transition-opacity active:opacity-75 disabled:cursor-default disabled:opacity-45"
                  onClick={() => {
                    setShowMoveHold(false);
                    setMoveTargetId("");
                    setMoveKeepAsLink(true);
                  }}
                >
                  Annuller
                </button>
                <button
                  className="flex-1 cursor-pointer rounded-[10px] border-0 bg-blue px-4 py-3 font-sans text-sm font-semibold text-paper transition-opacity active:opacity-75 disabled:cursor-default disabled:opacity-45"
                  onClick={moveToHold}
                  disabled={!moveTargetId}
                >
                  Flyt kursisten
                </button>
              </div>
            </div>
          ) : (
            <button
              className="mt-3.5 cursor-pointer border-0 bg-transparent text-center font-sans text-[13px] font-semibold text-blue"
              style={{ marginTop: -6, marginBottom: 16 }}
              onClick={() => setShowMoveHold(true)}
            >
              Forkert hold tilknyttet? Flyt kursisten til et andet hold
            </button>
          )}

          {(selectedStudent.courseLinks || []).map((link) => (
            <div
              className="flex items-center justify-between gap-2.5 border-b border-border py-2.5 last:border-b-0"
              key={link.courseId}
            >
              <div>
                <div className="text-sm font-semibold" style={{ fontSize: 13 }}>
                  {holdLabel(link.courseId, courses)} ·{" "}
                  {courses[link.courseId]?.startYear || ""}
                </div>
                <div className="mt-px text-xs text-ink-soft">
                  {programName(courses[link.courseId], programs)
                    ? `${programName(courses[link.courseId], programs)} · `
                    : ""}
                  {link.included
                    ? "Tæller med i regnskabet"
                    : "Vises i historik, tæller ikke med"}
                </div>
              </div>
              {confirmRemoveCourseId === link.courseId ? (
                <div className="flex items-center gap-1.5 text-xs">
                  <span>Fjern helt?</span>
                  <button
                    className="flex cursor-pointer rounded-lg border-[1.5px] border-border bg-paper p-1.5 text-ink-soft hover:border-blue hover:text-blue disabled:cursor-default disabled:opacity-35"
                    onClick={() => removeHoldLink(link.courseId)}
                  >
                    <Check size={14} />
                  </button>
                  <button
                    className="flex cursor-pointer rounded-lg border-[1.5px] border-border bg-paper p-1.5 text-ink-soft hover:border-blue hover:text-blue disabled:cursor-default disabled:opacity-35"
                    onClick={() => setConfirmRemoveCourseId(null)}
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span
                    className={`switch switch-sm ${link.included ? "on" : ""}`}
                    onClick={() => toggleHoldLink(link.courseId)}
                  >
                    <span className="absolute top-0.75 left-0.75 h-5 w-5 rounded-full bg-card transition-[left] duration-150" />
                  </span>
                  <button
                    className="flex cursor-pointer rounded-lg border-[1.5px] border-border bg-paper p-1.5 text-ink-soft hover:border-blue hover:text-blue disabled:cursor-default disabled:opacity-35"
                    onClick={() => setConfirmRemoveCourseId(link.courseId)}
                    title="Fjern hold helt (fx hvis forkert hold blev tilknyttet)"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>
          ))}

          {availableHoldsToAdd.length > 0 ? (
            <div className="mt-3.5 flex flex-wrap items-center gap-2">
              <div className="relative" style={{ flex: 1 }}>
                <select
                  value={addcourseId}
                  onChange={(e) => setAddcourseId(e.target.value)}
                >
                  {availableHoldsToAdd.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.label} · {h.startYear}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft"
                />
              </div>
              <button
                className="inline-flex flex-none cursor-pointer items-center gap-1.5 rounded-full border-0 bg-blue-soft px-3 py-1.5 font-sans text-xs font-semibold text-blue"
                onClick={addHoldLink}
              >
                <PlusCircle size={14} /> Tilføj eksisterende hold
              </button>
            </div>
          ) : (
            <p
              className="mt-1 block text-[11px] text-ink-soft"
              style={{ marginTop: 10 }}
            >
              Ingen flere hold inden for 5-års-vinduet at tilføje.
            </p>
          )}
        </div>

        {includedLinks.length > 0 && (
          <div className="flex flex-wrap gap-2" style={{ marginBottom: 12 }}>
            <button
              className="cursor-pointer rounded-full border-[1.5px] px-3.5 py-2 text-[13px] font-semibold transition-all"
              style={{
                background:
                  scope === "uddannelse" ? "var(--ink)" : "var(--card)",
                color: scope === "uddannelse" ? "var(--card)" : "var(--ink)",
              }}
              onClick={() => setScope("uddannelse")}
            >
              Hele uddannelsen
            </button>
            <button
              className="cursor-pointer rounded-full border-[1.5px] px-3.5 py-2 text-[13px] font-semibold transition-all"
              style={{
                background: scope === "hold" ? "var(--ink)" : "var(--card)",
                color: scope === "hold" ? "var(--card)" : "var(--ink)",
              }}
              onClick={() => setScope("hold")}
            >
              Dette hold
            </button>
          </div>
        )}

        <div className="md:grid md:grid-cols-3 md:gap-3">
          {Object.values(CATEGORIES).map((cat) => (
            <CategoryCard
              key={cat.key}
              label={cat.label}
              registered={totals[cat.key]}
              target={targets[cat.key]}
              color={cat.color}
            />
          ))}
        </div>

        <div className="mt-5.5 flex items-center justify-between">
          <div
            className="mb-2.5 mt-5.5 font-display text-[15px] font-semibold text-ink"
            style={{ margin: 0 }}
          >
            Registreringer
          </div>
          {!addingNew && (
            <button
              className="inline-flex flex-none cursor-pointer items-center gap-1.5 rounded-full border-0 bg-blue-soft px-3 py-1.5 font-sans text-xs font-semibold text-blue"
              onClick={() => {
                setAddingNew(true);
                setEditingId(null);
                setNewForm(
                  emptyForm(
                    selectedStudent.courseId,
                    CATEGORIES,
                    LEARNING_GOALS,
                  ),
                );
              }}
            >
              <PlusCircle size={14} /> Tilføj
            </button>
          )}
        </div>

        {addingNew && (
          <div className="mb-2.5 rounded-xl border border-border bg-card px-3.5 py-3">
            <EntryForm
              values={newForm}
              onChange={setNewForm}
              onSubmit={addEntry}
              onCancel={() => setAddingNew(false)}
              submitLabel="Tilføj registrering"
              showHoldField
              holdOptions={holdOptions}
            />
          </div>
        )}

        {studentEntries.length === 0 && !addingNew && (
          <div className="px-2.5 py-10 text-center text-[13px] text-ink-soft">
            Ingen registreringer endnu.
          </div>
        )}

        {studentEntries.map((e) => {
          const cat = categoryOf(ALL_CATEGORIES, e.category);
          if (editingId === e.id) {
            return (
              <div
                className="mb-2.5 rounded-xl border border-border bg-card px-3.5 py-3"
                key={e.id}
              >
                <EntryForm
                  values={editForm}
                  onChange={setEditForm}
                  onSubmit={saveEdit}
                  onCancel={() => setEditingId(null)}
                  submitLabel="Gem ændring"
                  showHoldField
                  holdOptions={holdOptions}
                />
              </div>
            );
          }
          return (
            <div
              className="mb-2.5 rounded-xl border border-border bg-card px-3.5 py-3"
              key={e.id}
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ background: cat.color }}
                />
                <span
                  className="text-xs font-semibold"
                  style={{ color: cat.color }}
                >
                  {cat.label}
                </span>
                <span className="ml-auto font-mono text-[11px] text-ink-soft">
                  {e.date}
                </span>
              </div>
              <div className="mt-1.5 flex items-end justify-between">
                <div>
                  <div className="font-mono text-xl font-semibold">
                    {e.hours} timer
                  </div>
                  {e.therapist && (
                    <div className="mt-0.5 text-xs text-ink-soft">
                      Terapeut: {e.therapist}
                    </div>
                  )}
                  <div className="mt-0.5 text-xs text-ink-soft">
                    Hold: {holdLabel(e.courseId, courses)}
                  </div>
                </div>
                {confirmId === e.id ? (
                  <div className="flex items-center gap-1.5 text-xs">
                    <span>Slet?</span>
                    <button
                      className="flex cursor-pointer rounded-lg border-[1.5px] border-border bg-paper p-1.5 text-ink-soft hover:border-blue hover:text-blue disabled:cursor-default disabled:opacity-35"
                      onClick={() => removeEntry(e.id ?? "")}
                    >
                      <Check size={14} />
                    </button>
                    <button
                      className="flex cursor-pointer rounded-lg border-[1.5px] border-border bg-paper p-1.5 text-ink-soft hover:border-blue hover:text-blue disabled:cursor-default disabled:opacity-35"
                      onClick={() => setConfirmId(null)}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-1.5">
                    <button
                      className="flex cursor-pointer rounded-lg border-[1.5px] border-border bg-paper p-1.5 text-ink-soft hover:border-blue hover:text-blue disabled:cursor-default disabled:opacity-35"
                      onClick={() => startEdit(e)}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      className="flex cursor-pointer rounded-lg border-[1.5px] border-border bg-paper p-1.5 text-ink-soft hover:border-blue hover:text-blue disabled:cursor-default disabled:opacity-35"
                      onClick={() => setConfirmId(e.id ?? "")}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
              <div className="mt-1.5 text-xs leading-snug text-ink-soft">
                {e.learningGoal}
              </div>
              {e.notes && (
                <div className="mt-1.5 text-xs leading-snug text-ink-soft">
                  {e.notes}
                </div>
              )}
            </div>
          );
        })}

        <div className="mb-2.5 mt-5.5 font-display text-[15px] font-semibold text-ink">
          <History size={14} style={{ verticalAlign: -2, marginRight: 6 }} />
          Aktivitetslog
        </div>
        <p
          className="mb-3.5 text-[13px] leading-normal text-ink-soft"
          style={{ marginTop: -6 }}
        >
          Sporer hvem der har ændret {selectedStudent.name}s timer og
          timeoverførsel, til dokumentation.
        </p>
        {studentLog.length === 0 && (
          <div className="px-2.5 py-10 text-center text-[13px] text-ink-soft">
            Ingen ændringer registreret endnu.
          </div>
        )}
        {studentLog.map((log) => (
          <div
            className="flex flex-wrap items-baseline gap-x-2 gap-y-1.5 border-b border-border py-2.5 text-xs last:border-b-0"
            key={log.id}
          >
            <span
              className={`shrink-0 rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.04em] ${log.actor === "Administrator" ? "border-terracotta text-terracotta" : "border-border text-ink-soft"}`}
            >
              {log.actor}
            </span>
            <span className="min-w-35 flex-1 text-ink">
              {log.description}
            </span>
            <span className="w-full font-mono text-[11px] text-ink-soft">
              {formatLogTime(log.at)}
            </span>
          </div>
        ))}

        <div
          className="mt-4 flex items-center gap-2"
          style={{ margin: "20px 0" }}
        >
          <span className="stitch-line" />
        </div>

        <div
          className="mb-2.5 mt-5.5 font-display text-[15px] font-semibold text-ink"
          style={{ color: "var(--terracotta)" }}
        >
          <AlertTriangle
            size={14}
            style={{ verticalAlign: -2, marginRight: 6 }}
          />
          Faresone
        </div>
        {confirmDeleteStudent ? (
          <div className="my-6 mb-1.5 rounded-xl border-[1.5px] border-dashed border-border p-3.5">
            <div
              className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-soft"
              style={{ color: "var(--terracotta)" }}
            >
              Bekræft sletning
            </div>
            <p
              className="mb-3.5 text-[13px] leading-normal text-ink-soft"
              style={{ margin: "6px 0 10px" }}
            >
              {selectedStudent.name} og alle {studentEntries.length}{" "}
              registreringer slettes permanent. Dette kan ikke fortrydes.
            </p>
            <div className="mt-6 flex gap-2.5">
              <button
                className="flex-1 cursor-pointer rounded-[10px] border-[1.5px] border-border bg-transparent px-4 py-3 font-sans text-sm font-semibold text-ink-soft transition-opacity active:opacity-75 disabled:cursor-default disabled:opacity-45"
                onClick={() => setConfirmDeleteStudent(false)}
              >
                Annuller
              </button>
              <button
                className="flex-1 cursor-pointer rounded-[10px] border-0 bg-blue px-4 py-3 font-sans text-sm font-semibold text-paper transition-opacity active:opacity-75 disabled:cursor-default disabled:opacity-45"
                style={{
                  background: "terracotta",
                  borderColor: "terracotta",
                }}
                onClick={handleDeleteStudent}
              >
                Ja, slet permanent
              </button>
            </div>
          </div>
        ) : (
          <button
            className="flex-1 cursor-pointer rounded-[10px] border-[1.5px] border-border bg-transparent px-4 py-3 font-sans text-sm font-semibold text-ink-soft transition-opacity active:opacity-75 disabled:cursor-default disabled:opacity-45"
            style={{
              color: "var(--terracotta)",
              borderColor: "var(--terracotta)",
            }}
            onClick={() => setConfirmDeleteStudent(true)}
          >
            <Trash2 size={14} /> Slet kursist permanent (GDPR)
          </button>
        )}
      </div>

      {toast && (
        <div className="fixed bottom-21 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-ink px-4.5 py-2.5 text-[13px] text-card shadow-[0_6px_18px_rgba(0,0,0,0.18)]">
          <Check size={14} /> {toast}
        </div>
      )}
    </>
  );

  return (
    <div className="relative mx-auto flex min-h-screen max-w-107.5 flex-col bg-paper font-sans text-ink md:my-10 md:min-h-[calc(100vh-80px)] md:max-w-225 md:overflow-hidden md:rounded-3xl md:shadow-[0_24px_64px_rgba(18,57,74,0.16)]">
      {body}
    </div>
  );
};
