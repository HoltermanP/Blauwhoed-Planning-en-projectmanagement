"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import {
  ROLE_COOKIE,
  adminPassword,
  clientPassword,
  requireAdmin,
  requireRole,
} from "@/lib/auth";
import { getState, saveState, type AnswerStatus, type StoryStatus } from "@/lib/store";
import { COLUMNS, SPRINTS, type Column, type Risk } from "@/lib/content";

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: 60 * 60 * 24 * 30,
  path: "/",
};

export async function login(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const store = await cookies();
  if (password === adminPassword()) {
    store.set(ROLE_COOKIE, "admin", COOKIE_OPTS);
  } else if (password === clientPassword()) {
    store.set(ROLE_COOKIE, "client", COOKIE_OPTS);
  } else {
    redirect("/login?error=1");
  }
  redirect("/");
}

export async function logout() {
  const store = await cookies();
  store.delete(ROLE_COOKIE);
  redirect("/login");
}

export async function addComment(formData: FormData) {
  const role = await requireRole();
  const agentId = String(formData.get("agentId") ?? "");
  const author = String(formData.get("author") ?? "").trim();
  const text = String(formData.get("text") ?? "").trim();
  if (!agentId || !author || !text) return;

  const state = await getState();
  state.comments.push({
    id: Math.random().toString(36).slice(2, 10),
    agentId,
    author,
    role,
    text,
    createdAt: new Date().toISOString(),
  });
  await saveState(state);
  revalidatePath(`/agents/${agentId}`);
  revalidatePath("/scrumbord");
  revalidatePath("/");
}

export async function saveAnswer(formData: FormData) {
  await requireRole();
  const questionId = String(formData.get("questionId") ?? "");
  const author = String(formData.get("author") ?? "").trim();
  const text = String(formData.get("text") ?? "").trim();
  if (!questionId || !text) return;

  const state = await getState();
  if (!state.questions.some((q) => q.id === questionId)) return;
  const existing = state.answers[questionId] ?? {
    questionId,
    text: "",
    author: "",
    status: "open" as AnswerStatus,
    updatedAt: "",
  };
  state.answers[questionId] = {
    ...existing,
    text,
    author: author || existing.author,
    status: "in-behandeling",
    updatedAt: new Date().toISOString(),
  };
  await saveState(state);
  revalidatePath("/validatie");
  revalidatePath("/");
}

export async function setAnswerStatus(formData: FormData) {
  await requireAdmin();
  const questionId = String(formData.get("questionId") ?? "");
  const status = String(formData.get("status") ?? "") as AnswerStatus;
  if (!["open", "in-behandeling", "beantwoord"].includes(status)) return;

  const state = await getState();
  const existing = state.answers[questionId];
  if (!existing) return;
  state.answers[questionId] = { ...existing, status, updatedAt: new Date().toISOString() };
  await saveState(state);
  revalidatePath("/validatie");
  revalidatePath("/");
}

function revalidateValidatie() {
  revalidatePath("/validatie");
  revalidatePath("/");
}

export async function addQuestion(formData: FormData) {
  await requireAdmin();
  const agentId = String(formData.get("agentId") ?? "");
  const question = String(formData.get("question") ?? "").trim();
  const toelichting = String(formData.get("toelichting") ?? "").trim();
  if (!agentId || !question) return;

  const state = await getState();
  const id = Math.random().toString(36).slice(2, 10);
  state.questions.push({ id, agentId, question, toelichting, archived: false });
  state.answers[id] = { questionId: id, text: "", author: "", status: "open", updatedAt: "" };
  await saveState(state);
  revalidateValidatie();
}

export async function updateQuestion(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("questionId") ?? "");
  const agentId = String(formData.get("agentId") ?? "");
  const question = String(formData.get("question") ?? "").trim();
  const toelichting = String(formData.get("toelichting") ?? "").trim();

  const state = await getState();
  const q = state.questions.find((x) => x.id === id);
  if (!q || !question) return;
  if (agentId) q.agentId = agentId;
  q.question = question;
  q.toelichting = toelichting;
  await saveState(state);
  revalidateValidatie();
}

/** Archiveren = veilig verwijderen: vraag verdwijnt uit de lijst, antwoord blijft bewaard. */
export async function setQuestionArchived(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("questionId") ?? "");
  const archived = String(formData.get("archived")) === "1";

  const state = await getState();
  const q = state.questions.find((x) => x.id === id);
  if (!q) return;
  q.archived = archived;
  await saveState(state);
  revalidateValidatie();
}

/** Definitief verwijderen kan alleen vanuit het archief; wist ook het antwoord. */
export async function deleteQuestionForever(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("questionId") ?? "");

  const state = await getState();
  const q = state.questions.find((x) => x.id === id);
  if (!q || !q.archived) return;
  state.questions = state.questions.filter((x) => x.id !== id);
  delete state.answers[id];
  await saveState(state);
  revalidateValidatie();
}

function revalidateBoard(agentId: string) {
  revalidatePath("/scrumbord");
  revalidatePath(`/agents/${agentId}`);
  revalidatePath("/");
}

export async function moveEpic(formData: FormData) {
  await requireAdmin();
  const agentId = String(formData.get("agentId") ?? "");
  const dir = Number(formData.get("dir"));
  if (dir !== 1 && dir !== -1) return;

  const state = await getState();
  const epic = state.epics[agentId];
  if (!epic) return;
  const order = COLUMNS.map((c) => c.key);
  const idx = order.indexOf(epic.column);
  const next = order[Math.min(order.length - 1, Math.max(0, idx + dir))];
  epic.column = next;
  await saveState(state);
  revalidateBoard(agentId);
  revalidatePath("/roadmap");
}

export async function addTask(formData: FormData) {
  await requireAdmin();
  const agentId = String(formData.get("agentId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  if (!agentId || !title) return;

  const state = await getState();
  state.tasks.push({
    id: Math.random().toString(36).slice(2, 10),
    agentId,
    title,
    done: false,
  });
  await saveState(state);
  revalidateBoard(agentId);
}

export async function toggleTask(formData: FormData) {
  await requireAdmin();
  const taskId = String(formData.get("taskId") ?? "");
  const state = await getState();
  const task = state.tasks.find((t) => t.id === taskId);
  if (!task) return;
  task.done = !task.done;
  await saveState(state);
  revalidateBoard(task.agentId);
}

export async function deleteTask(formData: FormData) {
  await requireAdmin();
  const taskId = String(formData.get("taskId") ?? "");
  const state = await getState();
  const task = state.tasks.find((t) => t.id === taskId);
  if (!task) return;
  state.tasks = state.tasks.filter((t) => t.id !== taskId);
  await saveState(state);
  revalidateBoard(task.agentId);
}

function revalidateSprints() {
  revalidatePath("/sprints");
  revalidatePath("/roadmap");
  revalidatePath("/");
}

export async function addStory(formData: FormData) {
  await requireAdmin();
  const agentId = String(formData.get("agentId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const pointsRaw = Number(formData.get("points"));
  if (!agentId || !title) return;

  const state = await getState();
  state.stories.push({
    id: Math.random().toString(36).slice(2, 10),
    agentId,
    title,
    points: Number.isFinite(pointsRaw) && pointsRaw > 0 ? pointsRaw : undefined,
    sprintId: null,
    status: "todo",
  });
  await saveState(state);
  revalidateSprints();
}

/**
 * Story verplaatsen (drag & drop of knoppen): naar een sprint met status,
 * of terug naar de backlog (sprintId null → status weer 'todo').
 */
export async function moveStoryTo(
  storyId: string,
  sprintId: string | null,
  status: StoryStatus
) {
  await requireAdmin();
  if (!["todo", "doing", "done"].includes(status)) return;
  if (sprintId !== null && !SPRINTS.some((s) => s.id === sprintId)) return;

  const state = await getState();
  const story = state.stories.find((s) => s.id === storyId);
  if (!story) return;
  story.sprintId = sprintId;
  story.status = sprintId === null ? "todo" : status;
  await saveState(state);
  revalidateSprints();
}

export async function deleteStoryById(storyId: string) {
  await requireAdmin();
  const state = await getState();
  state.stories = state.stories.filter((s) => s.id !== storyId);
  await saveState(state);
  revalidateSprints();
}

export async function updateEpic(formData: FormData) {
  await requireAdmin();
  const agentId = String(formData.get("agentId") ?? "");
  const column = String(formData.get("column") ?? "") as Column;
  const risk = String(formData.get("risk") ?? "") as Risk;
  const note = String(formData.get("note") ?? "");

  const state = await getState();
  const epic = state.epics[agentId];
  if (!epic) return;
  if (["backlog", "design", "build", "test", "uat", "live"].includes(column)) epic.column = column;
  if (["on-track", "at-risk", "delayed"].includes(risk)) epic.risk = risk;
  epic.note = note.trim();
  await saveState(state);
  revalidatePath("/scrumbord");
  revalidatePath(`/agents/${agentId}`);
  revalidatePath("/roadmap");
  revalidatePath("/");
}
