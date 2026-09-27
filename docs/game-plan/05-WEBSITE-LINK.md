# 05 — Linking the Game and the Website (game agent + website agent)

The game should make people want to visit `eliyadoesnails.vercel.app` and book, **without feeling like an advert**. The rule: **a link only appears after a nice moment** (a finished set, a high friendship level, a discovery), never as a pop-up.

---

## 1. Signature Recipes → "Book this look"

The four Signature looks (`03 §8.5`) are the real looks from the website.

- When a Signature look is delivered with ★★ or more, the result screen shows a second button next to "Continue":
  **"Wear this in real life →"** (Korean subtitle: 실제로 받아보기)
- It opens the website in a **new tab**:
  ```
  https://eliyadoesnails.vercel.app/?look=<websiteLookSlug>&shade=<shadeKey>&art=<artStyleKey>&utm_source=game&utm_medium=signature&utm_campaign=canal_world#book
  ```
- The first time this happens, the Collection Book entry gets a small "Real look ♡" stamp.

### Website agent: tasks
1. Choose stable slugs for the looks and give them to the game agent (proposal: `classic-french-swirls`, `retro-mint-polka`, `blushing-aura-constellation`, `petal-blossom`). The game stores them in `looks.websiteLookSlug`.
2. On page load, read `look`, `shade` and `art` from the URL:
   - pre-select them in the **Live Customizer / Nail Lab**,
   - prefill the reservation form's "Design concept" field (the site already prefills notes from the calculator, so reuse that code path): e.g. "From the Canal World game: Petal Blossom, Cherry Blossom Syrup",
   - scroll to `#book`.
   Ignore unknown values (no errors).
3. **Fix before linking:** the shop shows some looks at both **€18** and **€26 "Introductory Atelier Rate"**. Decide which is correct so the game never links to a confusing price. The game itself **shows no prices** for real services.

## 2. Other gentle links

| Moment in the game | Link |
|---|---|
| The Collection Book "About Eliya" page (the atelier's story, 2–3 lines in her voice) | Website Story section `#story` |
| Pip's 3rd quest unlocks photo mode (Life4Cuts) | "Make a real 인생네컷 at the atelier" → the website's 4-cut section |
| Standing at the AR hand-mannequin pedestal in the atelier | "Try these on your own hands" → the website's AR try-on section |
| Lotte's 3rd quest | A friendly card: "Eliya has a Junior Atelier too" → website junior pricing section. Plain text, no pressure. |
| Pause menu | A small "eliyadoesnails ↗" link + Instagram @eliyadoesnails |

All links: new tab, with `utm_source=game&utm_medium=<moment>`.

## 3. Website → game

Website agent: add a small, quiet entry point:
- In the footer and at the end of the Lookbook: **"Walk through the atelier ↗"** → `https://eliyadoesnails-game.vercel.app/?from=site`.
- The game, when it sees `?from=site`, skips the long intro and shows a one-line welcome.

## 4. Shared catalog (later, after Phase 5)

Goal: the shades, art styles and looks are defined **once** (in Convex), and both the game and the website read them, so a new shade on the website appears in the game automatically.

- The **game repo owns the `convex/` folder** and deploys it. The website does **not** deploy Convex functions.
- Backend agent: add a public read-only HTTP endpoint:
  ```ts
  // convex/http.ts
  import { httpRouter } from "convex/server";
  import { httpAction } from "./_generated/server";
  import { api } from "./_generated/api";
  const http = httpRouter();
  http.route({
    path: "/catalog", method: "GET",
    handler: httpAction(async (ctx) => {
      const c = await ctx.runQuery(api.content.catalogPublic, {}); // shades, artStyles, looks (no player data)
      return new Response(JSON.stringify(c), {
        headers: { "Content-Type": "application/json",
                   "Access-Control-Allow-Origin": "https://eliyadoesnails.vercel.app",
                   "Cache-Control": "public, max-age=300" },
      });
    }),
  });
  export default http;
  ```
  It's served at `https://<deployment>.convex.site/catalog`.
- Website agent: fetch `/catalog` at build time (or on page load, with the current hard-coded data as a fallback) for the Nail Lab swatches and lookbook names.
- **Prices for real services stay on the website only.** The catalog has no euro prices.

## 5. Measuring it

- Vercel Web Analytics on both projects; filter the website traffic by `utm_source=game`.
- In the game, log (to a Convex `events` table: `type, lookKey, createdAt`, with no personal data) when a "Wear this in real life" button is shown and when it's clicked.
