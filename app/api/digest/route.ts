// Weekly digest: samenvatting van status, blockers en komende milestones.
// Aanroepen via Vercel Cron (bijv. maandag 08:00) en doorzetten naar e-mail
// (Resend) — zie README. Beveiligd met CRON_SECRET of een ingelogde sessie.
import { NextRequest, NextResponse } from "next/server";
import { AGENTS, COLUMNS, VALIDATION_QUESTIONS, activeSprint } from "@/lib/content";
import { daysBetween, fmt, todayISO } from "@/lib/dates";
import { getState } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const role = req.cookies.get("portal_role")?.value;
  const auth = req.headers.get("authorization");
  const cronOk = process.env.CRON_SECRET && auth === `Bearer ${process.env.CRON_SECRET}`;
  if (role !== "admin" && role !== "client" && !cronOk) {
    return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 401 });
  }

  const state = await getState();
  const today = todayISO();

  const agents = AGENTS.map((a) => {
    const epic = state.epics[a.id];
    return {
      naam: a.name,
      fase: COLUMNS.find((c) => c.key === epic.column)?.label,
      status: epic.risk,
      notitie: epic.note || null,
      liveDatum: fmt(a.milestone.date),
    };
  });

  const komendeMilestones = AGENTS
    .filter((a) => daysBetween(today, a.milestone.date) >= 0 && daysBetween(today, a.milestone.date) <= 14)
    .map((a) => ({ agent: a.name, milestone: a.milestone.label, datum: fmt(a.milestone.date) }));

  const openVragen = VALIDATION_QUESTIONS.filter(
    (q) => state.answers[q.id].status !== "beantwoord"
  ).map((q) => q.question);

  const sprint = activeSprint(today);
  const sprintStories = state.stories.filter((s) => s.sprintId === sprint.id);

  return NextResponse.json({
    week: today,
    sprint: {
      naam: sprint.naam,
      periode: `${fmt(sprint.start)} – ${fmt(sprint.end)}`,
      doel: sprint.doel,
      storiesKlaar: sprintStories.filter((s) => s.status === "done").length,
      storiesTotaal: sprintStories.length,
    },
    agents,
    blockers: agents.filter((a) => a.notitie || a.status !== "on-track"),
    komendeMilestones,
    openValidatievragen: openVragen,
    recenteFeedback: state.comments.slice(-5).reverse(),
  });
}
