"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const S = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const ICONS: Record<string, React.ReactNode> = {
  dashboard: (
    <>
      <rect x="3" y="3" width="7.5" height="7.5" rx="1.5" {...S} />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" {...S} />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" {...S} />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" {...S} />
    </>
  ),
  roadmap: (
    <>
      <path d="M4 6h9M4 12h13M4 18h7" {...S} />
      <circle cx="17" cy="6" r="1.4" {...S} />
      <circle cx="20" cy="12" r="1.4" {...S} />
      <circle cx="14.5" cy="18" r="1.4" {...S} />
    </>
  ),
  scrumbord: (
    <>
      <rect x="3" y="4" width="5" height="16" rx="1.2" {...S} />
      <rect x="9.5" y="4" width="5" height="11" rx="1.2" {...S} />
      <rect x="16" y="4" width="5" height="7" rx="1.2" {...S} />
    </>
  ),
  sprints: (
    <>
      <path d="M20 12a8 8 0 1 1-2.34-5.66" {...S} />
      <path d="M18 2.5v4h-4" {...S} />
      <path d="M9.5 12.5l2 2 3.5-4" {...S} />
    </>
  ),
  validatie: (
    <>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4h-1A2.5 2.5 0 0 1 4 13.5v-8z" {...S} />
      <path d="M9.8 8.2a2.2 2.2 0 1 1 3 2.05c-.7.28-.8.75-.8 1.25" {...S} />
      <path d="M12 14h.01" {...S} />
    </>
  ),
  documenten: (
    <>
      <path d="M6 2.5h8l4 4V19a2.5 2.5 0 0 1-2.5 2.5h-7A2.5 2.5 0 0 1 6 19V2.5z" {...S} />
      <path d="M14 2.5v4h4" {...S} />
      <path d="M9 12h6M9 16h6" {...S} />
    </>
  ),
  sla: (
    <>
      <path d="M12 2.8l7.5 3v5.4c0 4.9-3.2 8.5-7.5 10-4.3-1.5-7.5-5.1-7.5-10V5.8l7.5-3z" {...S} />
      <path d="M8.8 12l2.3 2.3 4.2-4.6" {...S} />
    </>
  ),
};

const LINKS = [
  { href: "/", label: "Dashboard", icon: "dashboard" },
  { href: "/roadmap", label: "Roadmap", icon: "roadmap" },
  { href: "/scrumbord", label: "Scrumbord", icon: "scrumbord" },
  { href: "/sprints", label: "Sprints", icon: "sprints" },
  { href: "/validatie", label: "Validatievragen", icon: "validatie" },
  { href: "/documenten", label: "Documenten", icon: "documenten" },
  { href: "/sla", label: "SLA & Beheer", icon: "sla" },
];

export default function Nav() {
  const pathname = usePathname();
  return (
    <nav>
      {LINKS.map((l) => {
        const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
        return (
          <Link key={l.href} href={l.href} className={active ? "active" : undefined}>
            <svg width="19" height="19" viewBox="0 0 24 24" aria-hidden>
              {ICONS[l.icon]}
            </svg>
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
