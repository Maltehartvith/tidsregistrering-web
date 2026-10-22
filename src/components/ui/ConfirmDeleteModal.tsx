import { useState, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { Field } from "./Field";
import Input from "./Input";

type ConfirmDeleteModalProps = {
  title: string;
  name: string;
  description: ReactNode;
  blockedReason?: ReactNode;
  confirmLabel?: string;
  isSaving?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
};

export function ConfirmDeleteModal({
  title,
  name,
  description,
  blockedReason,
  confirmLabel = "Slet permanent",
  isSaving,
  onConfirm,
  onClose,
}: ConfirmDeleteModalProps) {
  const [typed, setTyped] = useState("");
  const matches = typed.trim() === name.trim();

  return (
    <Modal title={title} onClose={onClose}>
      {blockedReason ? (
        <>
          <div className="flex items-start gap-1.5 text-sm leading-normal text-secondary">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <div>{blockedReason}</div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button variant="secondary" onClick={onClose}>
              Luk
            </Button>
          </div>
        </>
      ) : (
        <>
          <p className="mb-3.5 text-[13px] leading-normal text-ink">
            {description}
          </p>
          <Field label={`Skriv "${name}" for at bekræfte`}>
            <Input
              type="text"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={name}
            />
          </Field>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose} disabled={isSaving}>
              Annuller
            </Button>
            <Button
              variant="primary"
              className="bg-red-700 text-white hover:bg-red-800"
              disabled={!matches || isSaving}
              aria-busy={isSaving}
              onClick={() => void onConfirm()}
            >
              {isSaving ? "Sletter…" : confirmLabel}
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
}
