import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "../../components/layout/PageHeader.jsx";
import { Card } from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import { BottomSheet } from "../../components/ui/Overlay.jsx";
import { EmptyState, ErrorState, LoadingState } from "../../components/ui/Feedback.jsx";
import LoyaltyCard from "../../components/domain/LoyaltyCard.jsx";
import SaleCard from "../../components/domain/SaleCard.jsx";
import CustomerForm from "./components/CustomerForm.jsx";
import { useAsync } from "../../hooks/useAsync.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { customersApi, salesApi } from "../../services/api/index.js";
import { formatMoney, ordinal } from "../../utils/format.js";
import { formatDate } from "../../utils/date.js";

export default function CustomerDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { can } = useAuth();
  const [editOpen, setEditOpen] = useState(false);
  const customer = useAsync(() => customersApi.get(id), [id]);
  const history = useAsync(() => salesApi.list({ customerId: id }), [id]);
  const data = customer.data;
  const sales = history.data || [];

  return (
    <>
      <PageHeader
        title={data?.name || "Customer"}
        back
        subtitle={data ? [data.place, data.code].filter(Boolean).join(" · ") : undefined}
        actions={
          <>
            {can.editCustomer && data && (
              <Button size="sm" variant="secondary" icon="edit" onClick={() => setEditOpen(true)}>
                <span className="hidden sm:inline">Edit</span>
              </Button>
            )}
            {/* Direct Create Sale: carries this customer into the sale form so
                the user does not have to select them again. */}
            <Button
              size="sm"
              icon="plus"
              onClick={() => navigate("/sales/new", { state: { customerId: id } })}
            >
              <span className="hidden sm:inline">Sale</span>
            </Button>
          </>
        }
      />

      {customer.loading ? (
        <LoadingState rows={3} />
      ) : customer.error ? (
        <ErrorState message={customer.error} onRetry={customer.reload} />
      ) : (
        <div className="space-y-5">
          <Card className="p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-subtle">Contact</p>
                <p className="mt-0.5 text-sm text-fg">{data.phone || data.whatsapp || "—"}</p>
                {data.whatsapp && data.phone && data.whatsapp !== data.phone && (
                  <p className="text-xs text-muted">WhatsApp {data.whatsapp}</p>
                )}
                {data.email && <p className="text-xs text-muted">{data.email}</p>}
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-subtle">Place</p>
                <p className="mt-0.5 text-sm text-fg">{data.place}</p>
                {data.address && <p className="text-xs text-muted">{data.address}</p>}
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { label: "Purchase count", value: data.totalPurchases },
              { label: "Paid purchases", value: data.paidPurchases },
              { label: "Total spent", value: formatMoney(data.totalSpent) },
              {
                label: "Pending",
                value: formatMoney(data.pendingAmount),
                tone: data.pendingAmount > 0 ? "text-warn" : "",
              },
            ].map((cell) => (
              <Card key={cell.label} className="p-3.5">
                <p className="text-[10px] uppercase tracking-wide text-subtle">{cell.label}</p>
                <p className={`tnum mt-1 text-lg font-bold text-fg ${cell.tone || ""}`}>{cell.value}</p>
              </Card>
            ))}
          </div>

          <LoyaltyCard
            name={`Next milestone: ${ordinal(data.nextMilestone)} purchase`}
            paidPurchases={data.paidPurchases}
            nextMilestone={data.nextMilestone}
          />

          <section>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                Purchase history
              </p>
              <span className="text-[11px] text-subtle">
                {sales.length} active {sales.length === 1 ? "sale" : "sales"}
              </span>
            </div>
            {history.loading ? (
              <LoadingState rows={3} />
            ) : sales.length === 0 ? (
              <EmptyState
                icon="receipt"
                title="No purchases yet"
                description="This customer has no active sales."
                action={<Button onClick={() => navigate("/sales/new")}>Create sale</Button>}
              />
            ) : (
              <div className="space-y-2.5">
                {sales.map((sale) => (
                  <SaleCard
                    key={sale.id}
                    sale={sale}
                    showCustomer={false}
                    onClick={() => navigate(`/sales/${sale.id}`)}
                  />
                ))}
              </div>
            )}
            <p className="mt-3 text-[11px] text-subtle">
              Last purchase: {data.lastPurchaseDate ? formatDate(data.lastPurchaseDate) : "—"} · deleted
              sales are excluded from this history.
            </p>
          </section>
        </div>
      )}

      {/* Admin-only customer edit. The FO- code is immutable and shown read-only. */}
      {can.editCustomer && data && (
        <BottomSheet
          open={editOpen}
          onClose={() => setEditOpen(false)}
          title="Edit customer"
          description="Name, contact and place are required"
        >
          <CustomerForm
            customer={data}
            cancelLabel="Cancel"
            onCancel={() => setEditOpen(false)}
            onSaved={() => {
              setEditOpen(false);
              customer.reload();
            }}
          />
        </BottomSheet>
      )}
    </>
  );
}
