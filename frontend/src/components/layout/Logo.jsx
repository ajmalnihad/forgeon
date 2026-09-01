import { cn } from "../../utils/cn.js";

/** ForgeON wordmark — dark identity, silver text, single orange accent. */
export function Logo({ className, size = "md", showTag = false }) {
  const text = size === "lg" ? "text-3xl" : size === "sm" ? "text-base" : "text-xl";
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span
        className={cn(
          "flex items-center justify-center rounded-xl bg-accent font-black text-accent-fg",
          size === "lg" ? "size-11 text-xl" : size === "sm" ? "size-7 text-xs" : "size-9 text-base"
        )}
        aria-hidden="true"
      >
        F
      </span>
      <span className="leading-none">
        <span className={cn("font-extrabold tracking-tight text-fg", text)}>
          Forge<span className="text-accent">ON</span>
        </span>
        {showTag && (
          <span className="mt-1 block text-[10px] font-medium uppercase tracking-[0.2em] text-subtle">
            Sales &amp; Loyalty
          </span>
        )}
      </span>
    </div>
  );
}

export default Logo;
