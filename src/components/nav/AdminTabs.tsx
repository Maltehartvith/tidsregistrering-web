import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { adminNavItems } from "./adminNav";

export function AdminTabs() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {adminNavItems.map(({ key, to, label, Icon, isActive }) => (
        <Button
          key={key}
          variant={isActive(pathname) ? "tabActive" : "tab"}
          onClick={() => navigate(to)}
        >
          <Icon size={14} /> {label}
        </Button>
      ))}
    </div>
  );
}
