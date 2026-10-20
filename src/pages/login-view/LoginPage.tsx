import { useState } from "react";
import { AuthStep } from "./LoginView";
import { Field } from "@/components/ui/Field";
import Input from "@/components/ui/Input";
import { Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { UserRole } from "@/types/user";
import { useAuth } from "@/context/AuthContext";
import type { OrganizationChoice } from "@/api/auth";
import ToggleButton from "@/components/ui/ToggleButton";

type LoginPageType = {
  onLoggedIn: (role: UserRole) => void;
  goToStep: (step: AuthStep, setError: (error: string) => void) => void;
};

export const LoginPage = ({ onLoggedIn, goToStep }: LoginPageType) => {
  const { login, selectOrganization } = useAuth();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [pending, setPending] = useState<{
    selectionToken: string;
    organizations: OrganizationChoice[];
  } | null>(null);

  const handleLogin = async () => {
    setError("");
    setBusy(true);
    try {
      const result = await login(email.trim(), password, rememberMe);
      if (result.status === "choose-organization") {
        setPending({
          selectionToken: result.selectionToken,
          organizations: result.organizations,
        });
        return;
      }
      onLoggedIn(result.user.role);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kunne ikke logge ind.");
    } finally {
      setBusy(false);
    }
  };

  const chooseOrganization = async (organizationId: string) => {
    if (!pending) return;
    setError("");
    setBusy(true);
    try {
      const user = await selectOrganization(pending.selectionToken, organizationId);
      onLoggedIn(user.role);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kunne ikke vælge organisation.");
    } finally {
      setBusy(false);
    }
  };

  if (pending) {
    return (
      <div className="w-full">
        <div className="flex justify-center mb-0.5 font-display text-3xl font-semibold">
          Vælg organisation
        </div>
        <p className="mb-4 text-center text-[13px] text-ink-soft">
          Emailen har adgang til flere organisationer. Data fra den ene kan ikke ses i den anden.
        </p>
        <div className="flex flex-col gap-2">
          {pending.organizations.map((organization) => (
            <Button
              key={organization.id}
              variant="secondary"
              className="w-full"
              disabled={busy}
              onClick={() => void chooseOrganization(organization.id)}
            >
              {organization.name}
            </Button>
          ))}
        </div>
        {error && (
          <div className="mt-3 text-xs text-[#a14b36]">{error}</div>
        )}
        <Button
          variant="ghost"
          type="button"
          className="mt-3 text-xs"
          onClick={() => setPending(null)}
        >
          Tilbage
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex justify-center mb-0.5 font-display text-3xl font-semibold">
        Log ind
      </div>
      <Field label="Email">
        <Input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          icon={<Mail size={16} />}
          type="email"
          autoComplete="email"
        />
      </Field>
      <Field label="Adgangskode">
        <Input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          icon={<Lock size={16} />}
          type="password"
          autoComplete="current-password"
          onKeyDown={(e) => {
            if (e.key === "Enter") void handleLogin();
          }}
        />
      </Field>
      <ToggleButton
        label="Forbliv logget ind"
        checked={rememberMe}
        onChange={(v) => setRememberMe(v)}
      />

      {error && (
        <div className="-mt-1.5 mb-3 text-xs text-[#a14b36]">{error}</div>
      )}
      <div className="flex flex-col items-center gap-2">
        <Button
          variant="primary"
          className="w-full"
          disabled={busy}
          onClick={() => void handleLogin()}
        >
          {busy ? "Logger ind…" : "Log ind"}
        </Button>
        <div className="flex flex-col items-center gap-2 mt-3">
          <Button
            variant="ghost"
            type="button"
            className="text-xs w-fit py-2!"
            onClick={() => goToStep("glemt-email", setError)}
          >
            Glemt adgangskode?
          </Button>
          <Button
            variant="ghost"
            type="button"
            className="text-xs w-fit py-2!"
            onClick={() => goToStep("installer", setError)}
          >
            Sådan installerer du appen på din telefon
          </Button>
        </div>
      </div>
    </div>
  );
};
