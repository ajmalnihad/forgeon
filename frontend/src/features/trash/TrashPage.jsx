import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/layout/PageHeader.jsx";
import Button from "../../components/ui/Button.jsx";
import { EmptyState, ErrorState, LoadingState, StatusBadge } from "../../components/ui/Feedback.jsx";
import { ConfirmModal } from "../../components/ui/Overlay.jsx";
import { useAsync } from "../../hooks/useAsync.js";
import { useToast } from "../../context/ToastContext.jsx";
import { salesApi, toUserMessage } from "../../services/api/index.js";
import { formatMoney } from "../../utils/format.js";
import { formatDate, formatDateTime } from "../../utils/date.js";

export default function TrashPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [restoring, setRestoring] = useState(null);
  const [busy, setBusy] = useState(false);
  const trash = useAsync(() => salesApi.trash(), []);
  const rows = trash.data || [];

  const restore = async () => {
    setBusy(true);
    try {
      await salesApi.restore(restoring.id);
      toast.success("Sale restored to active sales and reporting.");
      setRestoring(null);
      trash.reload();
    } catch (err) {
      toast.error(toUserMessage(err, "Unable to restore sale. Please try again."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Deleted Sales"
        back
        subtitle={`${rows.length} soft-deleted · excluded from reports and loyalty`}
      />

      {trash.loading ? (
        <LoadingState rows={3} />
      ) : trash.error ? (
        <ErrorState message={trash.error} onRetry={trash.reload} />
      ) : rows.length === 0 ? (
        <EmptyState icon="trash" title="No deleted sales" description="Deleted sales appear here and can be restored." />
      ) : (
        <div className="space-y-2.5">
          {rows.map((sale) => (
            <div
              key={sale.id}
              className="rounded-2xl border border-line bg-surface p-3.5 opacity-90"
            >
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-[15px] font-semibold text-muted line-through decoration-1">
                      {sale.customerName}
                    </p>
                    <StatusBadge status="deleted" size="sm">
                      Deleted
                    </StatusBadge>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-subtle">
                    {[sale.customerCode, formatDate(sale.date)].filter(Boolean).join(" · ")} ·{" "}
                    {sale.items.map((i) => `${i.productName} ×${i.quantity}`).join(", ")}
                  </p>
                </div>
                <p className="tnum shrink-0 text-base font-bold text-muted">{formatMoney(sale.total)}</p>
              </div>

              <div className="mt-3 rounded-xl bg-surface2 px-3 py-2.5 text-xs text-muted">
                <p>
                  <span className="font-semibold text-fg">Reason:</span> {sale.deleteReason || "—"}
                </p>
                <p className="mt-1">
                  Deleted by <span className="text-fg">{sale.deletedBy || "—"}</span> ·{" "}
                  {formatDateTime(sale.deletedAt)}
                </p>
              </div>

              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => navigate(`/sales/${sale.id}`)}>
                  View details
                </Button>
                <Button size="sm" icon="restore" onClick={() => setRestoring(sale)}>
                  Restore
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        open={!!restoring}
        onClose={() => setRestoring(null)}
        onConfirm={restore}
        loading={busy}
        tone="default"
        title="Restore this sale?"
        description="The sale returns to active sales, normal reporting and loyalty counting with its original purchase date."
        confirmLabel="Restore sale"
      />
    </>
  );
}
