// Inline SVG-illustraties en iconen — zelfstandig, geen externe assets.

export function LogoMark({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <rect x="3" y="13" width="7" height="16" rx="1.5" fill="#5598e7" />
      <rect x="12.5" y="5" width="7" height="24" rx="1.5" fill="#86b6ef" />
      <rect x="22" y="17" width="7" height="12" rx="1.5" fill="#2a78d6" />
    </svg>
  );
}

/** Abstracte skyline (vastgoed-motief) voor hero-headers. Kleur via currentColor. */
export function Skyline({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 520 160" preserveAspectRatio="xMaxYMax meet" aria-hidden>
      <g fill="currentColor">
        <rect x="0" y="96" width="34" height="64" opacity=".35" rx="2" />
        <rect x="40" y="64" width="44" height="96" opacity=".5" rx="2" />
        <rect x="90" y="112" width="30" height="48" opacity=".3" rx="2" />
        <rect x="126" y="40" width="52" height="120" opacity=".65" rx="2" />
        <rect x="184" y="84" width="38" height="76" opacity=".4" rx="2" />
        <rect x="228" y="20" width="58" height="140" opacity=".8" rx="2" />
        <rect x="292" y="70" width="42" height="90" opacity=".5" rx="2" />
        <rect x="340" y="46" width="50" height="114" opacity=".7" rx="2" />
        <rect x="396" y="90" width="34" height="70" opacity=".4" rx="2" />
        <rect x="436" y="30" width="54" height="130" opacity=".9" rx="2" />
        <rect x="496" y="76" width="24" height="84" opacity=".55" rx="2" />
      </g>
      <g fill="var(--page, #fff)" opacity=".25">
        <rect x="240" y="34" width="8" height="8" /><rect x="254" y="34" width="8" height="8" />
        <rect x="240" y="50" width="8" height="8" /><rect x="268" y="50" width="8" height="8" />
        <rect x="254" y="66" width="8" height="8" /><rect x="268" y="34" width="8" height="8" />
        <rect x="448" y="44" width="8" height="8" /><rect x="462" y="44" width="8" height="8" />
        <rect x="448" y="60" width="8" height="8" /><rect x="476" y="60" width="8" height="8" />
        <rect x="462" y="76" width="8" height="8" /><rect x="476" y="44" width="8" height="8" />
        <rect x="138" y="52" width="7" height="7" /><rect x="152" y="52" width="7" height="7" />
        <rect x="138" y="68" width="7" height="7" /><rect x="166" y="68" width="7" height="7" />
      </g>
    </svg>
  );
}

const STROKE = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/** Lijn-icoon per agent/epic. */
export function AgentIcon({ id, size = 22 }: { id: string; size?: number }) {
  const paths: Record<string, React.ReactNode> = {
    "tender-analyse": (
      <>
        <path d="M6 3h8l4 4v6" {...STROKE} />
        <path d="M14 3v4h4" {...STROKE} />
        <circle cx="10" cy="14" r="4" {...STROKE} />
        <path d="M13 17l3.5 3.5" {...STROKE} />
      </>
    ),
    schrijf: (
      <>
        <path d="M4 20l1.2-4.2L15.5 5.5a2 2 0 0 1 2.8 0l.2.2a2 2 0 0 1 0 2.8L8.2 18.8 4 20z" {...STROKE} />
        <path d="M13.5 7.5l3 3" {...STROKE} />
      </>
    ),
    structuur: (
      <>
        <rect x="9" y="3" width="6" height="5" rx="1" {...STROKE} />
        <rect x="3" y="16" width="6" height="5" rx="1" {...STROKE} />
        <rect x="15" y="16" width="6" height="5" rx="1" {...STROKE} />
        <path d="M12 8v4M12 12H6v4M12 12h6v4" {...STROKE} />
      </>
    ),
    toets: (
      <>
        <rect x="5" y="4" width="14" height="17" rx="2" {...STROKE} />
        <path d="M9 4V2.8A.8.8 0 0 1 9.8 2h4.4a.8.8 0 0 1 .8.8V4" {...STROKE} />
        <path d="M8.5 13l2.5 2.5 4.5-5" {...STROKE} />
      </>
    ),
    juridisch: (
      <>
        <path d="M12 4v16M8 20h8" {...STROKE} />
        <path d="M5 7h14" {...STROKE} />
        <path d="M5 7l-2.5 6a3 3 0 0 0 5 0L5 7zM19 7l-2.5 6a3 3 0 0 0 5 0L19 7z" {...STROKE} />
      </>
    ),
    learning: (
      <>
        <circle cx="12" cy="12" r="3" {...STROKE} />
        <circle cx="5" cy="5" r="1.6" {...STROKE} />
        <circle cx="19" cy="5" r="1.6" {...STROKE} />
        <circle cx="5" cy="19" r="1.6" {...STROKE} />
        <circle cx="19" cy="19" r="1.6" {...STROKE} />
        <path d="M6.2 6.2l3.6 3.6M17.8 6.2l-3.6 3.6M6.2 17.8l3.6-3.6M17.8 17.8l-3.6-3.6" {...STROKE} />
      </>
    ),
    academy: (
      <>
        <path d="M2.5 9L12 4.5 21.5 9 12 13.5 2.5 9z" {...STROKE} />
        <path d="M6.5 11v5c0 1.4 2.5 2.8 5.5 2.8s5.5-1.4 5.5-2.8v-5" {...STROKE} />
        <path d="M21.5 9v5" {...STROKE} />
      </>
    ),
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      {paths[id] ?? <circle cx="12" cy="12" r="8" {...STROKE} />}
    </svg>
  );
}
