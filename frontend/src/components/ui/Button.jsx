import { cn } from "../../utils/cn.js";
import Icon from "./Icon.jsx";

const VARIANTS = {
  primary:
    "bg-accent text-accent-fg hover:bg-accent-hover active:brightness-95 border border-transparent font-semibold",
  secondary:
    "bg-surface2 text-fg hover:bg-elevated border border-line",
  ghost: "bg-transparent text-muted hover:text-fg hover:bg-surface2 border border-transparent",
  outline: "bg-transparent text-fg border border-line-strong hover:bg-surface2",
  danger: "bg-danger text-white hover:brightness-110 border border-transparent font-semibold",
  success: "bg-success text-white hover:brightness-110 border border-transparent font-semibold",
  subtleDanger: "bg-danger-soft text-danger border border-danger/30 hover:bg-danger/15",
};

const SIZES = {
  sm: "h-9 px-3 text-sm rounded-lg gap-1.5",
  md: "h-11 px-4 text-sm rounded-xl gap-2",
  lg: "h-13 px-5 text-base rounded-xl gap-2 min-h-[52px]",
};

export function Button({
  as: Tag = "button",
  variant = "primary",
  size = "md",
  icon,
  iconRight,
  loading = false,
  loadingText,
  className,
  children,
  disabled,
  ...rest
}) {
  return (
    <Tag
      className={cn(
        "inline-flex select-none items-center justify-center whitespace-nowrap transition-colors duration-150",
        "disabled:cursor-not-allowed disabled:opacity-50",
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      disabled={Tag === "button" ? disabled || loading : undefined}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? (
        <>
          <Spinner />
          {loadingText || children}
        </>
      ) : (
        <>
          {icon && <Icon name={icon} className="size-4.5 shrink-0" />}
          {children}
          {iconRight && <Icon name={iconRight} className="size-4.5 shrink-0" />}
        </>
      )}
    </Tag>
  );
}

export function IconButton({ icon, label, className, variant = "ghost", ...rest }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors duration-150",
        VARIANTS[variant],
        className
      )}
      {...rest}
    >
      <Icon name={icon} />
    </button>
  );
}

export function Spinner({ className = "size-4" }) {
  return (
    <span
      className={cn(
        "mr-0.5 inline-block animate-spin rounded-full border-2 border-current border-t-transparent",
        className
      )}
    />
  );
}

export default Button;
