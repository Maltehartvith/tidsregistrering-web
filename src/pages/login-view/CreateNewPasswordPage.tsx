import { Field } from "@/components/ui/Field";
import Input from "@/components/ui/Input";
import { Check, KeyRound } from "lucide-react";
import { useState } from "react";
import { AuthStep } from "./LoginView";
import * as api from "../../api/auth";
import { Button } from "@/components/ui/Button";

type CreateNewPasswordPageType = {
  step: AuthStep;
  goToStep: (step: AuthStep, setError?: (error: string) => void) => void;
  resetToken: string;
};

export const CreateNewPasswordPage = ({
  step,
  goToStep,
  resetToken,
}: CreateNewPasswordPageType) => {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [newPassword2, setNewPassword2] = useState("");

  const saveNewPassword = async () => {
    if (newPassword.length < 8) {
      setError("Adgangskoden skal være mindst 8 tegn.");
      return;
    }
    if (newPassword !== newPassword2) {
      setError("De to adgangskoder er ikke ens.");
      return;
    }
    if (!resetToken) {
      setError("Manglende nulstillingstoken. Anmod om et nyt link.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await api.resetPassword(resetToken, newPassword);
      goToStep("glemt-succes", setError);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Kunne ikke opdatere adgangskoden.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      {step === "glemt-nyt" && (
        <>
          <div
            className="mb-0.5 font-display text-[28px] font-semibold"
            style={{ textAlign: "center" }}
          >
            Vælg ny adgangskode
          </div>
          <div
            className="text-[13px] text-ink-soft"
            style={{ textAlign: "center", marginBottom: 24 }}
          >
            Mindst 8 tegn.
          </div>
          <Field label="Ny adgangskode">
            <Input
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              icon={<KeyRound size={16} />}
              type="password"
            />
          </Field>
          <Field label="Gentag ny adgangskode">
            <Input
              value={newPassword2}
              onChange={(e) => setNewPassword2(e.target.value)}
              icon={<KeyRound size={16} />}
              type="password"
            />
          </Field>
          {error && (
            <div className="-mt-1.5 mb-3 text-xs text-[#a14b36]">{error}</div>
          )}
          <Button
            variant="primary"
            className="w-full"
            disabled={busy}
            onClick={() => void saveNewPassword()}
          >
            Gem ny adgangskode
          </Button>
        </>
      )}
      {step === "glemt-succes" && (
        <>
          <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-on-secondary">
            <Check size={22} />
          </div>
          <div
            className="mb-0.5 font-display text-[28px] font-semibold"
            style={{ textAlign: "center" }}
          >
            Adgangskode opdateret
          </div>
          <p
            className="mb-3.5 text-[13px] leading-normal text-ink-soft"
            style={{ textAlign: "center" }}
          >
            Du kan nu logge ind med din nye adgangskode. Er det din første gang,
            kan du med fordel installere appen på din telefon først.
          </p>
          <button
            className="flex-1 cursor-pointer rounded-[10px] border-0 bg-primary px-4 py-3 font-sans text-sm font-semibold text-on-primary transition-opacity active:opacity-75 disabled:cursor-default disabled:opacity-45"
            style={{ width: "100%", marginTop: 6 }}
            onClick={() => goToStep("installer", setError)}
          >
            Installer appen
          </button>
          <button
            className="mt-3.5 cursor-pointer border-0 bg-transparent text-center font-sans text-[13px] font-semibold text-primary"
            type="button"
            onClick={() => goToStep("login", setError)}
          >
            Spring over, gå til log ind
          </button>
        </>
      )}
    </>
  );
};

export default CreateNewPasswordPage;
