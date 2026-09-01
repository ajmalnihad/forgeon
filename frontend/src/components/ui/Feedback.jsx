import { cn } from "../../utils/cn.js";
import Icon from "./Icon.jsx";
import Button from "./Button.jsx";

const TONES = {
  paid: "bg-success-soft text-success border-success/30",
  pending: "bg-warn-soft text-warn border-warn/30",
  deleted: "bg-danger-soft text-danger border-danger/30",
  neutral: "bg-surface2 text-muted border-line",
  accent: "bg-accent-soft text-accent border-accent/30",
};

export function StatusBadge({ status, children, className, size = "md" }) {
  const label =
    children ?? (status === "paid" ? "Paid" : status === "pending" ? "Payment Pending" : status);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-semibold",
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]",
        TONES[status] || TONES.neutral,
        className
      )}
    >
      {status === "pending" && <span className="size-1.5 rounded-full bg-warn" />}
      {status === "paid" && <span className="size-1.5 rounded-full bg-success" />}
      {label}
    </span>
  );
}

export function Skeleton({ className }) {
  return <div className={cn("animate-pulse rounded-xl bg-surface2", className)} />;
}

export function LoadingState({ rows = 3, className }) {
  return (
    <div className={cn("space-y-3", className)} aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-20 w-full" />
      ))}
    </div>
  );
}

export function EmptyState({ icon = "box", title, description, action, className }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-surface px-6 py-12 text-center",
        className
      )}
    >
      <span className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-surface2 text-muted">
        <Icon name={icon} className="size-6" />
      </span>
      <p className="text-sm font-semibold text-fg">{title}</p>
      {description && <p className="mt-1 max-w-xs text-sm text-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ message = "Something went wrong. Please try again.", onRetry, className }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-danger/30 bg-danger-soft px-6 py-10 text-center",
        className
      )}
      role="alert"
    >
      <Icon name="alert" className="mb-2 size-6 text-danger" />
      <p className="text-sm font-medium text-fg">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function InlineError({ message, className }) {
  if (!message) return null;
  return (
    <p className={cn("flex items-start gap-1.5 text-xs font-medium text-danger", className)} role="alert">
      <Icon name="alert" className="mt-px size-3.5 shrink-0" />
      {message}
    </p>
  );
}
