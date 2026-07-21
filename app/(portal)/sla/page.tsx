import { CONTACTS, PROJECT, SLA_TIERS } from "@/lib/content";
import { fmt } from "@/lib/dates";
import PageHeader from "@/components/PageHeader";

export const dynamic = "force-dynamic";

export default function SlaPage() {
  return (
    <>
      <PageHeader
        title="SLA & Beheer"
        intro={`De Beheerfase start op ${fmt(PROJECT.beheerStart)}, direct na Oplevering ter Acceptatie. Vanaf dat moment gelden onderstaande service levels; het SLA-dashboard (uptime per maand, responstijden) wordt hier dan actief.`}
        image="/img/hero-film.jpg"
        imagePosition="center top"
      />

      <div className="grid-3">
        <div className="card">
          <div className="stat-label">Beschikbaarheid</div>
          <div className="stat-value">{PROJECT.sla.uptime}</div>
          <div className="stat-hint">Gegarandeerde uptime, gemeten per maand</div>
        </div>
        <div className="card">
          <div className="stat-label">Support</div>
          <div className="stat-value">P1–P4</div>
          <div className="stat-hint">Gegarandeerde reactietijden per prioriteit</div>
        </div>
        <div className="card">
          <div className="stat-label">Beheer</div>
          <div className="stat-value" style={{ fontSize: 24 }}>Standby</div>
          <div className="stat-hint">Hosting, monitoring, patches &amp; doorlopende optimalisatie door AI-Group</div>
        </div>
      </div>

      <h2>Prioriteiten &amp; reactietijden</h2>
      <div className="card table-wrap" style={{ padding: 0 }}>
        <table>
          <thead>
            <tr><th>Prio</th><th>Omschrijving</th><th>Reactietijd</th><th>Oplostijd</th></tr>
          </thead>
          <tbody>
            {SLA_TIERS.map((t) => (
              <tr key={t.prio}>
                <td><strong>{t.prio}</strong></td>
                <td>{t.omschrijving}</td>
                <td>{t.reactie}</td>
                <td>{t.oplossing}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 8 }}>
        Indicatief overzicht — de ondertekende SLA (Bijlage 1) is leidend. De Academy
        wordt na Oplevering door Blauwhoed onderhouden en valt buiten de SLA.
      </p>

      <div className="grid-2" style={{ marginTop: 20 }}>
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Contacten</h2>
          <table>
            <tbody>
              {[...CONTACTS.aigroup, ...CONTACTS.blauwhoed].map((c) => (
                <tr key={c.naam}>
                  <td><strong>{c.naam}</strong></td>
                  <td style={{ color: "var(--ink-2)" }}>{c.rol}</td>
                  <td style={{ color: "var(--muted)" }}>{c.org}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Escalatiepad</h2>
          <ol style={{ paddingLeft: 20, fontSize: 14, color: "var(--ink-2)", display: "grid", gap: 8 }}>
            {CONTACTS.escalatie.map((s) => <li key={s}>{s.replace(/^\d+\.\s*/, "")}</li>)}
          </ol>
        </div>
      </div>
    </>
  );
}
