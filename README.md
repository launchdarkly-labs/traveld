# TraveLD

TraveLD is a **demo vacation travel blog** used to teach **LaunchDarkly experiments**: paywalls, free-tier limits, messaging variations, and a fake checkout. Accounts and “payments” are **browser-local only**—suitable for workshops, not production.

## Quick start

```bash
cd /Users/briannorman/workspace/traveld
npm install
cp .env.example .env.local
```

Add your **Client-side ID** to `.env.local` as `NEXT_PUBLIC_LAUNCHDARKLY_CLIENT_SIDE_ID`. Without it, the app still runs but uses **built-in default flag values** (everything behaves like the control experience).

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Content

Ten realistic sample articles live in [`/Users/briannorman/workspace/traveld/content/articles.json`](/Users/briannorman/workspace/traveld/content/articles.json). Each post has an `intro` plus structured `sections` so a **partial-article** paywall can show a teaser without exposing the full article.

## Demo auth and tiers

- **Anonymous:** stable random key in `localStorage` (`traveld_ld_anon`) used as the LaunchDarkly context `key` with `tier: anonymous`.
- **Free / paid:** created via **Sign up** (free) or **Upgrade** (sets `paid` after fake checkout). Stored under `traveld_users` / `traveld_session`.

Passwords are stored **in plain text** in `localStorage` for simplicity. **Do not reuse real passwords.**

## LaunchDarkly flags (create these in your project)

Use LaunchDarkly project **`trave-ld-demo-app`** (or mirror the same flag keys/values in your own project). The React SDK is configured with **`useCamelCaseFlagKeys: false`**, so flag keys in code match the dashboard **exactly** (kebab-case).

| Flag key | Type | Variations / values | Purpose |
|----------|------|----------------------|---------|
| `pay-wall` | String / multivariate | `no_paywall`, `hide_full_article`, `hide_partial_article` | **Pay wall** (anonymous readers): off, full-article gate, or blurred partial + CTA |
| `free-daily-article-limit` | String / multivariate | `control`, `limit_2_per_day` | **Experiment 2:** free accounts limited to **2 distinct full article views per calendar day** |
| `upgrade-messaging` | String / multivariate | `default`, `urgency`, `social_proof` | **Experiment 3:** copy on gates and daily-limit prompt |
| `checkout-layout` | Boolean | `true` / `false` | Optional **fourth demo:** alternate fake checkout layout on `/upgrade` |
| `all-articles-tile-layout` | Boolean | `true` / `false` | **All articles:** tile grid on `/articles` instead of stacked rows (default **off**) |
| `traveld-ld-admin` | Boolean | `true` / `false` | **LD Admin** in-app debug panel (context, evaluations, events). Default **off**; turn **on** in LD when you need it. |

### Precedence (how the demo behaves)

1. If **`pay-wall`** is **`no_paywall`**, **anonymous** readers see **full articles** (same as pay wall off). **`free-daily-article-limit`** can still cap **free** accounts when set to **`limit_2_per_day`**.
2. If **`pay-wall`** is **`hide_full_article`**, **anonymous** users see a **sign-up gate** instead of the article body.
3. If **`pay-wall`** is **`hide_partial_article`**, **anonymous** users see the **intro** plus a blurred preview and a sign-up call to action.
4. **Paid** users are never subject to the daily article cap.

**`pay-wall`:** already created in **`trave-ld-demo-app`** via MCP; turn flag **on** per environment and adjust targeting/fallthrough when you want to test. Otherwise create a multivariate string flag with the same key and variation **values** (variation display names can differ).

## Custom events (for LaunchDarkly metrics)

The app calls `track()` when a LaunchDarkly client exists (see [`/Users/briannorman/workspace/traveld/src/lib/track.ts`](/Users/briannorman/workspace/traveld/src/lib/track.ts)). Suggested metric hooks:

| Event | When | Useful properties |
|-------|------|---------------------|
| `article_view` | First render of an article for a given `surface` | `slug`, `surface` (`full` \| `preview` \| `blocked` \| `limit`), `pay_wall`, `user_tier`, `source` |
| `paywall_shown` | Anonymous paywall visible (full block or partial teaser) | `slug` |
| `create_account_clicked` | Any “create account” path toward `/signup` | `source` (`header` \| `hero` \| `login_prompt` \| `account_anonymous` \| `paywall`), optional `slug` on articles |
| `paywall_cta_clicked` | Click signup or log in on a paywall | `slug`, `cta`: `signup` \| `login` |
| `upgrade_prompt_shown` | Daily limit wall shown | `reason`, `slug` |
| `account_created` | Successful sign-up | `tier: free` |
| `daily_limit_reached` | Free user hit the 2-article-per-day cap | `slug` |
| `checkout_started` | Fake checkout submit begins | `plan` |
| `checkout_completed` | Fake checkout completes | `plan` |

Create **funnel metrics** in LaunchDarkly from these events (e.g. primary: `checkout_completed`, guardrails: bounce or errors if you add them later).

## Targeting ideas

- **Anonymous-only paywall test:** segment where `tier` **is one of** `anonymous` (or `loggedIn` custom attribute if you add one).
- **Free-only upgrade pressure:** `tier` equals `free` **and** `free-daily-article-limit` is not `control`.

Context fields sent today: `key`, `email` (if logged in), `tier` (`anonymous` \| `free` \| `paid`), `accountCreatedAt` (if logged in).

## Production-ish auth (optional)

To swap demo auth for **Clerk**, **Auth0**, or **Supabase**, replace [`/Users/briannorman/workspace/traveld/src/context/session.tsx`](/Users/briannorman/workspace/traveld/src/context/session.tsx) with their session model and continue building `LDContext` in [`/Users/briannorman/workspace/traveld/src/lib/ld-context.ts`](/Users/briannorman/workspace/traveld/src/lib/ld-context.ts): stable `key`, plus `tier` (and any segments you need).

## Flag flash

Article pages show a short **skeleton** until `useLDClient()` is defined, so users are less likely to see the wrong paywall state for a frame while the client initializes.

## Key source files

- [`/Users/briannorman/workspace/traveld/src/lib/article-policy.ts`](/Users/briannorman/workspace/traveld/src/lib/article-policy.ts) — paywall + daily limit rules
- [`/Users/briannorman/workspace/traveld/src/components/ArticleExperience.tsx`](/Users/briannorman/workspace/traveld/src/components/ArticleExperience.tsx) — article UI + instrumentation
- [`/Users/briannorman/workspace/traveld/src/components/LaunchDarklyWrapper.tsx`](/Users/briannorman/workspace/traveld/src/components/LaunchDarklyWrapper.tsx) — `LDProvider` + context from session

## Other experiment ideas (for your deck)

- Homepage hero multivariate (signups vs first article click).
- Boolean **“Trip planner teaser”** banner with `planner_cta_clicked` metric.
- Related articles strip: control vs recommendations (`related_click`).
- Sticky upgrade bar vs modal-only upgrade prompts.

---

Built with [Next.js](https://nextjs.org/) (App Router), TypeScript, Tailwind CSS v4, and [`launchdarkly-react-client-sdk`](https://docs.launchdarkly.com/sdk/client-side/react/react-web).
