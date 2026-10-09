import { useState } from "react";
import { AuthStep } from "./LoginView";
import { Field } from "@/components/ui/Field";
import Input from "@/components/ui/Input";
import { Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { UserRole } from "@/types/user";
import { useAuth } from "@/context/AuthContext";
import { BrandName } from "@/components/brand/Brand";
import ToggleButton from "@/components/ui/ToggleButton";

type LoginPageType = {
  onLoggedIn: (role: UserRole) => void;
  goToStep: (step: AuthStep, setError: (error: string) => void) => void;
};

export const LoginPage = ({ onLoggedIn, goToStep }: LoginPageType) => {
  const { login } = useAuth();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);

  const handleLogin = async () => {
    setError("");
    setBusy(true);
    try {
      const session = await login(email.trim(), password, rememberMe);
      onLoggedIn(session.role);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kunne ikke logge ind.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <div
        className="mb-0.5 font-display text-3xl font-semibold"
        style={{ textAlign: "center" }}
      >
        Log ind
      </div>
      <div
        className="text-[13px] text-ink-soft"
        style={{ textAlign: "center", marginBottom: 24 }}
      >
        <BrandName />
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
        <Button
          variant="ghost"
          type="button"
          className="text-xs w-fit"
          onClick={() => goToStep("glemt-email", setError)}
        >
          Glemt adgangskode?
        </Button>
        <Button
          variant="ghost"
          type="button"
          className="text-xs w-fit"
          onClick={() => goToStep("installer", setError)}
        >
          Sådan installerer du appen på din telefon
        </Button>
      </div>
    </>
  );
};
