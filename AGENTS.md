<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules

- Maps use MapLibre GL, loaded only in the browser through `src/lib/maplibre.ts` (dynamic import + bundled worker URL, shared basemap style, max zoom, ResizeObserver, HTML pin elements styled with Sahn tokens); never Google Maps. Every map view renders a calm fallback if loading fails, so the list stays usable.
- All interface text lives in the `en`/`ml`/`ar` dictionaries in `src/lib/i18n.tsx`, and site data carries all three languages; use logical spacing/position utilities (`ps`, `pe`, `start`, `end`, `ms`, `me`) so Arabic RTL mirrors without extra code.
- Form validation lives in `src/lib/submission.ts` as zod schemas whose messages are i18n keys, so rules stay testable and translated in one place.
- Display preferences (e.g. quote visibility while exploring the map) live in `src/lib/preferences.tsx` on the visitor's device, with pure helpers (`shouldShowQuote`, `parsePreferences`) so behaviour stays testable; the Settings sheet is the only place they are edited.
- Ambient audio is mounted once inside the root's i18n provider; its device-local pause/mute preferences live in `src/lib/audio.ts` and are edited by the player so navigation never restarts playback.
- Steward progress (visits, kept sites, submissions, corrections) is stored on the visitor's device via `src/lib/steward.tsx` until a backend exists; badge thresholds live only in `src/lib/badges.ts`.
