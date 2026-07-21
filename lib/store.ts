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
  /** Vercel Blob-URL; ontbreekt bij lokale opslag in .data/uploads/. */
  url?: string;
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
  /** Bij een lagere opgeslagen versie wordt de backlog vervangen door de actuele seeds. */
  storySeedVersion?: number;
  questions: Question[];
  docs: DocItem[];
}

// v2: backlog vervangen door userstories_agentic_platform.md en
// userstories_platform_infrastructure.md (beide v1.0, 21-07-2026).
const STORY_SEED_VERSION = 2;

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
  return {
    epics, comments: [], answers, tasks,
    stories: seedStories(), storySeedVersion: STORY_SEED_VERSION,
    questions, docs,
  };
}

// Productbacklog conform twee documenten van 21-07-2026 (beide v1.0):
// - userstories_agentic_platform.md: agent- en Academy-stories, nummering 1.1 t/m 7.6.
// - userstories_platform_infrastructure.md: platform-epic, nummering P1.1 t/m P8.4
//   ("P"-prefix omdat dat document zijn eigen epic-nummering 1-8 hanteert).
// Alles start in de backlog (sprintId: null); per sprintplanning worden
// stories aan een sprint toegewezen.
function seedStories(): Story[] {
  const s = (id: string, agentId: string, title: string, points?: number): Story => ({
    id, agentId, title, points, sprintId: null, status: "todo",
  });
  return [
    // Agentic Platform — Epic P1: User & Access Management
    s("st-p-1-1", "platform", "P1.1 Als Blauwhoed-administrator wil ik nieuwe gebruikers kunnen registreren en aan teams toewijzen (invite-mail, MFA-setup, bulkimport) zodat het team meteen het platform kan gebruiken.", 5),
    s("st-p-1-2", "platform", "P1.2 Als Blauwhoed-administrator wil ik granulaire rollen definiëren (Admin, ProjectManager, AcquisitionManager, Viewer, Analyst) zodat iedereen alleen toegang heeft tot wat nodig is.", 5),
    s("st-p-1-3", "platform", "P1.3 Als developer/system-integrator wil ik API-keys genereren en beheren (scopes, rotatie, rate limiting) zodat ik het platform kan integreren met externe systemen zoals CRM en projectmanagement.", 5),
    s("st-p-1-4", "platform", "P1.4 Als Blauwhoed IT-manager wil ik SSO integreren (Azure AD/Okta via SAML 2.0/OpenID Connect) met tenant-isolatie zodat gebruikers met hun bedrijfsaccount inloggen.", 8),
    s("st-p-1-5", "platform", "P1.5 Als security officer wil ik sessies beheren en MFA afdwingen (verplicht voor admins, sessietimeouts, login-history) zodat het platform veilig blijft.", 5),
    // Agentic Platform — Epic P2: Agent & Workflow Management
    s("st-p-2-1", "platform", "P2.1 Als platform-operator wil ik agents kunnen deployen, upgraden en rollbacken (canary deployment, health checks, versiehistorie) zodat nieuwe agent-versies live gaan zonder downtime.", 8),
    s("st-p-2-2", "platform", "P2.2 Als platform-operator wil ik real-time health-metrics per agent zien (uptime, error rate, latency, alerts naar Slack/e-mail) zodat ik problemen snel spot.", 5),
    s("st-p-2-3", "platform", "P2.3 Als projectmanager wil ik agent-parameters kunnen tweaken zonder code-deploy (versioned configs, A/B-tests, rollback) zodat ik snel kan optimaliseren.", 5),
    s("st-p-2-4", "platform", "P2.4 Als projectmanager wil ik workflows definiëren (bijv. Tender Analyse → Toets → Learning) met conditionele logica en retry-afhandeling zodat complexe multi-agent-jobs automatisch lopen.", 8),
    // Agentic Platform — Epic P3: Credits & Usage Tracking
    s("st-p-3-1", "platform", "P3.1 Als billing-manager wil ik per agent-run zien hoeveel credits die kost (tokens, computetijd, API-calls) zodat ik accuraat kan factureren.", 5),
    s("st-p-3-2", "platform", "P3.2 Als Blauwhoed-administrator wil ik maandelijkse creditbudgetten alloceren aan teams en gebruikers (sub-quota's, alerts bij 70%/90%) zodat we spending controleren.", 5),
    s("st-p-3-3", "platform", "P3.3 Als platform-operator wil ik beleid instellen voor quota-overschrijding (hard-stop, soft-cap, auto-pause, rate limiting) zodat we kosten begrenzen.", 3),
    s("st-p-3-4", "platform", "P3.4 Als financial-manager wil ik dat usage-data automatisch naar het billing-systeem gaat (facturatie, betalingen, multi-currency) zodat facturen accuraat en op tijd zijn.", 8),
    // Agentic Platform — Epic P4: Monitoring, Logging & Observability
    s("st-p-4-1", "platform", "P4.1 Als platform-operator wil ik alle logs (app, agent, API, systeem) op één plek met structured logging en PII-masking zodat ik sneller kan debuggen.", 5),
    s("st-p-4-2", "platform", "P4.2 Als platform-operator wil ik een unified dashboard van platform-metrics (requests/sec, latency, error rate, per tenant/agent) met alertregels zodat ik de health snel kan beoordelen.", 5),
    s("st-p-4-3", "platform", "P4.3 Als engineer wil ik request-flows kunnen tracen van entry tot exit (trace-IDs, latency-breakdown, slow-query-detectie) zodat ik bottlenecks spot.", 5),
    s("st-p-4-4", "platform", "P4.4 Als security officer wil ik alle security-relevante events auditeren (immutable logs, minimaal 1 jaar retentie, exporteerbaar) zodat ik compliance kan aantonen.", 5),
    // Agentic Platform — Epic P5: Data Management & Backup
    s("st-p-5-1", "platform", "P5.1 Als platform-operator wil ik dagelijkse geautomatiseerde backups met point-in-time recovery (geo-redundant, RTO <4u, RPO <1u) zodat dataverlies voorkomen wordt.", 5),
    s("st-p-5-2", "platform", "P5.2 Als Blauwhoed wil ik al onze data kunnen exporteren in standaardformaten (JSON/CSV, binnen 24 uur, met checksums) zodat we niet vendor-locked zitten.", 3),
    s("st-p-5-3", "platform", "P5.3 Als security officer wil ik dat tenant-data volledig geïsoleerd en verwijderbaar is (soft/hard delete, right to be forgotten) zodat GDPR-compliance gewaarborgd is.", 5),
    s("st-p-5-4", "platform", "P5.4 Als platform-operator wil ik geautomatiseerd databaseonderhoud (indexoptimalisatie, archivering, partitionering) zodat de performance op peil blijft.", 3),
    // Agentic Platform — Epic P6: Integration & API Management
    s("st-p-6-1", "platform", "P6.1 Als developer wil ik webhooks configureren voor events (workflow gestart/afgerond/mislukt, quota overschreden) met retry-logica zodat ik externe systemen kan triggeren.", 5),
    s("st-p-6-2", "platform", "P6.2 Als developer wil ik third-party apps integreren via OAuth 2.0 (Slack, Teams, Zapier, Make) zodat resultaten naar communicatietools gepusht kunnen worden.", 5),
    s("st-p-6-3", "platform", "P6.3 Als security officer wil ik dat webhook-requests gesigneerd zijn (HMAC-SHA256, timestamp tegen replay-attacks) zodat ik kan verifiëren dat ze van ons platform komen.", 3),
    s("st-p-6-4", "platform", "P6.4 Als platform-operator wil ik rate-limits afdwingen per API-key/integratie (429-responses, burst allowance, abuse-alerts) zodat één bad actor het platform niet plat legt.", 3),
    // Agentic Platform — Epic P7: Security & Compliance
    s("st-p-7-1", "platform", "P7.1 Als platform-operator wil ik secrets centraal en veilig beheren (vault, encryptie, automatische rotatie, toegangs-audit) zodat er geen secrets in code of config staan.", 5),
    s("st-p-7-2", "platform", "P7.2 Als security officer wil ik automatisch scannen op vulnerabilities (dependencies, containers, code; CVE-alerts) zodat patches urgent gedeployed kunnen worden.", 5),
    s("st-p-7-3", "platform", "P7.3 Als platform-operator wil ik het platform beschermd hebben tegen DDoS-aanvallen (WAF, IP-rate-limiting, CDN-integratie) zodat de beschikbaarheid gewaarborgd is.", 3),
    s("st-p-7-4", "platform", "P7.4 Als compliance officer wil ik aantonen dat het platform voldoet aan compliance-eisen (SOC 2 Type II, GDPR, ISO 27001, jaarlijkse pentest) zodat klanten ons vertrouwen.", 5),
    // Agentic Platform — Epic P8: Support & Operations
    s("st-p-8-1", "platform", "P8.1 Als Blauwhoed-gebruiker wil ik supporttickets kunnen openen en de status volgen (SLA: P1 <1u, P2 <4u, P3 <24u) zodat issues opgelost worden.", 5),
    s("st-p-8-2", "platform", "P8.2 Als platform-operator wil ik incidenten managen en de status communiceren (severity-levels, publieke statuspagina, postmortems) zodat we transparant zijn.", 5),
    s("st-p-8-3", "platform", "P8.3 Als Blauwhoed-gebruiker wil ik de productroadmap zien en op features kunnen stemmen zodat ik invloed heb op de prioriteiten.", 3),
    s("st-p-8-4", "platform", "P8.4 Als nieuwe gebruiker wil ik uitgebreide documentatie (interactieve API-docs, guides, FAQ, video-tutorials, doorzoekbaar) zodat ik self-service kan leren.", 5),
    // Epic 1: Tender Analyse-agent
    s("st-1-1", "tender-analyse", "1.1 Als acquisitiemanager wil ik tenderdocumenten (PDF) kunnen uploaden zodat de Tender Analyse-agent automatisch basisgegevens extraheert (opdrachtgever, budget, deadline, raamwerk).", 8),
    s("st-1-2", "tender-analyse", "1.2 Als acquisitiemanager wil ik dat de agent alle functionele en technische eisen uit het tender-dossier verzamelt en categoriseert zodat ik snel inzicht heb in wat Blauwhoed moet leveren.", 8),
    s("st-1-3", "tender-analyse", "1.3 Als acquisitiemanager wil ik dat de agent het opdrachtgever-profiel en de jury-voorkeuren uit het document haalt zodat Blauwhoed kan richten op wat de jury waarschijnlijk waardeert.", 5),
    s("st-1-4", "tender-analyse", "1.4 Als acquisitiemanager wil ik dat de agent rode vlaggen direct signaleert (exclusiecriteria, capacity- en geo-risico's) zodat ik sneller kan bepalen of dit tender geschikt is voor Blauwhoed (go/no-go).", 5),
    // Epic 2: Schrijf-agent
    s("st-2-1", "schrijf", "2.1 Als acquisitiemanager wil ik dat de Schrijf-agent een sterke 1-pager executive summary schrijft voor het tender zodat het OMT snel de kernboodschap begrijpt.", 5),
    s("st-2-2", "schrijf", "2.2 Als projectleider wil ik dat de Schrijf-agent een visiedocument-template invult met tender-specifieke content zodat het team meteen een basis heeft om verder te schrijven.", 8),
    s("st-2-3", "schrijf", "2.3 Als jurist/acquisitiemanager wil ik dat de Schrijf-agent contractteksten genereert op basis van template en tender-requirements zodat juridische review en onderhandelingen sneller gaan.", 8),
    s("st-2-4", "schrijf", "2.4 Als communicatiemanager wil ik dat de Schrijf-agent alle gegenereerde teksten aanscherpt op Blauwhoed tone-of-voice zodat alle output consistent en professioneel voelt.", 5),
    // Epic 3: Structuur-agent
    s("st-3-1", "structuur", "3.1 Als projectmanager wil ik dat de Structuur-agent engineering-input (technische specs) en concept-input (visie) samenvoegt zodat het uiteindelijke document consistent is en niets mist.", 8),
    s("st-3-2", "structuur", "3.2 Als redacteur wil ik dat de Structuur-agent een logische outline genereert op basis van tender-requirements zodat het team weet welke secties nodig zijn en in welke volgorde.", 5),
    s("st-3-3", "structuur", "3.3 Als redacteur wil ik dat de Structuur-agent alle referenties in het document checkt (figuurnummers, paginaverwijzingen) zodat we geen broken links of foute verwijzingen hebben.", 3),
    s("st-3-4", "structuur", "3.4 Als projectmanager wil ik dat de Structuur-agent me helpt tegenstrijdige input op te lossen met resolutie-opties zodat het eindresultaat coherent is.", 5),
    // Epic 4: Toets-agent
    s("st-4-1", "toets", "4.1 Als projectmanager wil ik dat de Toets-agent checkt of alle tender-eisen gedekt zijn in ons concept zodat we geen essentiële requirement missen.", 5),
    s("st-4-2", "toets", "4.2 Als acquisitiemanager wil ik dat de Toets-agent door jury-ogen beoordeelt of ons concept overtuigend is (technisch, commercieel, innovatie, risico, team) zodat ik weet of we kunnen winnen.", 8),
    s("st-4-3", "toets", "4.3 Als communicatiemanager wil ik dat de Toets-agent controleert of onze messaging consistent en sterk is zodat we één heldere boodschap afgeven.", 5),
    s("st-4-4", "toets", "4.4 Als jurist/projectmanager wil ik dat de Toets-agent alle risico's en aannames in ons concept flagt met mitigatie-suggesties zodat we ze kunnen mitigeren voordat we indienen.", 5),
    // Epic 5: Juridische-agent
    s("st-5-1", "juridisch", "5.1 Als jurist wil ik dat de Juridische-agent alle clausules in ons contract scant op juridische risico's zodat ik snel weet waar rode vlaggen liggen.", 8),
    s("st-5-2", "juridisch", "5.2 Als jurist/acquisitiemanager wil ik dat de Juridische-agent checkt of ons contract aansluit op de tendervoorwaarden zodat we geen risico op breaches lopen.", 5),
    s("st-5-3", "juridisch", "5.3 Als jurist/projectmanager wil ik dat de Juridische-agent teaming-overeenkomsten en subcontractor-agreements checkt zodat we geen exposure hebben binnen ons partnership.", 5),
    s("st-5-4", "juridisch", "5.4 Als jurist/OMT wil ik dat de Juridische-agent een compliance-matrix bouwt (tender-requirement → contracttekst → eigenaar/garantsteller) zodat alles traceerbaar is.", 5),
    // Epic 6: Learning-agent
    s("st-6-1", "learning", "6.1 Als acquisitiemanager wil ik dat de Learning-agent automatisch win/loss-data verzamelt en analyseert zodat we leren van elk tender, gewonnen of verloren.", 5),
    s("st-6-2", "learning", "6.2 Als acquisitiemanager wil ik dat de Learning-agent een doorzoekbare database bouwt van alle eerdere tenders zodat ik snel kan zien of we zoiets eerder hebben gedaan.", 8),
    s("st-6-3", "learning", "6.3 Als projectmanager wil ik dat de Learning-agent de performance van elke agent trackt zodat we weten waar kwaliteitsverbeteringen nodig zijn.", 5),
    s("st-6-4", "learning", "6.4 Als projectmanager wil ik inzicht in welke teamcombinaties succesvol zijn zodat ik beter kan staffen op tenders.", 5),
    s("st-6-5", "learning", "6.5 Als agent wil ik feedback krijgen op mijn output (per agent, verwerkt in retraining) zodat ik continu verbeter.", 5),
    // Epic 7: AI-Group Academy (e-learning)
    s("st-7-1", "academy", "7.1 Als nieuwe Blauwhoed-medewerker wil ik een korte guided tour door het platform (5-10 min) zodat ik meteen kan beginnen.", 3),
    s("st-7-2", "academy", "7.2 Als acquisitiemanager wil ik per agent een deep-dive course (15-20 min) zodat ik begrijp hoe elke agent werkt en er maximale waarde uit haal.", 5),
    s("st-7-3", "academy", "7.3 Als projectmanager wil ik een masterclass agentic werken (30 min) zodat ik strategisch kan meedenken over de implementatie.", 3),
    s("st-7-4", "academy", "7.4 Als power user wil ik leren hoe ik agents beter kan instrueren via prompts zodat ik betere output krijg.", 3),
    s("st-7-5", "academy", "7.5 Als compliance/security officer wil ik dat teamleden verplichte training krijgen in data-handling zodat we GDPR/compliance-risico's minimaliseren.", 3),
    s("st-7-6", "academy", "7.6 Als gebruiker wil ik snel hulp kunnen vinden wanneer iets niet werkt (FAQ, kennisbank, support met SLA) zodat ik niet vast kom te zitten.", 3),
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
  // Opgeslagen backlog van een oudere seed-versie wordt volledig vervangen door
  // de actuele seeds (incl. sprint-toewijzingen — de nummering is dan niet meer geldig).
  const storiesCurrent = (raw.storySeedVersion ?? 0) >= STORY_SEED_VERSION;
  return {
    epics: { ...base.epics, ...(raw.epics ?? {}) },
    comments: raw.comments ?? [],
    answers: { ...base.answers, ...(raw.answers ?? {}) },
    tasks: withSeeds(raw.tasks, base.tasks),
    stories: storiesCurrent ? withSeeds(raw.stories, base.stories) : base.stories,
    storySeedVersion: STORY_SEED_VERSION,
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
