"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const links = [
  ["Events", "/events"],
  ["Announcements", "/announcements"],
  ["Calendar", "/calendar"],
  ["Campuses", "/campuses"],
  ["About", "/about"],
] as const;

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <header className={pathname === "/" ? "site-header site-header-home" : "site-header"}>
      <div className="nav-wrap">
        <Link href="/" className="brand-lockup" aria-label="Red Bull TUT home" onClick={() => setOpen(false)}>
          <Image src="/images/red-bull-tut-logo.png" alt="Red Bull Energy Drink" width={56} height={33} priority />
          <span className="brand-name">RED BULL <span>TUT</span></span>
        </Link>
        <nav className="desktop-nav" aria-label="Main navigation">
          {links.map(([label, href]) => (
            <Link key={href} href={href} aria-current={pathname === href || pathname.startsWith(`${href}/`) ? "page" : undefined}>
              {label}
            </Link>
          ))}
        </nav>
        <Button asChild className="nav-cta"><Link href="/events">Explore events <span aria-hidden="true">↗</span></Link></Button>
        <button className="menu-toggle" type="button" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen(!open)}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
      {open && (
        <nav className="mobile-nav" aria-label="Mobile navigation">
          {links.map(([label, href]) => (
            <Link key={href} href={href} aria-current={pathname === href || pathname.startsWith(`${href}/`) ? "page" : undefined} onClick={() => setOpen(false)}>{label}</Link>
          ))}
          <Link className="button button-red" href="/events" onClick={() => setOpen(false)}>Explore events <span aria-hidden="true">↗</span></Link>
        </nav>
      )}
    </header>
  );
}
