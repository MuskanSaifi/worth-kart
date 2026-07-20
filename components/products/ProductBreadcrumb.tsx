import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

export function ProductBreadcrumb({
  crumbs,
  productName,
}: {
  crumbs: { name: string; slug: string }[];
  productName: string;
}) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-muted mb-4 overflow-x-auto">
      <ol className="flex items-center gap-1 whitespace-nowrap">
        <li>
          <Link href="/" className="hover:text-primary flex items-center gap-1">
            <Home size={14} />
            <span className="sr-only sm:not-sr-only">Home</span>
          </Link>
        </li>
        {crumbs.map((crumb) => (
          <li key={crumb.slug} className="flex items-center gap-1">
            <ChevronRight size={14} className="text-gray-300 shrink-0" />
            <Link
              href={`/products?category=${crumb.slug}`}
              className="hover:text-primary capitalize"
            >
              {crumb.name}
            </Link>
          </li>
        ))}
        <li className="flex items-center gap-1 min-w-0">
          <ChevronRight size={14} className="text-gray-300 shrink-0" />
          <span className="text-foreground font-medium truncate max-w-[200px] md:max-w-xs" title={productName}>
            {productName}
          </span>
        </li>
      </ol>
    </nav>
  );
}
