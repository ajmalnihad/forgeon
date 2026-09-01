import { cn } from "../../utils/cn.js";
import { formatMoney, ordinal } from "../../utils/format.js";
import { formatDate } from "../../utils/date.js";
import { StatusBadge } from "../ui/Feedback.jsx";
import Icon from "../ui/Icon.jsx";

export function SaleCard({ sale, onClick, showCustomer = true, deleted = false, className }) {
  const summary = sale.items
    .map((i) => `${i.productName} ×${i.quantity}`)
    .join(", ");
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-2xl border border-line bg-surface p-3.5 text-left transition-colors hover:border-line-strong hover:bg-surface2",
        deleted && "opacity-70",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {showCustomer ? (
              <p className="truncate text-[15px] font-semibold text-fg">{sale.customerName}</p>
            ) : (
              <p className="truncate text-[15px] font-semibold text-fg">{formatDate(sale.date)}</p>
            )}
            {sale.isMilestone && (
              <span className="shrink-0 rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-bold text-accent">
                {ordinal(sale.purchaseNumber)}
              </span>
            )}
          </div>
          <p className="mt-0.5 truncate text-xs text-muted">{summary}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {deleted ? (
              <StatusBadge status="deleted" size="sm">
                Deleted
              </StatusBadge>
            ) : (
              <StatusBadge status={sale.paymentStatus} size="sm" />
            )}
            {showCustomer && <span className="text-[11px] text-subtle">{formatDate(sale.date)}</span>}
            {!deleted && sale.purchaseNumber ? (
              <span className="text-[11px] text-subtle">{ordinal(sale.purchaseNumber)} purchase</span>
            ) : null}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="tnum text-base font-bold text-fg">{formatMoney(sale.total)}</p>
          <p className="tnum mt-0.5 text-[11px] text-success">+{formatMoney(sale.profit)}</p>
        </div>
        <Icon name="chevronRight" className="mt-1 size-4 shrink-0 text-subtle" />
      </div>
    </button>
  );
}

export default SaleCard;
