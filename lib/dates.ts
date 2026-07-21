const DAY = 24 * 60 * 60 * 1000;

export function parseISO(iso: string): Date {
  return new Date(iso + "T00:00:00");
}

export function daysBetween(a: string, b: string): number {
  return Math.round((parseISO(b).getTime() - parseISO(a).getTime()) / DAY);
}

export function todayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Voortgang van vandaag binnen [start, end], 0–100. */
export function progressPct(start: string, end: string): number {
  const total = daysBetween(start, end);
  if (total <= 0) return todayISO() >= end ? 100 : 0;
  const done = daysBetween(start, todayISO());
  return Math.min(100, Math.max(0, Math.round((done / total) * 100)));
}

const MONTHS_NL = [
  "januari", "februari", "maart", "april", "mei", "juni",
  "juli", "augustus", "september", "oktober", "november", "december",
];

export function fmt(iso: string): string {
  const d = parseISO(iso);
  return `${d.getDate()} ${MONTHS_NL[d.getMonth()]} ${d.getFullYear()}`;
}

export function fmtShort(iso: string): string {
  const d = parseISO(iso);
  return `${d.getDate()} ${MONTHS_NL[d.getMonth()].slice(0, 3)}`;
}

export function fmtDateTime(isoDateTime: string): string {
  const d = new Date(isoDateTime);
  const time = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return `${d.getDate()} ${MONTHS_NL[d.getMonth()].slice(0, 3)} ${d.getFullYear()}, ${time}`;
}
