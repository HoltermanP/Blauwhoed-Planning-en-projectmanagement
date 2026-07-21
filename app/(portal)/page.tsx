import Link from "next/link";
import { AGENTS, COLUMNS, PROJECT, VALIDATION_QUESTIONS, agentById } from "@/lib/content";
import { daysBetween, fmt, fmtDateTime, progressPct, todayISO } from "@/lib/dates";
import { getState } from "@/lib/store";
import { Progress, RiskBadge } from "@/components/ui";
import PageHeader from "@/components/PageHeader";
import { AgentIcon } from "@/components/art";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const state = await getState();
  const today = todayISO();

  const totalDays = daysBetween(PROJECT.bouwStart, PROJECT.bouwEind) + 1;
  const dayNr = Math.min(totalDays, Math.max(0, daysBetween(PROJECT.bouwStart, today) + 1));
  const pct = progressPct(PROJECT.bouwStart, PROJECT.bouwEind);
  const daysLeft = Math.max(0, daysBetween(today, PROJECT.bouwEind));

  const answered = Object.values(state.answers).filter((a) => a.status === "beantwoord").length;
  const inProgress = Object.values(state.answers).filter((a) => a.status === "in-behandeling").length;
  const recentComments = [...state.comments].reverse().slice(0, 4);

  return (
    <>
      <PageHeader
        title="Samen bouwen aan het Agentic Platform"
        intro={`Volg hier live de planning en voortgang van de zes agents en de Academy — van design tot oplevering. Status per ${fmt(today)}.`}
        image="/img/hero-film.jpg"
      >
        <div className="hero-chips">
          <span className="hero-chip">Bouwfase · dag {dayNr} van {totalDays}</span>
          <span className="hero-chip">Oplevering: {fmt(PROJECT.bouwEind)}</span>
          <span className="hero-chip">Beheerfase vanaf {fmt(PROJECT.beheerStart)}</span>
        </div>
      </PageHeader>

      <div className="grid-3">
        <div className="card">
          <div className="stat-label">Bouwfase</div>
          <div className="stat-value">{pct}%</div>
          <div className="stat-hint">Dag {dayNr} van {totalDays} · {fmt(PROJECT.bouwStart)} – {fmt(PROJECT.bouwEind)}</div>
          <Progress pct={pct} />
        </div>
        <div className="card">
          <div className="stat-label">Oplevering ter Acceptatie</div>
          <div className="stat-value">{fmt(PROJECT.bouwEind).replace(" 2026", "")}</div>
          <div className="stat-hint">Nog {daysLeft} dagen · incl. Academy live</div>
        </div>
        <div className="card">
          <div className="stat-label">Beheerfase</div>
          <div className="stat-value" style={{ fontSize: 22 }}>vanaf {fmt(PROJECT.beheerStart).replace(" 2026", "")}</div>
          <div className="stat-hint">SLA: {PROJECT.sla.uptime} uptime · {PROJECT.sla.support}</div>
        </div>
      </div>

      <h2>Agents — status</h2>

      <div className="mobile-only agent-cardlist">
        {AGENTS.map((a) => {
          const epic = state.epics[a.id];
          const col = COLUMNS.find((c) => c.key === epic.column);
          return (
            <div className="arow" key={a.id}>
              <div className="top">
                <Link href={`/agents/${a.id}`}>
                  <AgentIcon id={a.id} size={17} />
                  {a.name}
                </Link>
                <RiskBadge risk={epic.risk} />
              </div>
              {epic.note && <div className="note">▲ {epic.note}</div>}
              <div className="meta">
                {col?.label} · {a.milestone.label}: {fmt(a.milestone.date)}
              </div>
            </div>
          );
        })}
      </div>

      <div className="card table-wrap desktop-only" style={{ padding: 0 }}>
        <table>
          <thead>
            <tr>
              <th>Epic</th>
              <th>Fase</th>
              <th>Status</th>
              <th>Live-datum</th>
            </tr>
          </thead>
          <tbody>
            {AGENTS.map((a) => {
              const epic = state.epics[a.id];
              const col = COLUMNS.find((c) => c.key === epic.column);
              return (
                <tr key={a.id}>
                  <td>
                    <Link href={`/agents/${a.id}`}><strong>{a.name}</strong></Link>
                    {epic.note && (
                      <div style={{ fontSize: 12.5, color: "var(--warning-text)", marginTop: 2 }}>
                        ▲ {epic.note}
                      </div>
                    )}
                  </td>
                  <td>{col?.label}</td>
                  <td><RiskBadge risk={epic.risk} /></td>
                  <td>{fmt(a.milestone.date)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grid-2" style={{ marginTop: 28 }}>
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Validatievragen</h2>
          <p style={{ fontSize: 14, color: "var(--ink-2)" }}>
            {answered} van {VALIDATION_QUESTIONS.length} beantwoord
            {inProgress > 0 && <> · {inProgress} in behandeling</>}.
            Input van Daphne &amp; Lise (OM Acquisitie) stuurt de designfase direct aan.
          </p>
          <Progress pct={Math.round((answered / VALIDATION_QUESTIONS.length) * 100)} />
          <p style={{ marginTop: 12 }}>
            <Link href="/validatie">Naar de validatievragen →</Link>
          </p>
        </div>
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Recente feedback</h2>
          {recentComments.length === 0 ? (
            <p style={{ fontSize: 14, color: "var(--ink-2)" }}>
              Nog geen reacties. Feedback per agent kan op de agent-pagina&apos;s
              via het <Link href="/scrumbord">scrumbord</Link>.
            </p>
          ) : (
            recentComments.map((c) => (
              <div className="comment" key={c.id}>
                <span className="who">
                  {c.author}
                  <span className="when">
                    {agentById(c.agentId)?.name} · {fmtDateTime(c.createdAt)}
                  </span>
                </span>
                <p>{c.text.length > 140 ? c.text.slice(0, 140) + "…" : c.text}</p>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="notice">
        <strong>Snel naar:</strong>{" "}
        <Link href="/roadmap">Roadmap</Link> · <Link href="/scrumbord">Scrumbord</Link> ·{" "}
        <Link href="/documenten">Documenten</Link> · <Link href="/sla">SLA &amp; Beheer</Link>
      </div>
    </>
  );
}
