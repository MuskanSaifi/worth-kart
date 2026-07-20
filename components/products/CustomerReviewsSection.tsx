import { Star } from "lucide-react";
import type { RatingBreakdown } from "@/lib/product-detail";

type ReviewItem = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
  user: { name: string | null };
};

type CustomerReviewsSectionProps = {
  productName: string;
  breakdown: RatingBreakdown;
  reviews: ReviewItem[];
};

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-amber-500" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={14}
          className={i < rating ? "fill-amber-500 text-amber-500" : "text-gray-300"}
        />
      ))}
    </span>
  );
}

export function CustomerReviewsSection({
  productName,
  breakdown,
  reviews,
}: CustomerReviewsSectionProps) {
  const hasReviews = breakdown.total > 0 || reviews.length > 0;

  return (
    <section className="mt-8 bg-card rounded-xl border border-border p-5 md:p-6" aria-labelledby="reviews-heading">
      <h2 id="reviews-heading" className="font-bold text-lg md:text-xl mb-6">
        Customer reviews
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: rating summary */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold text-foreground">{breakdown.average.toFixed(1)}</span>
            <div>
              <Stars rating={Math.round(breakdown.average)} />
              <p className="text-sm text-muted mt-0.5">
                {breakdown.total.toLocaleString("en-IN")} global ratings
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {([5, 4, 3, 2, 1] as const).map((star) => (
              <div key={star} className="flex items-center gap-2 text-sm">
                <span className="w-12 text-primary hover:underline cursor-default shrink-0">
                  {star} star
                </span>
                <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all"
                    style={{ width: `${breakdown.percents[star]}%` }}
                  />
                </div>
                <span className="w-10 text-right text-muted text-xs shrink-0">
                  {breakdown.percents[star]}%
                </span>
              </div>
            ))}
          </div>

          {!hasReviews && (
            <p className="text-sm text-muted pt-2">
              No customer reviews yet for {productName}. Be the first to share feedback after buying.
            </p>
          )}
        </div>

        {/* Right: top reviews */}
        <div className="lg:col-span-8">
          <h3 className="font-semibold text-base mb-4">Top reviews from India</h3>
          {reviews.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted">
              Reviews will appear here once buyers rate this product.
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <article key={review.id} className="border border-border rounded-lg p-4">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-sm font-semibold text-foreground">
                      {review.user.name || "Verified Buyer"}
                    </span>
                    <Stars rating={review.rating} />
                    <span className="text-xs text-muted">
                      {new Date(review.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  {review.comment ? (
                    <p className="text-sm text-foreground leading-relaxed">{review.comment}</p>
                  ) : (
                    <p className="text-sm text-muted italic">Rated {review.rating} out of 5</p>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
