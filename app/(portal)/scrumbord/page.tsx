import Link from "next/link";
import { AGENTS, COLUMNS } from "@/lib/content";
import { fmtShort } from "@/lib/dates";
import { getState, type PortalState } from "@/lib/store";
import { RiskBadge } from "@/components/ui";
import PageHeader from "@/components/PageHeader";
import { AgentIcon } from "@/components/art";
import { currentRole } from "@/lib/auth";
import { moveEpic } from "@/app/actions";
import type { Agent } from "@/lib/content";

export const dynamic = "force-dynamic";

function EpicCard({
  agent,
  state,
  isAdmin,
}: {
  agent: Agent;
  state: PortalState;
  isAdmin: boolean;
}) {
  const epic = state.epics[agent.id];
  const tasks = state.tasks.filter((t) => t.agentId === agent.id);
  const done = tasks.filter((t) => t.done).length;
  const comments = state.comments.filter((c) => c.agentId === agent.id).length;
  const order = COLUMNS.map((c) => c.key);
  const idx = order.indexOf(epic.column);

  return (
    <div className="kanban-card">
      <div className="cardhead">
        <AgentIcon id={agent.id} size={18} />
        <span className="name">
          <Link href={`/agents/${agent.id}`}>{agent.name}</Link>
        </span>
      </div>
      <div className="meta">{agent.description}</div>
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
        {agent.milestone.label}: {fmtShort(agent.milestone.date)}
        {comments > 0 && <> · 💬 {comments}</>}
      </div>
      {isAdmin && (
        <div className="kanban-move">
          <form action={moveEpic} style={{ flex: 1, display: "flex" }}>
            <input type="hidden" name="agentId" value={agent.id} />
            <input type="hidden" name="dir" value="-1" />
            <button type="submit" disabled={idx === 0} title="Kolom terug" style={{ flex: 1 }}>
              ←
            </button>
          </form>
          <form action={moveEpic} style={{ flex: 1, display: "flex" }}>
            <input type="hidden" name="agentId" value={agent.id} />
            <input type="hidden" name="dir" value="1" />
            <button type="submit" disabled={idx === order.length - 1} title="Kolom vooruit" style={{ flex: 1 }}>
              →
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default async function Scrumbord() {
  const state = await getState();
  const role = await currentRole();
  const isAdmin = role === "admin";

  return (
    <>
      <PageHeader
        title="Scrumbord"
        intro="Acht epics — het platform-fundament, zes agents en de Academy — van backlog tot live. AI-Group werkt hier met taken per epic; klik op een epic voor detail, taken en feedback. Reacties en vragen zijn altijd welkom."
        image="/img/harmonie.jpg"
      />

      {/* Desktop: klassiek bord met 6 kolommen naast elkaar */}
      <div className="kanban desktop-only">
        {COLUMNS.map((col) => {
          const items = AGENTS.filter((a) => state.epics[a.id].column === col.key);
          return (
            <div className="kanban-col" key={col.key}>
              <h3>{col.label} · {items.length}</h3>
              <div className="hint">{col.hint}</div>
              {items.map((a) => (
                <EpicCard key={a.id} agent={a} state={state} isAdmin={isAdmin} />
              ))}
            </div>
          );
        })}
      </div>

      {/* Mobiel: kolommen onder elkaar, inklapbaar; lege kolommen dichtgeklapt */}
      <div className="mobile-only kanban-stack">
        {COLUMNS.map((col) => {
          const items = AGENTS.filter((a) => state.epics[a.id].column === col.key);
          return (
            <details className="kb-sec" key={col.key} open={items.length > 0}>
              <summary>
                <span>{col.label}</span>
                <span className="cnt">{items.length}</span>
              </summary>
              <div className="kb-body">
                <div className="hint">{col.hint}</div>
                {items.map((a) => (
                  <EpicCard key={a.id} agent={a} state={state} isAdmin={isAdmin} />
                ))}
              </div>
            </details>
          );
        })}
      </div>
    </>
  );
}
