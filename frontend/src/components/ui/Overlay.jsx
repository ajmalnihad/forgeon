import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { cn } from "../../utils/cn.js";
import Icon from "./Icon.jsx";
import Button from "./Button.jsx";

function useDialogBehaviour(open, onClose) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const previous = document.activeElement;
    document.body.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKey);
    const id = setTimeout(() => {
      const target = ref.current?.querySelector(
        "[data-autofocus], input, button, textarea, select"
      );
      target?.focus();
    }, 40);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
      clearTimeout(id);
      previous?.focus?.();
    };
  }, [open, onClose]);
  return ref;
}

/**
 * Bottom sheet — mobile-first selection / quick detail / filters.
 * On desktop it becomes a centered panel so the pattern stays usable.
 */
export function BottomSheet({ open, onClose, title, description, children, footer, maxHeight = "85vh" }) {
  const ref = useDialogBehaviour(open, onClose);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="anim-fade absolute inset-0 bg-overlay backdrop-blur-[2px]"
      />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "anim-sheet relative flex w-full flex-col overflow-hidden rounded-t-2xl border border-line bg-elevated shadow-card",
          "sm:max-w-lg sm:rounded-2xl"
        )}
        style={{ maxHeight }}
      >
        <div className="flex items-start gap-3 border-b border-line px-4 py-3.5">
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-base font-semibold text-fg">{title}</h2>
            {description && <p className="mt-0.5 truncate text-xs text-muted">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 flex size-9 items-center justify-center rounded-xl text-muted hover:bg-surface2 hover:text-fg"
          >
            <Icon name="close" className="size-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">{children}</div>
        {footer && <div className="safe-bottom border-t border-line bg-surface px-4 py-3">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

/** Modal — destructive / high impact confirmations only. */
export function Modal({ open, onClose, title, description, children, footer, tone = "default" }) {
  const ref = useDialogBehaviour(open, onClose);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="anim-fade absolute inset-0 bg-overlay backdrop-blur-[2px]"
      />
      <div
        ref={ref}
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        className="anim-pop relative w-full max-w-md overflow-hidden rounded-2xl border border-line bg-elevated shadow-card"
      >
        <div className="px-5 pt-5">
          <div className="flex items-start gap-3">
            {tone === "danger" && (
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-danger-soft text-danger">
                <Icon name="alert" className="size-5" />
              </span>
            )}
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-fg">{title}</h2>
              {description && <p className="mt-1 text-sm text-muted">{description}</p>}
            </div>
          </div>
          {children && <div className="mt-4">{children}</div>}
        </div>
        <div className="mt-5 flex justify-end gap-2 border-t border-line bg-surface px-5 py-3.5">{footer}</div>
      </div>
    </div>,
    document.body
  );
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  loading = false,
  tone = "danger",
  children,
  disabled = false,
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      tone={tone}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant={tone === "danger" ? "danger" : "primary"}
            onClick={onConfirm}
            loading={loading}
            loadingText="Working..."
            disabled={disabled}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children}
    </Modal>
  );
}
