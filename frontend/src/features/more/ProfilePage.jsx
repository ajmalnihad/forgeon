import PageHeader from "../../components/layout/PageHeader.jsx";
import { Card } from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { initials } from "../../utils/format.js";

const PERMISSIONS = {
  admin: [
    "Manage customers and products",
    "Create, edit and read sales",
    "Mark pending payments as Paid",
    "Delete (soft) and restore sales",
    "View reports and Trash",
  ],
  staff: [
    "Search and read customers",
    "Create customers during a sale",
    "Read and use products",
    "Create, read and edit sales",
    "View dashboard and loyalty information",
  ],
};

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const permissions = PERMISSIONS[user?.role] || [];

  return (
    <>
      <PageHeader title="Profile" back />

      <div className="space-y-4">
        <Card className="flex items-center gap-4 p-5">
          <span className="flex size-14 items-center justify-center rounded-full bg-accent-soft text-base font-bold text-accent">
            {initials(user?.name || "")}
          </span>
          <div className="min-w-0">
            <p className="truncate text-lg font-bold text-fg">{user?.name}</p>
            <p className="text-xs text-muted">{user?.email}</p>
            <span className="mt-1.5 inline-block rounded-full bg-surface2 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
              {user?.role}
            </span>
          </div>
        </Card>

        <Card className="p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
            What you can do
          </p>
          <ul className="mt-2 space-y-1.5">
            {permissions.map((p) => (
              <li key={p} className="text-sm text-fg">
                · {p}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[11px] text-subtle">
            Permissions shown here reflect the UI only. The backend enforces the real authorization.
          </p>
        </Card>

        <Button variant="subtleDanger" icon="logout" className="w-full" onClick={logout}>
          Log out
        </Button>
      </div>
    </>
  );
}
