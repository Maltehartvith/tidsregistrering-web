import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { AccessibilityControls } from "@/components/ui/AccessibilityControls";
import { Button } from "@/components/ui/Button";
import { routes } from "@/routes";
import { useStudentOutlet } from "./StudentLayout";

export function SettingsTab() {
  const { student, viewPrefs, setViewPrefs } = useStudentOutlet();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate(routes.login, { replace: true });
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="font-display text-[1.375rem] font-semibold text-ink">
          Indstillinger
        </h2>
        <p className="mt-1 text-[0.8125rem] text-ink-soft">
          {student.name || user?.email || "Din konto"}
        </p>
      </div>

      <section
        className="rounded-[14px] border border-border bg-card px-4 py-3.5"
        aria-label="Visning"
      >
        <h3 className="mb-3 font-display text-[0.9375rem] font-semibold text-ink">
          Visning
        </h3>
        <AccessibilityControls prefs={viewPrefs} onChange={setViewPrefs} />
      </section>

      <section
        className="rounded-[14px] border border-border bg-card px-4 py-3.5"
        aria-label="Konto"
      >
        <h3 className="mb-3 font-display text-[0.9375rem] font-semibold text-ink">
          Konto
        </h3>
        {user?.email && (
          <p className="mb-3 text-[0.8125rem] text-ink-soft">{user.email}</p>
        )}
        <Button
          variant="secondary"
          className="w-full"
          onClick={() => void handleLogout()}
        >
          <LogOut size="1.05em" />
          Log ud
        </Button>
      </section>
    </div>
  );
}
