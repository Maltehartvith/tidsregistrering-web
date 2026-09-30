import { useParams } from "react-router-dom";
import { AdminKursisterView } from "./AdminKursisterView";

type AdminStudentsViewProps = {};
export const AdminStudentsView = ({}: AdminStudentsViewProps) => {
  const { studentId } = useParams<{ studentId?: string }>();
  return <AdminKursisterView />;
};
