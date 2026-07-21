import Nav from "@/components/Nav";
import { LogoMark } from "@/components/art";
import { currentRole } from "@/lib/auth";
import { logout } from "@/app/actions";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const role = await currentRole();
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="logo">
          <LogoMark />
          Blauwhoed × AI-Group
        </div>
        <div className="tagline">Agentic Platform — Acquisitie</div>
        <Nav />
        <div className="foot">
          <div className="rolebadge">
            {role === "admin" ? "AI-Group · beheerder" : "Blauwhoed · klant"}
          </div>
          <form action={logout}>
            <button className="btn-link" type="submit">Uitloggen</button>
          </form>
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
