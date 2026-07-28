"use client";

import { useEffect, useRef, useState } from "react";
import { moveStoryTo, deleteStoryById, updateStoryDetails } from "@/app/actions";
import { AgentIcon } from "./art";
import { StoryProgress } from "./ui";
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

type DropZone = "backlog" | StoryStatus;

/**
 * Story-dialoog: bekijken (iedereen) en bewerken incl. toelichting (beheerder).
 * Top-level component zodat de invoer niet verloren gaat bij re-renders van de planner.
 */
function StoryDialog({
  story,
  epicLabel,
  placeLabel,
  isAdmin,
  copied,
  onCopy,
  onSave,
  onClose,
}: {
  story: Story;
  epicLabel: string;
  placeLabel: string;
  isAdmin: boolean;
  copied: boolean;
  onCopy: () => void;
  onSave: (title: string, description: string, pointsRaw: string) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(story.title);
  const [description, setDescription] = useState(story.description ?? "");
  const [pts, setPts] = useState(story.points ? String(story.points) : "");

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal onClick={(e) => e.stopPropagation()}>
        <div className="modal-sub">
          <AgentIcon id={story.agentId} size={14} /> {epicLabel} · {placeLabel}
        </div>
        {isAdmin ? (
          <>
            <label htmlFor="dlg-title">User story</label>
            <textarea
              id="dlg-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ minHeight: 80 }}
            />
            <label htmlFor="dlg-desc">Toelichting (context, acceptatiecriteria)</label>
            <textarea
              id="dlg-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Uitgebreidere toelichting bij deze story…"
              style={{ minHeight: 130 }}
            />
            <label htmlFor="dlg-points">Punten (leeg = geen)</label>
            <input
              id="dlg-points"
              type="text"
              inputMode="numeric"
              value={pts}
              onChange={(e) => setPts(e.target.value)}
              style={{ maxWidth: 120 }}
            />
          </>
        ) : (
          <>
            <h3>{story.title}</h3>
            {story.points ? <p className="modal-sub">{story.points} punten</p> : null}
            {story.description ? (
              <p style={{ whiteSpace: "pre-wrap", fontSize: 14, color: "var(--ink-2)" }}>{story.description}</p>
            ) : (
              <p style={{ fontSize: 13.5, color: "var(--muted)" }}>Geen toelichting bij deze story.</p>
            )}
          </>
        )}
        <div className="modal-actions">
          {isAdmin && (
            <button className="btn" onClick={() => onSave(title, description, pts)}>
              Opslaan
            </button>
          )}
          <button className="mini-btn" onClick={onCopy}>
            {copied ? "✓ gekopieerd" : "⧉ kopieer tekst"}
          </button>
          <button className="mini-btn" onClick={onClose}>
            Sluiten
          </button>
        </div>
      </div>
    </div>
  );
}

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
  // Wijzigingen gaan één voor één naar de server (queue): elke actie herschrijft
  // de volledige state, dus parallelle acties zouden elkaars wijziging kunnen
  // overschrijven en een status terugdraaien. Zolang er acties onderweg zijn is
  // de lokale (optimistische) state leidend en wordt server-state genegeerd.
  const queueRef = useRef<Promise<unknown>>(Promise.resolve());
  const pendingRef = useRef(0);
  useEffect(() => {
    if (pendingRef.current === 0) setStories(initialStories);
  }, [initialStories]);

  function enqueue(fn: () => Promise<unknown>) {
    pendingRef.current++;
    queueRef.current = queueRef.current
      .then(fn)
      .catch(() => {})
      .finally(() => {
        pendingRef.current--;
      });
  }

  const [selected, setSelected] = useState(
    sprints.some((s) => s.id === initialSprintId) ? (initialSprintId as string) : activeId
  );
  const [hoverZone, setHoverZone] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Slepen met pointer events: indrukken en bewegen = direct slepen (geen
  // native HTML5-drag met zijn drempel en grijze snapshot). Een klik zonder
  // beweging opent de story-dialoog. Op touch-apparaten zijn er verplaatsknoppen.
  const [drag, setDrag] = useState<{ id: string; x: number; y: number; w: number } | null>(null);
  const pressRef = useRef<{ id: string; x: number; y: number; w: number } | null>(null);
  const didDragRef = useRef(false);
  const dropRef = useRef<(id: string, zone: DropZone) => void>(() => {});
  dropRef.current = (id, zone) => {
    if (zone === "backlog") apply(id, null, "todo");
    else apply(id, selected, zone);
  };

  useEffect(() => {
    if (!isAdmin) return;
    const zoneAt = (x: number, y: number): DropZone | null => {
      const el = document
        .elementsFromPoint(x, y)
        .find((n): n is HTMLElement => n instanceof HTMLElement && !!n.dataset.dropZone);
      return (el?.dataset.dropZone as DropZone | undefined) ?? null;
    };
    const onMove = (e: PointerEvent) => {
      const press = pressRef.current;
      if (!press) return;
      if (!didDragRef.current && Math.hypot(e.clientX - press.x, e.clientY - press.y) < 5) return;
      didDragRef.current = true;
      setDrag({ id: press.id, x: e.clientX, y: e.clientY, w: press.w });
      setHoverZone(zoneAt(e.clientX, e.clientY));
    };
    const onUp = (e: PointerEvent) => {
      const press = pressRef.current;
      pressRef.current = null;
      if (!press || !didDragRef.current) return;
      const zone = zoneAt(e.clientX, e.clientY);
      setDrag(null);
      setHoverZone(null);
      if (zone) dropRef.current(press.id, zone);
      // Nog even 'gedragd' blijven zodat de click na het loslaten de dialoog niet opent.
      setTimeout(() => {
        didDragRef.current = false;
      }, 0);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [isAdmin]);

  useEffect(() => {
    document.body.classList.toggle("dragging-story", drag !== null);
    return () => document.body.classList.remove("dragging-story");
  }, [drag]);

  const sprint = sprints.find((s) => s.id === selected)!;
  const backlog = stories.filter((s) => !s.sprintId);
  const inSprint = stories.filter((s) => s.sprintId === selected);
  const openStory = stories.find((s) => s.id === openId) ?? null;
  const dragStory = drag ? stories.find((s) => s.id === drag.id) ?? null : null;
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
    enqueue(() => moveStoryTo(storyId, sprintId, status));
  }

  function remove(storyId: string) {
    setStories((prev) => prev.filter((s) => s.id !== storyId));
    if (openId === storyId) setOpenId(null);
    enqueue(() => deleteStoryById(storyId));
  }

  function saveDetails(storyId: string, title: string, description: string, pointsRaw: string) {
    const parsed = Number(pointsRaw);
    const pts = Number.isFinite(parsed) && parsed > 0 ? parsed : null;
    if (!title.trim()) return;
    setStories((prev) =>
      prev.map((s) =>
        s.id === storyId
          ? { ...s, title: title.trim(), description: description.trim() || undefined, points: pts ?? undefined }
          : s
      )
    );
    enqueue(() => updateStoryDetails(storyId, { title, description, points: pts }));
    setOpenId(null);
  }

  function copyStory(story: Story) {
    const text = story.description ? `${story.title}\n\n${story.description}` : story.title;
    void navigator.clipboard.writeText(text).then(() => {
      setCopiedId(story.id);
      setTimeout(() => setCopiedId((cur) => (cur === story.id ? null : cur)), 1600);
    });
  }

  function StoryCard({ story, inBacklog }: { story: Story; inBacklog: boolean }) {
    return (
      <div
        className={`kanban-card story-card${drag?.id === story.id ? " dragging" : ""}${isAdmin ? " grabbable" : ""}`}
        onPointerDown={(e) => {
          if (!isAdmin || e.pointerType !== "mouse" || e.button !== 0) return;
          if ((e.target as HTMLElement).closest(".story-actions")) return;
          didDragRef.current = false;
          pressRef.current = {
            id: story.id,
            x: e.clientX,
            y: e.clientY,
            w: (e.currentTarget as HTMLElement).offsetWidth,
          };
        }}
        onDragStart={(e) => e.preventDefault()}
      >
        <div className="cardhead">
          <AgentIcon id={story.agentId} size={15} />
          <span className="story-epic">{epicName(story.agentId)}</span>
          {story.points ? <span className="points">{story.points} pt</span> : null}
        </div>
        <button
          type="button"
          className="story-title story-open"
          title="Story openen"
          onClick={() => {
            if (didDragRef.current) return;
            setOpenId(story.id);
          }}
        >
          {story.title}
          {story.description && <span className="has-note" title="Heeft toelichting"> ≡</span>}
        </button>
        <div className="story-actions">
          <button
            className="mini-btn"
            title="Tekst kopiëren om elders te plakken"
            onClick={() => copyStory(story)}
          >
            {copiedId === story.id ? "✓ gekopieerd" : "⧉ kopieer"}
          </button>
          {isAdmin &&
            (inBacklog ? (
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
            ))}
        </div>
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
        {inSprint.length > 0 && (
          <div style={{ marginTop: 10 }}>
            <StoryProgress stories={inSprint} />
          </div>
        )}
      </div>

      <div className="planner-grid">
        <div
          className={`kanban-col planner-backlog${hoverZone === "backlog" ? " drop-hover" : ""}`}
          data-drop-zone="backlog"
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
              data-drop-zone={col.key}
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

      {drag && dragStory && (
        <div
          className="kanban-card story-card drag-ghost"
          style={{ left: drag.x + 10, top: drag.y + 8, width: drag.w }}
        >
          <div className="cardhead">
            <AgentIcon id={dragStory.agentId} size={15} />
            <span className="story-epic">{epicName(dragStory.agentId)}</span>
            {dragStory.points ? <span className="points">{dragStory.points} pt</span> : null}
          </div>
          <div className="story-title">{dragStory.title}</div>
        </div>
      )}

      {openStory && (
        <StoryDialog
          key={openStory.id}
          story={openStory}
          epicLabel={epicName(openStory.agentId)}
          placeLabel={
            openStory.sprintId
              ? `${sprints.find((s) => s.id === openStory.sprintId)?.naam ?? openStory.sprintId} · ${
                  STATUS_COLS.find((c) => c.key === openStory.status)?.label ?? openStory.status
                }`
              : "Backlog"
          }
          isAdmin={isAdmin}
          copied={copiedId === openStory.id}
          onCopy={() => copyStory(openStory)}
          onSave={(title, description, pts) => saveDetails(openStory.id, title, description, pts)}
          onClose={() => setOpenId(null)}
        />
      )}
    </>
  );
}
