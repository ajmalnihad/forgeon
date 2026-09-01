import { useState } from "react";
import { ConfirmModal } from "../ui/Overlay.jsx";
import { Textarea } from "../ui/Input.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { salesApi, toUserMessage } from "../../services/api/index.js";

/** Admin-only soft delete: confirmation → required reason → soft delete → Trash. */
export function DeleteSaleModal({ sale, open, onClose, onDeleted }) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const toast = useToast();
  const { user } = useAuth();

  const close = () => {
    setReason("");
    setError("");
    onClose();
  };

  const confirm = async () => {
    if (!reason.trim()) {
      setError("A reason is required before deleting a sale.");
      return;
    }
    setLoading(true);
    try {
      await salesApi.softDelete(sale.id, reason.trim(), user);
      toast.success("Sale moved to Trash.");
      onDeleted?.();
      close();
    } catch (err) {
      setError(toUserMessage(err, "Unable to delete sale. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ConfirmModal
      open={open}
      onClose={close}
      onConfirm={confirm}
      title="Delete this sale?"
      description="The sale is soft-deleted, removed from reports and loyalty counting, and moved to Trash. It can be restored later."
      confirmLabel="Delete sale"
      loading={loading}
    >
      <Textarea
        label="Reason (required)"
        placeholder="Why is this sale being deleted?"
        value={reason}
        onChange={(e) => {
          setReason(e.target.value);
          setError("");
        }}
        error={error}
        data-autofocus
      />
    </ConfirmModal>
  );
}

export default DeleteSaleModal;
