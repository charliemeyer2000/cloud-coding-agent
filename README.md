# Cloud Coding Agent with a Desktop

A coding agent that works inside a real cloud computer. Every chat spawns a
sandboxed Linux VM with a desktop and Chromium; you talk to the agent on the
left and watch it work — running commands, driving the browser — in a live
desktop stream on the right. Chats live in a sidebar, each with its own
sandbox, and survive refreshes.

![Demo: the agent builds and serves a landing page, opens it in Chrome on its own desktop, verifies it with screenshots, then iterates on it](docs/demo.gif)

<sub>4× speed. The agent plans (expandable reasoning), writes and serves a
page, opens it in Chrome — watched live in the right pane — screenshots it to
verify, and handles a follow-up change. Higher-quality
[mp4 here](docs/demo.mp4).</sub>

The baseline agent here is **intentionally minimal**: a naive loop, a
four-line prompt, a handful of single-purpose tools, no error recovery, no
verification, and a deliberately simple UI. That's the starting point. Making
it good — the agent's policy, its recovery behavior, the product experience —
is the work.

## Run it locally

### Pre-Requisites

Ensure you have all of the required environment variables ready in a `.env.local` file (refer to the `.env.example`). If you need to create the resources, head to the [Deploy](#deploy-vercel) section.

```bash
cp .env.example .env.local   # then fill in the four keys (see comments inside)
pnpm install
pnpm dev
```

That's it. `pnpm dev` migrates the database and seeds a dev user first, and
the app auto-signs you in as that user locally so you can test immediately (see `/scripts/seed.ts`).
Open http://localhost:3000, hit **+ New chat**, and tell the agent to build
something.

You'll need (all free-tier friendly):

- an Anthropic API key — platform.claude.com
- an E2B API key — e2b.dev
- a Neon Postgres URL — console.neon.tech (create a project, copy the pooled
  connection string). You can also create one with the Vercel Marketplace/Vercel CLI
- any random string for the auth secret

## Deploy (Vercel)

One click (requires the repo to be public, since Vercel clones it):

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fcharliemeyer2000%2Fcloud-coding-agent&project-name=cloud-coding-agent&repository-name=cloud-coding-agent&env=ANTHROPIC_API_KEY%2CE2B_API_KEY%2CBETTER_AUTH_SECRET&envDescription=Anthropic+API+key+%28console.anthropic.com%29%2C+E2B+API+key+%28e2b.dev%29%2C+and+any+random+string+for+the+auth+secret.+The+Neon+database+is+provisioned+automatically.&envLink=https%3A%2F%2Fgithub.com%2Fcharliemeyer2000%2Fcloud-coding-agent%2Fblob%2Fmain%2F.env.example&products=%5B%7B%22type%22%3A%22integration%22%2C%22protocol%22%3A%22storage%22%2C%22productSlug%22%3A%22neon%22%2C%22integrationSlug%22%3A%22neon%22%7D%5D)

The flow provisions a **Neon Postgres** database (if not already provisioned earlier!) from the Vercel Marketplace
(`DATABASE_URL` is injected automatically into your Vercel environment variables) and prompts
for the three keys. Migrations run during the build.

You can also create & deploy from the Vercel CLI:

```bash
vercel link
vercel install neon
vercel env add ANTHROPIC_API_KEY production
vercel env add E2B_API_KEY production
openssl rand -base64 32 | vercel env add BETTER_AUTH_SECRET production
vercel deploy --prod
```

In production there's no seeded user, so just sign up on the login page. Anyone who
can reach the URL can sign up and use your API keys, so keep the URL private
or enable Vercel Deployment Protection.

## Scripts

| script                   | what it does                             |
| ------------------------ | ---------------------------------------- |
| `pnpm dev`               | migrate + seed + run the app locally     |
| `pnpm build` / `start`   | production build / serve                 |
| `pnpm lint` / `lint:fix` | Biome lint + Prettier check / fix        |
| `pnpm format`            | format everything                        |
| `pnpm typecheck`         | strict TypeScript                        |
| `pnpm db:generate`       | generate a migration from schema changes |
| `pnpm db:migrate`        | apply migrations                         |
| `pnpm db:seed`           | create the local dev user (idempotent)   |
| `pnpm db:studio`         | browse the database                      |

## Stack

Next.js App Router with strict TypeScript. Neon Postgres and Drizzle for
data, better-auth for sessions. The agent uses the AI SDK with Anthropic —
swap the model in `src/agent/model.ts` if you want something else.
Sandboxes are E2B Desktop. Biome and Prettier for lint/format, pnpm, and
Vercel to deploy.
