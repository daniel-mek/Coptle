import Link from "next/link";
import { ThemeSettings } from "../../components/theme";

export default function Profile() {
  return <section className="play"><h1>Profile</h1>
    <p>You’re playing as a guest on this device.</p>
    <ThemeSettings />
    <p><Link href="/stats">View your statistics</Link></p>
  </section>;
}
