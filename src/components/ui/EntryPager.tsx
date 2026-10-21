import { Button } from "@/components/ui/Button";

export function EntryPager({
  page,
  pageSize,
  total,
  onPage,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPage: (page: number) => void;
}) {
  if (total <= pageSize) return null;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  return (
    <div className="mt-3 flex items-center justify-between gap-3 text-xs text-ink-soft">
      <span>
        {from}–{to} af {total}
      </span>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="small"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
        >
          Forrige
        </Button>
        <Button
          variant="secondary"
          size="small"
          disabled={page >= pages}
          onClick={() => onPage(page + 1)}
        >
          Næste
        </Button>
      </div>
    </div>
  );
}
