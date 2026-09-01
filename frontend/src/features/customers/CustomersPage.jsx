import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/layout/PageHeader.jsx";
import Button from "../../components/ui/Button.jsx";
import { SearchInput } from "../../components/ui/Input.jsx";
import { BottomSheet } from "../../components/ui/Overlay.jsx";
import { EmptyState, ErrorState, LoadingState } from "../../components/ui/Feedback.jsx";
import CustomerCard from "../../components/domain/CustomerCard.jsx";
import CustomerForm from "./components/CustomerForm.jsx";
import { useAsync } from "../../hooks/useAsync.js";
import { useDebounce } from "../../hooks/useDebounce.js";
import { customersApi } from "../../services/api/index.js";

export default function CustomersPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const debounced = useDebounce(query, 250);
  const customers = useAsync(() => customersApi.list({ q: debounced }), [debounced]);
  const rows = customers.data || [];

  return (
    <>
      <PageHeader
        title="Customers"
        subtitle={`${rows.length} records`}
        back
        actions={
          <Button size="sm" icon="plus" onClick={() => setCreateOpen(true)}>
            <span className="hidden sm:inline">New</span>
          </Button>
        }
      />

      <div className="mb-4">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search name, phone, WhatsApp, code..."
        />
      </div>

      {!query && (
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-subtle">
          Recent customers
        </p>
      )}

      {customers.loading ? (
        <LoadingState rows={5} />
      ) : customers.error ? (
        <ErrorState message={customers.error} onRetry={customers.reload} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon="users"
          title="No customers found"
          description="Create a customer to start recording sales."
          action={
            <Button icon="plus" onClick={() => setCreateOpen(true)}>
              Create customer
            </Button>
          }
        />
      ) : (
        <div className="grid gap-2.5 lg:grid-cols-2">
          {rows.map((customer) => (
            <CustomerCard
              key={customer.id}
              customer={customer}
              onClick={() => navigate(`/customers/${customer.id}`)}
            />
          ))}
        </div>
      )}

      <BottomSheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New customer"
        description="Name, contact and place are required"
      >
        <CustomerForm
          cancelLabel="Cancel"
          submitLabel="Create customer"
          onCancel={() => setCreateOpen(false)}
          onSaved={(customer) => {
            setCreateOpen(false);
            customers.reload();
            navigate(`/customers/${customer.id}`);
          }}
        />
      </BottomSheet>
    </>
  );
}
