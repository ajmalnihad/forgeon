import { forwardRef, useId } from "react";
import { cn } from "../../utils/cn.js";
import Icon from "./Icon.jsx";

const BASE =
  "w-full rounded-xl border border-line bg-surface px-3.5 text-[15px] text-fg placeholder:text-subtle " +
  "transition-colors duration-150 focus:border-accent focus:outline-none disabled:opacity-60";

export function Field({ label, hint, error, required, children, className, htmlFor }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label htmlFor={htmlFor} className="block text-xs font-medium tracking-wide text-muted uppercase">
          {label} {required && <span className="text-accent">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-xs font-medium text-danger">{error}</p>
      ) : hint ? (
        <p className="text-xs text-subtle">{hint}</p>
      ) : null}
    </div>
  );
}

export const Input = forwardRef(function Input(
  { label, hint, error, required, className, inputClassName, ...rest },
  ref
) {
  const autoId = useId();
  const id = rest.id || autoId;
  return (
    <Field label={label} hint={hint} error={error} required={required} className={className} htmlFor={id}>
      <input
        id={id}
        ref={ref}
        aria-invalid={!!error}
        className={cn(BASE, "h-11", error && "border-danger", inputClassName)}
        {...rest}
      />
    </Field>
  );
});

export const Textarea = forwardRef(function Textarea(
  { label, hint, error, className, rows = 3, ...rest },
  ref
) {
  const autoId = useId();
  const id = rest.id || autoId;
  return (
    <Field label={label} hint={hint} error={error} className={className} htmlFor={id}>
      <textarea id={id} ref={ref} rows={rows} className={cn(BASE, "py-2.5", error && "border-danger")} {...rest} />
    </Field>
  );
});

export function Select({ label, hint, error, className, children, ...rest }) {
  const autoId = useId();
  const id = rest.id || autoId;
  return (
    <Field label={label} hint={hint} error={error} className={className} htmlFor={id}>
      <div className="relative">
        <select id={id} className={cn(BASE, "h-11 appearance-none pr-9")} {...rest}>
          {children}
        </select>
        <Icon
          name="chevronDown"
          className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted"
        />
      </div>
    </Field>
  );
}

export const SearchInput = forwardRef(function SearchInput(
  { value, onChange, onClear, placeholder = "Search...", className, ...rest },
  ref
) {
  return (
    <div className={cn("relative", className)}>
      <Icon name="search" className="pointer-events-none absolute left-3.5 top-1/2 size-4.5 -translate-y-1/2 text-subtle" />
      <input
        ref={ref}
        type="search"
        inputMode="search"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className={cn(BASE, "h-11 pl-10.5 pr-9 [&::-webkit-search-cancel-button]:hidden")}
        {...rest}
      />
      {value ? (
        <button
          type="button"
          onClick={() => (onClear ? onClear() : onChange?.(""))}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-lg text-subtle hover:text-fg"
        >
          <Icon name="close" className="size-4" />
        </button>
      ) : null}
    </div>
  );
});

export function Checkbox({ label, description, checked, onChange, className, id: idProp }) {
  const autoId = useId();
  const id = idProp || autoId;
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-surface p-3.5 transition-colors",
        checked && "border-accent/50 bg-accent-soft",
        className
      )}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange?.(e.target.checked)}
        className="mt-0.5 size-5 accent-[var(--fo-accent)]"
      />
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-fg">{label}</span>
        {description && <span className="mt-0.5 block text-xs text-muted">{description}</span>}
      </span>
    </label>
  );
}
