import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import PageHeader from "../../components/layout/PageHeader.jsx";
import Button from "../../components/ui/Button.jsx";
import { Card } from "../../components/ui/Card.jsx";
import { Checkbox } from "../../components/ui/Input.jsx";
import { EmptyState, InlineError, LoadingState, StatusBadge } from "../../components/ui/Feedback.jsx";
import Icon from "../../components/ui/Icon.jsx";
import LoyaltyCard from "../../components/domain/LoyaltyCard.jsx";
import CustomerSelectSheet from "./components/CustomerSelectSheet.jsx";
import ProductSelectSheet from "./components/ProductSelectSheet.jsx";
import SaleItemRow from "./components/SaleItemRow.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { customersApi, salesApi, toUserMessage } from "../../services/api/index.js";
import { useAsync } from "../../hooks/useAsync.js";
import { formatMoney, initials } from "../../utils/format.js";
import { toISODate } from "../../utils/date.js";
import { MILESTONE_STEP } from "../../utils/loyalty.js";

function toSaleItem(product) {
  return {
    productId: product.id,
    productName: product.name,
    unit: product.unit,
    quantity: 1,
    costPrice: product.costPrice,
    sellingPrice: product.sellingPrice,
    currentCostPrice: product.costPrice,
    currentSellingPrice: product.sellingPrice,
    priceEdited: false,
  };
}

export default function SaleFormPage({ mode = "create" }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user, isAdmin } = useAuth();

  /**
   * Payment status rule (UX layer):
   *  - Creating a sale: both roles may leave "Payment Done" unchecked (the sale
   *    is then saved as Payment Pending — approved behaviour).
   *  - Editing a sale: only Admin may change payment status. Staff sees it
   *    read-only and the field is never sent in the update payload.
   * Backend must enforce the same restriction.
   */
  const canEditPayment = mode === "create" || isAdmin;

  /**
   * FIX 1 — Customer Details → direct Create Sale.
   * When the sale form is opened from the "+" action on a Customer Details
   * page, that customer arrives in router state and is preselected, so the
   * user never has to search for them again.
   * The normal "+ Sale" bottom-nav entry sends no state and keeps behaving
   * exactly as before (no customer preselected).
   */
  const location = useLocation();
  const preselectCustomerId = mode === "create" ? location.state?.customerId : undefined;

  const [loading, setLoading] = useState(mode === "edit" || !!preselectCustomerId);
  const [customer, setCustomer] = useState(null);
  const [items, setItems] = useState([]);
  const [date, setDate] = useState(toISODate());
  const [paymentDone, setPaymentDone] = useState(true);
  const [customerSheet, setCustomerSheet] = useState(false);
  const [productSheet, setProductSheet] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Preselect the customer carried over from Customer Details (direct sale flow)
  useEffect(() => {
    if (!preselectCustomerId) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const cust = await customersApi.get(preselectCustomerId);
        if (!cancelled) setCustomer(cust);
      } catch (err) {
        if (!cancelled) setFormError(toUserMessage(err, "Unable to load this customer."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [preselectCustomerId]);

  // Load existing sale when editing
  useEffect(() => {
    if (mode !== "edit" || !id) return;
    let cancelled = false;
    (async () => {
      try {
        const [sale] = await Promise.all([salesApi.get(id)]);
        if (cancelled) return;
        const cust = await customersApi.get(sale.customerId);
        if (cancelled) return;
        setCustomer(cust);
        setDate(sale.date);
        setPaymentDone(sale.paymentStatus === "paid");
        setItems(
          sale.items.map((i) => ({
            ...i,
            currentCostPrice: i.costPrice,
            currentSellingPrice: i.sellingPrice,
            priceEdited: false,
          }))
        );
      } catch (err) {
        setFormError(toUserMessage(err, "Unable to load this sale."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mode, id]);

  const totals = useMemo(
    () =>
      items.reduce(
        (acc, i) => ({
          total: acc.total + i.quantity * i.sellingPrice,
          cost: acc.cost + i.quantity * i.costPrice,
        }),
        { total: 0, cost: 0 }
      ),
    [items]
  );
  const hasInvalidPrice = items.some((i) => Number(i.sellingPrice) < Number(i.costPrice));

  /**
   * FIX 2 — Loyalty milestone preview.
   *
   * The preview is fetched from the SAME distinct-date loyalty path used for
   * the real count (`customersApi.loyaltyPreview` → mock `paidDates()`), so
   * there is only ever one loyalty calculation.
   *
   * A sale adds one loyalty purchase only if it will be Paid AND the selected
   * date is not already represented by another active paid sale for this
   * customer. A second same-day sale therefore never shows "10th Purchase".
   * While editing, the sale ignores itself (`excludeSaleId`).
   */
  const preview = useAsync(
    () =>
      customer
        ? customersApi.loyaltyPreview({
            customerId: customer.id,
            date,
            paymentDone,
            excludeSaleId: mode === "edit" ? id : undefined,
          })
        : Promise.resolve(null),
    [customer?.id, date, paymentDone, mode, id]
  );

  const p = preview.data;
  // Fall back to the customer's own counters until the preview resolves.
  const currentCount = p?.currentCount ?? customer?.paidPurchases ?? 0;
  const upcomingNumber = p ? p.upcomingNumber : null;
  const isMilestoneSale = !!upcomingNumber && upcomingNumber % MILESTONE_STEP === 0;

  const addProduct = (product) => {
    setItems((prev) => {
      const existing = prev.findIndex((i) => i.productId === product.id);
      if (existing >= 0) {
        const next = [...prev];
        next[existing] = { ...next[existing], quantity: next[existing].quantity + 1 };
        return next;
      }
      return [...prev, toSaleItem(product)];
    });
  };

  const save = async () => {
    setFormError("");
    if (!customer) {
      setFormError("Please select a customer.");
      return;
    }
    if (items.length === 0) {
      setFormError("Add at least one product to the sale.");
      return;
    }
    if (hasInvalidPrice) {
      setFormError("Selling price cannot be below cost price.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        customerId: customer.id,
        date,
        // Staff editing an existing sale never sends payment fields.
        ...(canEditPayment
          ? { paymentDone, paymentStatus: paymentDone ? "paid" : "pending" }
          : {}),
        items: items.map(({ productId, productName, unit, quantity, costPrice, sellingPrice, priceEdited }) => ({
          productId,
          productName,
          unit,
          quantity,
          ...(priceEdited ? { costPrice, sellingPrice } : {}),
        })),
      };
      const saved =
        mode === "edit" ? await salesApi.update(id, payload) : await salesApi.create(payload, user);
      toast.success(mode === "edit" ? "Sale updated successfully." : "Sale saved successfully.");
      navigate(`/sales/${saved.id}`, { replace: true });
    } catch (err) {
      setFormError(toUserMessage(err, "Unable to save sale. Please try again."));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <PageHeader title="Edit sale" back />
        <LoadingState rows={4} />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={mode === "edit" ? "Edit sale" : "New sale"}
        back
        subtitle={mode === "edit" ? "Editing the prices used in this sale" : "One customer · one date · one purchase"}
      />

      <div className="space-y-5 pb-40 lg:pb-24">
        {/* Customer */}
        <section>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">Customer</p>
          {customer ? (
            <div className="space-y-2.5">
              <Card className="flex items-center gap-3 p-3.5">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface2 text-xs font-bold text-fg">
                  {initials(customer.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-semibold text-fg">{customer.name}</p>
                  <p className="truncate text-xs text-muted">
                    {[customer.code, customer.place, customer.phone || customer.whatsapp]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <Button size="sm" variant="secondary" onClick={() => setCustomerSheet(true)}>
                  Change
                </Button>
              </Card>
              <LoyaltyCard
                paidPurchases={currentCount}
                nextMilestone={p?.nextMilestone ?? customer.nextMilestone}
                projectedCount={p?.projectedCount}
                upcomingNumber={upcomingNumber}
                dateAlreadyCounted={!!p?.dateAlreadyCounted}
                paymentPending={isMilestoneSale && !paymentDone}
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setCustomerSheet(true)}
              className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-line-strong bg-surface p-4 text-left hover:border-accent/60"
            >
              <span className="flex size-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
                <Icon name="user" className="size-5" />
              </span>
              <span className="flex-1">
                <span className="block text-[15px] font-semibold text-fg">Select customer</span>
                <span className="block text-xs text-muted">Recent, search or create new</span>
              </span>
              <Icon name="chevronRight" className="size-4 text-subtle" />
            </button>
          )}
        </section>

        {/* Products */}
        <section>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Products</p>
            {items.length > 0 && (
              <button
                type="button"
                onClick={() => setProductSheet(true)}
                className="flex items-center gap-1 text-[13px] font-semibold text-accent"
              >
                <Icon name="plus" className="size-4" strokeWidth={2.4} /> Add product
              </button>
            )}
          </div>
          {items.length === 0 ? (
            <EmptyState
              icon="box"
              title="No products added"
              description="Add the products included in this purchase."
              action={
                <Button icon="plus" onClick={() => setProductSheet(true)}>
                  Add product
                </Button>
              }
            />
          ) : (
            <div className="space-y-2.5">
              {items.map((item, index) => (
                <SaleItemRow
                  key={`${item.productId}-${index}`}
                  item={item}
                  onChange={(next) =>
                    setItems((prev) => prev.map((i, idx) => (idx === index ? next : i)))
                  }
                  onRemove={() => setItems((prev) => prev.filter((_, idx) => idx !== index))}
                />
              ))}
            </div>
          )}
        </section>

        {/* Date + payment */}
        <section className="space-y-3">
          <Card className="flex items-center justify-between gap-3 p-3.5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Purchase date</p>
              <p className="mt-0.5 text-xs text-subtle">One customer + one date = one loyalty purchase</p>
            </div>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              aria-label="Purchase date"
              className="tnum h-11 rounded-xl border border-line bg-surface px-3 text-sm text-fg"
            />
          </Card>

          {canEditPayment ? (
            <Checkbox
              label="Payment Done"
              description={
                paymentDone
                  ? "Sale is recorded as paid and counts towards loyalty."
                  : "Sale will be saved as Payment Pending. It does not count towards loyalty until an Admin marks it paid."
              }
              checked={paymentDone}
              onChange={setPaymentDone}
            />
          ) : (
            <Card className="p-3.5">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-fg">Payment status</p>
                  <p className="mt-0.5 text-xs text-muted">
                    Only an Admin can change the payment status of a saved sale.
                  </p>
                </div>
                <StatusBadge status={paymentDone ? "paid" : "pending"} />
              </div>
            </Card>
          )}
        </section>

        {/* Totals */}
        <Card className="p-4">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-subtle">Total</p>
              <p className="tnum text-3xl font-extrabold text-fg">{formatMoney(totals.total)}</p>
            </div>
            <div className="text-right text-xs text-muted">
              <p className="tnum">Cost {formatMoney(totals.cost)}</p>
              <p className="tnum text-success">Profit {formatMoney(totals.total - totals.cost)}</p>
            </div>
          </div>
        </Card>

        <InlineError message={formError} />
      </div>

      {/* Sticky save bar */}
      <div className="safe-bottom fixed inset-x-0 bottom-[64px] z-30 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur lg:bottom-0 lg:left-64 lg:px-6">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] uppercase tracking-wide text-subtle">
              {paymentDone ? "Payment Done" : "Payment Pending"}
            </p>
            <p className="tnum truncate text-lg font-bold text-fg">{formatMoney(totals.total)}</p>
          </div>
          <Button
            size="lg"
            className="min-w-[9.5rem] flex-1 sm:flex-none"
            onClick={save}
            loading={saving}
            loadingText="Saving..."
            disabled={hasInvalidPrice}
          >
            {mode === "edit" ? "UPDATE SALE" : "SAVE SALE"}
          </Button>
        </div>
      </div>

      <CustomerSelectSheet
        open={customerSheet}
        onClose={() => setCustomerSheet(false)}
        onSelect={setCustomer}
      />
      <ProductSelectSheet
        open={productSheet}
        onClose={() => setProductSheet(false)}
        onSelect={addProduct}
      />
    </>
  );
}
