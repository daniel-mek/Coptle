import type { Metadata } from "next";
import { BottomNav, Header } from "../components/site-nav";
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
    <div className="site-frame">
      <Header />
      <main id="main" className="shell">{children}</main>
      <BottomNav />
    </div>
  </body></html>;
}
