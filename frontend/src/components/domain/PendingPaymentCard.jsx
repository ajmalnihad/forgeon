import { cn } from "../../utils/cn.js";
import { formatMoney } from "../../utils/format.js";
import { formatDateShort } from "../../utils/date.js";

export function PendingPaymentCard({ sale, onClick, className }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-[13.5rem] shrink-0 snap-start rounded-2xl border border-warn/35 bg-warn-soft p-3.5 text-left transition-colors hover:border-warn/60",
        className
      )}
    >
      <p className="truncate text-sm font-semibold text-fg">{sale.customerName}</p>
      <p className="tnum mt-1.5 text-xl font-extrabold text-fg">{formatMoney(sale.total)}</p>
      <div className="mt-2 flex items-center justify-between text-[11px]">
        <span className="font-semibold text-warn">Payment Pending</span>
        <span className="text-subtle">{formatDateShort(sale.date)}</span>
      </div>
    </button>
  );
}

export default PendingPaymentCard;
