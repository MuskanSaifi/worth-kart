import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";
import { COMPANY } from "@/lib/company";

export const metadata: Metadata = {
  title: "Contact Us",
  description: `Contact ${COMPANY.legalName} (${COMPANY.brand}) for order, payment, and delivery support.`,
  alternates: { canonical: "/contact-us" },
};

export default function ContactUsPage() {
  return (
    <LegalPage title="Contact Us">
      <p>
        {COMPANY.brand} is operated by <strong>{COMPANY.legalName}</strong>, an
        Indian online marketplace for electronics, fashion, beauty, home
        essentials and more. Use the details below for order, payment, refund,
        or delivery queries.
      </p>

      <h2>Customer support</h2>
      <p>
        Email:{" "}
        <a className="text-primary font-semibold" href={`mailto:${COMPANY.supportEmail}`}>
          {COMPANY.supportEmail}
        </a>
      </p>
      <p>
        Phone:{" "}
        <a className="text-primary font-semibold" href={COMPANY.phoneHref}>
          +91 {COMPANY.phone}
        </a>
      </p>
      <p>Business hours: {COMPANY.hours}</p>
      <p>
        Website:{" "}
        <a className="text-primary font-semibold" href={COMPANY.website}>
          {COMPANY.website}
        </a>
      </p>

      <h2>Registered business</h2>
      <p>
        Legal name: <strong>{COMPANY.legalName}</strong>
      </p>
      <p>Brand: {COMPANY.brand}</p>
      <p>Nature of business: Online marketplace / e-commerce (sale of goods).</p>

      <h2>Grievance</h2>
      <p>
        If support does not resolve your issue, email{" "}
        <a className="text-primary font-semibold" href={`mailto:${COMPANY.grievanceEmail}`}>
          {COMPANY.grievanceEmail}
        </a>{" "}
        with your order ID. We aim to acknowledge grievances within 48 hours.
      </p>
    </LegalPage>
  );
}
