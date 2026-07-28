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
  /** Uitgebreidere toelichting (context, acceptatiecriteria); optioneel. */
  description?: string;
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
  /** Bij een lagere opgeslagen versie worden de seed-teksten ververst; zie mergeStories. */
  storySeedVersion?: number;
  questions: Question[];
  docs: DocItem[];
}

// v3 (27-07-2026): backlog herzien — per epic ±12 functionele, business-gerichte
// userstories; technische stories (SSO, webhooks, backups e.d.) zijn eruit
// gehaald en kunnen later als aparte technische backlog worden toegevoegd.
const STORY_SEED_VERSION = 3;

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

// Productbacklog v3 (herzien 27-07-2026): per epic ±12 functionele userstories
// in businesstaal, genummerd P.x (platform) en 1.x t/m 7.x (agents/Academy).
// Alles start in de backlog (sprintId: null); per sprintplanning worden
// stories aan een sprint toegewezen.
function seedStories(): Story[] {
  const s = (id: string, agentId: string, title: string, points?: number): Story => ({
    id, agentId, title, points, sprintId: null, status: "todo",
  });
  return [
    // Epic P: Agentic Platform
    s("st-p-1", "platform", "P.1 Als Blauwhoed-medewerker wil ik veilig kunnen inloggen met mijn eigen bedrijfsaccount zodat ik zonder aparte wachtwoorden toegang heb tot het platform.", 5),
    s("st-p-2", "platform", "P.2 Als beheerder wil ik collega's kunnen uitnodigen en een rol kunnen geven (beheerder, gebruiker, meekijker) zodat iedereen precies de juiste toegang heeft.", 3),
    s("st-p-3", "platform", "P.3 Als acquisitiemanager wil ik per tender een eigen projectomgeving kunnen aanmaken zodat alle documenten, analyses en teksten van die tender op één plek staan.", 5),
    s("st-p-4", "platform", "P.4 Als gebruiker wil ik op een startdashboard direct de status van al mijn lopende tenders zien zodat ik meteen weet waar actie nodig is.", 5),
    s("st-p-5", "platform", "P.5 Als gebruiker wil ik alle agents vanuit één werkomgeving kunnen starten zodat ik niet hoef te schakelen tussen losse tools.", 5),
    s("st-p-6", "platform", "P.6 Als gebruiker wil ik kunnen zien waar een agent mee bezig is en hoe lang het nog duurt zodat ik weet wanneer ik het resultaat kan verwachten.", 3),
    s("st-p-7", "platform", "P.7 Als gebruiker wil ik een melding krijgen (in het platform of per e-mail) wanneer een agent klaar is of iets van mij nodig heeft zodat ik snel kan reageren.", 3),
    s("st-p-8", "platform", "P.8 Als acquisitiemanager wil ik resultaten van agents eenvoudig kunnen delen met collega's zodat het hele team met dezelfde versie werkt.", 3),
    s("st-p-9", "platform", "P.9 Als gebruiker wil ik eerdere resultaten en oudere versies altijd kunnen terugvinden zodat er nooit werk verloren gaat.", 5),
    s("st-p-10", "platform", "P.10 Als beheerder wil ik documenten en bronbestanden centraal kunnen beheren (uploaden, ordenen, vervangen) zodat agents altijd met de juiste en actuele bronnen werken.", 5),
    s("st-p-11", "platform", "P.11 Als beheerder wil ik kunnen terugzien wie wat wanneer heeft gedaan op het platform zodat we grip houden op het gebruik.", 3),
    s("st-p-12", "platform", "P.12 Als directielid wil ik een overzicht van het gebruik en de opbrengst van het platform (aantal tenders, doorlooptijd, tijdwinst) zodat ik de waarde voor Blauwhoed kan volgen.", 5),
    s("st-p-13", "platform", "P.13 Als gebruiker wil ik erop kunnen vertrouwen dat vertrouwelijke tenderinformatie alleen zichtbaar is voor het eigen projectteam zodat gevoelige informatie beschermd blijft.", 5),
    s("st-p-14", "platform", "P.14 Als gebruiker wil ik vanuit het platform eenvoudig een vraag of storing kunnen melden en de afhandeling volgen zodat ik snel geholpen word.", 3),
    // Epic 1: Tender Analyse-agent
    s("st-1-1", "tender-analyse", "1.1 Als acquisitiemanager wil ik een complete tenderset (leidraad, bijlagen, contractstukken) in één keer kunnen uploaden zodat de agent alles direct kan analyseren.", 5),
    s("st-1-2", "tender-analyse", "1.2 Als acquisitiemanager wil ik een automatische samenvatting van de tender (opdrachtgever, opgave, locatie, planning, budget) zodat ik in vijf minuten de kern ken.", 5),
    s("st-1-3", "tender-analyse", "1.3 Als acquisitiemanager wil ik alle eisen en voorwaarden overzichtelijk in één lijst, gegroepeerd per thema, zodat ik direct zie wat Blauwhoed moet leveren.", 8),
    s("st-1-4", "tender-analyse", "1.4 Als acquisitiemanager wil ik de gunningscriteria en hun weging helder op een rij zodat we weten waar de punten te verdienen zijn.", 5),
    s("st-1-5", "tender-analyse", "1.5 Als projectleider wil ik alle belangrijke deadlines (vragenronde, indiening, presentatie, gunning) in een tijdlijn zien zodat we geen enkele datum missen.", 3),
    s("st-1-6", "tender-analyse", "1.6 Als acquisitiemanager wil ik dat de agent rode vlaggen en uitsluitingsgronden direct signaleert zodat ik snel een go/no-go-besluit kan voorbereiden.", 5),
    s("st-1-7", "tender-analyse", "1.7 Als acquisitiemanager wil ik dat de agent kansen benoemt waar Blauwhoed zich kan onderscheiden (bijv. duurzaamheid, participatie) zodat we die bewust kunnen benutten.", 5),
    s("st-1-8", "tender-analyse", "1.8 Als acquisitiemanager wil ik een profiel van de opdrachtgever en de jury zodat we onze inzending kunnen richten op wat zij belangrijk vinden.", 5),
    s("st-1-9", "tender-analyse", "1.9 Als acquisitiemanager wil ik dat de agent de tender vergelijkt met eerdere vergelijkbare tenders van Blauwhoed zodat we ervaring en materiaal kunnen hergebruiken.", 5),
    s("st-1-10", "tender-analyse", "1.10 Als projectleider wil ik dat de agent voorstellen doet voor vragen voor de nota van inlichtingen zodat we onduidelijkheden op tijd wegnemen.", 3),
    s("st-1-11", "tender-analyse", "1.11 Als projectleider wil ik een checklist van alle in te dienen stukken en vormvereisten zodat onze indiening gegarandeerd compleet is.", 3),
    s("st-1-12", "tender-analyse", "1.12 Als acquisitiemanager wil ik de analyse als overzichtelijk rapport kunnen delen zodat het managementteam er direct over kan beslissen.", 3),
    // Epic 2: Schrijf-agent
    s("st-2-1", "schrijf", "2.1 Als acquisitiemanager wil ik per hoofdstuk een eerste concepttekst op basis van de tenderanalyse zodat het team nooit met een leeg vel begint.", 8),
    s("st-2-2", "schrijf", "2.2 Als communicatiemanager wil ik dat alle teksten in de Blauwhoed tone-of-voice worden geschreven zodat elke inzending herkenbaar en consistent klinkt.", 5),
    s("st-2-3", "schrijf", "2.3 Als acquisitiemanager wil ik een krachtige samenvatting (1-pager) van onze inzending zodat beslissers de kernboodschap in één oogopslag begrijpen.", 3),
    s("st-2-4", "schrijf", "2.4 Als projectleider wil ik eigen aantekeningen en losse bullets kunnen laten uitwerken tot lopende tekst zodat mijn inhoudelijke kennis snel op papier staat.", 5),
    s("st-2-5", "schrijf", "2.5 Als redacteur wil ik bestaande tekst kunnen laten herschrijven (korter, scherper, andere doelgroep) zodat aanpassen minder tijd kost dan zelf herschrijven.", 5),
    s("st-2-6", "schrijf", "2.6 Als acquisitiemanager wil ik dat teksten aantoonbaar aansluiten op de gunningscriteria en de taal van de leidraad zodat de jury onze antwoorden makkelijk herkent.", 5),
    s("st-2-7", "schrijf", "2.7 Als redacteur wil ik meerdere varianten van een passage kunnen opvragen zodat ik de sterkste versie kan kiezen.", 3),
    s("st-2-8", "schrijf", "2.8 Als acquisitiemanager wil ik dat onze kernboodschappen consequent terugkomen in alle hoofdstukken zodat de inzending één verhaal vertelt.", 5),
    s("st-2-9", "schrijf", "2.9 Als redacteur wil ik een taal- en stijlcontrole (spelling, consistent begrippenkader) zodat de eindredactie minder tijd kost.", 3),
    s("st-2-10", "schrijf", "2.10 Als projectleider wil ik dat teksten automatisch binnen de pagina- of woordlimiet van de leidraad blijven zodat we niet op het laatst moeten schrappen.", 3),
    s("st-2-11", "schrijf", "2.11 Als acquisitiemanager wil ik winnende teksten uit eerdere tenders als vertrekpunt kunnen gebruiken zodat bewezen materiaal niet opnieuw bedacht hoeft te worden.", 5),
    s("st-2-12", "schrijf", "2.12 Als gebruiker wil ik feedback kunnen geven op gegenereerde teksten zodat de agent steeds beter aanvoelt wat wij goed vinden.", 3),
    // Epic 3: Structuur-agent
    s("st-3-1", "structuur", "3.1 Als projectleider wil ik een documentopzet (hoofdstukindeling) op basis van de tenderleidraad zodat het team weet welke onderdelen nodig zijn en in welke volgorde.", 5),
    s("st-3-2", "structuur", "3.2 Als projectleider wil ik losse input van verschillende disciplines (stedenbouw, techniek, financiën) laten samenvoegen tot één document zodat niets verloren gaat.", 8),
    s("st-3-3", "structuur", "3.3 Als projectleider wil ik dat tegenstrijdige input wordt gesignaleerd met keuzeopties zodat wij bewust beslissen in plaats van dat er stilzwijgend wordt gekozen.", 5),
    s("st-3-4", "structuur", "3.4 Als projectleider wil ik zien welke onderdelen nog ontbreken ten opzichte van de eisen zodat ik gericht kan uitvragen bij het team.", 5),
    s("st-3-5", "structuur", "3.5 Als redacteur wil ik dat de rode draad van het verhaal wordt bewaakt over alle hoofdstukken heen zodat het document als één geheel leest.", 5),
    s("st-3-6", "structuur", "3.6 Als redacteur wil ik dat verwijzingen, figuurnummers en paginaverwijzingen automatisch kloppen zodat er geen fouten in de inzending sluipen.", 3),
    s("st-3-7", "structuur", "3.7 Als projectleider wil ik per discipline kunnen volgen wie welke input nog moet aanleveren zodat ik op tijd kan bijsturen.", 3),
    s("st-3-8", "structuur", "3.8 Als projectleider wil ik het document eenvoudig kunnen laten herstructureren als de leidraad wijzigt (bijv. na de nota van inlichtingen) zodat we snel kunnen schakelen.", 5),
    s("st-3-9", "structuur", "3.9 Als redacteur wil ik dat dubbelingen worden gesignaleerd en samengevoegd zodat het document compact blijft.", 3),
    s("st-3-10", "structuur", "3.10 Als communicatiemanager wil ik dat het document automatisch in de Blauwhoed-huisstijl en het gevraagde indieningsformat staat zodat de vormgeving geen nawerk oplevert.", 5),
    s("st-3-11", "structuur", "3.11 Als acquisitiemanager wil ik per hoofdstuk een korte leeswijzer of samenvatting zodat de jury snel de kern van elk onderdeel ziet.", 3),
    s("st-3-12", "structuur", "3.12 Als projectleider wil ik het samengestelde document kunnen exporteren (Word/PDF) zodat we het direct kunnen indienen of intern kunnen reviewen.", 3),
    // Epic 4: Toets-agent
    s("st-4-1", "toets", "4.1 Als projectleider wil ik een volledigheidscheck van ons concept tegen alle eisen uit de leidraad zodat we geen enkele eis over het hoofd zien.", 5),
    s("st-4-2", "toets", "4.2 Als acquisitiemanager wil ik per gunningscriterium een beoordeling met score zodat ik weet waar we sterk staan en waar we punten laten liggen.", 5),
    s("st-4-3", "toets", "4.3 Als acquisitiemanager wil ik dat het concept door de ogen van de jury wordt beoordeeld zodat we weten of ons verhaal overtuigt.", 8),
    s("st-4-4", "toets", "4.4 Als redacteur wil ik dat wordt getoetst of onze claims onderbouwd zijn (met cijfers, referenties of voorbeelden) zodat het verhaal geloofwaardig is.", 5),
    s("st-4-5", "toets", "4.5 Als communicatiemanager wil ik dat de consistentie van onze boodschap door het hele document wordt gecontroleerd zodat we één helder verhaal afgeven.", 3),
    s("st-4-6", "toets", "4.6 Als acquisitiemanager wil ik dat ons concept wordt vergeleken met lessen uit eerdere juryrapporten zodat we leren van wat eerder won of verloor.", 5),
    s("st-4-7", "toets", "4.7 Als projectleider wil ik dat risico's en aannames in ons concept worden gesignaleerd met suggesties zodat we ze kunnen oplossen vóór indiening.", 5),
    s("st-4-8", "toets", "4.8 Als projectleider wil ik per hoofdstuk concreet verbeteradvies (niet alleen een score) zodat het team direct aan de slag kan.", 5),
    s("st-4-9", "toets", "4.9 Als projectleider wil ik na het verwerken van feedback opnieuw kunnen toetsen zodat ik zie of het concept daadwerkelijk beter wordt.", 3),
    s("st-4-10", "toets", "4.10 Als acquisitiemanager wil ik vlak voor indiening een eindcheck (compleetheid, limieten, vormvereisten) zodat we met vertrouwen kunnen indienen.", 3),
    s("st-4-11", "toets", "4.11 Als acquisitiemanager wil ik het toetsrapport kunnen delen met het managementteam zodat de besluitvorming over indienen goed onderbouwd is.", 3),
    s("st-4-12", "toets", "4.12 Als acquisitiemanager wil ik zelf accenten kunnen meegeven (waar extra streng op toetsen) zodat de toets aansluit bij wat voor deze tender doorslaggevend is.", 3),
    // Epic 5: Juridische-agent
    s("st-5-1", "juridisch", "5.1 Als jurist wil ik een conceptcontract kunnen laten scannen op risicovolle clausules zodat ik direct zie waar de rode vlaggen zitten.", 8),
    s("st-5-2", "juridisch", "5.2 Als jurist wil ik dat de agent onze vastgelegde 'non-negotiables' bewaakt zodat onacceptabele voorwaarden nooit onopgemerkt blijven.", 5),
    s("st-5-3", "juridisch", "5.3 Als jurist wil ik dat afwijkingen van de Blauwhoed-standaarden worden gesignaleerd met verwijzing naar het artikel zodat ik gericht kan beoordelen.", 5),
    s("st-5-4", "juridisch", "5.4 Als jurist wil ik per bevinding een risico-inschatting (hoog/midden/laag) zodat ik mijn tijd aan de belangrijkste punten besteed.", 3),
    s("st-5-5", "juridisch", "5.5 Als acquisitiemanager wil ik per bevinding een begrijpelijke uitleg in gewone taal zodat ook niet-juristen de risico's snappen.", 3),
    s("st-5-6", "juridisch", "5.6 Als jurist wil ik tekstsuggesties voor alternatieve clausules zodat ik sneller een tegenvoorstel kan doen.", 5),
    s("st-5-7", "juridisch", "5.7 Als jurist wil ik dat wordt gecheckt of het contract aansluit op de tendervoorwaarden zodat we geen tegenstrijdige verplichtingen aangaan.", 5),
    s("st-5-8", "juridisch", "5.8 Als jurist wil ik ook samenwerkings- en combinatieovereenkomsten kunnen laten checken zodat we binnen partnerships geen onnodige risico's lopen.", 5),
    s("st-5-9", "juridisch", "5.9 Als jurist wil ik een overzicht dat elke tendereis koppelt aan de contracttekst en een eigenaar zodat alle verplichtingen traceerbaar zijn.", 5),
    s("st-5-10", "juridisch", "5.10 Als jurist wil ik twee contractversies kunnen vergelijken met een overzicht van de wijzigingen zodat ik onderhandelingsrondes snel kan beoordelen.", 3),
    s("st-5-11", "juridisch", "5.11 Als jurist wil ik de bevindingen als leesbaar rapport kunnen delen zodat het besproken kan worden met de wederpartij of het managementteam.", 3),
    s("st-5-12", "juridisch", "5.12 Als jurist wil ik zelf clausules kunnen toevoegen aan de rode-vlaggenlijst zodat de agent meegroeit met onze ervaring.", 3),
    // Epic 6: Learning-agent
    s("st-6-1", "learning", "6.1 Als acquisitiemanager wil ik per tender vastleggen of we gewonnen of verloren hebben zodat we een compleet beeld opbouwen van onze prestaties.", 3),
    s("st-6-2", "learning", "6.2 Als acquisitiemanager wil ik een analyse van waaróm we een tender wonnen of verloren (o.a. uit juryrapporten) zodat we leren van elke inzending.", 5),
    s("st-6-3", "learning", "6.3 Als acquisitiemanager wil ik een doorzoekbare kennisbank van al onze eerdere tenders zodat ik snel kan zien of we iets vergelijkbaars eerder deden.", 8),
    s("st-6-4", "learning", "6.4 Als projectleider wil ik bij een nieuwe tender automatisch vergelijkbare eerdere projecten aangereikt krijgen zodat we bewezen materiaal hergebruiken.", 5),
    s("st-6-5", "learning", "6.5 Als acquisitiemanager wil ik trends zien in juryfeedback over meerdere tenders zodat we structurele sterktes en zwaktes herkennen.", 5),
    s("st-6-6", "learning", "6.6 Als directielid wil ik een dashboard met kerncijfers (winrate, doorlooptijd, aantal reviewrondes) zodat ik de ontwikkeling kan volgen.", 5),
    s("st-6-7", "learning", "6.7 Als projectleider wil ik zien hoe elke agent presteert (kwaliteit van output, benodigde correcties) zodat we weten waar verbetering nodig is.", 5),
    s("st-6-8", "learning", "6.8 Als gebruiker wil ik op één plek feedback kunnen geven op de output van elke agent zodat verbeterpunten niet verloren gaan.", 3),
    s("st-6-9", "learning", "6.9 Als gebruiker wil ik terugzien wat er met mijn feedback is gebeurd zodat ik weet dat mijn input effect heeft.", 3),
    s("st-6-10", "learning", "6.10 Als acquisitiemanager wil ik inzicht in de succesfactoren van winnende inzendingen zodat we die bewust kunnen inzetten bij nieuwe tenders.", 5),
    s("st-6-11", "learning", "6.11 Als directielid wil ik een periodieke verbeterrapportage zodat zichtbaar is hoe de agents en onze tenderaanpak vooruitgaan.", 3),
    s("st-6-12", "learning", "6.12 Als acquisitiemanager wil ik samen met AI-Group vastleggen welke doelen 'beter' definiëren (bijv. winrate, tijdwinst) zodat we op de juiste dingen sturen.", 3),
    // Epic 7: AI-Group Academy (e-learning)
    s("st-7-1", "academy", "7.1 Als nieuwe medewerker wil ik een korte rondleiding door het platform (5-10 min) zodat ik meteen aan de slag kan.", 3),
    s("st-7-2", "academy", "7.2 Als gebruiker wil ik per agent een verdiepende module (15-20 min) zodat ik begrijp wat elke agent kan en er maximale waarde uit haal.", 5),
    s("st-7-3", "academy", "7.3 Als gebruiker wil ik op mijn eigen tempo kunnen leren en mijn voortgang bewaard zien zodat ik kan stoppen en later verdergaan.", 3),
    s("st-7-4", "academy", "7.4 Als manager wil ik een masterclass over werken met AI-agents zodat ik strategisch kan meedenken over de inzet ervan.", 3),
    s("st-7-5", "academy", "7.5 Als gebruiker wil ik leren hoe ik agents goede instructies geef zodat ik betere resultaten krijg.", 3),
    s("st-7-6", "academy", "7.6 Als gebruiker wil ik kunnen oefenen met een voorbeeldtender in een veilige omgeving zodat ik fouten kan maken zonder gevolgen.", 5),
    s("st-7-7", "academy", "7.7 Als gebruiker wil ik korte video's en stappenplannen per taak zodat ik snel het antwoord vind op 'hoe doe ik dit?'.", 3),
    s("st-7-8", "academy", "7.8 Als medewerker wil ik per module een korte kennistoets met certificaat zodat ik kan aantonen dat ik het platform beheers.", 3),
    s("st-7-9", "academy", "7.9 Als beheerder wil ik zien wie welke modules heeft afgerond zodat ik weet of het team klaar is om met het platform te werken.", 3),
    s("st-7-10", "academy", "7.10 Als beheerder wil ik dat medewerkers een verplichte module over veilig omgaan met vertrouwelijke data volgen zodat we zorgvuldig met tenderinformatie omgaan.", 3),
    s("st-7-11", "academy", "7.11 Als gebruiker wil ik een doorzoekbare FAQ en kennisbank zodat ik zelf antwoorden vind zonder te hoeven wachten op support.", 3),
    s("st-7-12", "academy", "7.12 Als gebruiker wil ik bij nieuwe functies een korte uitleg krijgen zodat ik nieuwe mogelijkheden direct kan benutten.", 2),
  ];
}

/**
 * Backlog-seeds kunnen wijzigen (hogere STORY_SEED_VERSION), maar wat de
 * gebruiker zelf heeft gedaan blijft daarbij altijd behouden: sprint-toewijzing,
 * status en toelichting per story (gematcht op id), plus handmatig toegevoegde
 * stories (id zonder "st-"-prefix). Een story verandert dus alleen van status
 * als de gebruiker dat zelf doet. Seed-stories die niet meer bestaan vervallen.
 */
function mergeStories(saved: Story[] | undefined, seeds: Story[], savedVersion: number): Story[] {
  if (!saved) return seeds;
  if (savedVersion >= STORY_SEED_VERSION) {
    // Zelfde seeds: alleen stories van later toegevoegde epics aanvullen.
    const knownAgents = new Set(saved.map((s) => s.agentId));
    return [...saved, ...seeds.filter((s) => !knownAgents.has(s.agentId))];
  }
  const savedById = new Map(saved.map((s) => [s.id, s]));
  const fromSeeds = seeds.map((seed) => {
    const old = savedById.get(seed.id);
    if (!old) return seed;
    return {
      ...seed,
      sprintId: old.sprintId,
      status: old.status,
      description: old.description ?? seed.description,
    };
  });
  return [...fromSeeds, ...saved.filter((s) => !s.id.startsWith("st-"))];
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
    stories: mergeStories(raw.stories, base.stories, raw.storySeedVersion ?? 0),
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
