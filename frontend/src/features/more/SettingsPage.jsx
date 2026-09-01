import PageHeader from "../../components/layout/PageHeader.jsx";
import { Card } from "../../components/ui/Card.jsx";
import { cn } from "../../utils/cn.js";
import Icon from "../../components/ui/Icon.jsx";
import { useTheme } from "../../context/ThemeContext.jsx";
import { API_BASE_URL } from "../../services/api/client.js";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();

  return (
    <>
      <PageHeader title="Settings" back subtitle="Appearance and environment" />

      <div className="space-y-4">
        <Card className="p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Theme</p>
          <p className="mt-0.5 text-xs text-subtle">Your choice is saved on this device.</p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {[
              { key: "dark", label: "Dark", icon: "moon" },
              { key: "light", label: "Light", icon: "sun" },
            ].map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setTheme(opt.key)}
                className={cn(
                  "flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors",
                  theme === opt.key
                    ? "border-accent bg-accent-soft text-accent"
                    : "border-line bg-surface text-muted hover:text-fg"
                )}
              >
                <Icon name={opt.icon} className="size-5" />
                <span className="text-sm font-semibold">{opt.label}</span>
              </button>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">API</p>
          <div className="mt-2 space-y-1 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-muted">Backend URL</span>
              <span className="truncate font-mono text-xs text-fg">{API_BASE_URL}</span>
            </div>
          </div>
          <p className="mt-3 text-xs text-subtle">
            Set <span className="font-mono">VITE_API_BASE_URL</span> in your{" "}
            <span className="font-mono">.env</span> to connect to a different backend server.
          </p>
        </Card>
      </div>
    </>
  );
}
