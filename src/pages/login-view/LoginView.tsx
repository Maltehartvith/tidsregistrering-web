import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import type { UserRole } from "../../types/user";
import { BrandLogo } from "../../components/brand/Brand";
import { ForgorPasswordPage } from "./ForgorPasswordPage";
import { LoginPage } from "./LoginPage";
import { CreateNewPasswordPage } from "./CreateNewPasswordPage";
import { InstallAppPage } from "./InstallAppPage";

export type AuthStep =
  | "login"
  | "glemt-email"
  | "glemt-sendt"
  | "glemt-nyt"
  | "glemt-succes"
  | "installer";

const AUTH_STEPS: AuthStep[] = [
  "login",
  "glemt-email",
  "glemt-sendt",
  "glemt-nyt",
  "glemt-succes",
  "installer",
];

function isAuthStep(value: string | null): value is AuthStep {
  return !!value && (AUTH_STEPS as string[]).includes(value);
}

export function LoginView({
  onLoggedIn,
  initialStep,
}: {
  onLoggedIn: (role: UserRole) => void;
  /** Open directly on reset-password form (e.g. from email link). */
  initialStep?: AuthStep;
}) {
  const [params, setSearchParams] = useSearchParams();
  const [resetToken, setResetToken] = useState("");

  const step: string = (() => {
    if (params.get("token") && !params.get("step")) return "glemt-nyt";
    if (isAuthStep(params.get("step"))) return params.get("step")!;
    return initialStep ?? "login";
  })();

  const goToStep = (next: AuthStep, setError?: (error: string) => void) => {
    if (setError) {
      setError("");
    }
    setSearchParams((prev) => {
      const nextParams = new URLSearchParams(prev);
      if (next === "login") {
        nextParams.delete("step");
        nextParams.delete("token");
      } else {
        nextParams.set("step", next);
      }
      return nextParams;
    });
  };

  useEffect(() => {
    const tokenFromUrl = params.get("token");
    if (tokenFromUrl) {
      setResetToken(tokenFromUrl);
    }
  }, [params]);

  return (
    <div className="relative mx-auto flex min-h-screen max-w-107.5 flex-col bg-paper font-sans text-ink md:my-10 md:min-h-[calc(100vh-80px)] md:overflow-hidden md:rounded-3xl md:shadow-[0_24px_64px_rgba(18,57,74,0.16)]">
      <div className="mx-auto mt-15 flex max-w-85 flex-col px-6">
        <BrandLogo className="mx-auto h-24 w-auto  max-w-55 object-contain" />

        {step === "login" && (
          <LoginPage onLoggedIn={onLoggedIn} goToStep={goToStep} />
        )}

        {(step === "glemt-email" || step === "glemt-sendt") && (
          <ForgorPasswordPage step={step} goToStep={goToStep} />
        )}

        {(step === "glemt-nyt" || step === "glemt-succes") && (
          <CreateNewPasswordPage
            step={step}
            goToStep={goToStep}
            resetToken={resetToken}
          />
        )}

        {step === "installer" && <InstallAppPage goToStep={goToStep} />}
      </div>
    </div>
  );
}
