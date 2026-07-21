// Statische projectcontent — bron: Overeenkomst van Opdracht v1.1 (14-07-2026),
// SLA (Bijlage 1) en Adviesrapport Agentic Platform (Deel 1 — Acquisitieproces).

export const PROJECT = {
  klant: "Blauwhoed B.V. (Rotterdam)",
  opdrachtnemer: "AI-Group",
  bouwStart: "2026-07-20",
  bouwEind: "2026-10-19", // Oplevering ter Acceptatie
  beheerStart: "2026-10-20",
  sla: { uptime: "99,5%", support: "P1–P4 met gegarandeerde reactietijden" },
};

export type Risk = "on-track" | "at-risk" | "delayed";
export type Column = "backlog" | "design" | "build" | "test" | "uat" | "live";

export const COLUMNS: { key: Column; label: string; hint: string }[] = [
  { key: "backlog", label: "Backlog", hint: "Requirements nog niet klaar" },
  { key: "design", label: "In Design", hint: "Agent-design in voorbereiding/review" },
  { key: "build", label: "In Build", hint: "Actieve development" },
  { key: "test", label: "In Test", hint: "Testing en validatie" },
  { key: "uat", label: "Ready for UAT", hint: "Klaar voor Blauwhoed-afnametest" },
  { key: "live", label: "Live", hint: "Opgeleverd en in productie" },
];

export const RISK_META: Record<Risk, { label: string; icon: string }> = {
  "on-track": { label: "On-track", icon: "●" },
  "at-risk": { label: "Risico — actieplan nodig", icon: "▲" },
  delayed: { label: "Vertraging — escalatie", icon: "■" },
};

export interface Phase {
  label: string;
  start: string; // ISO
  end: string; // ISO
  kind: "design" | "build" | "test" | "deploy";
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  owner: string;
  defaultColumn: Column;
  defaultRisk: Risk;
  phases: Phase[];
  milestone: { label: string; date: string };
  dependencies: string[];
  successCriteria: string[];
}

export const AGENTS: Agent[] = [
  {
    id: "tender-analyse",
    name: "Tender Analyse-agent",
    description:
      "Leest tenderdocumenten en haalt eisen, voorwaarden, criteria en kansen eruit.",
    owner: "AI-Group",
    defaultColumn: "design",
    defaultRisk: "on-track",
    phases: [
      { label: "Design", start: "2026-07-20", end: "2026-07-28", kind: "design" },
      { label: "Build", start: "2026-07-29", end: "2026-09-15", kind: "build" },
      { label: "Test", start: "2026-09-16", end: "2026-09-19", kind: "test" },
      { label: "Deploy", start: "2026-09-20", end: "2026-09-20", kind: "deploy" },
    ],
    milestone: { label: "Live", date: "2026-09-20" },
    dependencies: [],
    successCriteria: [
      "Extraheert eisen, voorwaarden, gunningscriteria en kansen uit een volledige tenderset",
      "Gevalideerd op minimaal 3 historische Blauwhoed-tenders",
      "Output direct bruikbaar als input voor Structuur- en Schrijf-agent",
    ],
  },
  {
    id: "schrijf",
    name: "Schrijf-agent",
    description:
      "Stelt teksten op en scherpt ze aan in de Blauwhoed tone-of-voice.",
    owner: "AI-Group",
    defaultColumn: "design",
    defaultRisk: "on-track",
    phases: [
      { label: "Design", start: "2026-07-20", end: "2026-07-28", kind: "design" },
      { label: "Build", start: "2026-07-29", end: "2026-09-18", kind: "build" },
      { label: "Test", start: "2026-09-19", end: "2026-09-22", kind: "test" },
      { label: "Deploy", start: "2026-09-23", end: "2026-09-23", kind: "deploy" },
    ],
    milestone: { label: "Live", date: "2026-09-23" },
    dependencies: ["tender-analyse"],
    successCriteria: [
      "Tone-of-voice getraind op door Blauwhoed aangeleverde 'goed vs. fout'-voorbeelden",
      "Concepttekst per hoofdstuk in één iteratie op 80% redactieniveau",
      "Reviewrondes gehalveerd ten opzichte van huidige werkwijze",
    ],
  },
  {
    id: "structuur",
    name: "Structuur-agent",
    description:
      "Ordent losse input van verschillende partijen tot één samenhangend document.",
    owner: "AI-Group",
    defaultColumn: "design",
    defaultRisk: "on-track",
    phases: [
      { label: "Design", start: "2026-07-20", end: "2026-07-28", kind: "design" },
      { label: "Build", start: "2026-08-03", end: "2026-09-25", kind: "build" },
      { label: "Test", start: "2026-09-26", end: "2026-09-30", kind: "test" },
      { label: "Deploy", start: "2026-10-01", end: "2026-10-01", kind: "deploy" },
    ],
    milestone: { label: "Live", date: "2026-10-01" },
    dependencies: ["tender-analyse"],
    successCriteria: [
      "Voegt input van minimaal 4 disciplines samen tot één consistente structuur",
      "Signaleert tegenstrijdige input en legt keuzes voor in plaats van stilzwijgend te kiezen",
      "Documentstructuur volgt de eisen uit de tenderleidraad",
    ],
  },
  {
    id: "toets",
    name: "Toets-agent",
    description:
      "Toetst concept-stukken op volledigheid en overtuigingskracht vanuit het perspectief van de jury.",
    owner: "AI-Group",
    defaultColumn: "design",
    defaultRisk: "on-track",
    phases: [
      { label: "Design", start: "2026-07-20", end: "2026-07-28", kind: "design" },
      { label: "Build", start: "2026-08-10", end: "2026-10-02", kind: "build" },
      { label: "Test", start: "2026-10-03", end: "2026-10-07", kind: "test" },
      { label: "Deploy", start: "2026-10-08", end: "2026-10-08", kind: "deploy" },
    ],
    milestone: { label: "Live", date: "2026-10-08" },
    dependencies: ["tender-analyse", "schrijf"],
    successCriteria: [
      "Toetst per gunningscriterium op volledigheid en overtuigingskracht",
      "Jury-criteria gevalideerd met OM Acquisitie (validatievraag 4)",
      "Concreet verbeteradvies per hoofdstuk, niet alleen een score",
    ],
  },
  {
    id: "juridisch",
    name: "Juridische-agent",
    description:
      "Red-flag detectie in conceptcontracten en signalering van afwijkingen ten opzichte van standaarden.",
    owner: "AI-Group",
    defaultColumn: "design",
    defaultRisk: "on-track",
    phases: [
      { label: "Design", start: "2026-07-20", end: "2026-07-28", kind: "design" },
      { label: "Build", start: "2026-08-17", end: "2026-10-06", kind: "build" },
      { label: "Test", start: "2026-10-07", end: "2026-10-12", kind: "test" },
      { label: "Deploy", start: "2026-10-13", end: "2026-10-13", kind: "deploy" },
    ],
    milestone: { label: "Live", date: "2026-10-13" },
    dependencies: [],
    successCriteria: [
      "Non-negotiable clausules en warning-flags vastgelegd met Blauwhoed (validatievraag 5)",
      "Detecteert 100% van de vooraf gedefinieerde red-flag clausules in testset",
      "Rapporteert afwijkingen met verwijzing naar artikel en risico-inschatting",
    ],
  },
  {
    id: "learning",
    name: "Learning-agent",
    description:
      "Verzamelt en ordent data vanaf dag één en maakt alle andere agents steeds beter.",
    owner: "AI-Group",
    defaultColumn: "design",
    defaultRisk: "on-track",
    phases: [
      { label: "Design", start: "2026-07-20", end: "2026-07-28", kind: "design" },
      { label: "Data verzamelen", start: "2026-07-29", end: "2026-10-12", kind: "build" },
      { label: "Integratie", start: "2026-10-13", end: "2026-10-17", kind: "test" },
      { label: "Live", start: "2026-10-19", end: "2026-10-19", kind: "deploy" },
    ],
    milestone: { label: "Live", date: "2026-10-19" },
    dependencies: ["tender-analyse", "schrijf", "structuur", "toets", "juridisch"],
    successCriteria: [
      "Metrics voor 'beter' gedefinieerd met Blauwhoed (validatievraag 6), incl. wins vs. losses",
      "Feedback-loop actief op alle vijf overige agents",
      "Eerste verbeterrapportage bij Oplevering ter Acceptatie",
    ],
  },
  {
    id: "academy",
    name: "AI-Group Academy",
    description:
      "E-learningomgeving voor Blauwhoed-medewerkers; live bij Oplevering. Onderhoud daarna door Blauwhoed (valt buiten SLA).",
    owner: "AI-Group",
    defaultColumn: "design",
    defaultRisk: "on-track",
    phases: [
      { label: "Design", start: "2026-07-20", end: "2026-08-14", kind: "design" },
      { label: "Build", start: "2026-08-17", end: "2026-10-09", kind: "build" },
      { label: "Test", start: "2026-10-12", end: "2026-10-16", kind: "test" },
      { label: "Live", start: "2026-10-19", end: "2026-10-19", kind: "deploy" },
    ],
    milestone: { label: "Live bij Oplevering", date: "2026-10-19" },
    dependencies: [],
    successCriteria: [
      "Alle 6 agents gedekt met een e-learningmodule",
      "Trainingssessies afgerond vóór Oplevering ter Acceptatie",
      "Beheeroverdracht aan Blauwhoed gedocumenteerd",
    ],
  },
];

// Sprints van 2 weken over de Bouwfase; sprint 7 is een korte opleversprint.
export interface Sprint {
  id: string;
  naam: string;
  start: string;
  end: string;
  doel: string;
}

export const SPRINTS: Sprint[] = [
  { id: "s1", naam: "Sprint 1", start: "2026-07-20", end: "2026-08-02", doel: "Design van alle agents en validatie met OM Acquisitie" },
  { id: "s2", naam: "Sprint 2", start: "2026-08-03", end: "2026-08-16", doel: "Eerste builds Tender Analyse- en Schrijf-agent; datalogging Learning-agent live" },
  { id: "s3", naam: "Sprint 3", start: "2026-08-17", end: "2026-08-30", doel: "Build kernagents; start Structuur- en Juridische-agent" },
  { id: "s4", naam: "Sprint 4", start: "2026-08-31", end: "2026-09-13", doel: "Build afronden Tender Analyse; eerste keten-integraties" },
  { id: "s5", naam: "Sprint 5", start: "2026-09-14", end: "2026-09-27", doel: "Test & livegang Tender Analyse en Schrijf; build Toets-agent" },
  { id: "s6", naam: "Sprint 6", start: "2026-09-28", end: "2026-10-11", doel: "Testen Toets- en Juridische-agent; UAT-voorbereiding; Academy vullen" },
  { id: "s7", naam: "Sprint 7", start: "2026-10-12", end: "2026-10-19", doel: "Opleversprint: integratie Learning-agent, acceptatie en training" },
];

export function activeSprint(todayIso: string): Sprint {
  return (
    SPRINTS.find((s) => todayIso >= s.start && todayIso <= s.end) ??
    (todayIso < SPRINTS[0].start ? SPRINTS[0] : SPRINTS[SPRINTS.length - 1])
  );
}

export function sprintById(id: string): Sprint | undefined {
  return SPRINTS.find((s) => s.id === id);
}

export interface ValidationQuestion {
  id: string;
  agentId: string;
  question: string;
  toelichting: string;
}

export const VALIDATION_QUESTIONS: ValidationQuestion[] = [
  {
    id: "v1",
    agentId: "tender-analyse",
    question:
      "Welke informatie moet de Tender Analyse-agent minimaal extraheren? Missen er bronnen (bijv. eerdere tenders)?",
    toelichting:
      "Denk aan: eisen, gunningscriteria, planning, risico's, kansen. En welke historische tenders zijn beschikbaar als referentiemateriaal?",
  },
  {
    id: "v2",
    agentId: "schrijf",
    question:
      "Hoe scherp moet de tone-of-voice-handhaving zijn? Kunnen jullie voorbeelden aanleveren van 'goed' vs. 'fout'?",
    toelichting:
      "Concrete tekstfragmenten (winnende teksten, afgekeurde teksten) maken het trainen van de Schrijf-agent veel effectiever.",
  },
  {
    id: "v3",
    agentId: "structuur",
    question:
      "Hoe moeten tegenstrijdige inputs worden opgelost? (Bijv. engineering vs. design)",
    toelichting:
      "Wie is doorslaggevend per themagebied, en wanneer moet de agent escaleren in plaats van kiezen?",
  },
  {
    id: "v4",
    agentId: "toets",
    question:
      "Welke jury-criteria zijn doorslaggevend? Wat maakt een concept 'overtuigend'?",
    toelichting:
      "Juryrapporten van gewonnen en verloren tenders zijn hiervoor de beste bron.",
  },
  {
    id: "v5",
    agentId: "juridisch",
    question:
      "Welke clausules zijn non-negotiable? Welke zijn 'warning flags'?",
    toelichting:
      "Bijvoorbeeld: aansprakelijkheid, boeteclausules, planning-garanties, grondposities.",
  },
  {
    id: "v6",
    agentId: "learning",
    question:
      "Welke metrics definiëren 'beter'? Willen jullie wins vs. losses tracken?",
    toelichting:
      "Bijvoorbeeld: winrate, doorlooptijd per tenderfase, aantal reviewrondes, juryscores.",
  },
];

export type DocStatus = "concept" | "review" | "goedgekeurd";

export interface Doc {
  id: string;
  titel: string;
  versie: string;
  datum: string;
  eigenaar: string;
  status: DocStatus;
  changelog: string;
}

export const DOCUMENTS: Doc[] = [
  {
    id: "ovo",
    titel: "Overeenkomst van Opdracht",
    versie: "v1.1",
    datum: "2026-07-14",
    eigenaar: "AI-Group / Blauwhoed",
    status: "review",
    changelog: "v1.1 — fasering herzien naar start 20 juli; ter ondertekening.",
  },
  {
    id: "sla",
    titel: "Service Level Agreement (Bijlage 1)",
    versie: "v1.0",
    datum: "2026-07-14",
    eigenaar: "AI-Group",
    status: "review",
    changelog: "v1.0 — 99,5% uptime, P1–P4 support, reactietijden.",
  },
  {
    id: "verwerkers",
    titel: "Verwerkersovereenkomst (Bijlage 2)",
    versie: "v1.0",
    datum: "2026-07-14",
    eigenaar: "AI-Group",
    status: "review",
    changelog: "v1.0 — initiële versie bij contract.",
  },
  {
    id: "advies",
    titel: "Adviesrapport Agentic Platform — Deel 1 (Acquisitieproces)",
    versie: "v1.0",
    datum: "2026-06-30",
    eigenaar: "AI-Group",
    status: "goedgekeurd",
    changelog: "Definitief; Bijlage A (validatievragen) wordt ingevuld met Daphne & Lise.",
  },
  {
    id: "sessie1",
    titel: "Sessieverslag 1 mei 2026 — Deel 1",
    versie: "v1.0",
    datum: "2026-05-01",
    eigenaar: "AI-Group",
    status: "goedgekeurd",
    changelog: "Definitief verslag.",
  },
  {
    id: "sessie2",
    titel: "Sessieverslag 1 mei 2026 — Deel 2",
    versie: "v1.0",
    datum: "2026-05-01",
    eigenaar: "AI-Group",
    status: "goedgekeurd",
    changelog: "Definitief verslag.",
  },
  {
    id: "design-agents",
    titel: "Designdocumenten per agent (as built)",
    versie: "—",
    datum: "2026-07-28",
    eigenaar: "AI-Group",
    status: "concept",
    changelog: "Volgt per agent na afronding designfase (verwacht v.a. 28 juli).",
  },
  {
    id: "acceptatie",
    titel: "Acceptatieprotocol",
    versie: "—",
    datum: "2026-10-19",
    eigenaar: "AI-Group / Blauwhoed",
    status: "concept",
    changelog: "Wordt opgesteld richting Oplevering ter Acceptatie (19 oktober).",
  },
];

export const CONTACTS = {
  aigroup: [{ naam: "Projectteam AI-Group", rol: "Technisch contactpunt & projectlead", org: "AI-Group" }],
  blauwhoed: [
    { naam: "Filip", rol: "Stuurgroep", org: "Blauwhoed" },
    { naam: "Yvonne", rol: "Stuurgroep", org: "Blauwhoed" },
    { naam: "Pascal", rol: "Stuurgroep / SPOC (voorstel)", org: "Blauwhoed" },
    { naam: "Daphne", rol: "OM Acquisitie — validatie", org: "Blauwhoed" },
    { naam: "Lise", rol: "OM Acquisitie — validatie", org: "Blauwhoed" },
  ],
  escalatie: [
    "1. Melding via portal of e-mail aan AI-Group technisch contactpunt",
    "2. Geen reactie binnen SLA-reactietijd → telefonisch contact met de AI-Group projectlead",
    "3. Structureel issue → escalatie naar stuurgroep-overleg (Blauwhoed SPOC + AI-Group)",
  ],
};

export const SLA_TIERS = [
  { prio: "P1", omschrijving: "Platform niet beschikbaar", reactie: "≤ 4 uur (werkdagen)", oplossing: "Workaround ≤ 1 werkdag" },
  { prio: "P2", omschrijving: "Kernfunctie ernstig beperkt", reactie: "≤ 8 uur", oplossing: "≤ 2 werkdagen" },
  { prio: "P3", omschrijving: "Beperkte functionele hinder", reactie: "≤ 1 werkdag", oplossing: "Volgende patch-cyclus" },
  { prio: "P4", omschrijving: "Vraag / kleine wens", reactie: "≤ 2 werkdagen", oplossing: "In overleg" },
];

export function agentById(id: string): Agent | undefined {
  return AGENTS.find((a) => a.id === id);
}
