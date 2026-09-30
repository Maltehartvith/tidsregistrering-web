import { Users2 } from "lucide-react";
import { BrandLogo } from "../../components/brand/Brand";
import { useIsDesktop } from "../../hooks/useIsDesktop";
import { useStudents } from "../../context/StudentsContext";
import { AdminTabs } from "./AdminTabs";
import { AdminListView } from "./AdminListView";
import { AdminDetailView } from "./AdminDetailView";
import { useNavigate } from "react-router-dom";
import { routes } from "@/routes";

type AdminKursisterViewProps = {
};
export const AdminKursisterView = ({
}: AdminKursisterViewProps) => {
  const navigate = useNavigate();
  const { students, selectedStudent } = useStudents();

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
              Kursister
            </div>
            <div className="text-[13px] text-ink-soft">
              {students.length} kursister på tværs af holdene
            </div>
          </div>
          <button
            className="flex cursor-pointer rounded-lg border-[1.5px] border-border bg-paper p-1.5 text-ink-soft hover:border-blue hover:text-blue disabled:cursor-default disabled:opacity-35"
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

      <div
        className="flex-1 overflow-y-auto px-5 pb-25 pt-1"
        style={{
          display: "flex",
          flexDirection: "column",
          padding: 0,
          overflow: "hidden",
        }}
      >
        <div className="flex min-h-0 flex-1 items-stretch">
          <div className="w-90 shrink-0 overflow-y-auto border-r border-border px-4 pb-10 pt-1">
            <AdminTabs />
            <AdminListView />
          </div>
          <div className="min-w-0 flex-1 overflow-y-auto px-6 pb-10 pt-1">
            {selectedStudent ? (
              <AdminDetailView />
            ) : (
              <div className="flex h-full items-center justify-center p-10 text-center text-sm text-ink-soft">
                Vælg en kursist i listen til venstre for at se og redigere
                detaljer.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
