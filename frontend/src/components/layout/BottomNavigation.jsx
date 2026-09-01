import { NavLink } from "react-router-dom";
import { cn } from "../../utils/cn.js";
import Icon from "../ui/Icon.jsx";
import { bottomNav } from "./navItems.js";

export function BottomNavigation() {
  return (
    <nav
      className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur lg:hidden"
      aria-label="Primary"
    >
      <ul className="mx-auto flex max-w-xl items-center justify-between px-2 py-1.5">
        {bottomNav.map((item) => (
          <li key={item.to} className="flex-1">
            <NavLink
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 text-[11px] font-medium transition-colors",
                  item.primary
                    ? "mx-1 min-h-[46px] flex-row gap-1.5 bg-accent px-3 text-[13px] font-bold text-accent-fg"
                    : isActive
                      ? "text-accent"
                      : "text-muted"
                )
              }
            >
              {({ isActive }) =>
                item.primary ? (
                  <>
                    <Icon name="plus" className="size-4.5" strokeWidth={2.6} />
                    <span>Sale</span>
                  </>
                ) : (
                  <>
                    <Icon name={item.icon} className="size-5.5" strokeWidth={isActive ? 2.2 : 1.7} />
                    <span>{item.label}</span>
                  </>
                )
              }
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default BottomNavigation;
