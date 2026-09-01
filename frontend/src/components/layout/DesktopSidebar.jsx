import { NavLink, useNavigate } from "react-router-dom";
import { cn } from "../../utils/cn.js";
import Icon from "../ui/Icon.jsx";
import Logo from "./Logo.jsx";
import Button from "../ui/Button.jsx";
import { desktopNav } from "./navItems.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { initials } from "../../utils/format.js";

export function DesktopSidebar() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const items = desktopNav({ isAdmin });

  return (
    <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-line bg-surface lg:flex">
      <div className="px-5 py-5">
        <Logo />
      </div>

      <div className="px-4 pb-4">
        <Button className="w-full" icon="plus" onClick={() => navigate("/sales/new")}>
          New Sale
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3" aria-label="Main">
        <ul className="space-y-1">
          {items.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-accent-soft text-accent"
                      : "text-muted hover:bg-surface2 hover:text-fg"
                  )
                }
              >
                <Icon name={item.icon} className="size-5" />
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-line p-3">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <span className="flex size-9 items-center justify-center rounded-full bg-surface2 text-xs font-bold text-fg">
            {initials(user?.name || "")}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-fg">{user?.name}</p>
            <p className="text-[11px] uppercase tracking-wide text-subtle">{user?.role}</p>
          </div>
          <button
            type="button"
            onClick={logout}
            aria-label="Log out"
            title="Log out"
            className="flex size-9 items-center justify-center rounded-xl text-muted hover:bg-surface2 hover:text-danger"
          >
            <Icon name="logout" className="size-5" />
          </button>
        </div>
      </div>
    </aside>
  );
}

export default DesktopSidebar;
