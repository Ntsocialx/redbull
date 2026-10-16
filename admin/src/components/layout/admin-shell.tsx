"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CalendarDays, LayoutDashboard, LogOut, Megaphone, Menu, Plus, X } from "lucide-react";
import { adminRequest, type AdminUser } from "@/lib/api";

const navItems = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Events", href: "/events", icon: CalendarDays },
  { label: "Create event", href: "/events/new", icon: Plus },
  { label: "Announcements", href: "/announcements", icon: Megaphone },
] as const;

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let active = true;
    adminRequest<{ data: { admin: AdminUser } }>("/auth/me").then((result) => {
      if (active) setAdmin(result.data.admin);
    }).catch(() => {
      if (active) router.replace("/login");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [router]);

  async function logout() {
    try { await adminRequest("/auth/logout", { method: "POST" }); } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  if (loading || !admin) return <main className="admin-loading" aria-busy="true"><span className="loading-bar" /><p>Checking administrator session…</p></main>;
  return (
    <div className="admin-layout">
      <aside className={`admin-sidebar ${menuOpen ? "is-open" : ""}`}>
        <Link className="admin-brand" href="/dashboard"><span>RED BULL <b>TUT</b><small>ADMIN CONSOLE</small></span></Link>
        <span className="sidebar-section-label">WORKSPACE</span>
        <nav aria-label="Admin navigation">
          {navItems.map(({ label, href, icon: Icon }) => <Link key={href} className={pathname === href || pathname.startsWith(`${href}/`) ? "active" : ""} href={href} onClick={() => setMenuOpen(false)}><Icon size={17} /><span>{label}</span></Link>)}
          <Link href={process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"} target="_blank" rel="noreferrer"><ArrowTopRightIcon /><span>View student site</span></Link>
        </nav>
        <div className="sidebar-bottom"><div className="admin-identity"><span className="identity-avatar">{admin.name.slice(0, 1).toUpperCase()}</span><span><strong>{admin.name}</strong><small>Administrator</small></span></div><button type="button" className="logout-button" onClick={logout}><LogOut size={16} /><span>Sign out</span></button></div>
      </aside>
      {menuOpen && <button type="button" className="sidebar-scrim" aria-label="Close navigation" onClick={() => setMenuOpen(false)} />}
      <div className="admin-workspace"><header className="admin-topbar"><button type="button" className="admin-menu-toggle" aria-label={menuOpen ? "Close navigation" : "Open navigation"} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={19} /> : <Menu size={19} />}</button><span>Platform administration</span><span className="topbar-user">{admin.email}</span></header><main className="admin-content">{children}</main></div>
    </div>
  );
}

function ArrowTopRightIcon() {
  return <span aria-hidden="true" className="external-arrow">↗</span>;
}
