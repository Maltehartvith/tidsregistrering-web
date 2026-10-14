import type { ReactNode } from "react";
import { AdminTabs } from "./AdminTabs";
import PageWrapper from "../../../components/ui/PageWrapper";

type AdminPageWrapperProps = {
  children: ReactNode;
  title?: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  /** Extra classes for the page header row (e.g. horizontal padding). */
  headerClassName?: string;
  wrapContent?: boolean;
};

export default function AdminPageWrapper({
  children,
  title,
  subtitle,
  actions,
  headerClassName = "px-5",
  wrapContent = true,
}: AdminPageWrapperProps) {
  return (
    <PageWrapper>
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
        <AdminTabs />
        {title ? (
          <div className={headerClassName}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="mb-0.5 font-display text-[28px] font-semibold">
                  {title}
                </div>
                {subtitle != null && (
                  <div className="text-[13px] text-ink-soft">{subtitle}</div>
                )}
              </div>
              {actions}
            </div>
            <div className="mt-4 flex items-center gap-2">
              <span className="h-3 w-0.5 shrink-0 rounded-sm bg-surplus" />
              <span className="stitch-line" />
            </div>
          </div>
        ) : null}
        {wrapContent ? (
          <div className="min-h-0 flex-1 overflow-y-auto mr-1 scrollbar-bottom-margin">
            <div className="min-h-full pl-5 pr-2  py-2">{children}</div>
          </div>
        ) : (
          children
        )}
      </div>
    </PageWrapper>
  );
}
