import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/layout/PageHeader.jsx";
import { Card, SectionHeader, LinkAction } from "../../components/ui/Card.jsx";
import { EmptyState, ErrorState, Skeleton, StatusBadge } from "../../components/ui/Feedback.jsx";
import Icon from "../../components/ui/Icon.jsx";
import Button, { IconButton } from "../../components/ui/Button.jsx";
import BarChart from "../../components/ui/BarChart.jsx";
import PendingPaymentCard from "../../components/domain/PendingPaymentCard.jsx";
import SaleDetailSheet from "../../components/domain/SaleDetailSheet.jsx";
import { useAsync } from "../../hooks/useAsync.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useTheme } from "../../context/ThemeContext.jsx";
import { salesApi, reportsApi } from "../../services/api/index.js";
import { formatMoney, formatNumber, ordinal } from "../../utils/format.js";
import { PERIODS, PERIOD_LABEL, periodRange, toISODate, formatDateShort } from "../../utils/date.js";
import { milestoneProgress } from "../../utils/loyalty.js";

function PeriodStepper({ index, onChange }) {
  return (
    <div className="flex items-center gap-1 rounded-xl border border-line bg-surface px-1 py-1">
      <button
        type="button"
        aria-label="Previous period"
        disabled={index === 0}
        onClick={() => onChange(index - 1)}
        className="flex size-7 items-center justify-center rounded-lg text-muted disabled:opacity-30 hover:bg-surface2 hover:text-fg"
      >
        <Icon name="chevronLeft" className="size-4" />
      </button>
      <span className="min-w-[74px] text-center text-[13px] font-semibold text-fg">
        {PERIOD_LABEL[PERIODS[index]]}
      </span>
      <button
        type="button"
        aria-label="Next period"
        disabled={index === PERIODS.length - 1}
        onClick={() => onChange(index + 1)}
        className="flex size-7 items-center justify-center rounded-lg text-muted disabled:opacity-30 hover:bg-surface2 hover:text-fg"
      >
        <Icon name="chevronRight" className="size-4" />
      </button>
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [periodIndex, setPeriodIndex] = useState(0);
  const [activeSale, setActiveSale] = useState(null);
  const period = PERIODS[periodIndex];
  const today = toISODate();

  const pending = useAsync(() => salesApi.pending(), []);
  const todaySummary = useAsync(() => reportsApi.summary({ from: today, to: today }), [today]);
  const chart = useAsync(() => reportsApi.timeseries({ period }), [period]);
  const periodSummary = useAsync(() => {
    const { from, to } = periodRange(period, today);
    return reportsApi.summary({ from, to });
  }, [period]);
  const loyalty = useAsync(() => reportsApi.loyaltyOverview(), []);

  const refreshAll = useCallback(() => {
    pending.reload();
    todaySummary.reload();
    periodSummary.reload();
    loyalty.reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pendingRows = pending.data || [];
  const summary = todaySummary.data;

  return (
    <>
      <PageHeader
        title={`Hello, ${user?.name?.split(" ")[0] || "there"}`}
        subtitle="Today's operations at a glance"
        actions={
          <>
            <IconButton
              icon={theme === "dark" ? "sun" : "moon"}
              label="Toggle theme"
              onClick={toggleTheme}
              className="lg:hidden"
            />
            <Button
              size="sm"
              icon="plus"
              className="hidden lg:inline-flex"
              onClick={() => navigate("/sales/new")}
            >
              New Sale
            </Button>
          </>
        }
      />

      <div className="space-y-7">
        {/* 1 — PAYMENT PENDING (highest priority) */}
        <section aria-labelledby="pending-heading">
          <SectionHeader
            title="Payment Pending"
            className="mb-2"
            action={
              pendingRows.length > 0 && (
                <LinkAction onClick={() => navigate("/sales/pending")}>
                  {pendingRows.length} pending · View all
                </LinkAction>
              )
            }
          />
          {pending.loading ? (
            <div className="flex gap-3">
              <Skeleton className="h-28 w-54 flex-1" />
              <Skeleton className="hidden h-28 flex-1 sm:block" />
            </div>
          ) : pending.error ? (
            <ErrorState message={pending.error} onRetry={pending.reload} />
          ) : pendingRows.length === 0 ? (
            <EmptyState
              icon="check"
              title="No pending payments"
              description="Every confirmed sale has been paid."
            />
          ) : (
            <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 lg:mx-0 lg:grid lg:grid-cols-3 lg:px-0">
              {pendingRows.slice(0, 8).map((sale) => (
                <PendingPaymentCard
                  key={sale.id}
                  sale={sale}
                  onClick={() => setActiveSale(sale)}
                  className="lg:w-auto"
                />
              ))}
            </div>
          )}
        </section>

        {/* 2 — TODAY'S SUMMARY */}
        <section aria-labelledby="today-heading">
          <SectionHeader title="Today's Summary" />
          <Card className="p-5">
            {todaySummary.loading ? (
              <Skeleton className="h-24 w-full" />
            ) : todaySummary.error ? (
              <ErrorState message={todaySummary.error} onRetry={todaySummary.reload} />
            ) : (
              <div className="flex flex-wrap items-end justify-between gap-6">
                <div>
                  <p className="text-xs uppercase tracking-wide text-subtle">Today's Sales</p>
                  <p className="tnum mt-1 text-4xl font-extrabold text-fg">
                    {formatMoney(summary.totalSales)}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
                    <span className="tnum text-muted">
                      <span className="font-semibold text-fg">{formatNumber(summary.salesCount)}</span>{" "}
                      purchases
                    </span>
                    <span className="tnum text-muted">
                      <span className="font-semibold text-success">
                        {formatMoney(summary.totalProfit)}
                      </span>{" "}
                      profit
                    </span>
                  </div>
                </div>
                {summary.pendingCount > 0 && (
                  <div className="rounded-xl border border-warn/30 bg-warn-soft px-3.5 py-2.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-warn">
                      Pending today
                    </p>
                    <p className="tnum mt-0.5 text-lg font-bold text-fg">
                      {formatMoney(summary.pendingAmount)}
                    </p>
                  </div>
                )}
              </div>
            )}
          </Card>
        </section>

        {/* 3 — SALES OVERVIEW */}
        <section aria-labelledby="overview-heading">
          <SectionHeader
            title="Sales Overview"
            action={<PeriodStepper index={periodIndex} onChange={setPeriodIndex} />}
          />
          <Card className="p-4">
            <div className="mb-4 flex flex-wrap items-end gap-x-8 gap-y-2">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-subtle">Revenue</p>
                <p className="tnum text-2xl font-bold text-fg">
                  {periodSummary.loading ? "—" : formatMoney(periodSummary.data?.totalSales || 0)}
                </p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-subtle">Profit</p>
                <p className="tnum text-2xl font-bold text-success">
                  {periodSummary.loading ? "—" : formatMoney(periodSummary.data?.totalProfit || 0)}
                </p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-subtle">Sales</p>
                <p className="tnum text-2xl font-bold text-fg">
                  {periodSummary.loading ? "—" : formatNumber(periodSummary.data?.salesCount || 0)}
                </p>
              </div>
            </div>
            {chart.loading ? (
              <Skeleton className="h-36 w-full" />
            ) : (
              <BarChart data={chart.data || []} />
            )}
            <div className="mt-3 flex justify-end">
              <LinkAction onClick={() => navigate("/reports")}>Detailed reports</LinkAction>
            </div>
          </Card>
        </section>

        {/* 4 — LOYALTY */}
        <section aria-labelledby="loyalty-heading">
          <SectionHeader title="Loyalty Milestones" subtitle="Identification only — no rewards module" />
          <div className="grid gap-3 lg:grid-cols-2">
            <Card className="p-4">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-muted">
                Approaching milestone
              </p>
              {loyalty.loading ? (
                <Skeleton className="h-24 w-full" />
              ) : (loyalty.data?.approaching || []).length === 0 ? (
                <p className="py-4 text-sm text-muted">No customers close to a milestone yet.</p>
              ) : (
                <ul className="space-y-2.5">
                  {loyalty.data.approaching.map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => navigate(`/customers/${c.id}`)}
                        className="flex w-full items-center gap-3 text-left"
                      >
                        <span className="min-w-0 flex-1 truncate text-sm text-fg">{c.name}</span>
                        <span className="tnum text-xs text-muted">
                          {c.paidPurchases} / {c.nextMilestone}
                        </span>
                        <span className="h-1.5 w-16 shrink-0 overflow-hidden rounded-full bg-surface2">
                          <span
                            className="block h-full rounded-full bg-accent"
                            style={{ width: `${milestoneProgress(c.paidPurchases).percent}%` }}
                          />
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card className="p-4">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-muted">
                Recent milestone purchases
              </p>
              {loyalty.loading ? (
                <Skeleton className="h-24 w-full" />
              ) : (loyalty.data?.recent || []).length === 0 ? (
                <p className="py-4 text-sm text-muted">No milestone purchases yet.</p>
              ) : (
                <ul className="space-y-2.5">
                  {loyalty.data.recent.map((s) => (
                    <li key={s.id} className="flex items-center gap-3">
                      <Icon name="star" className="size-4 shrink-0 text-accent" />
                      <span className="min-w-0 flex-1 truncate text-sm text-fg">{s.name}</span>
                      <StatusBadge status="accent" size="sm">
                        {ordinal(s.purchaseNumber)}
                      </StatusBadge>
                      <span className="text-[11px] text-subtle">{formatDateShort(s.date)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </section>
      </div>

      <SaleDetailSheet
        sale={activeSale}
        open={!!activeSale}
        onClose={() => setActiveSale(null)}
        onUpdated={refreshAll}
      />
    </>
  );
}
