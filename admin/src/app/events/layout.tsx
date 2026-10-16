import { AdminShell } from "@/components/layout/admin-shell";

export default function EventsLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
