import { cn } from "../../utils/cn.js";
import { ordinal } from "../../utils/format.js";
import { MILESTONE_STEP } from "../../utils/loyalty.js";

/**
 * Compact loyalty display. The system only identifies milestones —
 * there is no reward management anywhere in this app.
 *
 * Props for the Create/Edit Sale preview (all optional):
 *   projectedCount      → count including this sale if it is paid on a NEW date
 *   dateAlreadyCounted  → the selected date already has an active paid sale
 *   upcomingNumber      → purchase number this sale would occupy (null = adds none)
 *
 * When no preview props are supplied (customer details / dashboards) the card
 * renders the plain count exactly as before.
 */
export function LoyaltyCard({
  name,
  paidPurchases = 0,
  nextMilestone,
  upcomingNumber,
  projectedCount,
  dateAlreadyCounted = false,
  paymentPending = false,
  className,
}) {
  const target = nextMilestone || (Math.floor(paidPurchases / MILESTONE_STEP) + 1) * MILESTONE_STEP;
  const base = target - MILESTONE_STEP;
  const isMilestoneSale = !!upcomingNumber && upcomingNumber % MILESTONE_STEP === 0;

  // Progress reflects what the count will be if this sale becomes paid.
  const displayCount = projectedCount ?? paidPurchases;
  const inCycle = isMilestoneSale ? MILESTONE_STEP : displayCount - base;
  const percent = Math.min(100, Math.max(0, (inCycle / MILESTONE_STEP) * 100));
  const addsPurchase = !!upcomingNumber;

  return (
    <div className={cn("rounded-2xl border border-line bg-surface p-4", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {name && <p className="truncate text-[15px] font-semibold text-fg">{name}</p>}
          <p className="tnum mt-0.5 text-xs text-muted">
            {paidPurchases} paid purchases · Next milestone {ordinal(target)}
          </p>
        </div>
        {isMilestoneSale ? (
          <div className="shrink-0 text-right">
            <span className="inline-block rounded-lg bg-accent px-2.5 py-1 text-[11px] font-bold text-accent-fg">
              {ordinal(upcomingNumber)} Purchase
            </span>
            {paymentPending && (
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-warn">
                Payment Pending
              </p>
            )}
          </div>
        ) : (
          <span className="tnum shrink-0 text-sm font-bold text-fg">
            {inCycle} / {MILESTONE_STEP}
          </span>
        )}
      </div>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface2">
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Quiet, non-blocking notes — never a warning, never a confirmation. */}
      {addsPurchase && !paymentPending && (
        <p className="tnum mt-2 text-[11px] text-subtle">
          After this purchase: {displayCount} / {MILESTONE_STEP}
        </p>
      )}
      {dateAlreadyCounted && (
        <p className="mt-2 text-[11px] text-subtle">
          This date is already counted as a loyalty purchase — another sale today adds no
          extra loyalty purchase.
        </p>
      )}
    </div>
  );
}

export default LoyaltyCard;
