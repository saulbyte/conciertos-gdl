import Link from "next/link";
import { ChevronRight } from "lucide-react";

type BreadcrumbItem = {
  label: string;
  href?: string;
};

type BreadcrumbsProps = {
  items: BreadcrumbItem[];
  variant?: "light" | "dark";
};

export function Breadcrumbs({ items, variant = "light" }: BreadcrumbsProps) {
  return (
    <nav aria-label="Ruta" className="min-w-0">
      <ol className="flex min-w-0 items-center gap-1.5 text-xs font-bold sm:text-sm">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={`${item.label}-${index}`} className="flex min-w-0 items-center gap-1.5">
              {index > 0 ? (
                <ChevronRight
                  className={
                    variant === "dark"
                      ? "h-3.5 w-3.5 shrink-0 text-slate-500"
                      : "h-3.5 w-3.5 shrink-0 text-slate-400"
                  }
                  aria-hidden="true"
                />
              ) : null}
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className={
                    variant === "dark"
                      ? "shrink-0 text-slate-300 transition hover:text-white"
                      : "shrink-0 text-slate-500 transition hover:text-violet-700"
                  }
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={
                    variant === "dark"
                      ? "truncate text-white"
                      : "truncate text-slate-950"
                  }
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
