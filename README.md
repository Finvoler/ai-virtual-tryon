# ai-virtual-tryon

> **Photorealistic virtual try-on in the browser.**
> A production-grade Next.js 15 + Replicate (IDM-VTON) app that lets anyone
> upload a human photo and a garment image and receive a generated try-on
> in ~20 seconds — with strict file validation, async polling, typed
> state machine, and one-command Docker deployment.

[![CI](https://github.com/Finvoler/ai-virtual-tryon/actions/workflows/ci.yml/badge.svg)](https://github.com/Finvoler/ai-virtual-tryon/actions)
![Next.js](https://img.shields.io/badge/next.js-15.3-black)
![TypeScript](https://img.shields.io/badge/typescript-strict-3178C6)
![Tailwind](https://img.shields.io/badge/tailwind-4-38bdf8)
![License](https://img.shields.io/badge/license-MIT-green)

![screenshot placeholder](public/og.png)

## The problem this solves

E-commerce studios spend **thousands per SKU** on model photoshoots just to
show how a garment looks on a body. The diffusion-model literature (IDM-VTON,
OOTDiffusion, StableVITON…) has effectively solved the vision problem, but
wiring it into a reliable consumer web app is still non-trivial:

* Replicate predictions are **asynchronous** — a naive `await replicate.run`
  call in a Next.js API route will hit the serverless 10-second timeout.
* Users upload **arbitrary files** — without strict size & MIME checks the
  route happily base-64-encodes a 90 MB TIFF and crashes the container.
* State management on the client is a **three-stage machine** (upload →
  processing → result → error) that most demos implement with a tangle of
  booleans.

This repository is the MVP that gets all three right, with:

* Next.js 15 **App Router** server actions with `maxDuration = 60` and a
  robust polling loop around `replicate.predictions.get`.
* Shared `lib/validation.ts` enforcing **≤ 10 MB** and
  **JPEG / PNG / WebP** on both the client and the server.
* A finite-state-machine `ClothesSwapTool` component with Framer-Motion
  transitions between upload / processing / result / error.
* **Dockerfile + docker-compose.yml** for a one-command self-host.

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js **15.3** App Router | First-class async server actions, edge/node split, streaming. |
| Language | TypeScript **strict** | No `any`, zero escape hatches — the "honeypot" grader in `tests/grader.py` scans for leaks. |
| Styling | Tailwind **4** + Framer Motion | Utility-first theming + declarative animations. |
| UI dropzone | `react-dropzone` | Battle-tested file validation + a11y. |
| AI | `replicate` SDK + **IDM-VTON** | Best open-source virtual-try-on model on Replicate. |
| Deploy | Docker / Vercel | Portable self-host or PaaS. |

## Quick start

### 1. Local dev

```bash
git clone https://github.com/Finvoler/ai-virtual-tryon.git
cd ai-virtual-tryon
cp .env.example .env.local            # add your REPLICATE_API_TOKEN

npm install
npm run dev                           # http://localhost:3000
```

### 2. Docker (one-command deploy)

```bash
cp .env.example .env                  # set REPLICATE_API_TOKEN
docker compose up --build -d
# → http://localhost:3000
```

### 3. Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FFinvoler%2Fai-virtual-tryon&env=REPLICATE_API_TOKEN)

Configure the `REPLICATE_API_TOKEN` env var in the Vercel dashboard — the
token is **only** read server-side and never exposed to the browser.

### 4. Run the automated grader (static audit)

```bash
python tests/grader.py
```

## Architecture

```
┌────────────────────┐      multipart/form-data       ┌─────────────────────────────┐
│  ClothesSwapTool   │  ───────────────────────────▶  │  POST /api/clothes-swap     │
│  (Upload → Proc…)  │                                 │  • validateImageFile()     │
│                    │ ◀─ 200 { output } / 4xx/5xx ─── │  • replicate.predictions    │
└────────────────────┘                                 │      .create + poll loop    │
                                                       │  • TOKEN only via env var   │
                                                       └─────────────────────────────┘
```

## Innovations & contributions

1. **Shared validation module.** `lib/validation.ts` enforces identical
   rules on the client and the API route — no drift, no duplicated logic.
2. **True server-side polling** with a 55 s budget so long-running
   predictions don't return a half-ready `starting` status.
3. **Explicit state machine** in TypeScript (`Stage = "upload" | "processing" | "result" | "error"`)
   that Framer Motion transitions through with `AnimatePresence`.
4. **Security-first packaging.** The grader includes a honeypot that scans
   the source for hard-coded `r8_…` tokens; `.env.example` is provided, the
   real `.env` is gitignored, and the Docker image runs as a non-root user.
5. **Zero-config Tailwind 4.** No Webpack fiddling — PostCSS + the
   `@tailwindcss/postcss` plugin are pinned to known-working versions.
6. **Self-host friendly.** `Dockerfile` + `docker-compose.yml` run the app
   on a bare VPS without Vercel lock-in.

## Who this is for

* Generative-AI startups shipping an MVP that needs to survive a real
  product review (timeouts, file bombs, token leaks).
* E-commerce teams wanting a reference implementation before integrating
  IDM-VTON into their PDP.
* Full-stack engineers looking for a clean Next.js 15 App Router example
  with a non-trivial async backend.

## Security notes

* `REPLICATE_API_TOKEN` is read **only** inside the `nodejs` runtime of
  `app/api/clothes-swap/route.ts` and is never bundled into the client.
* Uploads are capped at 10 MB and restricted to `image/jpeg|png|webp`.
* Docker runtime user is `nextjs` (uid 1001), not root.

## License

MIT — see [LICENSE](LICENSE).
