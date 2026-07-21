import Link from "next/link";
import { AGENTS, PROJECT, SPRINTS, agentById } from "@/lib/content";
import { daysBetween, fmt, fmtShort, todayISO } from "@/lib/dates";
import { getState } from "@/lib/store";
import { RiskBadge } from "@/components/ui";
import PageHeader from "@/components/PageHeader";
import { AgentIcon } from "@/components/art";

export const dynamic = "force-dynamic";

const T0 = PROJECT.bouwStart;
const T1 = "2026-10-20"; // as rechts iets voorbij oplevering
const TOTAL = daysBetween(T0, T1);

function leftPct(iso: string): number {
  return (daysBetween(T0, iso) / TOTAL) * 100;
}
function widthPct(start: string, end: string): number {
  return ((daysBetween(start, end) + 1) / TOTAL) * 100;
}

const PHASE_COLOR: Record<string, string> = {
  design: "var(--phase-design)",
  build: "var(--phase-build)",
  test: "var(--phase-test)",
  deploy: "var(--phase-deploy)",
};

const MONTH_MARKS = [
  { iso: "2026-08-01", label: "augustus" },
  { iso: "2026-09-01", label: "september" },
  { iso: "2026-10-01", label: "oktober" },
];

export default async function Roadmap() {
  const state = await getState();
  const today = todayISO();
  const todayLeft = leftPct(today);

  return (
    <>
      <PageHeader
        title="Roadmap"
        intro={`Bouwfase ${fmt(PROJECT.bouwStart)} – ${fmt(PROJECT.bouwEind)} · Oplevering ter Acceptatie op 19 oktober · Beheerfase vanaf ${fmt(PROJECT.beheerStart)}.`}
        image="/img/casavita.jpg"
      />

      {/* Desktop: Gantt */}
      <div className="card desktop-only">
        <div className="gantt">
          <div className="gantt-inner">
          <div className="gantt-months">
            <span>juli</span>
            {MONTH_MARKS.map((m) => (
              <span key={m.iso} style={{ position: "absolute", left: `${leftPct(m.iso)}%` }}>
                {m.label}
              </span>
            ))}
          </div>

          <div className="gantt-row gantt-sprintrow">
            <div className="gantt-label">
              <Link href="/sprints">Sprints</Link>
            </div>
            <div className="gantt-track">
              {SPRINTS.map((sp, i) => (
                <Link
                  key={sp.id}
                  href="/sprints"
                  className={`gantt-sprint${i % 2 ? " alt" : ""}`}
                  style={{
                    left: `${leftPct(sp.start)}%`,
                    width: `${widthPct(sp.start, sp.end)}%`,
                  }}
                  title={`${sp.naam}: ${fmtShort(sp.start)} – ${fmtShort(sp.end)} — ${sp.doel}`}
                >
                  S{i + 1}
                </Link>
              ))}
              {todayLeft >= 0 && todayLeft <= 100 && (
                <div className="gantt-today" style={{ left: `${todayLeft}%` }} />
              )}
            </div>
          </div>

          {AGENTS.map((a) => (
            <div className="gantt-row" key={a.id}>
              <div className="gantt-label">
                <AgentIcon id={a.id} size={17} />
                <Link href={`/agents/${a.id}`}>{a.name}</Link>
              </div>
              <div className="gantt-track">
                {MONTH_MARKS.map((m) => (
                  <div key={m.iso} className="gantt-gridline" style={{ left: `${leftPct(m.iso)}%` }} />
                ))}
                {todayLeft >= 0 && todayLeft <= 100 && (
                  <div className="gantt-today" style={{ left: `${todayLeft}%` }} />
                )}
                {a.phases.map((p) => (
                  <div
                    key={p.label}
                    className="gantt-bar"
                    style={{
                      left: `${leftPct(p.start)}%`,
                      width: `${Math.max(widthPct(p.start, p.end), 1.2)}%`,
                      background: PHASE_COLOR[p.kind],
                    }}
                    title={`${p.label}: ${fmtShort(p.start)} – ${fmtShort(p.end)}`}
                  >
                    {widthPct(p.start, p.end) > 9 ? p.label : ""}
                  </div>
                ))}
                <div
                  className="gantt-milestone"
                  style={{ left: `calc(${leftPct(a.milestone.date)}% - 6px)` }}
                  title={`${a.milestone.label}: ${fmt(a.milestone.date)}`}
                />
              </div>
            </div>
          ))}
          </div>
        </div>

        <div className="gantt-legend">
          <span><span className="chip" style={{ background: "var(--phase-design)" }} />Design</span>
          <span><span className="chip" style={{ background: "var(--phase-build)" }} />Build / Data verzamelen</span>
          <span><span className="chip" style={{ background: "var(--phase-test)" }} />Test / UAT / Integratie</span>
          <span><span className="chip" style={{ background: "var(--phase-deploy)" }} />Deploy</span>
          <span><span className="chip" style={{ background: "var(--ink)", transform: "rotate(45deg)", width: 10, height: 10 }} />Milestone (Live)</span>
          <span><span className="chip" style={{ background: "var(--status-critical)", width: 3 }} />Vandaag</span>
        </div>
      </div>

      {/* Mobiel: sprints + fasen-tijdlijn per agent */}
      <div className="mobile-only agent-cardlist">
        <div className="arow">
          <div className="top">
            <Link href="/sprints">Sprints (2 weken)</Link>
          </div>
          <div style={{ marginTop: 8 }}>
            {SPRINTS.map((sp) => {
              const isActive = today >= sp.start && today <= sp.end;
              return (
                <div className={`phase-row${isActive ? " phase-active" : today > sp.end ? " phase-done" : " phase-planned"}`} key={sp.id}>
                  <span className="phase-name">{sp.naam}</span>
                  <span className="phase-dates">
                    {fmtShort(sp.start)} – {fmtShort(sp.end)}
                    {isActive && " · actief"}
                    {today > sp.end && " · ✓"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        {AGENTS.map((a) => (
          <div className="arow" key={a.id}>
            <div className="top">
              <Link href={`/agents/${a.id}`}>
                <AgentIcon id={a.id} size={17} />
                {a.name}
              </Link>
              <RiskBadge risk={state.epics[a.id].risk} />
            </div>
            <div style={{ marginTop: 8 }}>
              {a.phases.map((p) => {
                const status = today > p.end ? "done" : today >= p.start ? "active" : "planned";
                return (
                  <div className={`phase-row phase-${status}`} key={p.label}>
                    <span className="phase-name">
                      <span className="phase-dot" style={{ background: PHASE_COLOR[p.kind] }} />
                      {p.label}
                    </span>
                    <span className="phase-dates">
                      {fmtShort(p.start)}{p.start !== p.end && <> – {fmtShort(p.end)}</>}
                      {status === "done" && " · ✓"}
                      {status === "active" && " · actief"}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="meta">◆ {a.milestone.label}: {fmt(a.milestone.date)}</div>
          </div>
        ))}
      </div>

      <h2>Milestones &amp; status</h2>

      {/* Desktop: tabel */}
      <div className="card table-wrap desktop-only" style={{ padding: 0 }}>
        <table>
          <thead>
            <tr>
              <th>Agent</th>
              <th>Milestone</th>
              <th>Datum</th>
              <th>Status</th>
              <th>Afhankelijk van</th>
            </tr>
          </thead>
          <tbody>
            {AGENTS.map((a) => (
              <tr key={a.id}>
                <td><Link href={`/agents/${a.id}`}>{a.name}</Link></td>
                <td>{a.milestone.label}</td>
                <td>{fmt(a.milestone.date)}</td>
                <td><RiskBadge risk={state.epics[a.id].risk} /></td>
                <td style={{ fontSize: 13, color: "var(--ink-2)" }}>
                  {a.dependencies.length
                    ? a.dependencies.map((d) => agentById(d)?.name.replace("-agent", "")).join(", ")
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobiel: gestapelde kaartjes */}
      <div className="mobile-only agent-cardlist">
        {AGENTS.map((a) => (
          <div className="arow" key={a.id}>
            <div className="top">
              <Link href={`/agents/${a.id}`}>
                <AgentIcon id={a.id} size={17} />
                {a.name}
              </Link>
              <RiskBadge risk={state.epics[a.id].risk} />
            </div>
            <div className="meta">
              ◆ {a.milestone.label}: {fmt(a.milestone.date)}
              {a.dependencies.length > 0 && (
                <> · afhankelijk van {a.dependencies.map((d) => agentById(d)?.name.replace("-agent", "")).join(", ")}</>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="notice">
        De <strong>Learning-agent</strong> verzamelt vanaf dag één data uit alle andere
        agents en integreert als laatste — die volgorde is een bewuste afhankelijkheid.
        Oplevering ter Acceptatie (19 oktober) omvat alle agents, de Academy, inrichting
        en training.
      </div>
    </>
  );
}
