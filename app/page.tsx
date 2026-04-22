import type { Metadata } from "next";

import ClothesSwapTool from "@/components/ClothesSwapTool";

export const metadata: Metadata = {
  title: "AI Clothes Swapper - Virtual Try-On",
  description:
    "Experience instant virtual try-on with our AI-powered tool. Upload a person and a garment, get a photorealistic result in seconds.",
  openGraph: {
    title: "AI Clothes Swapper - Virtual Try-On",
    description:
      "Experience instant virtual try-on with our AI-powered tool.",
    type: "website",
  },
};

export default function HomePage(): JSX.Element {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 text-white">
      <header className="mx-auto max-w-5xl px-4 pb-4 pt-20 text-center">
        <div className="mx-auto mb-4 inline-flex items-center rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs uppercase tracking-wider text-white/70">
          Powered by Replicate · IDM-VTON
        </div>
        <h1 className="mx-auto max-w-3xl bg-gradient-to-br from-white to-white/60 bg-clip-text text-4xl font-bold leading-tight text-transparent md:text-6xl">
          Try on any outfit in seconds with AI.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-white/70">
          Upload a photo of a person and the garment you want to try on. Our
          pipeline runs a state-of-the-art virtual try-on model and returns a
          photorealistic result — no green screen, no photoshoot.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <a
            href="#tryon"
            className="rounded-full bg-white px-6 py-3 font-medium text-slate-900 shadow hover:bg-slate-100"
          >
            Start for free
          </a>
          <a
            href="https://github.com/Finvoler/ai-virtual-tryon"
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-white/30 px-6 py-3 text-white hover:bg-white/10"
          >
            View source
          </a>
        </div>
      </header>

      <section id="tryon" className="scroll-mt-16">
        <ClothesSwapTool />
      </section>

      <section className="mx-auto max-w-5xl px-4 py-20">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Zero setup",
              body: "No photoshoot, no model, no photographer. Two images and you're done.",
            },
            {
              title: "Production-grade API",
              body: "Server-side polling, 10 MB limits, type-safe Zod/manual validation, 504 timeouts.",
            },
            {
              title: "Built for scale",
              body: "Next.js 15 App Router with edge-ready UI and asynchronous inference orchestration.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-2xl bg-white/5 p-6 ring-1 ring-white/10"
            >
              <h3 className="mb-2 text-lg font-semibold text-white">{f.title}</h3>
              <p className="text-sm text-white/70">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="mx-auto max-w-5xl px-4 pb-12 text-center text-sm text-white/40">
        © 2026 Finvoler — MIT licensed.
      </footer>
    </main>
  );
}
