import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/layout/PageHeader.jsx";
import Button from "../../components/ui/Button.jsx";
import { SearchInput, Select } from "../../components/ui/Input.jsx";
import { BottomSheet } from "../../components/ui/Overlay.jsx";
import { EmptyState, ErrorState, LoadingState, StatusBadge } from "../../components/ui/Feedback.jsx";
import SaleCard from "../../components/domain/SaleCard.jsx";
import Icon from "../../components/ui/Icon.jsx";
import { useAsync } from "../../hooks/useAsync.js";
import { useDebounce } from "../../hooks/useDebounce.js";
import { salesApi } from "../../services/api/index.js";
import { formatMoney, ordinal } from "../../utils/format.js";
import { PERIOD_LABEL, formatDate, periodRange, toISODate } from "../../utils/date.js";

const RANGE_OPTIONS = ["all", "today", "week", "month", "year", "custom"];

export default function SalesListPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    range: "month",
    from: "",
    to: "",
    status: "all",
    sort: "date_desc",
  });
  const debounced = useDebounce(query, 250);

  const range = useMemo(() => {
    if (filters.range === "all") return {};
    if (filters.range === "custom") return { from: filters.from || undefined, to: filters.to || undefined };
    return periodRange(filters.range, toISODate());
  }, [filters]);

  const sales = useAsync(
    () =>
      salesApi.list({
        q: debounced,
        from: range.from,
        to: range.to,
        status: filters.status,
        sort: filters.sort,
      }),
    [debounced, range.from, range.to, filters.status, filters.sort]
  );

  const rows = sales.data || [];
  const totals = rows.reduce(
    (acc, s) => ({ total: acc.total + s.total, profit: acc.profit + s.profit }),
    { total: 0, profit: 0 }
  );
  const activeFilterCount =
    (filters.range !== "month" ? 1 : 0) + (filters.status !== "all" ? 1 : 0) + (filters.sort !== "date_desc" ? 1 : 0);

  return (
    <>
      <PageHeader
        title="Sales"
        subtitle={`${rows.length} sales · ${formatMoney(totals.total)}`}
        actions={
          <Button size="sm" icon="plus" className="hidden lg:inline-flex" onClick={() => navigate("/sales/new")}>
            New Sale
          </Button>
        }
      />

      <div className="mb-4 flex gap-2">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search customer or product..."
          className="flex-1"
        />
        <button
          type="button"
          onClick={() => setFilterOpen(true)}
          className="relative flex size-11 shrink-0 items-center justify-center rounded-xl border border-line bg-surface text-muted hover:text-fg"
          aria-label="Filters"
        >
          <Icon name="filter" />
          {activeFilterCount > 0 && (
            <span className="absolute -right-1 -top-1 flex size-4.5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-fg">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-muted">
        <span className="rounded-full border border-line bg-surface px-2.5 py-1">
          {filters.range === "all" ? "All time" : PERIOD_LABEL[filters.range] || "Custom"}
        </span>
        {filters.status !== "all" && <StatusBadge status={filters.status} size="sm" />}
        <span className="tnum ml-auto">Profit {formatMoney(totals.profit)}</span>
      </div>

      {sales.loading ? (
        <LoadingState rows={5} />
      ) : sales.error ? (
        <ErrorState message={sales.error} onRetry={sales.reload} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon="receipt"
          title="No sales found"
          description="Try a different date range or search term."
          action={
            <Button icon="plus" onClick={() => navigate("/sales/new")}>
              Create sale
            </Button>
          }
        />
      ) : (
        <>
          {/* Mobile / tablet: cards */}
          <div className="space-y-2.5 lg:hidden">
            {rows.map((sale) => (
              <SaleCard key={sale.id} sale={sale} onClick={() => navigate(`/sales/${sale.id}`)} />
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden overflow-hidden rounded-2xl border border-line bg-surface lg:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-[11px] uppercase tracking-wide text-subtle">
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Customer</th>
                  <th className="px-4 py-3 font-semibold">Products</th>
                  <th className="px-4 py-3 font-semibold">Payment</th>
                  <th className="px-4 py-3 text-right font-semibold">Total</th>
                  <th className="px-4 py-3 text-right font-semibold">Profit</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((sale) => (
                  <tr
                    key={sale.id}
                    onClick={() => navigate(`/sales/${sale.id}`)}
                    className="cursor-pointer border-b border-line last:border-0 hover:bg-surface2"
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-muted">{formatDate(sale.date)}</td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-fg">{sale.customerName}</span>
                      {sale.isMilestone && (
                        <span className="ml-2 rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-bold text-accent">
                          {ordinal(sale.purchaseNumber)}
                        </span>
                      )}
                    </td>
                    <td className="max-w-xs truncate px-4 py-3 text-muted">
                      {sale.items.map((i) => `${i.productName} ×${i.quantity}`).join(", ")}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={sale.paymentStatus} size="sm" />
                    </td>
                    <td className="tnum whitespace-nowrap px-4 py-3 text-right font-semibold text-fg">
                      {formatMoney(sale.total)}
                    </td>
                    <td className="tnum whitespace-nowrap px-4 py-3 text-right text-success">
                      {formatMoney(sale.profit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <BottomSheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        title="Filter sales"
        footer={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() =>
                setFilters({ range: "month", from: "", to: "", status: "all", sort: "date_desc" })
              }
            >
              Reset
            </Button>
            <Button className="flex-1" onClick={() => setFilterOpen(false)}>
              Apply
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Select
            label="Date range"
            value={filters.range}
            onChange={(e) => setFilters({ ...filters, range: e.target.value })}
          >
            {RANGE_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {r === "all" ? "All time" : PERIOD_LABEL[r] || "Custom range"}
              </option>
            ))}
          </Select>
          {filters.range === "custom" && (
            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs font-medium uppercase tracking-wide text-muted">
                From
                <input
                  type="date"
                  value={filters.from}
                  onChange={(e) => setFilters({ ...filters, from: e.target.value })}
                  className="mt-1.5 h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm text-fg"
                />
              </label>
              <label className="text-xs font-medium uppercase tracking-wide text-muted">
                To
                <input
                  type="date"
                  value={filters.to}
                  onChange={(e) => setFilters({ ...filters, to: e.target.value })}
                  className="mt-1.5 h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm text-fg"
                />
              </label>
            </div>
          )}
          <Select
            label="Payment status"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="all">All payments</option>
            <option value="paid">Paid</option>
            <option value="pending">Payment pending</option>
          </Select>
          <Select
            label="Sort by"
            value={filters.sort}
            onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
          >
            <option value="date_desc">Newest first</option>
            <option value="date_asc">Oldest first</option>
            <option value="total_desc">Highest total</option>
            <option value="total_asc">Lowest total</option>
            <option value="profit_desc">Highest profit</option>
          </Select>
        </div>
      </BottomSheet>
    </>
  );
}
