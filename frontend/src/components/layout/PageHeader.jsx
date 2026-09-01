import { useNavigate } from "react-router-dom";
import { cn } from "../../utils/cn.js";
import Icon from "../ui/Icon.jsx";

export function PageHeader({ title, subtitle, back = false, actions, sticky = true, className }) {
  const navigate = useNavigate();
  return (
    <header
      className={cn(
        "z-30 -mx-4 mb-4 border-b border-line bg-bg/95 px-4 py-3 backdrop-blur lg:-mx-6 lg:px-6",
        sticky && "sticky top-0",
        className
      )}
    >
      <div className="flex items-center gap-3">
        {back && (
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="-ml-2 flex size-10 shrink-0 items-center justify-center rounded-xl text-muted hover:bg-surface2 hover:text-fg"
          >
            <Icon name="chevronLeft" className="size-5" />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-bold tracking-tight text-fg lg:text-2xl">{title}</h1>
          {subtitle && <p className="mt-0.5 truncate text-[13px] text-muted">{subtitle}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}

export default PageHeader;
