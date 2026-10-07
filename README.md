# cingh-jasdeep.github.io

Minimal personal portfolio: React 19 + Vite + React Compiler, English/ਪੰਜਾਬੀ, light/dark.
All content comes from my LinkedIn profile. **LinkedIn is the single source of truth.**

## Updating the content (after editing LinkedIn)

1. On LinkedIn: **Me → Settings & Privacy → Data privacy → Get a copy of your data**.
   Choose *"Want something in particular?"*, tick **Profile, Positions, Education,
   Projects, Certifications, Skills, Languages, Honors, Volunteering** (whichever are offered),
   then **Request archive**. LinkedIn emails a download link, usually within ~10 minutes.
2. Download the zip, then run:

   ```sh
   npm install
   npm run import:linkedin -- ~/Downloads/Basic_LinkedInDataExport_*.zip
   ```

   This rewrites `src/data/profile.json`. Only public-profile fields are kept;
   address, birth date, connections and messages are ignored. Don't commit the zip
   (it's git-ignored).
3. Review with `npm run dev`, then commit and push. GitHub Actions deploys automatically.

## Things that aren't on LinkedIn

`src/data/site.json` holds site-only extras: the Gurbani line shown above the name, and
optional `photo` / `resumeUrl` (put the files in `public/`, e.g. `"photo": "photo.jpg"`).

## Punjabi

UI text is translated in `src/i18n.ts`. Profile content falls back to English; to translate
any of it, add the same fields to `src/data/profile.pa.json` (arrays match by position), e.g.

```json
{ "headline": "…", "positions": [{ "title": "…" }, null, { "description": "…" }] }
```

Link to a language directly with `?lang=pa`.

## Development

```sh
npm run dev        # local dev server
npm run build      # typecheck + production build into dist/
```

## Hosting

Deployed by `.github/workflows/deploy.yml`. One-time setup: repo **Settings → Pages →
Build and deployment → Source: GitHub Actions**.
