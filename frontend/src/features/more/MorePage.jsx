import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/layout/PageHeader.jsx";
import Icon from "../../components/ui/Icon.jsx";
import Button from "../../components/ui/Button.jsx";
import { moreItems } from "../../components/layout/navItems.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useTheme } from "../../context/ThemeContext.jsx";
import { initials } from "../../utils/format.js";

export default function MorePage() {
  const navigate = useNavigate();
  const { user, isAdmin, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const items = moreItems({ isAdmin });

  return (
    <>
      <PageHeader title="More" subtitle="Modules and account" />

      <div className="mb-5 flex items-center gap-3 rounded-2xl border border-line bg-surface p-4">
        <span className="flex size-12 items-center justify-center rounded-full bg-accent-soft text-sm font-bold text-accent">
          {initials(user?.name || "")}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold text-fg">{user?.name}</p>
          <p className="text-xs uppercase tracking-wide text-subtle">{user?.role} account</p>
        </div>
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="flex size-10 items-center justify-center rounded-xl border border-line text-muted hover:text-fg"
        >
          <Icon name={theme === "dark" ? "sun" : "moon"} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => (
          <button
            key={item.to}
            type="button"
            onClick={() => navigate(item.to)}
            className="flex flex-col items-start gap-3 rounded-2xl border border-line bg-surface p-4 text-left transition-colors hover:border-line-strong hover:bg-surface2"
          >
            <span className="flex size-10 items-center justify-center rounded-xl bg-surface2 text-accent">
              <Icon name={item.icon} className="size-5" />
            </span>
            <span className="min-w-0">
              <span className="block text-[15px] font-semibold text-fg">{item.label}</span>
              <span className="mt-0.5 block text-xs text-muted">{item.desc}</span>
            </span>
          </button>
        ))}
      </div>

      <Button variant="subtleDanger" icon="logout" className="mt-5 w-full" onClick={logout}>
        Log out
      </Button>

      <p className="mt-6 text-center text-[11px] text-subtle">ForgeON MVP · Frontend build</p>
    </>
  );
}
