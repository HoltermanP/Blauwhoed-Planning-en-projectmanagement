// Persistentie van muteerbare portal-state.
// - Met DATABASE_URL (Neon/Postgres): één jsonb-rij in tabel portal_state.
// - Zonder: lokaal bestand .data/state.json (alleen geschikt voor development).
import { promises as fs } from "fs";
import path from "path";
import type { Column, Risk } from "./content";
import { AGENTS, VALIDATION_QUESTIONS } from "./content";

export interface Comment {
  id: string;
  agentId: string;
  author: string;
  role: "admin" | "client";
  text: string;
  createdAt: string; // ISO datetime
}

export type AnswerStatus = "open" | "in-behandeling" | "beantwoord";

export interface Answer {
  questionId: string;
  text: string;
  author: string;
  status: AnswerStatus;
  updatedAt: string;
}

export interface EpicState {
  column: Column;
  risk: Risk;
  note: string; // actueel blocker-/risiconotitie van AI-Group
}

export interface Task {
  id: string;
  agentId: string;
  title: string;
  done: boolean;
}

export interface PortalState {
  epics: Record<string, EpicState>;
  comments: Comment[];
  answers: Record<string, Answer>;
  tasks: Task[];
}

function defaultState(): PortalState {
  const epics: Record<string, EpicState> = {};
  for (const a of AGENTS) {
    epics[a.id] = { column: a.defaultColumn, risk: a.defaultRisk, note: "" };
  }
  const answers: Record<string, Answer> = {};
  for (const q of VALIDATION_QUESTIONS) {
    answers[q.id] = { questionId: q.id, text: "", author: "", status: "open", updatedAt: "" };
  }
  // Elke epic start met zijn fasen als subtaken op het scrumbord.
  const tasks: Task[] = AGENTS.flatMap((a) =>
    a.phases.map((p, i) => ({
      id: `${a.id}-fase-${i}`,
      agentId: a.id,
      title: p.label,
      done: false,
    }))
  );
  return { epics, comments: [], answers, tasks };
}

function mergeWithDefaults(raw: Partial<PortalState> | null): PortalState {
  const base = defaultState();
  if (!raw) return base;
  return {
    epics: { ...base.epics, ...(raw.epics ?? {}) },
    comments: raw.comments ?? [],
    answers: { ...base.answers, ...(raw.answers ?? {}) },
    tasks: raw.tasks ?? base.tasks,
  };
}

const FILE = path.join(process.cwd(), ".data", "state.json");

async function sql() {
  const { neon } = await import("@neondatabase/serverless");
  return neon(process.env.DATABASE_URL!);
}

let tableReady = false;
async function ensureTable() {
  if (tableReady) return;
  const q = await sql();
  await q`create table if not exists portal_state (id int primary key, data jsonb not null)`;
  tableReady = true;
}

export async function getState(): Promise<PortalState> {
  if (process.env.DATABASE_URL) {
    await ensureTable();
    const q = await sql();
    const rows = await q`select data from portal_state where id = 1`;
    return mergeWithDefaults(rows.length ? (rows[0].data as PortalState) : null);
  }
  try {
    const raw = await fs.readFile(FILE, "utf8");
    return mergeWithDefaults(JSON.parse(raw));
  } catch {
    return defaultState();
  }
}

export async function saveState(state: PortalState): Promise<void> {
  if (process.env.DATABASE_URL) {
    await ensureTable();
    const q = await sql();
    const json = JSON.stringify(state);
    await q`insert into portal_state (id, data) values (1, ${json}::jsonb)
            on conflict (id) do update set data = ${json}::jsonb`;
    return;
  }
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(state, null, 2), "utf8");
}
