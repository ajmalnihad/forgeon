import { cn } from "../../utils/cn.js";
import { formatMoney, initials, ordinal } from "../../utils/format.js";
import Icon from "../ui/Icon.jsx";

export function CustomerCard({ customer, onClick, compact = false, className }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl border border-line bg-surface p-3.5 text-left transition-colors hover:border-line-strong hover:bg-surface2",
        className
      )}
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface2 text-xs font-bold text-fg">
        {initials(customer.name)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold text-fg">{customer.name}</p>
        <p className="mt-0.5 truncate text-xs text-muted">
          {[customer.place, customer.phone || customer.whatsapp, customer.code]
            .filter(Boolean)
            .join(" · ")}
        </p>
        {!compact && (
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-subtle">
            <span className="tnum">{customer.paidPurchases} paid purchases</span>
            <span className="tnum">{formatMoney(customer.totalSpent || 0)} spent</span>
            {customer.pendingAmount > 0 && (
              <span className="tnum font-semibold text-warn">
                {formatMoney(customer.pendingAmount)} pending
              </span>
            )}
          </div>
        )}
      </div>
      <div className="shrink-0 text-right">
        {customer.nextMilestone ? (
          <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-bold text-accent">
            {ordinal(customer.nextMilestone)} next
          </span>
        ) : null}
      </div>
      <Icon name="chevronRight" className="size-4 shrink-0 text-subtle" />
    </button>
  );
}

export default CustomerCard;
