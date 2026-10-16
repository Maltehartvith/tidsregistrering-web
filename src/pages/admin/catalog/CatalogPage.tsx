import AdminPageWrapper from "@/pages/admin/components/AdminPageWrapper";
import CategoriesSection from "@/pages/admin/catalog/components/CategoriesSection";
import LearningGoalsSection from "@/pages/admin/catalog/components/LearningGoalsSection";
import { useCatalog } from "@/context/CatalogContext";
import { useEntries } from "@/context/EntriesContext";
import { GhostBlock } from "@/components/ui/Ghost";

function CatalogSectionGhost({ rows = 4 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-2.5">
      <GhostBlock className="mb-1 h-6 w-48" />
      <GhostBlock className="mb-2 h-10 w-full max-w-xl" />
      {Array.from({ length: rows }).map((_, index) => (
        <GhostBlock key={index} className="h-16 w-full rounded-lg" />
      ))}
    </div>
  );
}

export function CatalogPage() {
  const { isLoading: isCatalogLoading } = useCatalog({
    categories: true,
    programs: true,
    goals: true,
  });
  const { isLoading: isEntriesLoading } = useEntries();
  const isLoading = isCatalogLoading || isEntriesLoading;

  return (
    <AdminPageWrapper
      title="Kategorier & læringsmål"
      subtitle="Tilpas timekategorier og læringsmål til jeres uddannelser"
    >
      {isLoading ? (
        <>
          <CatalogSectionGhost rows={4} />
          <div className="my-5 flex items-center gap-2">
            <span className="stitch-line" />
          </div>
          <CatalogSectionGhost rows={5} />
        </>
      ) : (
        <>
          <CategoriesSection />

          <div className="my-5 flex items-center gap-2">
            <span className="stitch-line" />
          </div>

          <LearningGoalsSection />
        </>
      )}
    </AdminPageWrapper>
  );
}
