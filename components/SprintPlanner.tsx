"use client";

import { useEffect, useState } from "react";
import { moveStoryTo, deleteStoryById } from "@/app/actions";
import { AgentIcon } from "./art";
import { fmtShort } from "@/lib/dates";
import type { Story, StoryStatus } from "@/lib/store";
import type { Sprint } from "@/lib/content";

interface EpicRef {
  id: string;
  name: string;
}

const STATUS_COLS: { key: StoryStatus; label: string }[] = [
  { key: "todo", label: "Te doen" },
  { key: "doing", label: "In uitvoering" },
  { key: "done", label: "Klaar" },
];

export default function SprintPlanner({
  sprints,
  activeId,
  initialSprintId,
  epics,
  stories: initialStories,
  isAdmin,
  todayIso,
}: {
  sprints: Sprint[];
  activeId: string;
  initialSprintId?: string;
  epics: EpicRef[];
  stories: Story[];
  isAdmin: boolean;
  todayIso: string;
}) {
  const [stories, setStories] = useState<Story[]>(initialStories);
  useEffect(() => setStories(initialStories), [initialStories]);

  const [selected, setSelected] = useState(
    sprints.some((s) => s.id === initialSprintId) ? (initialSprintId as string) : activeId
  );
  const [dragId, setDragId] = useState<string | null>(null);
  const [hoverZone, setHoverZone] = useState<string | null>(null);

  const sprint = sprints.find((s) => s.id === selected)!;
  const backlog = stories.filter((s) => !s.sprintId);
  const inSprint = stories.filter((s) => s.sprintId === selected);
  const epicName = (id: string) =>
    (epics.find((e) => e.id === id)?.name ?? id).replace("-agent", "");
  const points = (list: Story[]) => list.reduce((sum, s) => sum + (s.points ?? 0), 0);

  const sprintTense = (sp: Sprint) =>
    todayIso > sp.end ? "afgerond" : todayIso >= sp.start ? "actief" : "gepland";

  function apply(storyId: string, sprintId: string | null, status: StoryStatus) {
    setStories((prev) =>
      prev.map((s) =>
        s.id === storyId ? { ...s, sprintId, status: sprintId === null ? "todo" : status } : s
      )
    );
    void moveStoryTo(storyId, sprintId, status);
  }

  function remove(storyId: string) {
    setStories((prev) => prev.filter((s) => s.id !== storyId));
    void deleteStoryById(storyId);
  }

  function dropOn(zone: "backlog" | StoryStatus) {
    if (!dragId) return;
    if (zone === "backlog") apply(dragId, null, "todo");
    else apply(dragId, selected, zone);
    setDragId(null);
    setHoverZone(null);
  }

  const zoneProps = (zone: string, onDrop: () => void) =>
    isAdmin
      ? {
          onDragOver: (e: React.DragEvent) => {
            e.preventDefault();
            if (hoverZone !== zone) setHoverZone(zone);
          },
          onDragLeave: (e: React.DragEvent) => {
            if (e.currentTarget === e.target) setHoverZone(null);
          },
          onDrop: (e: React.DragEvent) => {
            e.preventDefault();
            onDrop();
          },
        }
      : {};

  function StoryCard({ story, inBacklog }: { story: Story; inBacklog: boolean }) {
    return (
      <div
        className={`kanban-card story-card${dragId === story.id ? " dragging" : ""}${isAdmin ? " grabbable" : ""}`}
        draggable={isAdmin}
        onDragStart={(e) => {
          e.dataTransfer.setData("text/plain", story.id);
          e.dataTransfer.effectAllowed = "move";
          setDragId(story.id);
        }}
        onDragEnd={() => {
          setDragId(null);
          setHoverZone(null);
        }}
      >
        <div className="cardhead">
          <AgentIcon id={story.agentId} size={15} />
          <span className="story-epic">{epicName(story.agentId)}</span>
          {story.points ? <span className="points">{story.points} pt</span> : null}
        </div>
        <div className="story-title">{story.title}</div>
        {isAdmin && (
          <div className="story-actions">
            {inBacklog ? (
              <>
                <button className="mini-btn" onClick={() => apply(story.id, selected, "todo")}>
                  + {sprint.naam}
                </button>
                <button className="mini-btn danger" title="Story verwijderen" onClick={() => remove(story.id)}>
                  ×
                </button>
              </>
            ) : (
              <>
                {STATUS_COLS.filter((c) => c.key !== story.status).map((c) => (
                  <button key={c.key} className="mini-btn touch-only" onClick={() => apply(story.id, selected, c.key)}>
                    → {c.label}
                  </button>
                ))}
                <button className="mini-btn" onClick={() => apply(story.id, null, "todo")}>
                  ↩ backlog
                </button>
              </>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="planner-tabs">
        {sprints.map((sp) => {
          const n = stories.filter((s) => s.sprintId === sp.id).length;
          return (
            <button
              key={sp.id}
              className={`planner-tab${sp.id === selected ? " sel" : ""}`}
              onClick={() => setSelected(sp.id)}
            >
              {sp.naam}
              {sp.id === activeId && " ●"}
              <span className="mini">
                {fmtShort(sp.start)} – {fmtShort(sp.end)}{n > 0 && ` · ${n}`}
              </span>
            </button>
          );
        })}
      </div>

      <div className="card planner-info">
        <strong>{sprint.naam}</strong> ({fmtShort(sprint.start)} – {fmtShort(sprint.end)}) ·{" "}
        <span className={`sprint-state sprint-${sprintTense(sprint)}`}>{sprintTense(sprint)}</span>
        <span style={{ color: "var(--ink-2)" }}> — {sprint.doel}</span>
        {inSprint.length > 0 && (
          <span style={{ color: "var(--ink-2)" }}>
            {" "}· {points(inSprint.filter((s) => s.status === "done"))}/{points(inSprint)} punten klaar
          </span>
        )}
      </div>

      <div className="planner-grid">
        <div
          className={`kanban-col planner-backlog${hoverZone === "backlog" ? " drop-hover" : ""}`}
          {...zoneProps("backlog", () => dropOn("backlog"))}
        >
          <h3>Backlog · {backlog.length}</h3>
          <div className="hint">
            {isAdmin ? "Sleep stories naar het bord, of gebruik de knop op een kaart." : "Nog niet ingeplande user stories, per epic."}
          </div>
          {epics.map((e) => {
            const items = backlog.filter((s) => s.agentId === e.id);
            if (items.length === 0) return null;
            return (
              <div key={e.id} className="epic-group">
                <h4>
                  <AgentIcon id={e.id} size={14} /> {e.name} · {items.length}
                </h4>
                {items.map((s) => (
                  <StoryCard key={s.id} story={s} inBacklog />
                ))}
              </div>
            );
          })}
          {backlog.length === 0 && (
            <p style={{ fontSize: 13, color: "var(--muted)" }}>
              De backlog is leeg — voeg hieronder nieuwe user stories toe.
            </p>
          )}
        </div>

        {STATUS_COLS.map((col) => {
          const items = inSprint.filter((s) => s.status === col.key);
          return (
            <div
              key={col.key}
              className={`kanban-col${hoverZone === col.key ? " drop-hover" : ""}`}
              {...zoneProps(col.key, () => dropOn(col.key))}
            >
              <h3>
                {col.label} · {items.length}
                {points(items) > 0 && <span className="colpts">{points(items)} pt</span>}
              </h3>
              <div className="hint" />
              {items.map((s) => (
                <StoryCard key={s.id} story={s} inBacklog={false} />
              ))}
              {items.length === 0 && col.key === "todo" && inSprint.length === 0 && (
                <p style={{ fontSize: 12.5, color: "var(--muted)" }}>
                  {isAdmin
                    ? "Leeg bord — sleep user stories vanuit de backlog hierheen."
                    : "Nog geen stories ingepland voor deze sprint."}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
