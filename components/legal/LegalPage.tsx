import type { ReactNode } from "react";

export function LegalPage({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="bg-background min-h-[60vh]">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-wide text-foreground border-b border-border pb-4 mb-8">
          {title}
        </h1>
        <article className="blog-content text-foreground space-y-4 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-8 [&_h2]:mb-2 [&_h3]:font-semibold [&_h3]:mt-6 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:leading-7">
          {children}
        </article>
      </div>
    </div>
  );
}
