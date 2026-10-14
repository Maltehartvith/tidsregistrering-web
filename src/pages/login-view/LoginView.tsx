import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import type { UserRole } from "../../types/user";
import { BrandLogo } from "../../components/brand/Brand";
import { ForgorPasswordPage } from "./ForgorPasswordPage";
import { LoginPage } from "./LoginPage";
import { CreateNewPasswordPage } from "./CreateNewPasswordPage";
import { InstallAppPage } from "./InstallAppPage";
import PageWrapper from "@/components/ui/PageWrapper";

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
    <PageWrapper size="form">
      <div className="w-full px-5 py-8 md:px-8">
        <div className="mb-4 flex justify-center">
          <BrandLogo className="mx-auto h-16 w-auto max-w-55 object-contain md:h-24" />
        </div>

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
    </PageWrapper>
  );
}
