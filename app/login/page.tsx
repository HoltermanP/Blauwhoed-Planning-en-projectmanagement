import { login } from "@/app/actions";
import { LogoMark, Skyline } from "@/components/art";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <div className="login-wrap">
      <Skyline className="login-skyline" />
      <div className="card login-card">
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 700, fontSize: 18 }}>
          <LogoMark />
          Blauwhoed <span style={{ color: "var(--brand)" }}>×</span> AI-Group
        </div>
        <p className="sub" style={{ marginTop: 6, marginBottom: 8 }}>
          Projectportal — samen bouwen aan het Agentic Platform voor het
          acquisitieproces.
        </p>
        {error && (
          <div className="error-box">Wachtwoord onjuist. Probeer het opnieuw.</div>
        )}
        <form action={login}>
          <label htmlFor="password">Toegangswachtwoord</label>
          <input id="password" name="password" type="password" required autoFocus />
          <button className="btn" type="submit">Inloggen</button>
        </form>
        <p style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 14 }}>
          AI-Group en Blauwhoed hebben elk een eigen wachtwoord; je rol wordt
          automatisch herkend. Wachtwoord kwijt? Neem contact op met het
          AI-Group projectteam.
        </p>
      </div>
    </div>
  );
}
