import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/layout/PageHeader.jsx";
import Button from "../../components/ui/Button.jsx";
import { Card, SectionHeader } from "../../components/ui/Card.jsx";
import { SearchInput, Select } from "../../components/ui/Input.jsx";
import { BottomSheet } from "../../components/ui/Overlay.jsx";
import { EmptyState, ErrorState, LoadingState, Skeleton } from "../../components/ui/Feedback.jsx";
import Icon from "../../components/ui/Icon.jsx";
import BarChart from "../../components/ui/BarChart.jsx";
import SaleCard from "../../components/domain/SaleCard.jsx";
import { cn } from "../../utils/cn.js";
import { useAsync } from "../../hooks/useAsync.js";
import { useDebounce } from "../../hooks/useDebounce.js";
import { useToast } from "../../context/ToastContext.jsx";
import { reportsApi, salesApi, exportApi, customersApi, productsApi } from "../../services/api/index.js";
import { formatMoney, formatNumber } from "../../utils/format.js";
import { PERIOD_LABEL, periodRange, toISODate } from "../../utils/date.js";

const QUICK = ["today", "week", "month", "year", "custom"];

export default function ReportsPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [range, setRange] = useState("month");
  const [custom, setCustom] = useState({ from: "", to: "" });
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("date_desc");
  const [customerId, setCustomerId] = useState("");
  const [productId, setProductId] = useState("");
  const [query, setQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const debounced = useDebounce(query, 250);

  const dates = useMemo(() => {
    if (range === "custom") return { from: custom.from || undefined, to: custom.to || undefined };
    return periodRange(range, toISODate());
  }, [range, custom]);

  /** Every report query is scoped by the same filters. */
  const scope = {
    ...dates,
    customerId: customerId || undefined,
    productId: productId || undefined,
  };
  const scopeDeps = [dates.from, dates.to, customerId, productId];

  // Filter option lists. Inactive products are included so historical reports
  // can still be filtered by a product that was later marked inactive.
  const customerOptions = useAsync(() => customersApi.list({}), []);
  const productOptions = useAsync(() => productsApi.list({ includeInactive: true }), []);

  const summary = useAsync(() => reportsApi.summary(scope), scopeDeps);
  const chart = useAsync(
    () =>
      reportsApi.timeseries({
        period: range === "custom" ? "month" : range,
        customerId: customerId || undefined,
        productId: productId || undefined,
      }),
    [range, customerId, productId]
  );
  const topProducts = useAsync(() => reportsApi.topProducts(scope), scopeDeps);
  const topCustomers = useAsync(() => reportsApi.topCustomers(scope), scopeDeps);
  const sales = useAsync(
    () => salesApi.list({ ...scope, status, sort, q: debounced }),
    [...scopeDeps, status, sort, debounced]
  );

  const s = summary.data;
  const rows = sales.data || [];
  const selectedCustomer = (customerOptions.data || []).find((c) => c.id === customerId);
  const selectedProduct = (productOptions.data || []).find((p) => p.id === productId);

  const exportPdf = async () => {
    setExporting(true);
    try {
      const result = await exportApi.exportSalesReportPdf({ ...scope, status });
      if (result?.pending) toast.info(result.message);
      else toast.success("Report exported.");
    } catch {
      toast.error("Unable to export the report right now.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Reports"
        subtitle={range === "custom" ? "Custom range" : PERIOD_LABEL[range]}
        actions={
          <Button size="sm" variant="secondary" icon="download" onClick={exportPdf} loading={exporting} loadingText="Exporting...">
            <span className="hidden sm:inline">Export PDF</span>
          </Button>
        }
      />

      <div className="space-y-6 pb-4">
        {/* Quick range */}
        <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
          {QUICK.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => (r === "custom" ? setFilterOpen(true) : setRange(r))}
              className={cn(
                "shrink-0 rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors",
                range === r
                  ? "border-accent bg-accent-soft text-accent"
                  : "border-line bg-surface text-muted hover:text-fg"
              )}
            >
              {r === "custom" ? "Custom" : PERIOD_LABEL[r]}
            </button>
          ))}
        </div>

        {/* Active customer / product scope */}
        {(selectedCustomer || selectedProduct) && (
          <div className="flex flex-wrap items-center gap-2">
            {selectedCustomer && (
              <button
                type="button"
                onClick={() => setCustomerId("")}
                className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-accent/30 bg-accent-soft px-3 py-1.5 text-[12px] font-medium text-accent"
              >
                <span className="truncate">Customer: {selectedCustomer.name}</span>
                <Icon name="close" className="size-3.5 shrink-0" strokeWidth={2.4} />
              </button>
            )}
            {selectedProduct && (
              <button
                type="button"
                onClick={() => setProductId("")}
                className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-accent/30 bg-accent-soft px-3 py-1.5 text-[12px] font-medium text-accent"
              >
                <span className="truncate">Product: {selectedProduct.name}</span>
                <Icon name="close" className="size-3.5 shrink-0" strokeWidth={2.4} />
              </button>
            )}
          </div>
        )}

        {/* 1 — Summary cards */}
        <section>
          {summary.loading ? (
            <Skeleton className="h-28 w-full" />
          ) : summary.error ? (
            <ErrorState message={summary.error} onRetry={summary.reload} />
          ) : (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[
                { label: "Total sales", value: formatMoney(s.totalSales) },
                { label: "Profit", value: formatMoney(s.totalProfit), tone: "text-success" },
                { label: "Purchases", value: formatNumber(s.salesCount) },
                {
                  label: "Pending",
                  value: formatMoney(s.pendingAmount),
                  tone: s.pendingAmount > 0 ? "text-warn" : "",
                  sub: `${s.pendingCount} sales`,
                },
              ].map((cell) => (
                <Card key={cell.label} className="p-4">
                  <p className="text-[10px] uppercase tracking-wide text-subtle">{cell.label}</p>
                  <p className={cn("tnum mt-1 text-xl font-bold text-fg", cell.tone)}>{cell.value}</p>
                  {cell.sub && <p className="mt-0.5 text-[11px] text-subtle">{cell.sub}</p>}
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Chart */}
        <Card className="p-4">
          <SectionHeader title="Revenue trend" className="mb-3" />
          {chart.loading ? <Skeleton className="h-36 w-full" /> : <BarChart data={chart.data || []} />}
        </Card>

        {/* Top products / customers */}
        <div className="grid gap-3 lg:grid-cols-2">
          <Card className="p-4">
            <SectionHeader title="Top products" className="mb-3" />
            {topProducts.loading ? (
              <Skeleton className="h-24 w-full" />
            ) : (topProducts.data || []).length === 0 ? (
              <p className="py-3 text-sm text-muted">No product sales in this range.</p>
            ) : (
              <ul className="space-y-2.5">
                {topProducts.data.map((p) => (
                  <li key={p.productId} className="flex items-center gap-3">
                    <span className="min-w-0 flex-1 truncate text-sm text-fg">{p.productName}</span>
                    <span className="tnum text-[11px] text-subtle">×{p.quantity}</span>
                    <span className="tnum text-sm font-semibold text-fg">{formatMoney(p.revenue)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card className="p-4">
            <SectionHeader title="Top customers" className="mb-3" />
            {topCustomers.loading ? (
              <Skeleton className="h-24 w-full" />
            ) : (topCustomers.data || []).length === 0 ? (
              <p className="py-3 text-sm text-muted">No customer activity in this range.</p>
            ) : (
              <ul className="space-y-2.5">
                {topCustomers.data.map((c) => (
                  <li key={c.customerId}>
                    <button
                      type="button"
                      onClick={() => navigate(`/customers/${c.customerId}`)}
                      className="flex w-full items-center gap-3 text-left"
                    >
                      <span className="min-w-0 flex-1 truncate text-sm text-fg">{c.name}</span>
                      <span className="tnum text-[11px] text-subtle">{c.purchases} sales</span>
                      <span className="tnum text-sm font-semibold text-fg">{formatMoney(c.total)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {/* Sales list */}
        <section>
          <SectionHeader
            title="Sales in range"
            subtitle="Deleted sales are excluded"
            action={
              <button
                type="button"
                onClick={() => setFilterOpen(true)}
                className="flex items-center gap-1.5 rounded-xl border border-line bg-surface px-3 py-1.5 text-[13px] font-medium text-muted hover:text-fg"
              >
                <Icon name="filter" className="size-4" /> Filters
              </button>
            }
          />
          <div className="mb-3">
            <SearchInput value={query} onChange={setQuery} placeholder="Search customer or product..." />
          </div>
          {sales.loading ? (
            <LoadingState rows={4} />
          ) : sales.error ? (
            <ErrorState message={sales.error} onRetry={sales.reload} />
          ) : rows.length === 0 ? (
            <EmptyState icon="chart" title="No sales in this range" description="Adjust the filters or date range." />
          ) : (
            <div className="space-y-2.5">
              {rows.map((sale) => (
                <SaleCard key={sale.id} sale={sale} onClick={() => navigate(`/sales/${sale.id}`)} />
              ))}
            </div>
          )}
        </section>
      </div>

      <BottomSheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        title="Report filters"
        footer={
          <Button className="w-full" onClick={() => setFilterOpen(false)}>
            Apply filters
          </Button>
        }
      >
        <div className="space-y-4">
          <Select label="Date range" value={range} onChange={(e) => setRange(e.target.value)}>
            {QUICK.map((r) => (
              <option key={r} value={r}>
                {r === "custom" ? "Custom range" : PERIOD_LABEL[r]}
              </option>
            ))}
          </Select>
          {range === "custom" && (
            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs font-medium uppercase tracking-wide text-muted">
                From
                <input
                  type="date"
                  value={custom.from}
                  onChange={(e) => setCustom({ ...custom, from: e.target.value })}
                  className="mt-1.5 h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm text-fg"
                />
              </label>
              <label className="text-xs font-medium uppercase tracking-wide text-muted">
                To
                <input
                  type="date"
                  value={custom.to}
                  onChange={(e) => setCustom({ ...custom, to: e.target.value })}
                  className="mt-1.5 h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm text-fg"
                />
              </label>
            </div>
          )}
          <Select
            label="Customer"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
          >
            <option value="">All customers</option>
            {(customerOptions.data || []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.code ? ` · ${c.code}` : ""}
              </option>
            ))}
          </Select>
          <Select label="Product" value={productId} onChange={(e) => setProductId(e.target.value)}>
            <option value="">All products</option>
            {(productOptions.data || []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
                {p.active ? "" : " (inactive)"}
              </option>
            ))}
          </Select>
          <Select label="Payment status" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">All payments</option>
            <option value="paid">Paid</option>
            <option value="pending">Payment pending</option>
          </Select>
          <Select label="Sort by" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="date_desc">Newest first</option>
            <option value="date_asc">Oldest first</option>
            <option value="total_desc">Highest total</option>
            <option value="profit_desc">Highest profit</option>
          </Select>
        </div>
      </BottomSheet>
    </>
  );
}
