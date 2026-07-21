import Link from "next/link";
import { AGENTS, agentById } from "@/lib/content";
import { fmtDateTime } from "@/lib/dates";
import { getState, type Answer } from "@/lib/store";
import { AnswerBadge } from "@/components/ui";
import PageHeader from "@/components/PageHeader";
import { currentRole } from "@/lib/auth";
import {
  addQuestion,
  deleteQuestionForever,
  saveAnswer,
  setAnswerStatus,
  setQuestionArchived,
  updateQuestion,
} from "@/app/actions";

export const dynamic = "force-dynamic";

const EMPTY_ANSWER = (id: string): Answer => ({
  questionId: id,
  text: "",
  author: "",
  status: "open",
  updatedAt: "",
});

export default async function Validatie() {
  const state = await getState();
  const role = await currentRole();
  const isAdmin = role === "admin";

  const questions = state.questions.filter((q) => !q.archived);
  const archived = state.questions.filter((q) => q.archived);

  return (
    <>
      <PageHeader
        title="Validatievragen"
        intro="Jullie kennis maakt de agents scherper. Deze vragen vullen we samen met het OM Acquisitie-team in — de antwoorden sturen het design van de agents direct aan."
      />
      <div className="notice">
        Voorbeelden of bijlagen (winnende teksten, juryrapporten, contracten)?
        Zet een verwijzing of link in je antwoord, of mail ze aan het AI-Group
        projectteam — ze worden dan aan het antwoord gekoppeld.
      </div>

      {questions.length === 0 && (
        <p style={{ fontSize: 14, color: "var(--ink-2)" }}>
          Er staan momenteel geen validatievragen open.
        </p>
      )}

      {questions.map((q, i) => {
        const answer = state.answers[q.id] ?? EMPTY_ANSWER(q.id);
        const agent = agentById(q.agentId);
        return (
          <div className="card" key={q.id} style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <span className="badge badge-neutral">
                Vraag {i + 1} · <Link href={`/agents/${q.agentId}`}>{agent?.name ?? q.agentId}</Link>
              </span>
              <AnswerBadge status={answer.status} />
            </div>
            <h2 style={{ margin: "10px 0 4px", fontSize: 16 }}>{q.question}</h2>
            {q.toelichting && (
              <p style={{ fontSize: 13.5, color: "var(--muted)" }}>{q.toelichting}</p>
            )}

            {answer.text && (
              <div className="comment" style={{ borderTop: "1px solid var(--grid)", marginTop: 10 }}>
                <span className="who">
                  {answer.author || "Blauwhoed"}
                  {answer.updatedAt && <span className="when">{fmtDateTime(answer.updatedAt)}</span>}
                </span>
                <p>{answer.text}</p>
              </div>
            )}

            <details style={{ marginTop: 10 }}>
              <summary style={{ cursor: "pointer", fontSize: 13.5, color: "var(--brand-ink)", fontWeight: 600 }}>
                {answer.text ? "Antwoord aanvullen of wijzigen" : "Antwoord invullen"}
              </summary>
              <form action={saveAnswer}>
                <input type="hidden" name="questionId" value={q.id} />
                <label htmlFor={`author-${q.id}`}>Naam</label>
                <input id={`author-${q.id}`} name="author" type="text" placeholder="Bijv. Lise" defaultValue={answer.author} />
                <label htmlFor={`text-${q.id}`}>Antwoord</label>
                <textarea id={`text-${q.id}`} name="text" required defaultValue={answer.text} />
                <button className="btn" type="submit">Opslaan</button>
              </form>
            </details>

            {isAdmin && (
              <>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginTop: 12, borderTop: "1px solid var(--grid)", paddingTop: 12 }}>
                  <form action={setAnswerStatus} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input type="hidden" name="questionId" value={q.id} />
                    <select name="status" defaultValue={answer.status} style={{ width: "auto" }}>
                      <option value="open">Open</option>
                      <option value="in-behandeling">In behandeling</option>
                      <option value="beantwoord">Beantwoord</option>
                    </select>
                    <button className="btn btn-secondary" type="submit" style={{ marginTop: 0 }}>
                      Status bijwerken
                    </button>
                  </form>
                  <form action={setQuestionArchived}>
                    <input type="hidden" name="questionId" value={q.id} />
                    <input type="hidden" name="archived" value="1" />
                    <button className="btn btn-secondary" type="submit" style={{ marginTop: 0 }} title="Vraag archiveren; het antwoord blijft bewaard">
                      Archiveren
                    </button>
                  </form>
                </div>
                <details style={{ marginTop: 10 }}>
                  <summary style={{ cursor: "pointer", fontSize: 13, color: "var(--ink-2)", fontWeight: 600 }}>
                    Vraag bewerken
                  </summary>
                  <form action={updateQuestion}>
                    <input type="hidden" name="questionId" value={q.id} />
                    <label htmlFor={`edit-agent-${q.id}`}>Epic</label>
                    <select id={`edit-agent-${q.id}`} name="agentId" defaultValue={q.agentId}>
                      {AGENTS.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                    <label htmlFor={`edit-q-${q.id}`}>Vraag</label>
                    <textarea id={`edit-q-${q.id}`} name="question" required defaultValue={q.question} style={{ minHeight: 60 }} />
                    <label htmlFor={`edit-t-${q.id}`}>Toelichting (optioneel)</label>
                    <textarea id={`edit-t-${q.id}`} name="toelichting" defaultValue={q.toelichting} style={{ minHeight: 50 }} />
                    <button className="btn" type="submit">Wijzigingen opslaan</button>
                  </form>
                </details>
              </>
            )}
          </div>
        );
      })}

      {isAdmin && (
        <div className="card" style={{ marginTop: 18 }}>
          <h2 style={{ marginTop: 0 }}>Nieuwe validatievraag</h2>
          <form action={addQuestion}>
            <label htmlFor="new-q-agent">Epic</label>
            <select id="new-q-agent" name="agentId">
              {AGENTS.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            <label htmlFor="new-q-question">Vraag</label>
            <textarea id="new-q-question" name="question" required placeholder="Welke informatie…?" style={{ minHeight: 60 }} />
            <label htmlFor="new-q-toelichting">Toelichting (optioneel)</label>
            <textarea id="new-q-toelichting" name="toelichting" placeholder="Context of voorbeelden die het beantwoorden makkelijker maken" style={{ minHeight: 50 }} />
            <button className="btn" type="submit">Vraag toevoegen</button>
          </form>
        </div>
      )}

      {isAdmin && archived.length > 0 && (
        <>
          <h2>Archief ({archived.length})</h2>
          {archived.map((q) => {
            const answer = state.answers[q.id];
            return (
              <div className="card" key={q.id} style={{ marginBottom: 10, opacity: 0.75 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{q.question}</div>
                    <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 2 }}>
                      {agentById(q.agentId)?.name ?? q.agentId}
                      {answer?.text && " · antwoord bewaard"}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <form action={setQuestionArchived}>
                      <input type="hidden" name="questionId" value={q.id} />
                      <input type="hidden" name="archived" value="0" />
                      <button className="btn btn-secondary" type="submit" style={{ marginTop: 0 }}>
                        Herstellen
                      </button>
                    </form>
                    <form action={deleteQuestionForever}>
                      <input type="hidden" name="questionId" value={q.id} />
                      <button className="btn btn-secondary" type="submit" style={{ marginTop: 0, color: "var(--critical-text)" }} title="Verwijdert de vraag én het antwoord definitief">
                        Definitief verwijderen
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            );
          })}
        </>
      )}
    </>
  );
}
