import { useState } from "react";
import PageHeader from "../../components/layout/PageHeader.jsx";
import Button, { IconButton } from "../../components/ui/Button.jsx";
import { SearchInput, Input, Select } from "../../components/ui/Input.jsx";
import { BottomSheet, ConfirmModal } from "../../components/ui/Overlay.jsx";
import { EmptyState, ErrorState, LoadingState, InlineError } from "../../components/ui/Feedback.jsx";
import ProductCard from "../../components/domain/ProductCard.jsx";
import { cn } from "../../utils/cn.js";
import { useAsync } from "../../hooks/useAsync.js";
import { useDebounce } from "../../hooks/useDebounce.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { productsApi, toUserMessage } from "../../services/api/index.js";

const EMPTY = {
  name: "",
  category: "",
  description: "",
  unit: "pc",
  costPrice: "",
  sellingPrice: "",
};

export default function ProductsPage() {
  const { can } = useAuth();
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [showInactive, setShowInactive] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deactivate, setDeactivate] = useState(null);
  const debounced = useDebounce(query, 220);

  const categories = useAsync(() => productsApi.categories(), []);
  const products = useAsync(
    () => productsApi.list({ q: debounced, category, includeInactive: showInactive || can.manageProducts }),
    [debounced, category, showInactive, can.manageProducts]
  );

  const rows = (products.data || []).filter((p) => (showInactive ? true : p.active));
  const chips = ["all", ...(categories.data || [])];

  const toggleActive = async (product, active) => {
    try {
      await productsApi.setActive(product.id, active);
      toast.success(active ? "Product reactivated." : "Product marked inactive.");
      products.reload();
    } catch (err) {
      toast.error(toUserMessage(err, "Unable to update product."));
    }
  };

  return (
    <>
      <PageHeader
        title="Products"
        back
        subtitle={`${rows.length} products${can.manageProducts ? "" : " · read only"}`}
        actions={
          can.manageProducts ? (
            <Button size="sm" icon="plus" onClick={() => setEditing({ ...EMPTY })}>
              <span className="hidden sm:inline">New</span>
            </Button>
          ) : null
        }
      />

      <div className="mb-3">
        <SearchInput value={query} onChange={setQuery} placeholder="Search products..." />
      </div>

      <div className="no-scrollbar -mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-1">
        {chips.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={cn(
              "shrink-0 rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors",
              category === c
                ? "border-accent bg-accent-soft text-accent"
                : "border-line bg-surface text-muted hover:text-fg"
            )}
          >
            {c === "all" ? "All" : c}
          </button>
        ))}
        {can.manageProducts && (
          <button
            type="button"
            onClick={() => setShowInactive((v) => !v)}
            className={cn(
              "ml-auto shrink-0 rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors",
              showInactive ? "border-accent bg-accent-soft text-accent" : "border-line bg-surface text-muted"
            )}
          >
            Inactive
          </button>
        )}
      </div>

      {products.loading ? (
        <LoadingState rows={5} />
      ) : products.error ? (
        <ErrorState message={products.error} onRetry={products.reload} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon="box"
          title="No products found"
          description="Try another search or category filter."
          action={
            can.manageProducts ? (
              <Button icon="plus" onClick={() => setEditing({ ...EMPTY })}>
                Add product
              </Button>
            ) : null
          }
        />
      ) : (
        <div className="grid gap-2.5 lg:grid-cols-2">
          {rows.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              actions={
                can.manageProducts ? (
                  <>
                    <IconButton icon="edit" label="Edit product" onClick={() => setEditing(product)} />
                    {product.active ? (
                      <IconButton
                        icon="trash"
                        label="Mark inactive"
                        onClick={() => setDeactivate(product)}
                      />
                    ) : (
                      <IconButton
                        icon="restore"
                        label="Reactivate product"
                        onClick={() => toggleActive(product, true)}
                      />
                    )}
                  </>
                ) : null
              }
            />
          ))}
        </div>
      )}

      {editing && (
        <ProductFormSheet
          key={editing.id || "new-product"}
          product={editing}
          categories={categories.data || []}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            products.reload();
            categories.reload();
          }}
        />
      )}

      <ConfirmModal
        open={!!deactivate}
        onClose={() => setDeactivate(null)}
        onConfirm={async () => {
          await toggleActive(deactivate, false);
          setDeactivate(null);
        }}
        title="Mark product inactive?"
        description="The product is hidden from new sales. Historical sales keep their original product and prices."
        confirmLabel="Mark inactive"
      />
    </>
  );
}

function ProductFormSheet({ product, categories, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState({ ...EMPTY, ...(product || {}) });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  if (!product) return null;

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!form.name?.trim()) next.name = "Product name is required.";
    if (!form.category?.trim()) next.category = "Category is required.";
    if (!form.unit?.trim()) next.unit = "Unit is required.";
    if (form.costPrice === "" || Number(form.costPrice) < 0) next.costPrice = "Enter a valid cost price.";
    if (form.sellingPrice === "" || Number(form.sellingPrice) < 0)
      next.sellingPrice = "Enter a valid selling price.";
    if (Number(form.sellingPrice) < Number(form.costPrice))
      next.sellingPrice = "Selling price cannot be below cost price.";
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    setFormError("");
    try {
      const payload = {
        name: form.name.trim(),
        category: form.category.trim(),
        description: form.description?.trim() || "",
        unit: form.unit.trim(),
        costPrice: Number(form.costPrice),
        sellingPrice: Number(form.sellingPrice),
      };
      if (form.id) await productsApi.update(form.id, payload);
      else await productsApi.create(payload);
      toast.success(form.id ? "Product updated." : "Product created.");
      onSaved();
    } catch (err) {
      setFormError(toUserMessage(err, "Unable to save product. Please try again."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <BottomSheet
      open={!!product}
      onClose={onClose}
      title={form.id ? "Edit product" : "New product"}
      description="Current catalogue prices — historical sales are never affected"
    >
      <form onSubmit={submit} className="space-y-3.5" noValidate>
        <Input label="Name" required value={form.name} onChange={set("name")} error={errors.name} data-autofocus />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Category"
            required
            list="product-categories"
            value={form.category}
            onChange={set("category")}
            error={errors.category}
          />
          <datalist id="product-categories">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
          <Select label="Unit" value={form.unit} onChange={set("unit")} error={errors.unit}>
            {["pc", "pack", "pair", "tin", "bottle", "kg", "litre", "box"].map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </Select>
        </div>
        <Input label="Description" value={form.description} onChange={set("description")} hint="Optional" />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Cost price"
            type="number"
            inputMode="decimal"
            value={form.costPrice}
            onChange={set("costPrice")}
            error={errors.costPrice}
            required
          />
          <Input
            label="Selling price"
            type="number"
            inputMode="decimal"
            value={form.sellingPrice}
            onChange={set("sellingPrice")}
            error={errors.sellingPrice}
            required
          />
        </div>
        <InlineError message={formError} />
        <div className="flex gap-2 pt-1">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1" loading={saving} loadingText="Saving...">
            {form.id ? "Save changes" : "Create product"}
          </Button>
        </div>
      </form>
    </BottomSheet>
  );
}
