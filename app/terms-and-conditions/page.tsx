import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal/LegalPage";
import { COMPANY } from "@/lib/company";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: `Terms & Conditions for using ${COMPANY.brand} (${COMPANY.website}).`,
  alternates: { canonical: "/terms-and-conditions" },
};

export default function TermsAndConditionsPage() {
  return (
    <LegalPage title="Terms & Conditions">
      <p>
        These Terms &amp; Conditions (&quot;Terms&quot;) govern your use of{" "}
        {COMPANY.website} and the {COMPANY.brand} mobile apps, operated by{" "}
        <strong>{COMPANY.legalName}</strong>. By using the website or apps you
        agree to these Terms, our{" "}
        <Link href="/refunds-cancellations" className="text-primary font-semibold">
          Refunds &amp; Cancellations
        </Link>{" "}
        policy, and Privacy Policy. If you do not agree, do not use the service.
      </p>

      <h2>About the business</h2>
      <p>
        {COMPANY.brand} is an Indian online marketplace connecting buyers with
        independent sellers for the sale of goods (electronics, fashion, beauty,
        home and more). Payments for orders are collected by {COMPANY.legalName}{" "}
        through licensed payment partners (including Cashfree) and settled to
        sellers as per our seller agreement.
      </p>

      <h2>Eligibility</h2>
      <ul>
        <li>You must be 18 years or older, or use the service under a parent/guardian.</li>
        <li>Provide accurate mobile number and address details for orders.</li>
      </ul>

      <h2>Orders &amp; payments</h2>
      <p>
        Orders are confirmed after successful online payment or acceptance of
        Cash on Delivery. We may cancel orders for payment failure, pricing
        errors, suspected fraud, or stock unavailability. Refunds follow the
        Refunds &amp; Cancellations policy.
      </p>

      <h2>Marketplace</h2>
      <p>
        Product listings, pricing, and fulfilment are primarily the seller&apos;s
        responsibility unless stated otherwise. {COMPANY.brand} provides the
        platform, customer support, and payment collection.
      </p>

      <h2>Acceptable use</h2>
      <p>
        Use the service only for lawful shopping. Do not commit fraud, misuse
        coupons, upload malware, or try to access other users&apos; accounts.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        We are not liable for indirect or consequential losses, courier delays
        beyond our control, or payment-gateway downtime. Use of the website is
        at your own risk, subject to applicable Indian consumer law.
      </p>

      <h2>Governing law</h2>
      <p>
        These Terms are governed by the laws of India. Disputes are subject to
        the courts of India.
      </p>

      <h2>Contact</h2>
      <p>
        {COMPANY.legalName} · {COMPANY.supportEmail} · +91 {COMPANY.phone}. See{" "}
        <Link href="/contact-us" className="text-primary font-semibold">
          Contact Us
        </Link>
        .
      </p>
    </LegalPage>
  );
}
