import { AdminShell } from "@/components/admin/AdminShell";
import { SitePageForm } from "@/components/admin/SitePageForm";

export default function AdminNewSitePage() {
  return (
    <AdminShell
      title="Create Info Page"
      description="Add a new footer or policy page with rich content."
    >
      <SitePageForm submitLabel="Create Page" />
    </AdminShell>
  );
}
