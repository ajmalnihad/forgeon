import { cn } from "../../utils/cn.js";
import Icon from "./Icon.jsx";

export function Card({ as: Tag = "div", className, children, interactive = false, ...rest }) {
  return (
    <Tag
      className={cn(
        "rounded-2xl border border-line bg-surface",
        interactive &&
          "cursor-pointer text-left transition-colors duration-150 hover:border-line-strong hover:bg-surface2 w-full",
        className
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export function SectionHeader({ title, subtitle, action, className }) {
  return (
    <div className={cn("mb-3 flex items-end justify-between gap-3", className)}>
      <div className="min-w-0">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-muted">{title}</h2>
        {subtitle && <p className="mt-0.5 truncate text-xs text-subtle">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function LinkAction({ children, className, ...rest }) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center gap-1 rounded-lg px-1.5 py-1 text-[13px] font-semibold text-accent transition-colors hover:bg-accent-soft",
        className
      )}
      {...rest}
    >
      {children}
      <Icon name="chevronRight" className="size-3.5" strokeWidth={2.4} />
    </button>
  );
}
