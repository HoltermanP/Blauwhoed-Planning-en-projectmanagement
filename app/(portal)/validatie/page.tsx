import Link from "next/link";
import { VALIDATION_QUESTIONS, agentById } from "@/lib/content";
import { fmtDateTime } from "@/lib/dates";
import { getState } from "@/lib/store";
import { AnswerBadge } from "@/components/ui";
import PageHeader from "@/components/PageHeader";
import { currentRole } from "@/lib/auth";
import { saveAnswer, setAnswerStatus } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function Validatie() {
  const state = await getState();
  const role = await currentRole();

  return (
    <>
      <PageHeader
        title="Validatievragen"
        intro="Jullie kennis maakt de agents scherper. Deze zes vragen uit het adviesrapport (Bijlage A) vullen we samen met het OM Acquisitie-team in — de antwoorden sturen het design van de agents direct aan."
        image="/img/erven.jpg"
      />
      <div className="notice">
        Voorbeelden of bijlagen (winnende teksten, juryrapporten, contracten)?
        Zet een verwijzing of link in je antwoord, of mail ze aan het AI-Group
        projectteam — ze worden dan aan het antwoord gekoppeld.
      </div>

      {VALIDATION_QUESTIONS.map((q, i) => {
        const answer = state.answers[q.id];
        const agent = agentById(q.agentId);
        return (
          <div className="card" key={q.id} style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <span className="badge badge-neutral">
                Vraag {i + 1} · <Link href={`/agents/${q.agentId}`}>{agent?.name}</Link>
              </span>
              <AnswerBadge status={answer.status} />
            </div>
            <h2 style={{ margin: "10px 0 4px", fontSize: 16 }}>{q.question}</h2>
            <p style={{ fontSize: 13.5, color: "var(--muted)" }}>{q.toelichting}</p>

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

            {role === "admin" && (
              <form action={setAnswerStatus} style={{ marginTop: 10, display: "flex", gap: 8, alignItems: "center" }}>
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
            )}
          </div>
        );
      })}
    </>
  );
}
