import { AppTitle } from "@/components/brand/Brand";
import type { AuthStep } from "./LoginView";
import { Button } from "@/components/ui/Button";

type InstallAppPageType = {
  goToStep: (step: AuthStep, setError?: (error: string) => void) => void;
};
export const InstallAppPage = ({ goToStep }: InstallAppPageType) => {
  return (
    <>
      <div
        className="mb-0.5 font-display text-[28px] font-semibold"
        style={{ textAlign: "center" }}
      >
        Installer appen
      </div>
      <p
        className="mb-3.5 text-[13px] leading-normal text-ink-soft"
        style={{ textAlign: "center" }}
      >
        Så ligger <AppTitle /> klar på din hjemmeskærm, ligesom enhver anden
        app.
      </p>

      <div className="mb-4.5">
        <div className="mb-2.5 font-mono text-[11px] uppercase tracking-[0.06em] text-primary">
          iPhone · Safari
        </div>
        <div className="mb-2 flex items-start gap-2.5 text-[13px] leading-normal">
          <span className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink font-mono text-[11px] font-semibold text-card">
            1
          </span>
          <span>
            Åbn appens link i Safari (ikke i mail-appens indbyggede visning).
          </span>
        </div>
        <div className="mb-2 flex items-start gap-2.5 text-[13px] leading-normal">
          <span className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink font-mono text-[11px] font-semibold text-card">
            2
          </span>
          <span>Tryk på Del-ikonet nederst på skærmen.</span>
        </div>
        <div className="mb-2 flex items-start gap-2.5 text-[13px] leading-normal">
          <span className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink font-mono text-[11px] font-semibold text-card">
            3
          </span>
          <span>Vælg &quot;Føj til hjemmeskærm&quot;.</span>
        </div>
      </div>

      <div className="mb-4.5">
        <div className="mb-2.5 font-mono text-[11px] uppercase tracking-[0.06em] text-primary">
          Android · Chrome
        </div>
        <div className="mb-2 flex items-start gap-2.5 text-[13px] leading-normal">
          <span className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink font-mono text-[11px] font-semibold text-card">
            1
          </span>
          <span>Åbn appens link i Chrome.</span>
        </div>
        <div className="mb-2 flex items-start gap-2.5 text-[13px] leading-normal">
          <span className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink font-mono text-[11px] font-semibold text-card">
            2
          </span>
          <span>Tryk på menuen (⋮) øverst til højre.</span>
        </div>
        <div className="mb-2 flex items-start gap-2.5 text-[13px] leading-normal">
          <span className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink font-mono text-[11px] font-semibold text-card">
            3
          </span>
          <span>
            Vælg &quot;Installer app&quot; eller &quot;Føj til startskærm&quot;.
          </span>
        </div>
      </div>

      <p
        className="mt-1 block text-[11px] text-ink-soft"
        style={{ margin: "4px 0 20px" }}
      >
        Herefter åbner du appen direkte fra ikonet på din hjemmeskærm, uden at
        skulle taste linket ind igen. Adgangskoden gemmes ikke på telefonen —
        sessionen holdes sikkert via cookie.
      </p>

      <Button
        variant="primary"
        className="w-full"
        onClick={() => goToStep("login")}
      >
        Gå til log ind
      </Button>
    </>
  );
};
