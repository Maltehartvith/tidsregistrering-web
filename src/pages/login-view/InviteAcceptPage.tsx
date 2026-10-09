import { useEffect, useState } from "react";
import { Lock, User, Mail, Check } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Field } from "../../components/ui/Field";
import { BrandLogo } from "../../components/brand/Brand";
import * as api from "../../api/auth";
import { domainQueryKeys, queryKeys, homeForRole } from "../../api/queryKeys";
import { useQueryClient } from "@tanstack/react-query";
import { routes } from "@/routes";

export function InviteAcceptPage() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<api.InvitePreview | null>(null);
  const [loadError, setLoadError] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) {
      setLoadError("Manglende invitationslink.");
      setLoading(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const data = await api.getInvite(token);
        if (cancelled) return;
        setPreview(data);
        setName(data.name);
      } catch (e) {
        if (cancelled) return;
        setLoadError(
          e instanceof Error
            ? e.message
            : "Invitationslinket er ugyldigt eller udløbet.",
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const submit = async () => {
    setError("");
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Angiv dit navn.");
      return;
    }
    if (password.length < 8) {
      setError("Adgangskoden skal være mindst 8 tegn.");
      return;
    }
    if (password !== password2) {
      setError("De to adgangskoder er ikke ens.");
      return;
    }
    setBusy(true);
    try {
      const user = await api.acceptInvite({
        token,
        name: trimmed,
        password,
      });
      queryClient.setQueryData(queryKeys.me, user);
      for (const key of domainQueryKeys) {
        queryClient.removeQueries({ queryKey: key });
      }
      setDone(true);
      navigate(homeForRole(user.role), { replace: true });
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Kunne ikke fuldføre invitationen.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative mx-auto flex min-h-screen max-w-107.5 flex-col bg-paper font-sans text-ink md:my-10 md:min-h-[calc(100vh-80px)] md:overflow-hidden md:rounded-3xl md:shadow-[0_24px_64px_rgba(18,57,74,0.16)]">
      <div className="mx-auto mt-15 flex max-w-85 flex-col px-6">
        <BrandLogo className="mx-auto mb-5 h-12 w-auto max-w-55 object-contain" />

        {loading && (
          <div className="text-center text-[13px] text-ink-soft">
            Indlæser invitation…
          </div>
        )}

        {!loading && loadError && (
          <>
            <div className="mb-2 text-center font-display text-[24px] font-semibold">
              Ugyldigt link
            </div>
            <p className="mb-6 text-center text-[13px] text-ink-soft">
              {loadError}
            </p>
            <button
              type="button"
              className="cursor-pointer rounded-[10px] border-0 bg-primary px-4 py-3 font-sans text-sm font-semibold text-on-primary"
              onClick={() => navigate(routes.login)}
            >
              Gå til login
            </button>
          </>
        )}

        {!loading && preview && !done && (
          <>
            <div className="mb-0.5 text-center font-display text-[28px] font-semibold">
              Fuldfør invitation
            </div>
            <p className="mb-6 text-center text-[13px] text-ink-soft">
              Du er inviteret til <strong>{preview.orgName}</strong> som{" "}
              {preview.role}. Tjek dit navn og vælg en adgangskode.
            </p>

            <Field label="Email">
              <div className="flex items-center gap-2 rounded-[10px] border-[1.5px] border-border bg-card px-3 text-ink-soft opacity-80">
                <Mail size={16} />
                <input type="email" value={preview.email} readOnly disabled />
              </div>
            </Field>

            <Field label="Navn">
              <div className="flex items-center gap-2 rounded-[10px] border-[1.5px] border-border bg-card px-3 text-ink-soft">
                <User size={16} />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                />
              </div>
            </Field>

            <Field label="Adgangskode">
              <div className="flex items-center gap-2 rounded-[10px] border-[1.5px] border-border bg-card px-3 text-ink-soft">
                <Lock size={16} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mindst 8 tegn"
                  autoComplete="new-password"
                />
              </div>
            </Field>

            <Field label="Gentag adgangskode">
              <div className="flex items-center gap-2 rounded-[10px] border-[1.5px] border-border bg-card px-3 text-ink-soft">
                <Lock size={16} />
                <input
                  type="password"
                  value={password2}
                  onChange={(e) => setPassword2(e.target.value)}
                  autoComplete="new-password"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void submit();
                  }}
                />
              </div>
            </Field>

            {error && (
              <div className="-mt-1.5 mb-3 text-xs text-[#a14b36]">{error}</div>
            )}

            <button
              type="button"
              className="mt-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-[10px] border-0 bg-primary px-4 py-3 font-sans text-sm font-semibold text-on-primary disabled:opacity-45"
              disabled={busy}
              onClick={() => void submit()}
            >
              {busy ? "Gemmer…" : (
                <>
                  <Check size={16} /> Opret konto
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
