import AdminPageWrapper from "@/pages/admin/components/AdminPageWrapper";
import CategoriesSection from "@/pages/admin/catalog/components/CategoriesSection";
import LearningGoalsSection from "@/pages/admin/catalog/components/LearningGoalsSection";

export function CatalogPage() {
  return (
    <AdminPageWrapper
      title="Kategorier & læringsmål"
      subtitle="Tilpas timekategorier og læringsmål til jeres uddannelser"
    >
      <CategoriesSection />

      <div
        className="mt-4 flex items-center gap-2"
        style={{ margin: "20px 0" }}
      >
        <span className="stitch-line" />
      </div>

      <LearningGoalsSection />
    </AdminPageWrapper>
  );
}
