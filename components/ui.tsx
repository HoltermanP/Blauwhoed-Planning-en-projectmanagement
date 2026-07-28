import { RISK_META, type Risk, type DocStatus } from "@/lib/content";
import type { AnswerStatus, Story } from "@/lib/store";

const RISK_CLASS: Record<Risk, string> = {
  "on-track": "badge-good",
  "at-risk": "badge-warning",
  delayed: "badge-critical",
};

export function RiskBadge({ risk }: { risk: Risk }) {
  const meta = RISK_META[risk];
  return (
    <span className={`badge ${RISK_CLASS[risk]}`}>
      <span className="dot" aria-hidden>{meta.icon}</span>
      {meta.label}
    </span>
  );
}

/**
 * Voortgang van een epic op basis van zijn user stories: gerealiseerd (klaar)
 * en onderhanden (in uitvoering) ten opzichte van alle stories van die epic.
 */
export function StoryProgress({ stories }: { stories: Story[] }) {
  const total = stories.length;
  if (total === 0) {
    return <span className="story-progress-text">Nog geen user stories</span>;
  }
  const done = stories.filter((s) => s.status === "done").length;
  const doing = stories.filter((s) => s.status === "doing").length;
  return (
    <div className="story-progress" title={`${done} klaar · ${doing} onderhanden · ${total} totaal`}>
      <div
        className="progress progress-sm progress-stack"
        role="progressbar"
        aria-valuenow={done}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label={`${done} van ${total} user stories klaar`}
      >
        <div className="seg-done" style={{ width: `${(done / total) * 100}%` }} />
        <div className="seg-doing" style={{ width: `${(doing / total) * 100}%` }} />
      </div>
      <span className="story-progress-text">
        {done}/{total} klaar{doing > 0 && <> · {doing} onderhanden</>}
      </span>
    </div>
  );
}

export function Progress({ pct }: { pct: number }) {
  return (
    <div className="progress" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div style={{ width: `${pct}%` }} />
    </div>
  );
}

const DOC_META: Record<DocStatus, { label: string; cls: string; icon: string }> = {
  concept: { label: "Concept", cls: "badge-neutral", icon: "○" },
  review: { label: "Ter review", cls: "badge-warning", icon: "▲" },
  goedgekeurd: { label: "Goedgekeurd", cls: "badge-good", icon: "●" },
};

export function DocBadge({ status }: { status: DocStatus }) {
  const m = DOC_META[status];
  return (
    <span className={`badge ${m.cls}`}>
      <span className="dot" aria-hidden>{m.icon}</span>
      {m.label}
    </span>
  );
}

const ANSWER_META: Record<AnswerStatus, { label: string; cls: string; icon: string }> = {
  open: { label: "Open", cls: "badge-neutral", icon: "○" },
  "in-behandeling": { label: "In behandeling", cls: "badge-warning", icon: "▲" },
  beantwoord: { label: "Beantwoord", cls: "badge-good", icon: "●" },
};

export function AnswerBadge({ status }: { status: AnswerStatus }) {
  const m = ANSWER_META[status];
  return (
    <span className={`badge ${m.cls}`}>
      <span className="dot" aria-hidden>{m.icon}</span>
      {m.label}
    </span>
  );
}
