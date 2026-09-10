import { useState } from "react";
import { Input } from "../../../components/ui/Input.jsx";
import Button from "../../../components/ui/Button.jsx";
import { InlineError } from "../../../components/ui/Feedback.jsx";
import { useToast } from "../../../context/ToastContext.jsx";
import { customersApi, toUserMessage } from "../../../services/api/index.js";

/**
 * Single customer form used for BOTH create and Admin edit.
 *
 * Validation (approved rules):
 *   - Name required
 *   - Phone OR WhatsApp required
 *   - Place required
 *
 * The customer display code is generated once on creation and can be corrected
 * by an Admin when editing an existing imported customer.
 */
const EMPTY = { code: "", name: "", phone: "", whatsapp: "", place: "", address: "", email: "" };

export default function CustomerForm({
  customer = null,
  initialName = "",
  onSaved,
  onCancel,
  cancelLabel = "Back",
  submitLabel,
}) {
  const isEdit = !!customer;
  const toast = useToast();
  const [form, setForm] = useState(
    isEdit ? { ...EMPTY, ...customer } : { ...EMPTY, name: initialName }
  );
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!form.name?.trim()) next.name = "Name is required.";
    if (!form.phone?.trim() && !form.whatsapp?.trim()) next.phone = "Phone or WhatsApp is required.";
    if (!form.place?.trim()) next.place = "Place is required.";
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    setFormError("");
    try {
      const payload = {
        name: form.name,
        phone: form.phone,
        whatsapp: form.whatsapp,
        place: form.place,
        address: form.address,
        email: form.email,
        ...(isEdit ? { code: form.code } : {}),
      };
      const saved = isEdit
        ? await customersApi.update(customer.id, payload)
        : await customersApi.create(payload);
      toast.success(isEdit ? "Customer updated." : "Customer created.");
      onSaved?.(saved);
    } catch (err) {
      setFormError(
        toUserMessage(
          err,
          isEdit ? "Unable to update customer. Please try again." : "Unable to create customer. Please try again."
        )
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3.5" noValidate>
      {isEdit && (
        <Input
          label="Customer code"
          value={form.code}
          onChange={set("code")}
          error={errors.code}
          hint="Unique historical/customer reference"
        />
      )}
      <Input label="Name" required value={form.name} onChange={set("name")} error={errors.name} data-autofocus />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Phone" inputMode="tel" value={form.phone} onChange={set("phone")} error={errors.phone} />
        <Input label="WhatsApp" inputMode="tel" value={form.whatsapp} onChange={set("whatsapp")} />
      </div>
      <Input label="Place" required value={form.place} onChange={set("place")} error={errors.place} />
      <Input label="Address" value={form.address} onChange={set("address")} hint="Optional" />
      <Input label="Email" type="email" value={form.email} onChange={set("email")} hint="Optional" />
      <InlineError message={formError} />
      <div className="flex gap-2 pt-1">
        <Button type="button" variant="secondary" className="flex-1" onClick={onCancel} disabled={saving}>
          {cancelLabel}
        </Button>
        <Button type="submit" className="flex-1" loading={saving} loadingText="Saving...">
          {submitLabel || (isEdit ? "Save changes" : "Create & select")}
        </Button>
      </div>
    </form>
  );
}
