import { RISK_META, type Risk, type DocStatus } from "@/lib/content";
import type { AnswerStatus } from "@/lib/store";

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
