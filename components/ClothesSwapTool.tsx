"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useCallback, useState } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";

import { cn } from "@/lib/utils";
import {
  DEFAULT_ALLOWED,
  DEFAULT_MAX_BYTES,
  validateImageFile,
} from "@/lib/validation";

// ---------------------------------------------------------------------
type Stage = "upload" | "processing" | "result" | "error";

type SwapState = {
  stage: Stage;
  person: File | null;
  garment: File | null;
  personUrl: string | null;
  garmentUrl: string | null;
  resultUrl: string | null;
  errorMessage: string | null;
};

const initial: SwapState = {
  stage: "upload",
  person: null,
  garment: null,
  personUrl: null,
  garmentUrl: null,
  resultUrl: null,
  errorMessage: null,
};

// ---------------------------------------------------------------------
interface DropSlotProps {
  label: string;
  hint: string;
  file: File | null;
  previewUrl: string | null;
  onFile: (f: File) => void;
  onError: (m: string) => void;
}

function DropSlot({ label, hint, file, previewUrl, onFile, onError }: DropSlotProps) {
  const onDrop = useCallback(
    (accepted: File[], rejected: FileRejection[]) => {
      if (rejected.length > 0) {
        const reason = rejected[0].errors?.[0]?.message ?? "File rejected.";
        onError(reason);
        return;
      }
      const next = accepted[0];
      if (!next) return;
      const err = validateImageFile(next);
      if (err) {
        onError(err);
        return;
      }
      onFile(next);
    },
    [onFile, onError],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    maxSize: DEFAULT_MAX_BYTES,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
    },
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "group relative flex h-72 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed bg-white/5 p-4 text-center transition",
        isDragActive ? "border-fuchsia-400 bg-fuchsia-500/10" : "border-white/20 hover:border-white/40",
      )}
    >
      <input {...getInputProps()} />
      {previewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={previewUrl}
          alt={label}
          className="h-full w-full rounded-xl object-contain"
        />
      ) : (
        <div className="flex flex-col items-center gap-2 text-white/70">
          <div className="text-lg font-semibold text-white">{label}</div>
          <div className="text-sm">{hint}</div>
          <div className="text-xs text-white/50">JPEG / PNG / WebP · up to 10&nbsp;MB</div>
        </div>
      )}
      {file && (
        <span className="absolute right-3 top-3 rounded-full bg-emerald-500/90 px-2 py-0.5 text-xs font-medium text-white">
          ready
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------
export default function ClothesSwapTool() {
  const [state, setState] = useState<SwapState>(initial);

  const updateFile = (key: "person" | "garment") => (file: File) => {
    const url = URL.createObjectURL(file);
    setState((s) => ({
      ...s,
      [key]: file,
      [`${key}Url`]: url,
      errorMessage: null,
    }));
  };

  const setError = (msg: string) =>
    setState((s) => ({ ...s, stage: "error", errorMessage: msg }));

  const reset = () => setState(initial);

  // --- submit ---------------------------------------------------------
  async function handleSubmit(): Promise<void> {
    if (!state.person || !state.garment) {
      setError("Please upload both a person image and a garment image.");
      return;
    }
    setState((s) => ({ ...s, stage: "processing", errorMessage: null }));

    const form = new FormData();
    form.append("person", state.person);
    form.append("garment", state.garment);

    try {
      const resp = await fetch("/api/clothes-swap", { method: "POST", body: form });
      const data: { output?: string; error?: string; detail?: string } = await resp.json();
      if (!resp.ok || !data.output) {
        setError(data.error ?? `Server returned ${resp.status}`);
        return;
      }
      setState((s) => ({ ...s, stage: "result", resultUrl: data.output ?? null }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Network error.";
      setError(msg);
    }
  }

  // --- render ---------------------------------------------------------
  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-12">
      <AnimatePresence mode="wait">
        {state.stage === "upload" && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col gap-6"
          >
            <div className="grid gap-6 md:grid-cols-2">
              <DropSlot
                label="1. Human image"
                hint="Drag a full-body photo here or click to browse."
                file={state.person}
                previewUrl={state.personUrl}
                onFile={updateFile("person")}
                onError={setError}
              />
              <DropSlot
                label="2. Garment image"
                hint="Drag the clothing photo here."
                file={state.garment}
                previewUrl={state.garmentUrl}
                onFile={updateFile("garment")}
                onError={setError}
              />
            </div>
            <button
              onClick={handleSubmit}
              disabled={!state.person || !state.garment}
              className={cn(
                "mx-auto rounded-full bg-gradient-to-r from-fuchsia-500 to-indigo-500 px-10 py-3 font-semibold text-white shadow-lg transition",
                (!state.person || !state.garment) && "cursor-not-allowed opacity-40",
              )}
            >
              Try it on →
            </button>
          </motion.div>
        )}

        {state.stage === "processing" && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center gap-6 py-24 text-center text-white"
          >
            <motion.div
              aria-label="loading"
              className="h-16 w-16 rounded-full border-4 border-white/20 border-t-fuchsia-400"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            />
            <p className="text-lg">AI is trying on clothes…</p>
            <p className="text-sm text-white/60">
              IDM-VTON usually takes 15–30&nbsp;seconds. Please keep this tab open.
            </p>
          </motion.div>
        )}

        {state.stage === "result" && state.resultUrl && (
          <motion.div
            key="result"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col gap-6"
          >
            <div className="grid gap-4 md:grid-cols-3">
              {[
                { label: "Person", url: state.personUrl },
                { label: "Garment", url: state.garmentUrl },
                { label: "Result", url: state.resultUrl },
              ].map((item) => (
                <div key={item.label} className="flex flex-col items-center gap-2">
                  <span className="text-sm font-medium uppercase tracking-wider text-white/60">
                    {item.label}
                  </span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.url ?? ""}
                    alt={item.label}
                    className="h-72 w-full rounded-2xl object-contain shadow-lg ring-1 ring-white/10"
                  />
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <a
                href={state.resultUrl}
                download="tryon.png"
                className="rounded-full bg-white px-6 py-2 font-medium text-slate-900 shadow hover:bg-slate-100"
              >
                Download result
              </a>
              <button
                onClick={reset}
                className="rounded-full border border-white/30 px-6 py-2 text-white hover:bg-white/10"
              >
                Try another outfit
              </button>
            </div>
          </motion.div>
        )}

        {state.stage === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mx-auto max-w-lg rounded-2xl bg-rose-500/20 p-6 text-center text-rose-100"
          >
            <div className="mb-2 text-lg font-semibold">Something went wrong</div>
            <p className="mb-4 text-sm">{state.errorMessage}</p>
            <button
              onClick={reset}
              className="rounded-full bg-white px-6 py-2 font-medium text-slate-900"
            >
              Start over
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
