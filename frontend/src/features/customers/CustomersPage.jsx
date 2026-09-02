import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/layout/PageHeader.jsx";
import Button from "../../components/ui/Button.jsx";
import { SearchInput, Textarea } from "../../components/ui/Input.jsx";
import { BottomSheet } from "../../components/ui/Overlay.jsx";
import { EmptyState, ErrorState, LoadingState } from "../../components/ui/Feedback.jsx";
import CustomerCard from "../../components/domain/CustomerCard.jsx";
import CustomerForm from "./components/CustomerForm.jsx";
import { useAsync } from "../../hooks/useAsync.js";
import { useDebounce } from "../../hooks/useDebounce.js";
import { customersApi, toUserMessage } from "../../services/api/index.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";

export default function CustomersPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkError, setBulkError] = useState("");
  const [bulkSaving, setBulkSaving] = useState(false);
  const { isAdmin } = useAuth();
  const toast = useToast();
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
          <div className="flex gap-2">
            {isAdmin && <Button size="sm" variant="secondary" onClick={() => { setBulkError(""); setBulkOpen(true); }}>Bulk Add Customers</Button>}
            <Button size="sm" icon="plus" onClick={() => setCreateOpen(true)}><span className="hidden sm:inline">New</span></Button>
          </div>
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

      <BottomSheet
        open={bulkOpen}
        onClose={() => !bulkSaving && setBulkOpen(false)}
        title="Bulk add customers"
        description="Admin only - one customer per line"
        footer={
          <Button
            className="w-full"
            loading={bulkSaving}
            loadingText="Importing..."
            onClick={async () => {
              setBulkError("");
              setBulkSaving(true);
              try {
                const result = await customersApi.bulkImport(bulkText);
                toast.success(`${result.created_count} customers added successfully.`);
                setBulkText("");
                setBulkOpen(false);
                customers.reload();
              } catch (err) {
                setBulkError(toUserMessage(err, "Unable to import customers."));
              } finally {
                setBulkSaving(false);
              }
            }}
          >
            Import customers
          </Button>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-muted">One customer per line. Format: Name,Phone,Address. Optional numbering like 1. is accepted.</p>
          <Textarea
            rows={8}
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            placeholder={'Ajmal,9846977619,Olavanna\nNihad,9846977892,Nallalam'}
            data-autofocus
          />
          {bulkError && <p className="text-xs font-medium text-danger">{bulkError}</p>}
        </div>
      </BottomSheet>
    </>
  );
}
