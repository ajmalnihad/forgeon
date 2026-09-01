import { useState } from "react";
import PageHeader from "../../components/layout/PageHeader.jsx";
import SaleCard from "../../components/domain/SaleCard.jsx";
import SaleDetailSheet from "../../components/domain/SaleDetailSheet.jsx";
import { EmptyState, ErrorState, LoadingState } from "../../components/ui/Feedback.jsx";
import { useAsync } from "../../hooks/useAsync.js";
import { salesApi } from "../../services/api/index.js";
import { formatMoney } from "../../utils/format.js";
import { useAuth } from "../../context/AuthContext.jsx";

export default function PendingPaymentsPage() {
  const { can } = useAuth();
  const [active, setActive] = useState(null);
  const pending = useAsync(() => salesApi.pending(), []);
  const rows = pending.data || [];
  const total = rows.reduce((s, r) => s + r.total, 0);

  return (
    <>
      <PageHeader
        title="Payment Pending"
        back
        subtitle={
          rows.length
            ? `${rows.length} pending · ${formatMoney(total)}${can.markPaid ? "" : " · Admin marks payments paid"}`
            : undefined
        }
      />
      {pending.loading ? (
        <LoadingState rows={4} />
      ) : pending.error ? (
        <ErrorState message={pending.error} onRetry={pending.reload} />
      ) : rows.length === 0 ? (
        <EmptyState icon="check" title="No pending payments" description="All sales are fully paid." />
      ) : (
        <div className="space-y-2.5">
          {rows.map((sale) => (
            <SaleCard key={sale.id} sale={sale} onClick={() => setActive(sale)} />
          ))}
        </div>
      )}

      <SaleDetailSheet
        sale={active}
        open={!!active}
        onClose={() => setActive(null)}
        onUpdated={pending.reload}
      />
    </>
  );
}
