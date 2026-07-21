import { cookies } from "next/headers";

export type Role = "admin" | "client";

export const ROLE_COOKIE = "portal_role";

export function adminPassword(): string {
  return process.env.PORTAL_ADMIN_PASSWORD || "aigroup-demo";
}

export function clientPassword(): string {
  return process.env.PORTAL_CLIENT_PASSWORD || "blauwhoed-demo";
}

export async function currentRole(): Promise<Role | null> {
  const store = await cookies();
  const v = store.get(ROLE_COOKIE)?.value;
  return v === "admin" || v === "client" ? v : null;
}

export async function requireRole(): Promise<Role> {
  const role = await currentRole();
  if (!role) throw new Error("Niet ingelogd");
  return role;
}

export async function requireAdmin(): Promise<void> {
  const role = await currentRole();
  if (role !== "admin") throw new Error("Alleen AI-Group (beheerder) mag dit aanpassen");
}
