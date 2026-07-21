import Link from "next/link";
import { notFound } from "next/navigation";
import { COLUMNS, RISK_META, agentById } from "@/lib/content";
import { fmt, fmtDateTime, todayISO } from "@/lib/dates";
import { getState } from "@/lib/store";
import { RiskBadge } from "@/components/ui";
import { AgentIcon } from "@/components/art";
import PageHeader from "@/components/PageHeader";
import { AGENTS } from "@/lib/content";
import { currentRole } from "@/lib/auth";
import { addComment, addTask, deleteTask, toggleTask, updateEpic } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function AgentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const agent = agentById(id);
  if (!agent) notFound();

  const state = await getState();
  const role = await currentRole();
  const isAdmin = role === "admin";
  const epic = state.epics[agent.id];
  const comments = state.comments.filter((c) => c.agentId === agent.id);
  const tasks = state.tasks.filter((t) => t.agentId === agent.id);
  const doneCount = tasks.filter((t) => t.done).length;
  const today = todayISO();
  const column = COLUMNS.find((c) => c.key === epic.column);

  const HERO_IMAGES = ["/img/harmonie.jpg", "/img/casavita.jpg", "/img/erven.jpg", "/img/hero-film.jpg"];
  const heroImage = HERO_IMAGES[AGENTS.findIndex((a) => a.id === agent.id) % HERO_IMAGES.length];

  return (
    <>
      <p style={{ fontSize: 13, marginBottom: 8 }}>
        <Link href="/scrumbord">← Scrumbord</Link>
      </p>
      <PageHeader title={agent.name} intro={agent.description} image={heroImage}>
        <div className="hero-chips" style={{ marginTop: 12 }}>
          <span className="hero-chip" style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
            <AgentIcon id={agent.id} size={15} /> Epic
          </span>
          <span className="hero-chip">{agent.milestone.label}: {fmt(agent.milestone.date)}</span>
        </div>
      </PageHeader>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 18 }}>
        <RiskBadge risk={epic.risk} />
        <span className="badge badge-neutral">Fase: {column?.label}</span>
        <span className="badge badge-neutral">Eigenaar: {agent.owner}</span>
      </div>

      {epic.note && (
        <div className="error-box">
          <strong>Actuele notitie AI-Group:</strong> {epic.note}
        </div>
      )}

      <div className="grid-2">
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Planning</h2>
          <table>
            <thead>
              <tr><th>Fase</th><th>Periode</th><th>Status</th></tr>
            </thead>
            <tbody>
              {agent.phases.map((p) => {
                const status = today > p.end ? "Afgerond" : today >= p.start ? "Actief" : "Gepland";
                return (
                  <tr key={p.label}>
                    <td><strong>{p.label}</strong></td>
                    <td>{fmt(p.start)}{p.start !== p.end && <> – {fmt(p.end)}</>}</td>
                    <td style={{ color: status === "Actief" ? "var(--brand-ink)" : "var(--ink-2)" }}>{status}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {agent.dependencies.length > 0 && (
            <p style={{ fontSize: 13, color: "var(--ink-2)", marginTop: 12 }}>
              Afhankelijk van:{" "}
              {agent.dependencies.map((d, i) => (
                <span key={d}>
                  {i > 0 && ", "}
                  <Link href={`/agents/${d}`}>{agentById(d)?.name}</Link>
                </span>
              ))}
            </p>
          )}
        </div>

        <div className="card">
          <h2 style={{ marginTop: 0 }}>Success criteria — definitie van &lsquo;af&rsquo;</h2>
          <ul style={{ paddingLeft: 20, fontSize: 14, color: "var(--ink-2)", display: "grid", gap: 8 }}>
            {agent.successCriteria.map((c) => <li key={c}>{c}</li>)}
          </ul>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h2 style={{ marginTop: 0 }}>
          Taken ({doneCount}/{tasks.length})
        </h2>
        {tasks.length > 0 && (
          <div className="progress progress-sm" style={{ marginBottom: 10 }}>
            <div style={{ width: `${tasks.length ? Math.round((doneCount / tasks.length) * 100) : 0}%` }} />
          </div>
        )}
        {tasks.length === 0 && (
          <p style={{ fontSize: 14, color: "var(--ink-2)" }}>Nog geen taken voor deze epic.</p>
        )}
        {tasks.map((t) => (
          <div className="task" key={t.id}>
            {isAdmin ? (
              <form action={toggleTask} style={{ display: "inline-flex" }}>
                <input type="hidden" name="taskId" value={t.id} />
                <button
                  type="submit"
                  className={`task-check${t.done ? " done" : ""}`}
                  title={t.done ? "Markeer als open" : "Markeer als afgerond"}
                >
                  {t.done ? "✓" : ""}
                </button>
              </form>
            ) : (
              <span className={`task-check${t.done ? " done" : ""}`} style={{ cursor: "default" }}>
                {t.done ? "✓" : ""}
              </span>
            )}
            <span className={`task-title${t.done ? " done" : ""}`}>{t.title}</span>
            {isAdmin && (
              <form action={deleteTask} style={{ display: "inline-flex" }}>
                <input type="hidden" name="taskId" value={t.id} />
                <button type="submit" className="task-del" title="Taak verwijderen">×</button>
              </form>
            )}
          </div>
        ))}
        {isAdmin && (
          <form action={addTask} className="task-add">
            <input type="hidden" name="agentId" value={agent.id} />
            <input name="title" type="text" required placeholder="Nieuwe taak…" />
            <button className="btn" type="submit">Toevoegen</button>
          </form>
        )}
      </div>

      {isAdmin && (
        <div className="card" style={{ marginTop: 14 }}>
          <h2 style={{ marginTop: 0 }}>Status bijwerken (AI-Group)</h2>
          <form action={updateEpic}>
            <input type="hidden" name="agentId" value={agent.id} />
            <div className="grid-2">
              <div>
                <label htmlFor="column">Kolom</label>
                <select id="column" name="column" defaultValue={epic.column}>
                  {COLUMNS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="risk">Risico</label>
                <select id="risk" name="risk" defaultValue={epic.risk}>
                  {(Object.keys(RISK_META) as (keyof typeof RISK_META)[]).map((r) => (
                    <option key={r} value={r}>{RISK_META[r].label}</option>
                  ))}
                </select>
              </div>
            </div>
            <label htmlFor="note">Notitie / blocker (zichtbaar voor Blauwhoed; leeg = geen)</label>
            <input id="note" name="note" type="text" defaultValue={epic.note} />
            <button className="btn" type="submit">Opslaan</button>
          </form>
        </div>
      )}

      <div className="card" style={{ marginTop: 14 }}>
        <h2 style={{ marginTop: 0 }}>Feedback &amp; vragen ({comments.length})</h2>
        {comments.length === 0 && (
          <p style={{ fontSize: 14, color: "var(--ink-2)" }}>
            Nog geen reacties op deze epic.
          </p>
        )}
        {comments.map((c) => (
          <div className="comment" key={c.id}>
            <span className="who">
              {c.author}
              <span className="when">
                {c.role === "admin" ? "AI-Group" : "Blauwhoed"} · {fmtDateTime(c.createdAt)}
              </span>
            </span>
            <p>{c.text}</p>
          </div>
        ))}
        <form action={addComment} style={{ marginTop: 8, borderTop: "1px solid var(--grid)", paddingTop: 4 }}>
          <input type="hidden" name="agentId" value={agent.id} />
          <label htmlFor="author">Naam</label>
          <input id="author" name="author" type="text" required placeholder="Bijv. Daphne" />
          <label htmlFor="text">Reactie of vraag</label>
          <textarea id="text" name="text" required placeholder="Feedback, vraag of aanvulling op deze agent…" />
          <button className="btn" type="submit">Plaatsen</button>
        </form>
      </div>
    </>
  );
}
