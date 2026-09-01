import { cn } from "../../utils/cn.js";
import { formatMoney } from "../../utils/format.js";
import Icon from "../ui/Icon.jsx";

export function ProductCard({ product, onClick, actions, className }) {
  const margin = product.sellingPrice - product.costPrice;
  return (
    <div
      className={cn(
        "rounded-2xl border border-line bg-surface p-3.5",
        !product.active && "opacity-65",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={onClick}
          className="min-w-0 flex-1 text-left"
          disabled={!onClick}
        >
          <div className="flex items-center gap-2">
            <p className="truncate text-[15px] font-semibold text-fg">{product.name}</p>
            {!product.active && (
              <span className="shrink-0 rounded-full border border-line bg-surface2 px-2 py-0.5 text-[10px] font-semibold text-muted">
                Inactive
              </span>
            )}
          </div>
          <p className="mt-0.5 truncate text-xs text-muted">
            {product.category} · per {product.unit}
            {product.description ? ` · ${product.description}` : ""}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px]">
            <span className="tnum text-muted">
              Cost <span className="font-semibold text-fg">{formatMoney(product.costPrice)}</span>
            </span>
            <span className="tnum text-muted">
              Selling <span className="font-semibold text-fg">{formatMoney(product.sellingPrice)}</span>
            </span>
            <span className="tnum text-success">+{formatMoney(margin)}</span>
          </div>
        </button>
        {actions ? (
          <div className="flex shrink-0 items-center gap-1">{actions}</div>
        ) : onClick ? (
          <Icon name="chevronRight" className="mt-1 size-4 shrink-0 text-subtle" />
        ) : null}
      </div>
    </div>
  );
}

export default ProductCard;
