import { useState } from "react";
import Icon from "../../../components/ui/Icon.jsx";
import { InlineError } from "../../../components/ui/Feedback.jsx";
import { formatMoney } from "../../../utils/format.js";
import { cn } from "../../../utils/cn.js";

/**
 * One product line inside a sale.
 * Prices shown here are the PRICES USED IN THIS SALE — they are seeded from
 * the product's latest saved prices but can be modified for this sale only.
 */
export default function SaleItemRow({ item, onChange, onRemove }) {
  const [editing, setEditing] = useState(false);
  const invalid = Number(item.sellingPrice) < Number(item.costPrice);
  const lineTotal = item.quantity * item.sellingPrice;

  const setQty = (qty) => onChange({ ...item, quantity: Math.max(1, Number(qty) || 1) });

  return (
    <div className={cn("rounded-2xl border border-line bg-surface p-3.5", invalid && "border-danger/50")}>
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold text-fg">{item.productName}</p>
          <p className="text-[11px] text-subtle">
            per {item.unit}
            {item.priceEdited ? " · price adjusted for this sale" : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${item.productName}`}
          className="-mr-1 flex size-9 shrink-0 items-center justify-center rounded-xl text-subtle hover:bg-danger-soft hover:text-danger"
        >
          <Icon name="close" className="size-4.5" />
        </button>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            aria-label="Decrease quantity"
            onClick={() => setQty(item.quantity - 1)}
            className="flex size-11 items-center justify-center rounded-xl border border-line bg-surface2 text-fg active:scale-95"
          >
            <Icon name="minus" className="size-4" strokeWidth={2.4} />
          </button>
          <input
            type="number"
            inputMode="numeric"
            min="1"
            aria-label="Quantity"
            value={item.quantity}
            onChange={(e) => setQty(e.target.value)}
            className="tnum h-11 w-14 rounded-xl border border-line bg-surface text-center text-base font-bold text-fg"
          />
          <button
            type="button"
            aria-label="Increase quantity"
            onClick={() => setQty(item.quantity + 1)}
            className="flex size-11 items-center justify-center rounded-xl border border-line bg-surface2 text-fg active:scale-95"
          >
            <Icon name="plus" className="size-4" strokeWidth={2.4} />
          </button>
        </div>
        <p className="tnum text-lg font-bold text-fg">{formatMoney(lineTotal)}</p>
      </div>

      {!editing ? (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="mt-3 flex w-full items-center justify-between rounded-xl bg-surface2 px-3.5 py-2.5 text-left"
        >
          <span className="tnum text-[13px] text-muted">
            Cost <span className="font-semibold text-fg">{formatMoney(item.costPrice)}</span>
            <span className="mx-2 text-subtle">·</span>
            Selling <span className="font-semibold text-fg">{formatMoney(item.sellingPrice)}</span>
          </span>
          <span className="flex items-center gap-1 text-[12px] font-semibold text-accent">
            Edit <Icon name="chevronRight" className="size-3.5" strokeWidth={2.4} />
          </span>
        </button>
      ) : (
        <div className="mt-3 rounded-xl border border-line bg-surface2 p-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-subtle">
            Prices used in this sale
          </p>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-[11px] font-medium uppercase tracking-wide text-muted">
              Cost price
              <input
                type="number"
                inputMode="decimal"
                min="0"
                value={item.costPrice}
                onChange={(e) =>
                  onChange({ ...item, costPrice: Number(e.target.value), priceEdited: true })
                }
                className="tnum mt-1.5 h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm font-semibold text-fg"
              />
            </label>
            <label className="text-[11px] font-medium uppercase tracking-wide text-muted">
              Selling price
              <input
                type="number"
                inputMode="decimal"
                min="0"
                value={item.sellingPrice}
                onChange={(e) =>
                  onChange({ ...item, sellingPrice: Number(e.target.value), priceEdited: true })
                }
                className={cn(
                  "tnum mt-1.5 h-11 w-full rounded-xl border bg-surface px-3 text-sm font-semibold text-fg",
                  invalid ? "border-danger" : "border-line"
                )}
              />
            </label>
          </div>
          <p className="mt-2 text-[11px] text-subtle">
            Current product price: cost {formatMoney(item.currentCostPrice)} · selling{" "}
            {formatMoney(item.currentSellingPrice)}
          </p>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="mt-2 text-[12px] font-semibold text-accent"
          >
            Done
          </button>
        </div>
      )}

      {invalid && <InlineError className="mt-2" message="Selling price cannot be below cost price." />}
    </div>
  );
}
