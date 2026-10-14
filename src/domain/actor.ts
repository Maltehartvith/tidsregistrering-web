import { useAuth } from "@/context/AuthContext";
import type { UserRole } from "@/types/user";

export function actorLabel(role: UserRole | null | undefined): string {
  switch (role) {
    case "administrator":
      return "Administrator";
    case "underviser":
      return "Underviser";
    case "kursist":
      return "Kursist";
    default:
      return "Bruger";
  }
}

export function useActorLabel() {
  const { user } = useAuth();
  return actorLabel(user?.role);
}
