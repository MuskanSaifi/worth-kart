import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal/LegalPage";
import { COMPANY } from "@/lib/company";

export const metadata: Metadata = {
  title: "Refunds & Cancellations",
  description: `Refunds, cancellations and returns policy for ${COMPANY.brand}.`,
  alternates: { canonical: "/refunds-cancellations" },
};

export default function RefundsCancellationsPage() {
  return (
    <LegalPage title="Refunds & Cancellations">
      <p>
        This Refunds &amp; Cancellations policy applies to purchases on{" "}
        {COMPANY.website}, operated by {COMPANY.legalName}.
      </p>

      <h2>Cancellations</h2>
      <h3>Before shipment</h3>
      <p>
        You may cancel an order from My Orders before the seller ships it. For
        prepaid orders, a full refund is started to the original payment method
        (UPI / card / net banking).
      </p>
      <h3>After shipment</h3>
      <p>
        Once shipped, cancellation may not be available. You can request a
        return after delivery if the product is eligible below.
      </p>

      <h2>Returns</h2>
      <p>
        Most products can be returned within 7 days of delivery if unused and in
        original packaging with tags, accessories, and invoice. Open My Orders
        and choose Return or Replacement.
      </p>
      <p>You may request a return if:</p>
      <ul>
        <li>The product is damaged, defective, or broken on delivery</li>
        <li>You received the wrong item</li>
        <li>Parts or accessories are missing</li>
        <li>The product differs significantly from the listing</li>
      </ul>

      <h2>Non-returnable items</h2>
      <ul>
        <li>Items marked Non-Returnable on the product page</li>
        <li>Opened personal-care / hygiene products</li>
        <li>Innerwear, lingerie, socks, and swimwear</li>
        <li>Perishable goods</li>
        <li>Gift cards and digital products</li>
        <li>Customized products</li>
        <li>Items damaged due to misuse</li>
      </ul>

      <h2>Refunds</h2>
      <p>
        After return pickup and quality check, refunds are initiated to the
        original payment method. Typical timelines after WorthKart initiates the
        refund:
      </p>
      <ul>
        <li>UPI: 1–3 business days</li>
        <li>Cards / net banking: 3–5 business days (bank may take longer)</li>
        <li>COD: refund to the verified UPI / bank account you provide</li>
      </ul>
      <p>
        Shipping charges are generally non-refundable unless the return is due
        to our or the seller&apos;s error.
      </p>

      <h2>Contact</h2>
      <p>
        Email{" "}
        <a className="text-primary font-semibold" href={`mailto:${COMPANY.supportEmail}`}>
          {COMPANY.supportEmail}
        </a>{" "}
        or call{" "}
        <a className="text-primary font-semibold" href={COMPANY.phoneHref}>
          +91 {COMPANY.phone}
        </a>
        . Also see{" "}
        <Link href="/contact-us" className="text-primary font-semibold">
          Contact Us
        </Link>{" "}
        and{" "}
        <Link href="/terms-and-conditions" className="text-primary font-semibold">
          Terms &amp; Conditions
        </Link>
        .
      </p>
    </LegalPage>
  );
}
