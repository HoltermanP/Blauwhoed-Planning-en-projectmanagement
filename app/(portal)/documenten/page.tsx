import { fmt } from "@/lib/dates";
import { getState, type DocItem } from "@/lib/store";
import { DocBadge } from "@/components/ui";
import PageHeader from "@/components/PageHeader";
import { currentRole } from "@/lib/auth";
import { deleteDoc, removeDocFile, saveDoc } from "@/app/actions";

export const dynamic = "force-dynamic";

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} kB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fmtDatum(iso: string): string {
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? fmt(iso) : iso || "—";
}

function DocForm({ doc }: { doc?: DocItem }) {
  const p = doc?.id ?? "new";
  return (
    <form action={saveDoc}>
      {doc && <input type="hidden" name="docId" value={doc.id} />}
      <label htmlFor={`titel-${p}`}>Titel</label>
      <input id={`titel-${p}`} name="titel" type="text" required defaultValue={doc?.titel} />
      <div className="grid-2">
        <div>
          <label htmlFor={`versie-${p}`}>Versie</label>
          <input id={`versie-${p}`} name="versie" type="text" defaultValue={doc?.versie} placeholder="v1.0" />
        </div>
        <div>
          <label htmlFor={`datum-${p}`}>Datum</label>
          <input id={`datum-${p}`} name="datum" type="date" defaultValue={doc?.datum} />
        </div>
      </div>
      <div className="grid-2">
        <div>
          <label htmlFor={`eigenaar-${p}`}>Eigenaar</label>
          <input id={`eigenaar-${p}`} name="eigenaar" type="text" defaultValue={doc?.eigenaar} placeholder="AI-Group / Blauwhoed" />
        </div>
        <div>
          <label htmlFor={`status-${p}`}>Status</label>
          <select id={`status-${p}`} name="status" defaultValue={doc?.status ?? "concept"}>
            <option value="concept">Concept</option>
            <option value="review">Ter review</option>
            <option value="goedgekeurd">Goedgekeurd</option>
          </select>
        </div>
      </div>
      <label htmlFor={`changelog-${p}`}>Changelog / omschrijving</label>
      <input id={`changelog-${p}`} name="changelog" type="text" defaultValue={doc?.changelog} />
      <label htmlFor={`file-${p}`}>
        {doc?.file ? "Bestand vervangen (optioneel)" : "Bestand uploaden (optioneel)"}
      </label>
      <input id={`file-${p}`} name="file" type="file" />
      <button className="btn" type="submit">{doc ? "Wijzigingen opslaan" : "Document toevoegen"}</button>
    </form>
  );
}

export default async function Documenten() {
  const state = await getState();
  const role = await currentRole();
  const isAdmin = role === "admin";

  return (
    <>
      <PageHeader
        title="Documenten & besluiten"
        intro="Eén centrale plek voor contractstukken, adviesrapport, sessieverslagen en (as-built) designdocumenten. Documenten met een bestand zijn direct te downloaden."
        image="/img/casavita.jpg"
        imagePosition="center top"
      />

      {state.docs.map((d) => (
        <div className="card" key={d.id} style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <strong style={{ fontSize: 15 }}>{d.titel}</strong>
            <DocBadge status={d.status} />
          </div>
          <div style={{ fontSize: 13, color: "var(--ink-2)", marginTop: 4 }}>
            {d.versie || "—"} · {fmtDatum(d.datum)} · {d.eigenaar || "—"}
          </div>
          {d.changelog && (
            <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 4 }}>{d.changelog}</div>
          )}

          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginTop: 12 }}>
            {d.file ? (
              <>
                <a className="btn" href={`/api/docs/${d.id}`} style={{ marginTop: 0 }}>
                  ⬇ Download
                </a>
                <span style={{ fontSize: 12.5, color: "var(--muted)" }}>
                  {d.file.name} · {fmtSize(d.file.size)}
                </span>
                {isAdmin && (
                  <form action={removeDocFile}>
                    <input type="hidden" name="docId" value={d.id} />
                    <button className="btn btn-secondary" type="submit" style={{ marginTop: 0 }}>
                      Bestand loskoppelen
                    </button>
                  </form>
                )}
              </>
            ) : (
              <span style={{ fontSize: 13, color: "var(--muted)" }}>
                Nog geen bestand geüpload — download volgt.
              </span>
            )}
          </div>

          {isAdmin && (
            <>
              <details style={{ marginTop: 12, borderTop: "1px solid var(--grid)", paddingTop: 10 }}>
                <summary style={{ cursor: "pointer", fontSize: 13, color: "var(--brand-ink)", fontWeight: 600 }}>
                  Bewerken{d.file ? " / bestand vervangen" : " / bestand uploaden"}
                </summary>
                <DocForm doc={d} />
              </details>
              <form action={deleteDoc} style={{ marginTop: 8 }}>
                <input type="hidden" name="docId" value={d.id} />
                <button
                  className="btn-link"
                  type="submit"
                  style={{ color: "var(--critical-text)", fontSize: 12.5 }}
                  title="Verwijdert document én bestand definitief"
                >
                  Document verwijderen
                </button>
              </form>
            </>
          )}
        </div>
      ))}

      {isAdmin && (
        <div className="card" style={{ marginTop: 18 }}>
          <h2 style={{ marginTop: 0 }}>Nieuw document</h2>
          <DocForm />
        </div>
      )}

      <div className="notice">
        <strong>Besluitenlog:</strong> goedgekeurde versies zijn leidend; wijzigingen
        lopen via een nieuwe versie met changelog-regel. Ondertekening Overeenkomst
        van Opdracht + bijlagen staat gepland rond de projectstart (contractset van
        14 juli 2026).
      </div>
    </>
  );
}
