import { useEffect, useRef, useState } from "react";
import { BottomSheet } from "../../../components/ui/Overlay.jsx";
import { SearchInput } from "../../../components/ui/Input.jsx";
import { EmptyState, LoadingState } from "../../../components/ui/Feedback.jsx";
import { cn } from "../../../utils/cn.js";
import { formatMoney } from "../../../utils/format.js";
import { useAsync } from "../../../hooks/useAsync.js";
import { useDebounce } from "../../../hooks/useDebounce.js";
import { productsApi } from "../../../services/api/index.js";

/** Fast product picker: search + category chips. Inactive products excluded. */
export default function ProductSelectSheet({ open, onClose, onSelect }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const searchRef = useRef(null);
  const debounced = useDebounce(query, 200);

  const categories = useAsync(() => productsApi.categories(), []);
  const products = useAsync(
    () => productsApi.list({ q: debounced, category }),
    [debounced, category, open]
  );

  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 60);
  }, [open]);

  const rows = products.data || [];
  const chips = ["all", ...(categories.data || [])];

  return (
    <BottomSheet open={open} onClose={onClose} title="Add product" description="Search or filter by category">
      <div className="space-y-3">
        <SearchInput ref={searchRef} value={query} onChange={setQuery} placeholder="Search products..." />

        <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {chips.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={cn(
                "shrink-0 rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors",
                category === c
                  ? "border-accent bg-accent-soft text-accent"
                  : "border-line bg-surface text-muted hover:text-fg"
              )}
            >
              {c === "all" ? "All" : c}
            </button>
          ))}
        </div>

        {products.loading ? (
          <LoadingState rows={4} />
        ) : rows.length === 0 ? (
          <EmptyState icon="box" title="No products found" description="Try another search or category." />
        ) : (
          <ul className="space-y-2">
            {rows.map((product) => (
              <li key={product.id}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(product);
                    onClose();
                  }}
                  className="flex w-full items-center gap-3 rounded-2xl border border-line bg-surface p-3.5 text-left transition-colors hover:border-accent/50 hover:bg-surface2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold text-fg">{product.name}</p>
                    <p className="truncate text-xs text-muted">
                      {product.category} · per {product.unit}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="tnum text-sm font-bold text-fg">{formatMoney(product.sellingPrice)}</p>
                    <p className="tnum text-[11px] text-subtle">cost {formatMoney(product.costPrice)}</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </BottomSheet>
  );
}
