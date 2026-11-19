import type { Metadata } from "next";
import Link from "next/link";
import "./styles.css";
import { ApplyTheme } from "../components/theme";

export const metadata: Metadata = {
  title: { default: "Coptle — Daily Christian puzzles", template: "%s · Coptle" },
  description: "Play. Learn. Grow in faith.",
};

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>
    <ApplyTheme />
    <a className="skip" href="#main">Skip to content</a>
    <header className="site-header">
      <Link className="brand" href="/"><span aria-hidden="true">✥</span> Coptle</Link>
      <nav aria-label="Main navigation">
        <Link href="/">Today</Link><Link href="/?mode=practice">Practice</Link>
        <Link href="/stats">Statistics</Link><Link href="/settings">Settings</Link><Link href="/about">About</Link>
      </nav>
    </header>
    <main id="main" className="shell">{children}</main>
    <footer className="site-footer">Coptle <span aria-hidden="true">·</span> An independent Christian puzzle project</footer>
  </body></html>;
}
