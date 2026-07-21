import { AGENTS, SPRINTS, activeSprint, agentById } from "@/lib/content";
import { fmtShort, todayISO } from "@/lib/dates";
import { getState, type Story } from "@/lib/store";
import PageHeader from "@/components/PageHeader";
import { AgentIcon } from "@/components/art";
import { currentRole } from "@/lib/auth";
import { addStory, deleteStory, planStory, setStoryStatus } from "@/app/actions";

export const dynamic = "force-dynamic";

const STATUS_COLS: { key: Story["status"]; label: string }[] = [
  { key: "todo", label: "Te doen" },
  { key: "doing", label: "In uitvoering" },
  { key: "done", label: "Klaar" },
];

function StoryCard({ story, isAdmin }: { story: Story; isAdmin: boolean }) {
  const epic = agentById(story.agentId);
  return (
    <div className="kanban-card">
      <div className="cardhead">
        <AgentIcon id={story.agentId} size={16} />
        <span className="story-epic">{epic?.name.replace("-agent", "")}</span>
        {story.points && <span className="points">{story.points} pt</span>}
      </div>
      <div className="story-title">{story.title}</div>
      {isAdmin && (
        <div className="story-controls">
          <form action={setStoryStatus}>
            <input type="hidden" name="storyId" value={story.id} />
            <select name="status" defaultValue={story.status}>
              <option value="todo">Te doen</option>
              <option value="doing">In uitvoering</option>
              <option value="done">Klaar</option>
            </select>
            <button className="btn btn-secondary" type="submit">OK</button>
          </form>
          <form action={planStory}>
            <input type="hidden" name="storyId" value={story.id} />
            <input type="hidden" name="sprintId" value="backlog" />
            <button className="btn btn-secondary" type="submit">→ backlog</button>
          </form>
        </div>
      )}
    </div>
  );
}

function SprintBoard({ stories, isAdmin }: { stories: Story[]; isAdmin: boolean }) {
  if (stories.length === 0) {
    return (
      <p style={{ fontSize: 14, color: "var(--ink-2)" }}>
        Nog geen user stories ingepland — kies ze hieronder in de backlog.
      </p>
    );
  }
  return (
    <div className="grid-3" style={{ alignItems: "start" }}>
      {STATUS_COLS.map((col) => {
        const items = stories.filter((s) => s.status === col.key);
        return (
          <div className="kanban-col" key={col.key}>
            <h3>{col.label} · {items.length}</h3>
            <div className="hint" />
            {items.map((s) => (
              <StoryCard key={s.id} story={s} isAdmin={isAdmin} />
            ))}
          </div>
        );
      })}
    </div>
  );
}

export default async function Sprints() {
  const state = await getState();
  const role = await currentRole();
  const isAdmin = role === "admin";
  const today = todayISO();
  const active = activeSprint(today);

  const inSprint = (sprintId: string) => state.stories.filter((s) => s.sprintId === sprintId);
  const backlog = state.stories.filter((s) => !s.sprintId);
  const points = (list: Story[]) => list.reduce((sum, s) => sum + (s.points ?? 0), 0);

  const activeStories = inSprint(active.id);
  const otherSprints = SPRINTS.filter((s) => s.id !== active.id);

  return (
    <>
      <PageHeader
        title="Sprintplanning"
        intro="We werken in sprints van twee weken. Per sprintplanning kiezen we samen welke user stories van de backlog naar de sprint gaan; afgeronde sprints blijven bewaard zodat de historie zichtbaar is."
        image="/img/erven.jpg"
      >
        <div className="hero-chips">
          <span className="hero-chip">
            {active.naam} · {fmtShort(active.start)} – {fmtShort(active.end)}
          </span>
          <span className="hero-chip">{backlog.length} stories in backlog</span>
        </div>
      </PageHeader>

      <h2>
        {active.naam} — actieve sprint ({fmtShort(active.start)} – {fmtShort(active.end)})
      </h2>
      <p className="sub" style={{ marginBottom: 12 }}>
        Sprintdoel: {active.doel}
        {activeStories.length > 0 && (
          <> · {points(activeStories.filter((s) => s.status === "done"))}/{points(activeStories)} punten klaar</>
        )}
      </p>
      <SprintBoard stories={activeStories} isAdmin={isAdmin} />

      <h2>Backlog per epic</h2>
      <p className="sub" style={{ marginBottom: 12 }}>
        {isAdmin
          ? "Plan stories in een sprint met de selectie per story, of voeg nieuwe stories toe."
          : "Deze user stories staan klaar om in een sprint te worden gepland. Mis je iets? Laat het weten via de feedback op de agent-pagina's."}
      </p>
      {AGENTS.map((a) => {
        const items = backlog.filter((s) => s.agentId === a.id);
        return (
          <details className="kb-sec" key={a.id} open={items.length > 0} style={{ marginBottom: 10 }}>
            <summary>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <AgentIcon id={a.id} size={16} />
                {a.name}
              </span>
              <span className="cnt">{items.length}</span>
            </summary>
            <div className="kb-body">
              {items.length === 0 && (
                <p style={{ fontSize: 13, color: "var(--muted)" }}>Geen open stories in de backlog.</p>
              )}
              {items.map((s) => (
                <div className="story" key={s.id}>
                  <div className="story-title">
                    {s.title}
                    {s.points && <span className="points" style={{ marginLeft: 8 }}>{s.points} pt</span>}
                  </div>
                  {isAdmin && (
                    <div className="story-controls">
                      <form action={planStory}>
                        <input type="hidden" name="storyId" value={s.id} />
                        <select name="sprintId" defaultValue={active.id}>
                          {SPRINTS.map((sp) => (
                            <option key={sp.id} value={sp.id}>
                              {sp.naam} ({fmtShort(sp.start)} – {fmtShort(sp.end)})
                            </option>
                          ))}
                        </select>
                        <button className="btn" type="submit">Plan in</button>
                      </form>
                      <form action={deleteStory}>
                        <input type="hidden" name="storyId" value={s.id} />
                        <button className="task-del" type="submit" title="Story verwijderen">×</button>
                      </form>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </details>
        );
      })}

      {isAdmin && (
        <div className="card" style={{ marginTop: 14 }}>
          <h2 style={{ marginTop: 0 }}>Nieuwe user story</h2>
          <form action={addStory}>
            <div className="grid-2">
              <div>
                <label htmlFor="story-epic">Epic</label>
                <select id="story-epic" name="agentId">
                  {AGENTS.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="story-points">Punten (optioneel)</label>
                <input id="story-points" name="points" type="text" inputMode="numeric" placeholder="Bijv. 5" />
              </div>
            </div>
            <label htmlFor="story-title">User story</label>
            <textarea
              id="story-title"
              name="title"
              required
              placeholder="Als [rol] wil ik [functionaliteit] zodat [waarde]…"
              style={{ minHeight: 70 }}
            />
            <button className="btn" type="submit">Toevoegen aan backlog</button>
          </form>
        </div>
      )}

      <h2>Alle sprints</h2>
      <p className="sub" style={{ marginBottom: 12 }}>
        Iedere sprint blijft bewaard — zo bouwen we een zichtbare historie op van wat
        wanneer is opgepakt en afgerond.
      </p>
      {otherSprints.map((sp) => {
        const items = inSprint(sp.id);
        const done = items.filter((s) => s.status === "done");
        const past = today > sp.end;
        return (
          <details className="kb-sec" key={sp.id} style={{ marginBottom: 10 }}>
            <summary>
              <span>
                {sp.naam} · {fmtShort(sp.start)} – {fmtShort(sp.end)}
                {past && " · afgerond"}
              </span>
              <span className="cnt">
                {items.length > 0 ? `${done.length}/${items.length} klaar` : "leeg"}
              </span>
            </summary>
            <div className="kb-body">
              <p style={{ fontSize: 13, color: "var(--ink-2)", marginBottom: 10 }}>
                Sprintdoel: {sp.doel}
              </p>
              <SprintBoard stories={items} isAdmin={isAdmin} />
            </div>
          </details>
        );
      })}
    </>
  );
}
