import { useState } from "react";
import { AuthStep } from "./LoginView";
import * as api from "../../api/auth";
import { Field } from "@/components/ui/Field";
import Input from "@/components/ui/Input";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";

type ForgorPasswordPageType = {
  step: AuthStep;
  goToStep: (step: AuthStep, setError?: (error: string) => void) => void;
};
export const ForgorPasswordPage = ({
  step,
  goToStep,
}: ForgorPasswordPageType) => {
  const [resetEmail, setResetEmail] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [resetToken, setResetToken] = useState("");
  const sendReset = async () => {
    if (!resetEmail.trim()) return;
    setBusy(true);
    setError("");
    try {
      const res = await api.forgotPassword(resetEmail.trim());
      goToStep("glemt-sendt", setError);
      // Dev helper: API may return token when SMTP is not configured
      if ((res as unknown as { token?: string }).token) {
        setResetToken((res as unknown as { token?: string }).token ?? "");
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Kunne ikke sende reset-mail.");
    } finally {
      setBusy(false);
      console.log(step);
    }
  };

  return (
    <>
      {step === "glemt-email" && (
        <>
          <div
            className="mb-0.5 font-display text-[28px] font-semibold"
            style={{ textAlign: "center" }}
          >
            Nulstil adgangskode
          </div>
          <div
            className="text-[13px] text-ink-soft"
            style={{ textAlign: "center", marginBottom: 24 }}
          >
            Indtast din email, så sender vi et link til at vælge en ny
            adgangskode.
          </div>
          <Field label="Email">
            <Input
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              icon={<Mail size={16} />}
              type="email"
              autoComplete="email"
            />
          </Field>
          {error && (
            <div className="-mt-1.5 mb-3 text-xs text-[#a14b36]">{error}</div>
          )}
          <Button
            variant="primary"
            className="w-full"
            disabled={busy}
            onClick={() => void sendReset()}
          >
            {busy ? "Sender nulstillingslink…" : "Send nulstillingslink"}
          </Button>
          <Button
            variant="ghost"
            className="text-xs w-fit mx-auto mt-2"
            onClick={() => goToStep("login", setError)}
          >
            Tilbage til log ind
          </Button>
        </>
      )}
      {step === "glemt-sendt" && (
        <>
          <div
            className="mb-0.5 font-display text-[28px] font-semibold"
            style={{ textAlign: "center" }}
          >
            Tjek din email
          </div>
          <p
            className="mb-3.5 text-[13px] leading-normal text-ink-soft"
            style={{ textAlign: "center" }}
          >
            Hvis {resetEmail || "din email"} findes i vores system, har vi sendt
            et link til at nulstille adgangskoden. Linket er gyldigt i 60
            minutter.
          </p>
          {import.meta.env.DEV && resetToken && (
            <div className="my-4.5 mb-1.5 rounded-xl border-[1.5px] border-dashed border-border p-3.5">
              <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-soft">
                Kun i udvikling
              </div>
              <p
                className="mb-3.5 text-[13px] leading-normal text-ink-soft"
                style={{ margin: "6px 0 10px" }}
              >
                SMTP er ikke konfigureret — brug token direkte:
              </p>
              <button
                className="flex-1 cursor-pointer rounded-[10px] border-[1.5px] border-border bg-transparent px-4 py-3 font-sans text-sm font-semibold text-ink-soft transition-opacity active:opacity-75 disabled:cursor-default disabled:opacity-45"
                style={{ width: "100%" }}
                onClick={() => goToStep("glemt-nyt", setError)}
              >
                Åbn nulstillingslink
              </button>
            </div>
          )}
          <button
            className="mt-3.5 cursor-pointer border-0 bg-transparent text-center font-sans text-[13px] font-semibold text-primary"
            type="button"
            onClick={() => goToStep("login", setError)}
          >
            Tilbage til log ind
          </button>
        </>
      )}
    </>
  );
};
