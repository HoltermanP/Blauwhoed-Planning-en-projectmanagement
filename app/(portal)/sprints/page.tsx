import { AGENTS, SPRINTS, activeSprint, sprintById } from "@/lib/content";
import { fmtShort, todayISO } from "@/lib/dates";
import { getState, saveState, type PortalState } from "@/lib/store";
import PageHeader from "@/components/PageHeader";
import SprintPlanner from "@/components/SprintPlanner";
import { currentRole } from "@/lib/auth";
import { addStory } from "@/app/actions";

export const dynamic = "force-dynamic";

/**
 * Sprintwissel: is een sprint voorbij, dan wordt het bord leeggemaakt —
 * afgeronde stories blijven bij hun sprint (historie), niet-afgeronde stories
 * schuiven automatisch door naar de actieve sprint.
 */
async function loadStateWithCarryOver(): Promise<PortalState> {
  const state = await getState();
  const today = todayISO();
  const active = activeSprint(today);
  let changed = false;
  for (const story of state.stories) {
    if (!story.sprintId || story.status === "done") continue;
    const sp = sprintById(story.sprintId);
    if (sp && sp.end < today && sp.id !== active.id) {
      story.sprintId = active.id;
      changed = true;
    }
  }
  if (changed) await saveState(state);
  return state;
}

export default async function Sprints({
  searchParams,
}: {
  searchParams: Promise<{ sprint?: string }>;
}) {
  const { sprint: focusId } = await searchParams;
  const state = await loadStateWithCarryOver();
  const role = await currentRole();
  const isAdmin = role === "admin";
  const today = todayISO();
  const active = activeSprint(today);
  const backlogCount = state.stories.filter((s) => !s.sprintId).length;

  return (
    <>
      <PageHeader
        title="Sprintplanning"
        intro="We werken in sprints van twee weken aan het platform-fundament, de agents en de Academy. Elke sprint start met een leeg bord: bij de sprintplanning slepen we user stories vanuit de backlog naar de sprint. Loopt een sprint af, dan schuiven niet-afgeronde stories automatisch door naar de nieuwe sprint — afgeronde werk blijft bewaard bij zijn sprint."
        image="/img/erven.jpg"
      >
        <div className="hero-chips">
          <span className="hero-chip">
            {active.naam} · {fmtShort(active.start)} – {fmtShort(active.end)}
          </span>
          <span className="hero-chip">{backlogCount} stories in backlog</span>
        </div>
      </PageHeader>

      <SprintPlanner
        sprints={SPRINTS}
        activeId={active.id}
        initialSprintId={focusId}
        epics={AGENTS.map((a) => ({ id: a.id, name: a.name }))}
        stories={state.stories}
        isAdmin={isAdmin}
        todayIso={today}
      />

      {isAdmin && (
        <div className="card" style={{ marginTop: 18 }}>
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
    </>
  );
}
