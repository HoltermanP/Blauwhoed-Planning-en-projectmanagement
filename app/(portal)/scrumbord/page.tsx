import Link from "next/link";
import { AGENTS, COLUMNS } from "@/lib/content";
import { fmtShort } from "@/lib/dates";
import { getState } from "@/lib/store";
import { RiskBadge } from "@/components/ui";
import PageHeader from "@/components/PageHeader";
import { AgentIcon } from "@/components/art";
import { currentRole } from "@/lib/auth";
import { moveEpic } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function Scrumbord() {
  const state = await getState();
  const role = await currentRole();
  const isAdmin = role === "admin";
  const order = COLUMNS.map((c) => c.key);

  return (
    <>
      <PageHeader
        title="Scrumbord"
        intro="Zeven epics — zes agents en de Academy — van backlog tot live. AI-Group werkt hier met taken per epic; klik op een epic voor detail, taken en feedback. Reacties en vragen zijn altijd welkom."
        image="/img/harmonie.jpg"
      />

      <div className="kanban">
        {COLUMNS.map((col) => {
          const items = AGENTS.filter((a) => state.epics[a.id].column === col.key);
          return (
            <div className="kanban-col" key={col.key}>
              <h3>{col.label} · {items.length}</h3>
              <div className="hint">{col.hint}</div>
              {items.map((a) => {
                const epic = state.epics[a.id];
                const tasks = state.tasks.filter((t) => t.agentId === a.id);
                const done = tasks.filter((t) => t.done).length;
                const comments = state.comments.filter((c) => c.agentId === a.id).length;
                const idx = order.indexOf(epic.column);
                return (
                  <div className="kanban-card" key={a.id}>
                    <div className="cardhead">
                      <AgentIcon id={a.id} size={18} />
                      <span className="name">
                        <Link href={`/agents/${a.id}`}>{a.name}</Link>
                      </span>
                    </div>
                    <div className="meta">{a.description}</div>
                    <RiskBadge risk={epic.risk} />
                    {epic.note && (
                      <div style={{ fontSize: 12, color: "var(--warning-text)", marginTop: 6 }}>
                        ▲ {epic.note}
                      </div>
                    )}
                    {tasks.length > 0 && (
                      <div className="taskline">
                        {done}/{tasks.length} taken afgerond
                        <div className="progress progress-sm">
                          <div style={{ width: `${Math.round((done / tasks.length) * 100)}%` }} />
                        </div>
                      </div>
                    )}
                    <div className="deadline">
                      {a.milestone.label}: {fmtShort(a.milestone.date)}
                      {comments > 0 && <> · 💬 {comments}</>}
                    </div>
                    {isAdmin && (
                      <div className="kanban-move">
                        <form action={moveEpic} style={{ flex: 1, display: "flex" }}>
                          <input type="hidden" name="agentId" value={a.id} />
                          <input type="hidden" name="dir" value="-1" />
                          <button type="submit" disabled={idx === 0} title="Kolom terug" style={{ flex: 1 }}>
                            ←
                          </button>
                        </form>
                        <form action={moveEpic} style={{ flex: 1, display: "flex" }}>
                          <input type="hidden" name="agentId" value={a.id} />
                          <input type="hidden" name="dir" value="1" />
                          <button type="submit" disabled={idx === order.length - 1} title="Kolom vooruit" style={{ flex: 1 }}>
                            →
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </>
  );
}
