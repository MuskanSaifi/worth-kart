import { ProductCard, ProductCardData } from "@/components/products/ProductCard";

export function RelatedProductsSection({ products }: { products: ProductCardData[] }) {
  if (products.length === 0) return null;

  return (
    <section aria-labelledby="related-products-heading" className="mt-10">
      <div className="flex items-center justify-between mb-4">
        <h2 id="related-products-heading" className="text-lg md:text-xl font-bold">
          Related Products
        </h2>
        <span className="text-xs text-muted">{products.length} items</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
