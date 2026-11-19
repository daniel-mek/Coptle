"use client";

import { AlignLeft, CalendarDays, ChartNoAxesColumnIncreasing, Cross, House, Settings, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";

export function Header() {
  const menu = useRef<HTMLDetailsElement>(null);
  return <header className="site-header">
    <details className="site-menu" ref={menu} onKeyDown={(event) => {
      if (event.key === "Escape" && menu.current?.open) {
        menu.current.open = false;
        menu.current.querySelector("summary")?.focus();
      }
    }}>
      <summary className="icon-button" aria-label="Menu"><AlignLeft aria-hidden="true" /></summary>
      <nav aria-label="More options">
        <Link onClick={() => { if (menu.current) menu.current.open = false; }} href="/?mode=practice">Practice</Link>
        <Link onClick={() => { if (menu.current) menu.current.open = false; }} href="/about">About Coptle</Link>
      </nav>
    </details>
    <Link className="brand" href="/"><Cross aria-hidden="true" strokeWidth={2.4} /> Coptle</Link>
    <Link className="icon-button settings-link" href="/settings" aria-label="Settings"><Settings aria-hidden="true" /></Link>
  </header>;
}

const destinations = [
  { href: "/", label: "Home", Icon: House },
  { href: "/stats", label: "Statistics", Icon: ChartNoAxesColumnIncreasing },
  { href: "/archive", label: "Archive", Icon: CalendarDays },
  { href: "/profile", label: "Profile", Icon: UserRound },
];

export function BottomNav() {
  const path = usePathname();
  return <nav className="bottom-nav" aria-label="Main navigation">
    {destinations.map(({ href, label, Icon }) => <Link key={href} href={href} aria-current={path === href ? "page" : undefined}>
      <Icon aria-hidden="true" /><span>{label}</span>
    </Link>)}
  </nav>;
}
