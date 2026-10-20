import { useEffect, useState } from "react";
import { ApiError, request } from "@/api/request";
import { Button } from "@/components/ui/Button";
import { Field, FieldRow } from "@/components/ui/Field";
import Input from "@/components/ui/Input";
import { useAuth } from "@/context/AuthContext";

type MailSettings = {
  host: string;
  port: number;
  username: string;
  fromAddress: string;
  fromName: string;
  hasPassword: boolean;
  fallbackFromAddress?: string | null;
};

type Draft = {
  host: string;
  port: string;
  username: string;
  password: string;
  fromAddress: string;
  fromName: string;
  hasPassword: boolean;
};

const emptyDraft: Draft = {
  host: "",
  port: "587",
  username: "",
  password: "",
  fromAddress: "",
  fromName: "",
  hasPassword: false,
};

function toDraft(settings: MailSettings): Draft {
  return {
    host: settings.host,
    port: String(settings.port || 587),
    username: settings.username,
    password: "",
    fromAddress: settings.fromAddress,
    fromName: settings.fromName,
    hasPassword: settings.hasPassword,
  };
}

export function MailSettingsSection() {
  const { user } = useAuth();
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [fallbackFrom, setFallbackFrom] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState<"save" | "test" | "clear" | null>(null);

  useEffect(() => {
    let cancelled = false;
    request<MailSettings>("/mail-settings")
      .then((settings) => {
        if (!cancelled) {
          setDraft(toDraft(settings));
          setFallbackFrom(settings.fallbackFromAddress ?? "");
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Kunne ikke hente email-indstillinger.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const payload = (password: string, clear = false) =>
    clear
      ? { host: "", port: 587, username: "", password: "", fromAddress: "", fromName: "" }
      : {
          host: draft.host.trim(),
          port: Number(draft.port) || 587,
          username: draft.username.trim(),
          password,
          fromAddress: draft.fromAddress.trim(),
          fromName: draft.fromName.trim(),
        };

  const save = async () => {
    setError("");
    setNotice("");
    setBusy("save");
    try {
      const saved = await request<MailSettings>("/mail-settings", {
        method: "PUT",
        body: JSON.stringify(payload(draft.password)),
      });
      setDraft(toDraft(saved));
      setFallbackFrom(saved.fallbackFromAddress ?? "");
      setNotice(saved.hasPassword ? "Email-afsenderen er gemt." : "Email-afsenderen er fjernet.");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Kunne ikke gemme email.");
    } finally {
      setBusy(null);
    }
  };

  const test = async () => {
    setError("");
    setNotice("");
    setBusy("test");
    try {
      await request("/mail-settings/test", {
        method: "POST",
        body: JSON.stringify(payload(draft.password)),
      });
      setNotice(`Testmailen er sendt til ${user?.email ?? "din email"}.`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Testmailen blev ikke sendt.");
    } finally {
      setBusy(null);
    }
  };

  const clear = async () => {
    setError("");
    setNotice("");
    setBusy("clear");
    try {
      const saved = await request<MailSettings>("/mail-settings", {
        method: "PUT",
        body: JSON.stringify(payload("", true)),
      });
      setDraft(toDraft(saved));
      setFallbackFrom(saved.fallbackFromAddress ?? "");
      setNotice("Email-afsenderen er fjernet.");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Kunne ikke fjerne email.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="mt-8 border-t border-black/10 pt-6">
      <h2 className="font-display text-[15px] font-semibold text-ink">Email</h2>
      <p className="mt-1 mb-4 max-w-2xl text-[13px] text-ink-soft">
        Invitationer og nulstilling af adgangskode sendes fra organisationens egen postkasse.
        {fallbackFrom
          ? ` Indtil den er gemt, sendes mailen fra ${fallbackFrom}.`
          : " Indtil den er gemt, sendes mailen fra systemets postkasse."}
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <Field label="SMTP-server" hint="Fx smtp.office365.com eller mail.udbyder.dk.">
            <Input
              type="text"
              value={draft.host}
              autoComplete="off"
              onChange={(e) => setDraft((d) => ({ ...d, host: e.target.value }))}
            />
          </Field>
          <FieldRow>
            <Field label="Port" hint="587 er det normale valg. 465 bruger SSL med det samme.">
              <Input
                type="text"
                value={draft.port}
                autoComplete="off"
                onChange={(e) => setDraft((d) => ({ ...d, port: e.target.value }))}
              />
            </Field>
            <Field label="Brugernavn" hint="Ofte den fulde emailadresse.">
              <Input
                type="text"
                value={draft.username}
                autoComplete="off"
                onChange={(e) => setDraft((d) => ({ ...d, username: e.target.value }))}
              />
            </Field>
          </FieldRow>
          <Field
            label="Adgangskode"
            hint={
              draft.hasPassword
                ? "Lad feltet stå tomt for at beholde den gemte adgangskode."
                : "Adgangskoden gemmes krypteret og vises ikke igen."
            }
          >
            <Input
              type="password"
              value={draft.password}
              autoComplete="off"
              placeholder={draft.hasPassword ? "Uændret" : ""}
              onChange={(e) => setDraft((d) => ({ ...d, password: e.target.value }))}
            />
          </Field>
          <Field label="Afsenderadresse" hint="Skal være en adresse postkassen må sende som. Brug samme adresse som brugernavnet, medmindre udbyderen siger andet.">
            <Input
              type="email"
              value={draft.fromAddress}
              autoComplete="off"
              onChange={(e) => setDraft((d) => ({ ...d, fromAddress: e.target.value }))}
            />
          </Field>
          <Field label="Afsendernavn" hint='Valgfrit. Fx "Narrative efteruddannelser".'>
            <Input
              type="text"
              value={draft.fromName}
              autoComplete="off"
              onChange={(e) => setDraft((d) => ({ ...d, fromName: e.target.value }))}
            />
          </Field>
          {error && <div className="mb-3 text-xs text-[#a14b36]">{error}</div>}
          {notice && <div className="mb-3 text-xs text-ink-soft">{notice}</div>}
          <div className="flex flex-wrap gap-2.5">
            <Button variant="primary" disabled={busy !== null} onClick={() => void save()}>
              {busy === "save" ? "Gemmer…" : "Gem email"}
            </Button>
            <Button variant="secondary" disabled={busy !== null} onClick={() => void test()}>
              {busy === "test" ? "Sender…" : "Send testmail"}
            </Button>
            {draft.hasPassword && (
              <Button variant="secondary" disabled={busy !== null} onClick={() => void clear()}>
                {busy === "clear" ? "Fjerner…" : "Fjern afsender"}
              </Button>
            )}
          </div>
          <p className="mt-2 text-[11px] text-ink-soft">
            Testmailen sendes kun til {user?.email ?? "den administrator, der er logget ind"}.
          </p>
        </div>

        <details className="text-[13px] text-ink-soft">
          <summary className="cursor-pointer font-semibold text-ink">Sådan finder I oplysningerne</summary>
          <div className="mt-3 space-y-3">
            <p>
              Brug en postkasse organisationen allerede har. Opret ikke en ny mailservice.
              Afsenderadressen og brugernavnet er næsten altid den samme email.
            </p>
            <p>
              <span className="font-semibold text-ink">Microsoft 365.</span> Server{" "}
              <span className="font-mono">smtp.office365.com</span>, port 587. Brugernavnet er postkassens
              fulde adresse. Authenticated SMTP skal være slået til for netop den postkasse. Det er slået
              fra hos mange. En administrator i Microsoft 365 finder det under brugeren, Mail, og
              Administrer mailapps. Hvis kontoen har to-trins godkendelse, skal adgangskoden være en
              app-adgangskode. Afsenderadressen skal være postkassen selv, eller et alias den må sende som.
            </p>
            <p>
              <span className="font-semibold text-ink">Webhotel eller egen mail.</span> Kontrolpanelet viser
              SMTP-server, port og brugernavn. Porten er typisk 587. Adgangskoden er postkassens egen.
            </p>
            <p>
              Gem først, eller send testmailen med det samme. Kommer den ikke frem, er server, port eller
              adgangskode forkert, eller udbyderen blokerer SMTP fra Azure. Invitationen kan sendes igen,
              når testmailen virker.
            </p>
          </div>
        </details>
      </div>
    </section>
  );
}
