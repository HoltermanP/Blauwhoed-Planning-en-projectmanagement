import { DOCUMENTS } from "@/lib/content";
import { fmt } from "@/lib/dates";
import { DocBadge } from "@/components/ui";
import PageHeader from "@/components/PageHeader";

export const dynamic = "force-dynamic";

export default function Documenten() {
  return (
    <>
      <PageHeader
        title="Documenten & besluiten"
        intro="Eén centrale plek voor contractstukken, adviesrapport, sessieverslagen en (as-built) designdocumenten. Downloads verschijnen per document zodra de definitieve bestanden zijn geüpload."
        image="/img/casavita.jpg"
        imagePosition="center top"
      />

      <div className="card table-wrap" style={{ padding: 0 }}>
        <table>
          <thead>
            <tr>
              <th>Document</th>
              <th>Versie</th>
              <th>Datum</th>
              <th>Eigenaar</th>
              <th>Status</th>
              <th>Download</th>
            </tr>
          </thead>
          <tbody>
            {DOCUMENTS.map((d) => (
              <tr key={d.id}>
                <td>
                  <strong>{d.titel}</strong>
                  <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 2 }}>{d.changelog}</div>
                </td>
                <td>{d.versie}</td>
                <td>{d.datum !== "—" ? fmt(d.datum) : "—"}</td>
                <td>{d.eigenaar}</td>
                <td><DocBadge status={d.status} /></td>
                <td style={{ fontSize: 13, color: "var(--muted)" }}>volgt</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="notice">
        <strong>Besluitenlog:</strong> goedgekeurde versies zijn leidend; wijzigingen
        lopen via een nieuwe versie met changelog-regel. Ondertekening Overeenkomst
        van Opdracht + bijlagen staat gepland rond de projectstart (contractset van
        14 juli 2026).
      </div>
    </>
  );
}
