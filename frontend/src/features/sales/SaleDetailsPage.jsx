import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "../../components/layout/PageHeader.jsx";
import { Card } from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import { ErrorState, LoadingState, StatusBadge } from "../../components/ui/Feedback.jsx";
import DeleteSaleModal from "../../components/domain/DeleteSaleModal.jsx";
import { useAsync } from "../../hooks/useAsync.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { salesApi, toUserMessage } from "../../services/api/index.js";
import { formatMoney, ordinal } from "../../utils/format.js";
import { formatDate } from "../../utils/date.js";

export default function SaleDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { can } = useAuth();
  const toast = useToast();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [marking, setMarking] = useState(false);
  const sale = useAsync(() => salesApi.get(id), [id]);
  const data = sale.data;

  const markPaid = async () => {
    setMarking(true);
    try {
      await salesApi.markPaid(id);
      toast.success("Payment marked as paid.");
      sale.reload();
    } catch (err) {
      toast.error(toUserMessage(err, "Unable to update payment. Please try again."));
    } finally {
      setMarking(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Sale details"
        back
        subtitle={data ? `${data.customerName} · ${formatDate(data.date)}` : undefined}
        actions={
          data && !data.deleted ? (
            <Button size="sm" variant="secondary" icon="edit" onClick={() => navigate(`/sales/${id}/edit`)}>
              <span className="hidden sm:inline">Edit</span>
            </Button>
          ) : null
        }
      />

      {sale.loading ? (
        <LoadingState rows={3} />
      ) : sale.error ? (
        <ErrorState message={sale.error} onRetry={sale.reload} />
      ) : (
        <div className="space-y-4 pb-4">
          {data.deleted && (
            <div className="rounded-2xl border border-danger/30 bg-danger-soft p-4">
              <StatusBadge status="deleted">Deleted sale</StatusBadge>
              <p className="mt-2 text-sm text-fg">{data.deleteReason}</p>
              <p className="mt-1 text-xs text-muted">
                Deleted by {data.deletedBy} · excluded from reports and loyalty counting
              </p>
            </div>
          )}

          <Card className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <button
                  type="button"
                  onClick={() => navigate(`/customers/${data.customerId}`)}
                  className="text-lg font-bold text-fg hover:text-accent"
                >
                  {data.customerName}
                </button>
                <p className="mt-0.5 text-xs text-muted">
                  {[data.customerCode, data.customerPhone].filter(Boolean).join(" · ")}
                </p>
              </div>
              <div className="text-right">
                <StatusBadge status={data.paymentStatus} />
                {data.purchaseNumber ? (
                  <p className="mt-1.5 text-[11px] text-subtle">
                    {ordinal(data.purchaseNumber)} paid purchase
                    {data.isMilestone ? " · milestone" : ""}
                  </p>
                ) : null}
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Sale date", value: formatDate(data.date) },
                { label: "Total", value: formatMoney(data.total) },
                { label: "Cost", value: formatMoney(data.cost) },
                { label: "Profit", value: formatMoney(data.profit), tone: "text-success" },
              ].map((cell) => (
                <div key={cell.label} className="rounded-xl border border-line bg-surface2 px-3 py-2.5">
                  <p className="text-[10px] uppercase tracking-wide text-subtle">{cell.label}</p>
                  <p className={`tnum mt-0.5 text-sm font-bold text-fg ${cell.tone || ""}`}>{cell.value}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="border-b border-line px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                Products · prices used in this sale
              </p>
              <p className="mt-0.5 text-[11px] text-subtle">
                Historical snapshot. Current product prices may differ.
              </p>
            </div>
            <ul className="divide-y divide-[var(--fo-border)]">
              {data.items.map((item, idx) => (
                <li key={`${item.productId}-${idx}`} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="min-w-0 flex-1 truncate text-sm font-semibold text-fg">
                      {item.productName}
                    </p>
                    <p className="tnum text-sm font-bold text-fg">
                      {formatMoney(item.quantity * item.sellingPrice)}
                    </p>
                  </div>
                  <div className="tnum mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-muted">
                    <span>
                      Qty <span className="text-fg">{item.quantity} {item.unit}</span>
                    </span>
                    <span>
                      Cost used <span className="text-fg">{formatMoney(item.costPrice)}</span>
                    </span>
                    <span>
                      Selling used <span className="text-fg">{formatMoney(item.sellingPrice)}</span>
                    </span>
                    <span className="text-success">
                      +{formatMoney(item.quantity * (item.sellingPrice - item.costPrice))}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          <div className="flex flex-wrap gap-2">
            {data.paymentStatus === "pending" && can.markPaid && !data.deleted && (
              <Button variant="success" onClick={markPaid} loading={marking} loadingText="Updating...">
                Mark as Paid
              </Button>
            )}
            {can.deleteSale && !data.deleted && (
              <Button variant="subtleDanger" icon="trash" onClick={() => setDeleteOpen(true)}>
                Delete sale
              </Button>
            )}
            {data.deleted && can.restoreSale && (
              <Button
                variant="secondary"
                icon="restore"
                onClick={async () => {
                  await salesApi.restore(data.id);
                  toast.success("Sale restored.");
                  sale.reload();
                }}
              >
                Restore sale
              </Button>
            )}
          </div>

          {data.createdBy && (
            <p className="text-xs text-subtle">Created by {data.createdBy}</p>
          )}
        </div>
      )}

      <DeleteSaleModal
        sale={data}
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onDeleted={() => navigate("/sales")}
      />
    </>
  );
}
