import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BottomSheet } from "../ui/Overlay.jsx";
import Button from "../ui/Button.jsx";
import { StatusBadge } from "../ui/Feedback.jsx";
import { formatMoney, ordinal } from "../../utils/format.js";
import { formatDate } from "../../utils/date.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { salesApi, toUserMessage } from "../../services/api/index.js";

/** Quick detail overlay used from the dashboard pending section and lists. */
export function SaleDetailSheet({ sale, open, onClose, onUpdated }) {
  const { can } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  if (!sale) return null;

  const markPaid = async () => {
    setSaving(true);
    try {
      const updated = await salesApi.markPaid(sale.id);
      toast.success("Payment marked as paid.");
      onUpdated?.(updated);
      onClose();
    } catch (err) {
      toast.error(toUserMessage(err, "Unable to update payment. Please try again."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={sale.customerName}
      description={`${formatDate(sale.date)}${sale.customerCode ? ` · ${sale.customerCode}` : ""}`}
      footer={
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={() => navigate(`/sales/${sale.id}`)}>
            Full details
          </Button>
          {sale.paymentStatus === "pending" && can.markPaid && (
            <Button
              variant="success"
              className="flex-1"
              onClick={markPaid}
              loading={saving}
              loadingText="Updating..."
            >
              Mark as Paid
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex items-end justify-between gap-3 rounded-2xl border border-line bg-surface p-4">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-subtle">Total</p>
            <p className="tnum text-2xl font-extrabold text-fg">{formatMoney(sale.total)}</p>
          </div>
          <div className="text-right">
            <StatusBadge status={sale.paymentStatus} />
            {sale.purchaseNumber ? (
              <p className="mt-1.5 text-[11px] text-subtle">
                {ordinal(sale.purchaseNumber)} purchase
              </p>
            ) : null}
          </div>
        </div>

        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
            Products · prices used in this sale
          </p>
          <ul className="divide-y divide-[var(--fo-border)] overflow-hidden rounded-2xl border border-line bg-surface">
            {sale.items.map((item, idx) => (
              <li key={`${item.productId}-${idx}`} className="flex items-start gap-3 p-3.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-fg">{item.productName}</p>
                  <p className="tnum mt-0.5 text-[11px] text-subtle">
                    {item.quantity} {item.unit} · cost {formatMoney(item.costPrice)} · selling{" "}
                    {formatMoney(item.sellingPrice)}
                  </p>
                </div>
                <span className="tnum text-sm font-semibold text-fg">
                  {formatMoney(item.quantity * item.sellingPrice)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-3.5 text-xs text-muted">
          <div className="flex justify-between py-0.5">
            <span>Sale date</span>
            <span className="text-fg">{formatDate(sale.date)}</span>
          </div>
          <div className="flex justify-between py-0.5">
            <span>Created by</span>
            <span className="text-fg">{sale.createdBy || "—"}</span>
          </div>
          <div className="flex justify-between py-0.5">
            <span>Profit</span>
            <span className="tnum text-success">{formatMoney(sale.profit)}</span>
          </div>
        </div>
      </div>
    </BottomSheet>
  );
}

export default SaleDetailSheet;
