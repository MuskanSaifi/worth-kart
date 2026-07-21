export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // Auth is enforced in middleware (except /admin/login).
  // Panel pages wrap content with AdminShell themselves.
  return children;
}
