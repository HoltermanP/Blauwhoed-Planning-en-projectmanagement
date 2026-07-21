// Persistentie van muteerbare portal-state.
// - Met DATABASE_URL (Neon/Postgres): één jsonb-rij in tabel portal_state.
// - Zonder: lokaal bestand .data/state.json (alleen geschikt voor development).
import { promises as fs } from "fs";
import path from "path";
import type { Column, DocStatus, Risk } from "./content";
import { AGENTS, DOCUMENTS, VALIDATION_QUESTIONS } from "./content";

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

/** Validatievraag — beheerbaar door AI-Group; gearchiveerd = verborgen maar bewaard. */
export interface Question {
  id: string;
  agentId: string;
  question: string;
  toelichting: string;
  archived: boolean;
}

export interface DocFile {
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
}

/** Document in de documenten-hub — beheerbaar door AI-Group. */
export interface DocItem {
  id: string;
  titel: string;
  versie: string;
  datum: string; // ISO
  eigenaar: string;
  status: DocStatus;
  changelog: string;
  file?: DocFile;
}

export type StoryStatus = "todo" | "doing" | "done";

export interface Story {
  id: string;
  agentId: string; // epic
  title: string;
  points?: number;
  sprintId: string | null; // null = backlog
  status: StoryStatus;
}

export interface PortalState {
  epics: Record<string, EpicState>;
  comments: Comment[];
  answers: Record<string, Answer>;
  tasks: Task[];
  stories: Story[];
  questions: Question[];
  docs: DocItem[];
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
  const questions: Question[] = VALIDATION_QUESTIONS.map((q) => ({ ...q, archived: false }));
  const docs: DocItem[] = DOCUMENTS.map((d) => ({ ...d }));
  return { epics, comments: [], answers, tasks, stories: seedStories(), questions, docs };
}

// Eerste aanzet productbacklog: realistische user stories per epic.
// Alles start in de backlog (sprintId: null); per sprintplanning worden
// stories aan een sprint toegewezen.
function seedStories(): Story[] {
  const s = (id: string, agentId: string, title: string, points?: number): Story => ({
    id, agentId, title, points, sprintId: null, status: "todo",
  });
  return [
    // Agentic Platform (fundament)
    s("st-pl-1", "platform", "Als AI-Group willen we een centrale orchestratielaag zodat alle agents gecoördineerd samenwerken en data delen.", 8),
    s("st-pl-2", "platform", "Als beheerder wil ik gebruikers en rollen centraal beheren zodat toegang tot het platform veilig en overzichtelijk is.", 5),
    s("st-pl-3", "platform", "Als beheerder wil ik logging en monitoring van alle agent-runs zodat we prestaties en fouten direct zien.", 5),
    s("st-pl-4", "platform", "Als Blauwhoed willen we dat alle data conform de Verwerkersovereenkomst wordt verwerkt zodat AVG-compliance geborgd is.", 5),
    s("st-pl-5", "platform", "Als AI-Group willen we een geautomatiseerde deploy-pijplijn zodat agent-updates zonder downtime live gaan.", 3),
    // Tender Analyse-agent
    s("st-ta-1", "tender-analyse", "Als acquisitiemedewerker wil ik een tenderset (PDF's) kunnen uploaden zodat de agent eisen, voorwaarden en criteria automatisch extraheert.", 8),
    s("st-ta-2", "tender-analyse", "Als tendermanager wil ik een overzicht van gunningscriteria met weging zodat ik direct zie waarop de inschrijving wordt beoordeeld.", 5),
    s("st-ta-3", "tender-analyse", "Als tendermanager wil ik deadlines en mijlpalen uit de leidraad in een tijdlijn zien zodat we geen termijn missen.", 3),
    s("st-ta-4", "tender-analyse", "Als acquisitiemedewerker wil ik risico's en kansen gemarkeerd krijgen zodat we vroeg een bid/no-bid-afweging kunnen maken.", 5),
    s("st-ta-5", "tender-analyse", "Als tendermanager wil ik de output als gestructureerd eisenoverzicht kunnen exporteren zodat het team ermee aan de slag kan.", 3),
    // Schrijf-agent
    s("st-sc-1", "schrijf", "Als tekstschrijver wil ik op basis van bullets een concepthoofdstuk in Blauwhoed tone-of-voice laten genereren zodat ik sneller een eerste versie heb.", 8),
    s("st-sc-2", "schrijf", "Als tekstschrijver wil ik bestaande tekst laten aanscherpen in de huisstijl zodat alle hoofdstukken consistent klinken.", 5),
    s("st-sc-3", "schrijf", "Als tendermanager wil ik goed/fout-voorbeelden kunnen beheren zodat de agent de tone-of-voice steeds beter leert.", 5),
    s("st-sc-4", "schrijf", "Als reviewer wil ik per alinea zien welke wijzigingen de agent voorstelt zodat ik gericht kan accepteren of afwijzen.", 5),
    // Structuur-agent
    s("st-st-1", "structuur", "Als tendermanager wil ik losse input (mails, memo's, schetsen) kunnen samenvoegen tot één documentstructuur zodat niets verloren gaat.", 8),
    s("st-st-2", "structuur", "Als tendermanager wil ik tegenstrijdigheden tussen disciplines gesignaleerd krijgen zodat we keuzes expliciet maken in plaats van stilzwijgend.", 5),
    s("st-st-3", "structuur", "Als acquisitiemedewerker wil ik dat de documentstructuur de indeling van de leidraad volgt zodat de inschrijving aantoonbaar compleet is.", 3),
    // Toets-agent
    s("st-to-1", "toets", "Als tendermanager wil ik een concept laten scoren per gunningscriterium zodat ik zie waar we punten laten liggen.", 8),
    s("st-to-2", "toets", "Als reviewer wil ik concreet verbeteradvies per hoofdstuk zodat we gericht kunnen verbeteren in plaats van alleen een score te krijgen.", 5),
    s("st-to-3", "toets", "Als directie wil ik een jury-samenvatting van het concept zodat de go/no-go-beslissing onderbouwd is.", 3),
    // Juridische-agent
    s("st-ju-1", "juridisch", "Als jurist wil ik conceptcontracten laten scannen op red-flag clausules zodat risico's vroeg zichtbaar zijn.", 8),
    s("st-ju-2", "juridisch", "Als jurist wil ik afwijkingen t.o.v. onze standaarden zien met artikelverwijzing en risico-inschatting zodat ik snel kan beoordelen.", 5),
    s("st-ju-3", "juridisch", "Als tendermanager wil ik non-negotiables en warning-flags kunnen vastleggen zodat de agent weet wat hard is en wat signalering vraagt.", 3),
    // Learning-agent
    s("st-le-1", "learning", "Als projectteam willen we alle agent-interacties vanaf dag één gelogd hebben zodat de Learning-agent direct data verzamelt.", 5),
    s("st-le-2", "learning", "Als management wil ik wins en losses met juryscores registreren zodat we de winrate kunnen volgen.", 3),
    s("st-le-3", "learning", "Als projectteam willen we periodieke verbetervoorstellen per agent zodat de kwaliteit aantoonbaar stijgt.", 5),
    // Academy
    s("st-ac-1", "academy", "Als medewerker wil ik per agent een e-learningmodule zodat ik zelfstandig leer werken met het platform.", 5),
    s("st-ac-2", "academy", "Als teamlead wil ik de voortgang van deelnemers zien zodat ik de training kan bijsturen.", 3),
    s("st-ac-3", "academy", "Als beheerder wil ik content kunnen bijwerken zodat de Academy actueel blijft na oplevering.", 3),
  ];
}

function mergeWithDefaults(raw: Partial<PortalState> | null): PortalState {
  const base = defaultState();
  if (!raw) return base;
  // Seeds voor epics die nog niet in de opgeslagen state voorkomen (bijv. een
  // later toegevoegde epic) worden aangevuld; bestaande epics blijven zoals ze zijn.
  const withSeeds = <T extends { agentId: string }>(saved: T[] | undefined, seeds: T[]): T[] => {
    if (!saved) return seeds;
    const knownAgents = new Set(saved.map((i) => i.agentId));
    return [...saved, ...seeds.filter((i) => !knownAgents.has(i.agentId))];
  };
  return {
    epics: { ...base.epics, ...(raw.epics ?? {}) },
    comments: raw.comments ?? [],
    answers: { ...base.answers, ...(raw.answers ?? {}) },
    tasks: withSeeds(raw.tasks, base.tasks),
    stories: withSeeds(raw.stories, base.stories),
    // Zodra er opgeslagen vragen/documenten zijn, zijn die volledig leidend (CRUD door beheerder).
    questions: raw.questions ?? base.questions,
    docs: raw.docs ?? base.docs,
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
