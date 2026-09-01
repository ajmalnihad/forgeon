import { useEffect, useRef, useState } from "react";
import { BottomSheet } from "../../../components/ui/Overlay.jsx";
import { SearchInput } from "../../../components/ui/Input.jsx";
import Button from "../../../components/ui/Button.jsx";
import { EmptyState, LoadingState } from "../../../components/ui/Feedback.jsx";
import CustomerCard from "../../../components/domain/CustomerCard.jsx";
import CustomerForm from "../../customers/components/CustomerForm.jsx";
import { useAsync } from "../../../hooks/useAsync.js";
import { useDebounce } from "../../../hooks/useDebounce.js";
import { customersApi } from "../../../services/api/index.js";

/**
 * Customer picker used inside Create Sale: recent + live search + inline create.
 * Search matches name, phone, WhatsApp, place and the opaque customer code.
 */
export default function CustomerSelectSheet({ open, onClose, onSelect }) {
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const searchRef = useRef(null);
  const debounced = useDebounce(query, 220);
  const list = useAsync(() => customersApi.list({ q: debounced, limit: 25 }), [debounced, open]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setCreating(false);
      setTimeout(() => searchRef.current?.focus(), 60);
    }
  }, [open]);

  const rows = list.data || [];

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={creating ? "New customer" : "Select customer"}
      description={creating ? "Name, contact and place are required" : "Recent customers and search"}
    >
      {creating ? (
        <CustomerForm
          initialName={query}
          onCancel={() => setCreating(false)}
          onSaved={(customer) => {
            onSelect(customer);
            onClose();
          }}
        />
      ) : (
        <div className="space-y-3">
          <SearchInput
            ref={searchRef}
            value={query}
            onChange={setQuery}
            placeholder="Search name, phone, WhatsApp, code..."
          />

          {!query && (
            <p className="pt-1 text-[11px] font-semibold uppercase tracking-wide text-subtle">
              Recent customers
            </p>
          )}

          {list.loading ? (
            <LoadingState rows={3} />
          ) : rows.length === 0 ? (
            <EmptyState
              icon="users"
              title="No customer found"
              description="Create the customer and continue with this sale."
              action={
                <Button icon="plus" onClick={() => setCreating(true)}>
                  Create New Customer
                </Button>
              }
            />
          ) : (
            <>
              <div className="space-y-2">
                {rows.map((customer) => (
                  <CustomerCard
                    key={customer.id}
                    customer={customer}
                    compact
                    onClick={() => {
                      onSelect(customer);
                      onClose();
                    }}
                  />
                ))}
              </div>
              <Button variant="outline" icon="plus" className="w-full" onClick={() => setCreating(true)}>
                Create New Customer
              </Button>
            </>
          )}
        </div>
      )}
    </BottomSheet>
  );
}
