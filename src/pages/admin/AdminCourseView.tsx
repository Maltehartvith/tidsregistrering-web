import { useState } from "react";
import * as XLSX from "xlsx";
import {
  PlusCircle,
  Pencil,
  Trash2,
  Check,
  Users2,
  X,
  AlertTriangle,
  ChevronDown,
  ArrowRightLeft,
  User,
  Upload,
  FileSpreadsheet,
} from "lucide-react";
import { useCatalog } from "../../context/CatalogContext";
import { useCourses } from "../../context/CoursesContext";
import { useStudents } from "../../context/StudentsContext";
import { useEntries } from "../../context/EntriesContext";
import { useUsers } from "../../context/UsersContext";
import {
  defaultTargets,
  zeroTargets,
  formatTargets,
} from "../../domain/catalog";
import { coursesWithinTransferWindow, programName } from "../../domain/totals";
import { ADMIN_ROLES } from "@/data/constants";
import { Field } from "../../components/ui/Field";
import ToggleButton from "../../components/ui/ToggleButton";

import { AdminTabs } from "@/components/nav/AdminTabs";
import { Program, ProgramDraft } from "@/types/domain";
import { BrandLogo } from "@/components/brand/Brand";
import { useNavigate } from "react-router-dom";
import { routes } from "@/routes";
import { Student } from "@/types/user";
import { useAuditLogs } from "@/context/AuditLogsContext";
import { useToast } from "@/components/ui/Toast";

export const AdminCourseView = () => {
  const navigate = useNavigate();
  const { logEvent: onLog } = useAuditLogs();
  const { showToast } = useToast();
  const {
    CATEGORIES,
    LEARNING_GOALS,
    programs,
    createProgram: createProgramApi,
    updateProgram,
    deleteProgram: deleteProgramApi,
  } = useCatalog();
  const {
    courses,
    createCourse: createCourseApi,
    updateCourse,
    deleteCourse: deleteCourseApi,
  } = useCourses();
  const { students, createStudent, updateStudent } = useStudents();
  const { entries } = useEntries();
  const { adminUsers, updateUser } = useUsers();
  const [openCourseId, setOpenCourseId] = useState<string | null>(null);
  const [draftOn, setDraftOn] = useState(false);
  const [draftFrom, setDraftFrom] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newCourseId, setNewCourseId] = useState("");
  const [newCourseYear, setNewCourseYear] = useState(
    String(new Date().getFullYear()),
  );
  const [newCourseProgramId, setNewCourseProgramId] = useState(
    Object.keys(programs)[0] || "__new__",
  );
  const [newProgramName, setNewProgramName] = useState("");
  const [newCourseTargets, setNewCourseTargets] = useState(
    defaultTargets(CATEGORIES),
  );
  const [createError, setCreateError] = useState("");
  const [importResult, setImportResult] = useState<{
    courseId?: string;
    error?: string;
    fileName?: string;
    added?: Student[];
    duplicates?: { name: string; email: string }[];
    skipped?: { name: string; email: string }[];
  } | null>(null);
  const [importingCourseId, setImportingCourseId] = useState<string | null>(
    null,
  );
  const [addName, setAddName] = useState<string | null>(null);
  const [addEmail, setAddEmail] = useState<string | null>(null);
  const [addResult, setAddResult] = useState<{
    error?: string;
    duplicate?: { name: string; email: string };
    added?: { name: string; email: string };
  } | null>(null);
  const [confirmDeleteCourseId, setConfirmDeleteCourseId] = useState<
    string | null
  >(null);
  const [confirmRemoveCourseId, setConfirmRemoveCourseId] = useState<
    string | null
  >(null);
  const [editProgramId, setEditProgramId] = useState<string | null>(null);
  const [editTargets, setEditTargets] = useState(zeroTargets(CATEGORIES));
  const [addUserId, setAddUserId] = useState<string | null>(null);
  const [showCreateProgram, setShowCreateProgram] = useState(false);
  const [standaloneProgramName, setStandaloneProgramName] = useState("");
  const [standaloneProgramTargets, setStandaloneProgramTargets] = useState(
    defaultTargets(CATEGORIES),
  );
  const [createProgramError, setCreateProgramError] = useState("");
  const [transferSourceId, setTransferSourceId] = useState("");
  const [confirmTransferRoster, setConfirmTransferRoster] = useState(false);
  const [confirmDeleteProgramId, setConfirmDeleteProgramId] = useState<
    string | null
  >(null);
  const [editingProgramId, setEditingProgramId] = useState<string | null>(null);
  const [programDraft, setProgramDraft] = useState<ProgramDraft | null>(null);
  const [programError, setProgramError] = useState("");

  const openCourse = (courseId: string) => {
    if (openCourseId === courseId) {
      setOpenCourseId(null);
      return;
    }
    setDraftOn(false);
    setDraftFrom(coursesWithinTransferWindow(courseId, courses)[0]?.id || "");
    setOpenCourseId(courseId);
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
  };

  const saveCourseProgram = async (courseId: string) => {
    const course = courses[courseId];
    if (!course || !editProgramId) return;

    await updateCourse(courseId, {
      programId: editProgramId,
      targets: editTargets,
    });
    onLog({
      actor: "Administrator",
      courseId,
      description: `Administrator satte ${course.label} til uddannelsen "${programs[editProgramId]?.name}" med delmål ${formatTargets(editTargets, CATEGORIES)}`,
    });
    showToast(`Uddannelse og delmål gemt for ${course.label}`);
  };

  const createProgramLocal = async (
    name: string,
    targets: Record<string, number>,
  ) => {
    const id =
      name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9æøå]+/g, "-")
        .replace(/(^-|-$)/g, "") ||
      "uddannelse-" + Math.random().toString(36).slice(2, 7);
    await createProgramApi({ id, name: name.trim(), targets });
    onLog({
      actor: "Administrator",
      description: `Administrator oprettede uddannelsen "${name.trim()}" med totalmål ${formatTargets(targets, CATEGORIES)}`,
    });
    return id;
  };

  const submitNewProgram = async () => {
    if (!standaloneProgramName.trim()) {
      setCreateProgramError("Angiv et navn til uddannelsen.");
      return;
    }
    if (
      Object.values(programs).some(
        (p) =>
          p.name.toLowerCase() === standaloneProgramName.trim().toLowerCase(),
      )
    ) {
      setCreateProgramError("Der findes allerede en uddannelse med det navn.");
      return;
    }
    await createProgramLocal(standaloneProgramName, standaloneProgramTargets);
    showToast(`Uddannelsen "${standaloneProgramName.trim()}" oprettet`);
    setStandaloneProgramName("");
    setStandaloneProgramTargets(defaultTargets(CATEGORIES));
    setCreateProgramError("");
    setShowCreateProgram(false);
  };

  const transferRoster = async (targetCourseId: string) => {
    if (!transferSourceId) return;
    const sourceCourseId = transferSourceId;
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
    onLog({
      actor: "Administrator",
      courseId: targetCourseId,
      description: `Administrator overførte ${moved.length} kursister fra ${sourceLabel} til ${targetLabel} (timer fra ${sourceLabel} tæller fortsat med)`,
    });
    showToast(`${moved.length} kursister overført til ${targetLabel}`);
    setTransferSourceId("");
    setConfirmTransferRoster(false);
  };

  const startEditProgram = (p: Program) => {
    if (!p) return;
    setEditingProgramId(p.id);
    setProgramDraft({
      name: p.name,
      targets: { ...zeroTargets(CATEGORIES), ...(p.targets || {}) },
    });
    setProgramError("");
    setConfirmDeleteProgramId(null);
  };

  const saveProgramEdit = async (programId: string) => {
    if (!programDraft) return;
    const old = programs[programId];
    const name = programDraft.name.trim();
    if (!name) {
      setProgramError("Angiv et navn til uddannelsen.");
      return;
    }
    if (
      Object.values(programs).some(
        (p) =>
          p.id !== programId && p.name.toLowerCase() === name.toLowerCase(),
      )
    ) {
      setProgramError("Der findes allerede en uddannelse med det navn.");
      return;
    }
    const targets = Object.fromEntries(
      Object.entries(programDraft.targets).map(([k, v]) => [k, Number(v)]),
    );
    if (Object.values(targets).some((v) => !(v >= 0))) {
      setProgramError("Totalmålene skal være 0 eller mere.");
      return;
    }
    const nextTargets = { ...(old.targets || {}), ...targets };
    await updateProgram(programId, { name, targets: nextTargets });
    const changes = [];
    if (old.name !== name) changes.push(`navn fra "${old.name}" til "${name}"`);
    if (
      formatTargets(old.targets, CATEGORIES) !==
      formatTargets(nextTargets, CATEGORIES)
    ) {
      changes.push(
        `totalmål fra ${formatTargets(old.targets, CATEGORIES)} til ${formatTargets(nextTargets, CATEGORIES)}`,
      );
    }
    if (changes.length > 0)
      onLog({
        actor: "Administrator",
        description: `Administrator ændrede uddannelsen "${old.name}": ${changes.join(", ")}`,
      });
    showToast(`Uddannelsen "${name}" gemt`);
    setEditingProgramId(null);
    setProgramDraft(null);
  };

  const deleteProgram = async (programId: string) => {
    const inUse = Object.values(courses).some((h) => h.programId === programId);
    if (inUse) return;
    const programBeingDeleted = programs[programId];
    await deleteProgramApi(programId);
    onLog({
      actor: "Administrator",
      description: `Administrator slettede uddannelsen "${programBeingDeleted.name}" (blev ikke brugt af noget hold)`,
    });
    showToast(`${programBeingDeleted.name} slettet`);
    setConfirmDeleteProgramId(null);
  };

  const addUserToCourse = async (courseId: string) => {
    if (!addUserId) return;
    const user = adminUsers.find((u) => u.id === addUserId);
    if (!user || user.allCourses || (user.courseIds || []).includes(courseId)) {
      setAddUserId("");
      return;
    }
    await updateUser(user.id, {
      courseIds: [...(user.courseIds || []), courseId],
    });
    onLog({
      actor: "Administrator",
      courseId: courseId,
      description: `Administrator gav ${user.name} (${ADMIN_ROLES[user.role]?.label || user.role}) adgang til ${courses[courseId].label}`,
    });
    showToast(`${user.name} har nu adgang til ${courses[courseId].label}`);
    setAddUserId("");
  };

  const removeUserFromCourse = async (courseId: string, userId: string) => {
    const user = adminUsers.find((u) => u.id === userId);
    await updateUser(userId, {
      courseIds: (user?.courseIds || []).filter((id) => id !== courseId),
    });
    onLog({
      actor: "Administrator",
      courseId: courseId,
      description: `Administrator fjernede ${user?.name}s adgang til ${courses[courseId].label}`,
    });
    showToast(
      `${user?.name} har ikke længere adgang til ${courses[courseId].label}`,
    );
  };

  const deleteCourse = async (courseId: string) => {
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
    onLog({
      actor: "Administrator",
      description: `Administrator slettede ${holdBeingDeleted.label} permanent — jf. GDPR${
        linkedElsewhere > 0
          ? `. ${linkedElsewhere} kursist(er) på andre hold har fortsat gyldige timer herfra; holdnavnet vises nu som "(slettet)" i deres historik`
          : ""
      }`,
    });
    showToast(`${holdBeingDeleted.label} slettet`);
    setOpenCourseId(null);
    setConfirmDeleteCourseId(null);
  };

  const applyToCourse = async (courseId: string) => {
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
    onLog({
      actor: "Administrator",
      courseId: courseId,
      description: draftOn
        ? `Administrator anvendte timeoverførsel fra ${courses[draftFrom]?.label || draftFrom} på hele ${courses[courseId].label} (${members.length} kursister)`
        : `Administrator slog timeoverførsel fra ${courses[draftFrom]?.label || draftFrom} fra for hele ${courses[courseId].label} (${members.length} kursister)`,
    });
    showToast(
      draftOn
        ? `Anvendt på ${members.length} kursister i ${courses[courseId].label}`
        : `Slået fra for ${members.length} kursister i ${courses[courseId].label}`,
    );
    setOpenCourseId(null);
  };

  const removeFromCourse = async (courseId: string, fromCourseId: string) => {
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
    onLog({
      actor: "Administrator",
      courseId: courseId,
      description: `Administrator fjernede timeoverførslen fra ${courses[fromCourseId]?.label || fromCourseId} helt for ${courses[courseId].label} (${affectedCount} kursister berørt, ${hoursWithdrawnTotal} timer trukket ud af regnskabet igen)`,
    });
    showToast(
      `Overførsel fjernet helt — ${hoursWithdrawnTotal} timer trukket tilbage for ${affectedCount} kursister`,
    );
    setConfirmRemoveCourseId(null);
    setOpenCourseId(null);
  };

  const addSingleStudent = async (courseId: string) => {
    if (!addName || !addEmail) {
      setAddResult({ error: "Udfyld både navn og email." } as {
        error?: string;
        duplicate?: { name: string; email: string };
        added?: { name: string; email: string };
      });
      return;
    }
    const name = addName.trim();
    const email = addEmail.trim();
    const exists = students.some(
      (s) => s.email.toLowerCase() === email.toLowerCase(),
    );
    if (exists) {
      setAddResult({ duplicate: { name, email } } as {
        error?: string;
        duplicate?: { name: string; email: string };
        added?: { name: string; email: string };
      });
      return;
    }
    const created = await createStudent({
      name,
      email,
      courseId,
      courseLinks: [],
    });
    onLog({
      actor: "Administrator",
      studentId: created.id,
      courseId: courseId,
      description: `Administrator tilføjede ${name} til ${courses[courseId].label}`,
    });
    setAddResult({ added: { name, email } } as {
      error?: string;
      duplicate?: { name: string; email: string };
      added?: { name: string; email: string };
    });
    setAddName("");
    setAddEmail("");
    showToast(`${name} tilføjet til ${courses[courseId].label}`);
  };

  const createCourse = async () => {
    const id = newCourseId.trim();
    if (!id) {
      setCreateError("Angiv et holdnavn, fx 26-100.");
      return;
    }
    if (courses[id]) {
      setCreateError(`Hold ${id} findes allerede.`);
      return;
    }
    let programId = newCourseProgramId;
    if (programId === "__new__") {
      if (!newProgramName.trim()) {
        setCreateError("Angiv et navn til den nye uddannelse.");
        return;
      }
      programId = await createProgramLocal(newProgramName, newCourseTargets);
    }
    const year = Number(newCourseYear) || new Date().getFullYear();
    await createCourseApi({
      id,
      label: `Hold ${id}`,
      startYear: year,
      programId,
      targets: newCourseTargets,
    });
    onLog({
      actor: "Administrator",
      courseId: id,
      description: `Administrator oprettede hold ${id} under "${programs[programId]?.name || newProgramName}" med delmål ${formatTargets(newCourseTargets, CATEGORIES)}`,
    });
    showToast(`Hold ${id} oprettet`);
    setNewCourseId("");
    setNewCourseYear(String(new Date().getFullYear()));
    setNewProgramName("");
    setNewCourseTargets(defaultTargets(CATEGORIES));
    setCreateError("");
    setShowCreate(false);
    setOpenCourseId(id);
  };

  const handleImportFile = (
    event: React.ChangeEvent<HTMLInputElement>,
    courseId: string,
  ) => {
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
          onLog({
            actor: "Administrator",
            courseId: courseId,
            description: `Administrator importerede ${added.length} kursister til ${courses[courseId].label} fra Excel`,
          });
        }
        setImportResult({
          added,
          duplicates,
          skipped,
        });
      } catch (err) {
        setImportResult({ error: "Fejl ved import af Excel-fil" } as {
          added?: Student[];
          duplicates?: { name: string; email: string }[];
          skipped?: { name: string; email: string }[];
          error?: string;
        });
      }
      setImportingCourseId(null);
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="relative mx-auto flex min-h-screen max-w-107.5 flex-col bg-paper font-sans text-ink md:my-10 md:min-h-[calc(100vh-80px)] md:max-w-225 md:overflow-hidden md:rounded-3xl md:shadow-[0_24px_64px_rgba(18,57,74,0.16)]">
      <div className="px-5 pb-4.5 pt-6.5">
        <div className="flex items-center gap-2.5">
          <BrandLogo className="h-6.5 w-auto max-w-35 shrink-0 object-contain" />
          <div className="font-mono text-[11px] uppercase tracking-widest text-ink-soft">
            Administrator
          </div>
        </div>
        <div className="mt-2 flex items-start justify-between">
          <div>
            <div className="mb-0.5 font-display text-[28px] font-semibold">
              Hold-administration
            </div>
            <div className="text-[13px] text-ink-soft">
              Opret hold, tilføj kursister og overfør timer
            </div>
          </div>
          <button
            className="flex cursor-pointer rounded-lg border-[1.5px] border-border bg-paper p-1.5 text-ink-soft hover:border-primary hover:text-primary disabled:cursor-default disabled:opacity-35"
            onClick={() => navigate(routes.adminStudents)}
            title="Kursistvisning"
          >
            <Users2 size={16} />
          </button>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <span className="h-3 w-0.5 shrink-0 rounded-sm bg-surplus" />
          <span className="stitch-line" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-25 pt-1">
        <AdminTabs />

        <div
          className="mt-5.5 flex items-center justify-between"
          style={{ marginTop: 0 }}
        >
          <div
            className="mb-2.5 mt-5.5 font-display text-[15px] font-semibold text-ink"
            style={{ margin: 0 }}
          >
            Uddannelser
          </div>
          {!showCreateProgram && (
            <button
              className="inline-flex flex-none cursor-pointer items-center gap-1.5 rounded-full border-0 bg-primary-soft px-3 py-1.5 font-sans text-xs font-semibold text-primary"
              onClick={() => {
                setShowCreateProgram(true);
                setCreateProgramError("");
              }}
            >
              <PlusCircle size={14} /> Opret uddannelse
            </button>
          )}
        </div>

        {showCreateProgram && (
          <div className="mb-2.5 overflow-hidden rounded-[14px] border border-border bg-card">
            <div
              className="border-t border-border px-4 pb-4 pt-3.5"
              style={{ borderTop: "none", paddingTop: 16 }}
            >
              <Field
                label="Navn på uddannelse"
                hint="Fx Psykoterapeutuddannelsen"
              >
                <input
                  type="text"
                  value={standaloneProgramName}
                  onChange={(e) => setStandaloneProgramName(e.target.value)}
                  placeholder="Uddannelsens navn"
                />
              </Field>
              <Field
                label="Totalmål"
                hint="Det samlede timekrav for hele uddannelsen — til reference. De enkelte hold får deres egne delmål."
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
                        value={standaloneProgramTargets[c.key] ?? 0}
                        onChange={(e) =>
                          setStandaloneProgramTargets({
                            ...standaloneProgramTargets,
                            [c.key]: Number(e.target.value),
                          })
                        }
                      />
                    </div>
                  ))}
                </div>
              </Field>
              {createProgramError && (
                <div className="-mt-1.5 mb-3 text-xs text-[#a14b36]">
                  {createProgramError}
                </div>
              )}
              <div className="mt-4.5 flex gap-2.5">
                <button
                  className="flex-1 cursor-pointer rounded-[10px] border-[1.5px] border-border bg-transparent px-4 py-3 font-sans text-sm font-semibold text-ink-soft transition-opacity active:opacity-75 disabled:cursor-default disabled:opacity-45"
                  onClick={() => setShowCreateProgram(false)}
                >
                  Annuller
                </button>
                <button
                  className="flex-1 cursor-pointer rounded-[10px] border-0 bg-primary px-4 py-3 font-sans text-sm font-semibold text-on-primary transition-opacity active:opacity-75 disabled:cursor-default disabled:opacity-45"
                  onClick={submitNewProgram}
                >
                  Opret uddannelse
                </button>
              </div>
            </div>
          </div>
        )}
        {Object.values(programs).map((p) => {
          const coursesUsingProgram = Object.values(courses).filter(
            (h) => h.programId === p.id,
          );
          const isBlocked = coursesUsingProgram.length > 0;
          return (
            <div
              className="mb-2.5 overflow-hidden rounded-[14px] border border-border bg-card"
              key={p.id}
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
                    <div className="text-sm font-semibold">{p.name}</div>
                    <div className="mt-px text-xs text-ink-soft">
                      Totalmål: {formatTargets(p.targets, CATEGORIES)} timer ·{" "}
                      {coursesUsingProgram.length} hold
                    </div>
                  </div>
                  {editingProgramId === p.id ? null : !isBlocked &&
                    confirmDeleteProgramId === p.id ? (
                    <div className="flex items-center gap-1.5 text-xs">
                      <span>Slet?</span>
                      <button
                        className="flex cursor-pointer rounded-lg border-[1.5px] border-border bg-paper p-1.5 text-ink-soft hover:border-primary hover:text-primary disabled:cursor-default disabled:opacity-35"
                        onClick={() => deleteProgram(p.id)}
                      >
                        <Check size={14} />
                      </button>
                      <button
                        className="flex cursor-pointer rounded-lg border-[1.5px] border-border bg-paper p-1.5 text-ink-soft hover:border-primary hover:text-primary disabled:cursor-default disabled:opacity-35"
                        onClick={() => setConfirmDeleteProgramId(null)}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex shrink-0 gap-1.5">
                      <button
                        className="flex cursor-pointer rounded-lg border-[1.5px] border-border bg-paper p-1.5 text-ink-soft hover:border-primary hover:text-primary disabled:cursor-default disabled:opacity-35"
                        disabled={editingProgramId !== null}
                        onClick={() => startEditProgram(p)}
                        title="Redigér uddannelse"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        className="flex cursor-pointer rounded-lg border-[1.5px] border-border bg-paper p-1.5 text-ink-soft hover:border-primary hover:text-primary disabled:cursor-default disabled:opacity-35"
                        disabled={editingProgramId !== null}
                        onClick={() =>
                          setConfirmDeleteProgramId(
                            confirmDeleteProgramId === p.id ? null : p.id,
                          )
                        }
                        title="Slet uddannelse"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
                {editingProgramId === p.id && programDraft && (
                  <div style={{ marginTop: 12 }}>
                    <Field label="Navn">
                      <input
                        type="text"
                        value={programDraft.name}
                        onChange={(e) =>
                          setProgramDraft({
                            ...programDraft,
                            name: e.target.value,
                          })
                        }
                      />
                    </Field>
                    <Field
                      label="Totalmål for hele uddannelsen"
                      hint="Til reference. Kursisternes regnskab regnes ud fra delmålene på de hold, de går på."
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
                              min="0"
                              value={programDraft.targets[c.key] ?? 0}
                              onChange={(e) =>
                                setProgramDraft({
                                  ...programDraft,
                                  targets: {
                                    ...programDraft.targets,
                                    [c.key]: Number(e.target.value),
                                  },
                                })
                              }
                            />
                          </div>
                        ))}
                      </div>
                    </Field>
                    <div
                      className="mb-1.5 block text-xs font-semibold text-ink-soft"
                      style={{ marginBottom: 6 }}
                    >
                      Hold under uddannelsen og deres delmål
                    </div>
                    {coursesUsingProgram.length === 0 ? (
                      <p className="mt-1 block text-[11px] text-ink-soft">
                        Ingen hold bruger uddannelsen endnu.
                      </p>
                    ) : (
                      <div
                        className="flex flex-col gap-2 rounded-[10px] border-[1.5px] border-border bg-card px-3 py-2.5"
                        style={{ marginBottom: 6 }}
                      >
                        {[...coursesUsingProgram]
                          .sort(
                            (a, b) =>
                              a.startYear - b.startYear ||
                              a.label.localeCompare(b.label),
                          )
                          .map((h) => (
                            <div
                              key={h.id}
                              className="flex flex-wrap items-baseline justify-between gap-2.5"
                            >
                              <button
                                className="mt-3.5 cursor-pointer border-0 bg-transparent text-center font-sans text-[13px] font-semibold text-primary"
                                style={{ margin: 0, textAlign: "left" }}
                                onClick={() => {
                                  if (openCourseId !== h.id) openCourse(h.id);
                                  setTimeout(
                                    () =>
                                      document
                                        .getElementById(`hold-card-${h.id}`)
                                        ?.scrollIntoView({
                                          behavior: "smooth",
                                          block: "start",
                                        }),
                                    60,
                                  );
                                }}
                                title="Åbn holdet for at rette delmål"
                              >
                                {h.label}
                              </button>
                              <span className="mt-px text-xs text-ink-soft">
                                Start {h.startYear} · delmål{" "}
                                {formatTargets(h.targets, CATEGORIES)}
                              </span>
                            </div>
                          ))}
                      </div>
                    )}
                    <p className="mt-1 block text-[11px] text-ink-soft">
                      Parallelle årgange har hver deres fulde delmål, mens
                      flerårige forløb deler totalmålet mellem årene. Klik på et
                      hold for at rette dets delmål.
                    </p>
                    {programError && (
                      <div className="-mt-1.5 mb-3 text-xs text-[#a14b36]">
                        {programError}
                      </div>
                    )}
                    <div className="mt-4.5 flex gap-2.5">
                      <button
                        className="flex-1 cursor-pointer rounded-[10px] border-[1.5px] border-border bg-transparent px-4 py-3 font-sans text-sm font-semibold text-ink-soft transition-opacity active:opacity-75 disabled:cursor-default disabled:opacity-45"
                        onClick={() => {
                          setEditingProgramId(null);
                          setProgramDraft(null);
                          setProgramError("");
                        }}
                      >
                        Annuller
                      </button>
                      <button
                        className="flex-1 cursor-pointer rounded-[10px] border-0 bg-primary px-4 py-3 font-sans text-sm font-semibold text-on-primary transition-opacity active:opacity-75 disabled:cursor-default disabled:opacity-45"
                        onClick={() => saveProgramEdit(p.id)}
                      >
                        Gem uddannelse
                      </button>
                    </div>
                  </div>
                )}
                {isBlocked && confirmDeleteProgramId === p.id && (
                  <div className="mb-1" style={{ marginTop: 10 }}>
                    <div className="flex items-start gap-1.5 py-2 text-xs leading-normal text-secondary">
                      <AlertTriangle size={14} />
                      Kan ikke slettes — bruges stadig af{" "}
                      {coursesUsingProgram.length} hold. Flyt eller slet dem
                      først:
                    </div>
                    <div
                      className="flex flex-col gap-2 rounded-[10px] border-[1.5px] border-border bg-card px-3 py-2.5"
                      style={{ marginTop: 8 }}
                    >
                      {coursesUsingProgram.map((h) => (
                        <button
                          key={h.id}
                          className="mt-3.5 cursor-pointer border-0 bg-transparent text-center font-sans text-[13px] font-semibold text-primary"
                          style={{ margin: 0, textAlign: "left" }}
                          onClick={() => {
                            setConfirmDeleteProgramId(null);
                            openCourse(h.id);
                          }}
                        >
                          {h.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        <div
          className="mt-4 flex items-center gap-2"
          style={{ margin: "16px 0" }}
        >
          <span className="stitch-line" />
        </div>

        <div className="mt-5.5 flex items-center justify-between">
          <div
            className="mb-2.5 mt-5.5 font-display text-[15px] font-semibold text-ink"
            style={{ margin: 0 }}
          >
            Hold
          </div>
          {!showCreate && (
            <button
              className="inline-flex flex-none cursor-pointer items-center gap-1.5 rounded-full border-0 bg-primary-soft px-3 py-1.5 font-sans text-xs font-semibold text-primary"
              onClick={() => {
                setShowCreate(true);
                setOpenCourseId(null);
              }}
            >
              <PlusCircle size={14} /> Opret hold
            </button>
          )}
        </div>

        {showCreate && (
          <div className="mb-2.5 overflow-hidden rounded-[14px] border border-border bg-card">
            <div
              className="border-t border-border px-4 pb-4 pt-3.5"
              style={{ borderTop: "none", paddingTop: 16 }}
            >
              <div className="flex gap-3">
                <Field label="Holdnavn" hint="Fx 26-100">
                  <input
                    type="text"
                    value={newCourseId}
                    onChange={(e) => setNewCourseId(e.target.value)}
                    placeholder="26-100"
                  />
                </Field>
                <Field label="Startår">
                  <input
                    type="number"
                    value={newCourseYear}
                    onChange={(e) => setNewCourseYear(e.target.value)}
                  />
                </Field>
              </div>
              <Field
                label="Uddannelse"
                hint="Vælg en eksisterende uddannelse, eller opret en ny."
              >
                <div className="relative">
                  <select
                    value={newCourseProgramId}
                    onChange={(e) => setNewCourseProgramId(e.target.value)}
                  >
                    {Object.values(programs).map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                    <option value="__new__">+ Opret ny uddannelse…</option>
                  </select>
                  <ChevronDown
                    size={16}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft"
                  />
                </div>
              </Field>
              {newCourseProgramId === "__new__" && (
                <Field label="Navn på ny uddannelse">
                  <input
                    type="text"
                    value={newProgramName}
                    onChange={(e) => setNewProgramName(e.target.value)}
                    placeholder="Fx Psykoterapeutuddannelsen"
                  />
                </Field>
              )}
              <Field
                label="Holdets delmål"
                hint="Hvor mange timer skal netop dette hold/år bidrage med i hver kategori?"
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
                        value={newCourseTargets[c.key] ?? 0}
                        onChange={(e) =>
                          setNewCourseTargets({
                            ...newCourseTargets,
                            [c.key]: Number(e.target.value),
                          })
                        }
                      />
                    </div>
                  ))}
                </div>
              </Field>
              {createError && (
                <div className="-mt-1.5 mb-3 text-xs text-[#a14b36]">
                  {createError}
                </div>
              )}
              <div className="mt-4.5 flex gap-2.5">
                <button
                  className="flex-1 cursor-pointer rounded-[10px] border-[1.5px] border-border bg-transparent px-4 py-3 font-sans text-sm font-semibold text-ink-soft transition-opacity active:opacity-75 disabled:cursor-default disabled:opacity-45"
                  onClick={() => {
                    setShowCreate(false);
                    setCreateError("");
                  }}
                >
                  Annuller
                </button>
                <button
                  className="flex-1 cursor-pointer rounded-[10px] border-0 bg-primary px-4 py-3 font-sans text-sm font-semibold text-on-primary transition-opacity active:opacity-75 disabled:cursor-default disabled:opacity-45"
                  onClick={createCourse}
                >
                  Opret hold
                </button>
              </div>
            </div>
          </div>
        )}

        <p className="mb-3.5 text-[13px] leading-normal text-ink-soft">
          Når en hel årgang fortsætter under et nyt holdnavn, kan I her overføre
          timer for alle kursister i holdet på én gang, i stedet for at gøre det
          enkeltvis. Kun hold oprettet inden for 5 år vises som kilde, da
          uddannelsen forløber over op til 5 år. Er der ved en fejl blevet
          overført fra et forkert hold, kan overførslen fjernes helt igen —
          timerne trækkes automatisk ud af regnskabet.
        </p>

        {Object.values(courses).map((h) => {
          const members = students.filter((s) => s.courseId === h.id);
          const onCount = members.filter((s) =>
            (s.courseLinks || []).some((l) => l.included),
          ).length;
          const isOpen = openCourseId === h.id;
          const windowCourses = coursesWithinTransferWindow(h.id, courses);
          return (
            <div
              className="mb-2.5 overflow-hidden rounded-[14px] border border-border bg-card"
              key={h.id}
              id={`hold-card-${h.id}`}
            >
              <button
                className="flex w-full cursor-pointer items-center gap-2.5 border-0 bg-transparent px-4 py-3.5 text-left font-sans"
                onClick={() => openCourse(h.id)}
              >
                <div>
                  <div className="text-sm font-semibold">{h.label}</div>
                  <div className="mt-px text-xs text-ink-soft">
                    {programName(h, programs)
                      ? `${programName(h, programs)} · `
                      : ""}
                    Oprettet {h.startYear} · {members.length} kursister
                  </div>
                </div>
                {onCount > 0 && (
                  <span
                    className="flex items-center gap-1 font-mono text-[11px] font-semibold"
                    style={{ color: "var(--secondary)" }}
                  >
                    <ArrowRightLeft size={12} /> {onCount}/{members.length}{" "}
                    overfører
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
                    onClick={() => saveCourseProgram(h.id)}
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
                            onClick={() => removeUserFromCourse(h.id, u.id)}
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
                      Ingen administratorer eller undervisere har adgang til
                      dette hold endnu.
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
                          <option value="">
                            Vælg administrator eller underviser…
                          </option>
                          {adminUsers
                            .filter(
                              (u) =>
                                !u.allCourses &&
                                !(u.courseIds || []).includes(h.id),
                            )
                            .map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.name} ·{" "}
                                {ADMIN_ROLES[u.role]?.label || u.role}
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
                        onClick={() => addUserToCourse(h.id)}
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
                    Til når en hel årgang rykker videre til dette hold (fx fra
                    år 1 til år 2). Flytter kursisterne hertil og viderefører
                    automatisk deres optjente timer fra kildeholdet.
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
                            {
                              students.filter((s) => s.courseId === src.id)
                                .length
                            }{" "}
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
                            students.filter(
                              (s) => s.courseId === transferSourceId,
                            ).length
                          }{" "}
                          kursister flyttes fra{" "}
                          {courses[transferSourceId].label} til {h.label}, og{" "}
                          {courses[transferSourceId].label} beholdes som
                          tidligere hold, så deres timer fortsætter med at
                          tælle.
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
                            onClick={() => transferRoster(h.id)}
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
                          students.filter(
                            (s) => s.courseId === transferSourceId,
                          ).length === 0
                        }
                      >
                        <ArrowRightLeft size={14} /> Overfør{" "}
                        {
                          students.filter(
                            (s) => s.courseId === transferSourceId,
                          ).length
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
                    onClick={() => addSingleStudent(h.id)}
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
                          {addResult.duplicate?.name ||
                            addResult.duplicate?.email}{" "}
                          findes allerede som kursist og blev ikke oprettet på
                          ny.
                        </div>
                      )}
                      {addResult.added && (
                        <div className="flex items-start gap-1.5 py-2 text-xs leading-normal text-ink">
                          <Check size={14} /> {addResult.added?.name} tilføjet
                          til {h.label}.
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
                    {importingCourseId === h.id
                      ? "Importerer..."
                      : "Importér fra Excel"}
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      style={{ display: "none" }}
                      onChange={(e) => handleImportFile(e, h.id)}
                    />
                  </label>
                  <p
                    className="mt-1 block text-[11px] text-ink-soft"
                    style={{ margin: "6px 0 16px" }}
                  >
                    Filen skal have kolonnerne "Navn" og "Email". Kursister der
                    allerede findes (samme email), bliver ikke oprettet på ny.
                  </p>

                  {importResult && importResult.courseId === h.id && (
                    <div className="mb-1">
                      {importResult.error ? (
                        <div className="flex items-start gap-1.5 py-2 text-xs leading-normal text-secondary">
                          <AlertTriangle size={14} /> Kunne ikke læse "
                          {importResult.fileName}". Tjek at filen er en gyldig
                          Excel- eller CSV-fil.
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start gap-1.5 py-2 text-xs leading-normal text-ink">
                            <FileSpreadsheet size={14} />{" "}
                            {importResult.added?.length ?? 0} kursister
                            importeret fra "{importResult.fileName}".
                          </div>
                          {(importResult.duplicates?.length ?? 0) > 0 && (
                            <div className="flex items-start gap-1.5 py-2 text-xs leading-normal text-secondary">
                              <AlertTriangle size={14} />
                              {importResult.duplicates?.length ?? 0} findes
                              allerede og blev ikke oprettet:{" "}
                              {importResult.duplicates
                                ?.map((d) => d.name || d.email)
                                .join(", ")}
                            </div>
                          )}
                          {(importResult.skipped?.length ?? 0) > 0 && (
                            <div className="flex items-start gap-1.5 py-2 text-xs leading-normal text-secondary">
                              <AlertTriangle size={14} />
                              {importResult.skipped?.length ?? 0} rækker
                              manglede navn eller email og blev sprunget over.
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
                    Denne indstilling anvendes på alle {members.length}{" "}
                    kursister i {h.label}.
                  </p>
                  <button
                    className="flex-1 cursor-pointer rounded-[10px] border-0 bg-primary px-4 py-3 font-sans text-sm font-semibold text-on-primary transition-opacity active:opacity-75 disabled:cursor-default disabled:opacity-45"
                    style={{ width: "100%" }}
                    onClick={() => applyToCourse(h.id)}
                  >
                    Anvend på hele holdet
                  </button>

                  {draftFrom &&
                    members.some((s) =>
                      (s.courseLinks || []).some(
                        (l) => l.courseId === draftFrom,
                      ),
                    ) &&
                    (confirmRemoveCourseId === draftFrom ? (
                      <div className="mb-1">
                        <div className="flex items-start gap-1.5 py-2 text-xs leading-normal text-secondary">
                          <AlertTriangle size={14} />
                          Sikker på at overførslen fra{" "}
                          {courses[draftFrom]?.label || draftFrom} skal fjernes
                          helt for hele {h.label}? Timerne trækkes automatisk ud
                          af regnskabet igen for alle berørte kursister.
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
                            onClick={() => removeFromCourse(h.id, draftFrom)}
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
                        onClick={() =>
                          setConfirmRemoveCourseId(draftFrom as string)
                        }
                        title="Brug denne hvis overførslen ved en fejl blev sat op med det forkerte hold"
                      >
                        <Trash2 size={14} /> Fjern denne overførsel helt for
                        hele holdet
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
                        Holdet kan ikke slettes, så længe der er{" "}
                        {members.length} kursister tilknyttet. Flyt dem til et
                        andet hold, eller slet dem permanent, én for én, fra
                        deres kursistdetalje — klik på en kursist herunder for
                        at gå direkte dertil.
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
                        {h.label} slettes permanent. Kursister, der historisk
                        har fået overført timer herfra til et andet, aktivt
                        hold, beholder deres timer — holdnavnet vises blot som
                        "(slettet)" i deres historik.
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
                          onClick={() => deleteCourse(h.id)}
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
        })}
      </div>

    </div>
  );
};

/* ---------------------------------------------------------------
   Administrator: administratorer & undervisere (invitation)
--------------------------------------------------------------- */
