import { useState, useEffect } from "react";
import { Lock, Mail, KeyRound, Check } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import type { UserRole } from "../../types/user";
import { Field } from "../../components/ui/Field";
import { BrandLogo, BrandName, AppTitle } from "../../components/brand/Brand";
import { useAuth } from "../../context/AuthContext";
import * as api from "../../api/auth";

type AuthStep =
  | "login"
  | "glemt-email"
  | "glemt-sendt"
  | "glemt-nyt"
  | "glemt-succes"
  | "installer";

export function AuthFlow({
  onLoggedIn,
  onContinueDemo,
  initialStep,
}: {
  onLoggedIn: (role: UserRole) => void;
  onContinueDemo?: () => void;
  /** Open directly on reset-password form (e.g. from email link). */
  initialStep?: AuthStep;
}) {
  const { login } = useAuth();
  const [params] = useSearchParams();
  const [step, setStep] = useState<AuthStep>(initialStep || "login");
  const [email, setEmail] = useState("user1@email.dk");
  const [password, setPassword] = useState("12345");
  const [rememberMe, setRememberMe] = useState(true);
  const [resetEmail, setResetEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPassword2, setNewPassword2] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const tokenFromUrl = params.get("token");
    if (tokenFromUrl) {
      setResetToken(tokenFromUrl);
      setStep("glemt-nyt");
    }
  }, [params]);

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

  const sendReset = async () => {
    if (!resetEmail.trim()) return;
    setBusy(true);
    setError("");
    try {
      const res = await api.forgotPassword(resetEmail.trim());
      setStep("glemt-sendt");
      // Dev helper: API may return token when SMTP is not configured
      if ((res as unknown as { token?: string }).token) {
        setResetToken((res as unknown as { token?: string }).token ?? "");
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Kunne ikke sende reset-mail.");
    } finally {
      setBusy(false);
    }
  };

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
      setStep("glemt-succes");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Kunne ikke opdatere adgangskoden.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative mx-auto flex min-h-screen max-w-[430px] flex-col bg-[var(--paper)] font-sans text-[var(--ink)] md:my-10 md:min-h-[calc(100vh-80px)] md:overflow-hidden md:rounded-3xl md:shadow-[0_24px_64px_rgba(18,57,74,0.16)]">
      <div className="mx-auto mt-[60px] flex max-w-[340px] flex-col px-6">
        <BrandLogo className="mx-auto mb-5 h-12 w-auto max-w-[220px] object-contain" />

        {step === "login" && (
          <>
            <div
              className="mb-0.5 font-[family-name:var(--font-display)] text-[28px] font-semibold"
              style={{ textAlign: "center" }}
            >
              Log ind
            </div>
            <div
              className="text-[13px] text-[var(--ink-soft)]"
              style={{ textAlign: "center", marginBottom: 24 }}
            >
              <BrandName />
            </div>
            <Field label="Email">
              <div className="flex items-center gap-2 rounded-[10px] border-[1.5px] border-[var(--border)] bg-[var(--card)] px-3 text-[var(--ink-soft)]">
                <Mail size={16} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                />
              </div>
            </Field>
            <Field label="Adgangskode">
              <div className="flex items-center gap-2 rounded-[10px] border-[1.5px] border-[var(--border)] bg-[var(--card)] px-3 text-[var(--ink-soft)]">
                <Lock size={16} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void handleLogin();
                  }}
                />
              </div>
            </Field>
            <label
              className="mb-1 flex cursor-pointer items-center justify-between text-[13px] font-semibold"
              style={{ marginTop: 4 }}
            >
              <span>Forbliv logget ind</span>
              <button
                type="button"
                className={`switch ${rememberMe ? "on" : ""}`}
                aria-pressed={rememberMe}
                onClick={() => setRememberMe((v) => !v)}
              >
                <span className="switch-knob" />
              </button>
            </label>
            {error && (
              <div className="-mt-1.5 mb-3 text-xs text-[#a14b36]">{error}</div>
            )}
            <button
              className="flex-1 cursor-pointer rounded-[10px] border-0 bg-[var(--blue)] px-4 py-3 font-sans text-sm font-semibold text-[#fafaf7] transition-opacity active:opacity-75 disabled:cursor-default disabled:opacity-45"
              style={{ width: "100%", marginTop: 6 }}
              disabled={busy}
              onClick={() => void handleLogin()}
            >
              {busy ? "Logger ind…" : "Log ind"}
            </button>
            <button
              className="mt-3.5 cursor-pointer border-0 bg-transparent text-center font-sans text-[13px] font-semibold text-[var(--blue)]"
              type="button"
              onClick={() => setStep("glemt-email")}
            >
              Glemt adgangskode?
            </button>
            <button
              className="mt-3.5 cursor-pointer border-0 bg-transparent text-center font-sans text-[13px] font-semibold text-[var(--blue)]"
              type="button"
              onClick={() => setStep("installer")}
            >
              Sådan installerer du appen på din telefon
            </button>
            {import.meta.env.DEV && onContinueDemo && (
              <button
                className="mt-3.5 cursor-pointer border-0 bg-transparent text-center font-sans text-[13px] font-semibold text-[var(--blue)]"
                type="button"
                onClick={onContinueDemo}
              >
                Fortsæt uden login (lokal demo)
              </button>
            )}
          </>
        )}

        {step === "glemt-email" && (
          <>
            <div
              className="mb-0.5 font-[family-name:var(--font-display)] text-[28px] font-semibold"
              style={{ textAlign: "center" }}
            >
              Nulstil adgangskode
            </div>
            <div
              className="text-[13px] text-[var(--ink-soft)]"
              style={{ textAlign: "center", marginBottom: 24 }}
            >
              Indtast din email, så sender vi et link til at vælge en ny
              adgangskode.
            </div>
            <Field label="Email">
              <div className="flex items-center gap-2 rounded-[10px] border-[1.5px] border-[var(--border)] bg-[var(--card)] px-3 text-[var(--ink-soft)]">
                <Mail size={16} />
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="din@email.dk"
                />
              </div>
            </Field>
            {error && (
              <div className="-mt-1.5 mb-3 text-xs text-[#a14b36]">{error}</div>
            )}
            <button
              className="flex-1 cursor-pointer rounded-[10px] border-0 bg-[var(--blue)] px-4 py-3 font-sans text-sm font-semibold text-[#fafaf7] transition-opacity active:opacity-75 disabled:cursor-default disabled:opacity-45"
              style={{ width: "100%", marginTop: 6 }}
              disabled={busy}
              onClick={() => void sendReset()}
            >
              Send nulstillingslink
            </button>
            <button
              className="mt-3.5 cursor-pointer border-0 bg-transparent text-center font-sans text-[13px] font-semibold text-[var(--blue)]"
              type="button"
              onClick={() => setStep("login")}
            >
              Tilbage til log ind
            </button>
          </>
        )}

        {step === "glemt-sendt" && (
          <>
            <div
              className="mb-0.5 font-[family-name:var(--font-display)] text-[28px] font-semibold"
              style={{ textAlign: "center" }}
            >
              Tjek din email
            </div>
            <p
              className="mb-3.5 text-[13px] leading-normal text-[var(--ink-soft)]"
              style={{ textAlign: "center" }}
            >
              Hvis {resetEmail || "din email"} findes i vores system, har vi
              sendt et link til at nulstille adgangskoden. Linket er gyldigt i
              60 minutter.
            </p>
            {import.meta.env.DEV && resetToken && (
              <div className="my-[18px] mb-1.5 rounded-xl border-[1.5px] border-dashed border-[var(--border)] p-3.5">
                <div className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.08em] text-[var(--ink-soft)]">
                  Kun i udvikling
                </div>
                <p
                  className="mb-3.5 text-[13px] leading-normal text-[var(--ink-soft)]"
                  style={{ margin: "6px 0 10px" }}
                >
                  SMTP er ikke konfigureret — brug token direkte:
                </p>
                <button
                  className="flex-1 cursor-pointer rounded-[10px] border-[1.5px] border-[var(--border)] bg-transparent px-4 py-3 font-sans text-sm font-semibold text-[var(--ink-soft)] transition-opacity active:opacity-75 disabled:cursor-default disabled:opacity-45"
                  style={{ width: "100%" }}
                  onClick={() => setStep("glemt-nyt")}
                >
                  Åbn nulstillingslink
                </button>
              </div>
            )}
            <button
              className="mt-3.5 cursor-pointer border-0 bg-transparent text-center font-sans text-[13px] font-semibold text-[var(--blue)]"
              type="button"
              onClick={() => setStep("login")}
            >
              Tilbage til log ind
            </button>
          </>
        )}

        {step === "glemt-nyt" && (
          <>
            <div
              className="mb-0.5 font-[family-name:var(--font-display)] text-[28px] font-semibold"
              style={{ textAlign: "center" }}
            >
              Vælg ny adgangskode
            </div>
            <div
              className="text-[13px] text-[var(--ink-soft)]"
              style={{ textAlign: "center", marginBottom: 24 }}
            >
              Mindst 8 tegn.
            </div>
            <Field label="Ny adgangskode">
              <div className="flex items-center gap-2 rounded-[10px] border-[1.5px] border-[var(--border)] bg-[var(--card)] px-3 text-[var(--ink-soft)]">
                <KeyRound size={16} />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
            </Field>
            <Field label="Gentag ny adgangskode">
              <div className="flex items-center gap-2 rounded-[10px] border-[1.5px] border-[var(--border)] bg-[var(--card)] px-3 text-[var(--ink-soft)]">
                <KeyRound size={16} />
                <input
                  type="password"
                  value={newPassword2}
                  onChange={(e) => setNewPassword2(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
            </Field>
            {error && (
              <div className="-mt-1.5 mb-3 text-xs text-[#a14b36]">{error}</div>
            )}
            <button
              className="flex-1 cursor-pointer rounded-[10px] border-0 bg-[var(--blue)] px-4 py-3 font-sans text-sm font-semibold text-[#fafaf7] transition-opacity active:opacity-75 disabled:cursor-default disabled:opacity-45"
              style={{ width: "100%", marginTop: 6 }}
              disabled={busy}
              onClick={() => void saveNewPassword()}
            >
              Gem ny adgangskode
            </button>
          </>
        )}

        {step === "glemt-succes" && (
          <>
            <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-[var(--terracotta)] text-[#fafaf7]">
              <Check size={22} />
            </div>
            <div
              className="mb-0.5 font-[family-name:var(--font-display)] text-[28px] font-semibold"
              style={{ textAlign: "center" }}
            >
              Adgangskode opdateret
            </div>
            <p
              className="mb-3.5 text-[13px] leading-normal text-[var(--ink-soft)]"
              style={{ textAlign: "center" }}
            >
              Du kan nu logge ind med din nye adgangskode. Er det din første
              gang, kan du med fordel installere appen på din telefon først.
            </p>
            <button
              className="flex-1 cursor-pointer rounded-[10px] border-0 bg-[var(--blue)] px-4 py-3 font-sans text-sm font-semibold text-[#fafaf7] transition-opacity active:opacity-75 disabled:cursor-default disabled:opacity-45"
              style={{ width: "100%", marginTop: 6 }}
              onClick={() => setStep("installer")}
            >
              Installer appen
            </button>
            <button
              className="mt-3.5 cursor-pointer border-0 bg-transparent text-center font-sans text-[13px] font-semibold text-[var(--blue)]"
              type="button"
              onClick={() => setStep("login")}
            >
              Spring over, gå til log ind
            </button>
          </>
        )}

        {step === "installer" && (
          <>
            <div
              className="mb-0.5 font-[family-name:var(--font-display)] text-[28px] font-semibold"
              style={{ textAlign: "center" }}
            >
              Installer appen
            </div>
            <p
              className="mb-3.5 text-[13px] leading-normal text-[var(--ink-soft)]"
              style={{ textAlign: "center" }}
            >
              Så ligger <AppTitle /> klar på din hjemmeskærm, ligesom enhver
              anden app.
            </p>

            <div className="mb-[18px]">
              <div className="mb-2.5 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.06em] text-[var(--blue)]">
                iPhone · Safari
              </div>
              <div className="mb-2 flex items-start gap-2.5 text-[13px] leading-normal">
                <span className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--ink)] font-[family-name:var(--font-mono)] text-[11px] font-semibold text-[var(--card)]">
                  1
                </span>
                <span>
                  Åbn appens link i Safari (ikke i mail-appens indbyggede
                  visning).
                </span>
              </div>
              <div className="mb-2 flex items-start gap-2.5 text-[13px] leading-normal">
                <span className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--ink)] font-[family-name:var(--font-mono)] text-[11px] font-semibold text-[var(--card)]">
                  2
                </span>
                <span>Tryk på Del-ikonet nederst på skærmen.</span>
              </div>
              <div className="mb-2 flex items-start gap-2.5 text-[13px] leading-normal">
                <span className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--ink)] font-[family-name:var(--font-mono)] text-[11px] font-semibold text-[var(--card)]">
                  3
                </span>
                <span>Vælg &quot;Føj til hjemmeskærm&quot;.</span>
              </div>
            </div>

            <div className="mb-[18px]">
              <div className="mb-2.5 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.06em] text-[var(--blue)]">
                Android · Chrome
              </div>
              <div className="mb-2 flex items-start gap-2.5 text-[13px] leading-normal">
                <span className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--ink)] font-[family-name:var(--font-mono)] text-[11px] font-semibold text-[var(--card)]">
                  1
                </span>
                <span>Åbn appens link i Chrome.</span>
              </div>
              <div className="mb-2 flex items-start gap-2.5 text-[13px] leading-normal">
                <span className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--ink)] font-[family-name:var(--font-mono)] text-[11px] font-semibold text-[var(--card)]">
                  2
                </span>
                <span>Tryk på menuen (⋮) øverst til højre.</span>
              </div>
              <div className="mb-2 flex items-start gap-2.5 text-[13px] leading-normal">
                <span className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--ink)] font-[family-name:var(--font-mono)] text-[11px] font-semibold text-[var(--card)]">
                  3
                </span>
                <span>
                  Vælg &quot;Installer app&quot; eller &quot;Føj til
                  startskærm&quot;.
                </span>
              </div>
            </div>

            <p
              className="mt-1 block text-[11px] text-[var(--ink-soft)]"
              style={{ margin: "4px 0 20px" }}
            >
              Herefter åbner du appen direkte fra ikonet på din hjemmeskærm,
              uden at skulle taste linket ind igen. Adgangskoden gemmes ikke på
              telefonen — sessionen holdes sikkert via cookie.
            </p>

            <button
              className="flex-1 cursor-pointer rounded-[10px] border-0 bg-[var(--blue)] px-4 py-3 font-sans text-sm font-semibold text-[#fafaf7] transition-opacity active:opacity-75 disabled:cursor-default disabled:opacity-45"
              style={{ width: "100%" }}
              onClick={() => setStep("login")}
            >
              Videre til log ind
            </button>
          </>
        )}
      </div>
    </div>
  );
}
