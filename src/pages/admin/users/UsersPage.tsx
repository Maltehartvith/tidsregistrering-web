import AdminPageWrapper from "@/pages/admin/components/AdminPageWrapper";
import { ADMIN_ROLES } from "@/data/constants";
import { InviteUserForm } from "@/pages/admin/users/components/InviteUserForm";
import { UserList } from "@/pages/admin/users/components/UserList";

export function UsersPage() {
  return (
    <AdminPageWrapper
      title="Administratorer"
      subtitle="Inviter og administrer administratorer og undervisere"
    >
      <p className="mb-3.5 text-[13px] leading-normal text-ink-soft">
        <strong>Administrator</strong>: {ADMIN_ROLES.administrator.description}
      </p>
      <p
        className="mb-3.5 text-[13px] leading-normal text-ink-soft"
        style={{ marginTop: -8 }}
      >
        <strong>Underviser</strong>: {ADMIN_ROLES.underviser.description}
      </p>

      <InviteUserForm />
      <UserList />
    </AdminPageWrapper>
  );
}
