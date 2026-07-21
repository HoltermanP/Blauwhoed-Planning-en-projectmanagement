# Blauwhoed × AI-Group — Projectportal

Projectplanning-portal voor het Blauwhoed Agentic Platform (acquisitieproces):
dashboard, roadmap (Gantt), scrumbord met 7 epics (6 agents + Academy),
validatievragen met invulformulieren, documentenhub en SLA-overzicht.

## Lokaal draaien

```bash
npm install
npm run dev          # http://localhost:3000
```

Inloggen (demo-wachtwoorden, override via `.env`):

| Rol | Wachtwoord (default) | Rechten |
|---|---|---|
| AI-Group (beheerder) | `aigroup-demo` | status/kolom/risico bijwerken, notities, antwoord-status |
| Blauwhoed (klant) | `blauwhoed-demo` | alles inzien, validatievragen beantwoorden, feedback plaatsen |

Zonder `DATABASE_URL` wordt state lokaal opgeslagen in `.data/state.json`.

## Deploy naar Vercel

1. `git init && git add -A && git commit -m "Portal v0.1"` en push naar GitHub.
2. Importeer de repo op vercel.com (framework: Next.js, geen extra config nodig).
3. Maak een gratis [Neon](https://neon.tech)-project en zet in Vercel de env vars:
   - `DATABASE_URL` — Neon connection string (vereist op Vercel; het bestandssysteem is daar niet persistent)
   - `PORTAL_ADMIN_PASSWORD` en `PORTAL_CLIENT_PASSWORD` — sterke wachtwoorden
   - `CRON_SECRET` — willekeurige string voor de digest-cron
4. Kies desgewenst het domein `blauwhoed-portal.vercel.app` onder Settings → Domains.

De tabel `portal_state` wordt automatisch aangemaakt bij het eerste gebruik.

## Weekly digest

`GET /api/digest` levert de weekstatus als JSON (agents, blockers, milestones
komende 14 dagen, open validatievragen, recente feedback). Voor een wekelijkse
e-mail: voeg in `vercel.json` een cron toe die dit endpoint aanroept met
`Authorization: Bearer $CRON_SECRET` en stuur het resultaat door via bijv.
[Resend](https://resend.com). Bewust nog niet aangesloten — keuze voor
mailprovider en afzenderdomein ligt bij Patrick.

## Architectuurkeuzes

- **Auth:** lichtgewicht wachtwoord-per-rol met httpOnly-cookie (`middleware.ts`,
  `lib/auth.ts`). Bewust simpel gehouden voor de eerste iteratie; het is
  voorbereid op vervanging door **Clerk** (rollen `admin`/`client` zitten al in
  de datalaag — alleen `lib/auth.ts`, `middleware.ts` en de login-actie hoeven
  dan vervangen te worden).
- **Persistentie:** één `jsonb`-document in Neon (`lib/store.ts`) met
  file-fallback voor development. Ruim voldoende voor dit gebruiksvolume;
  makkelijk te normaliseren naar losse tabellen als het portal groeit.
- **Statische content** (agents, fasering, documenten, SLA, contacten) staat in
  `lib/content.ts` — één plek om planning en teksten bij te werken.
- **Kleuren/status:** gevalideerd dataviz-palet; status altijd icoon + label,
  nooit kleur alleen. Light & dark mode.

## Nog in te vullen door Patrick

- Definitieve fasering per agent (nu: onderbouwde aanname met gespreide builds —
  pas aan in `lib/content.ts` → `AGENTS[].phases`)
- Risk register en success criteria verfijnen (zelfde bestand)
- Documenten uploaden/koppelen (nu placeholders "volgt")
- Weekly update-cadans + mailprovider voor de digest
- Echte wachtwoorden en `DATABASE_URL` in Vercel
