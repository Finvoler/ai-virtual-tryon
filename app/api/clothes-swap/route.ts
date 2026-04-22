"use server";

// app/api/clothes-swap/route.ts
//
// POST /api/clothes-swap
// ----------------------
// multipart/form-data body:
//   person  : File  (<=10MB, image/jpeg|png|webp)
//   garment : File  (<=10MB, image/jpeg|png|webp)
//
// Runs Replicate's `cuuupid/idm-vton` model and returns the result URL.

import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";

import { validateImageFile } from "@/lib/validation";

export const runtime = "nodejs";
export const maxDuration = 60; // seconds

// Pinned model version — bump when you want a newer checkpoint.
const IDM_VTON_MODEL =
  "cuuupid/idm-vton:c871bb9b046607b680449ecbae55fd8c6d945e0a1948644bf2361b3d021d3ff4";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

type ApiResponse =
  | { output: string; id: string }
  | { error: string; detail?: string };

// ----------------------------------------------------------------------
async function fileToDataUrl(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  return `data:${file.type};base64,${base64}`;
}

// ----------------------------------------------------------------------
export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "Server misconfigured: REPLICATE_API_TOKEN is missing." },
      { status: 500 },
    );
  }

  // --- Parse multipart ------------------------------------------------
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Invalid multipart/form-data body." },
      { status: 400 },
    );
  }

  const person = formData.get("person");
  const garment = formData.get("garment");

  if (!(person instanceof File) || !(garment instanceof File)) {
    return NextResponse.json(
      { error: "Both 'person' and 'garment' image files are required." },
      { status: 400 },
    );
  }

  for (const [name, file] of [
    ["person", person],
    ["garment", garment],
  ] as const) {
    const err = validateImageFile(file, { maxBytes: MAX_BYTES, allowedTypes: ALLOWED });
    if (err) {
      return NextResponse.json({ error: `${name}: ${err}` }, { status: 400 });
    }
  }

  // --- Encode inputs ---------------------------------------------------
  const [humanImg, garmImg] = await Promise.all([
    fileToDataUrl(person),
    fileToDataUrl(garment),
  ]);

  // --- Call Replicate --------------------------------------------------
  const replicate = new Replicate({ auth: token });

  try {
    let prediction = await replicate.predictions.create({
      version: IDM_VTON_MODEL.split(":")[1],
      input: {
        human_img: humanImg,
        garm_img: garmImg,
        garment_des: "clothing",
        crop: false,
        seed: 42,
        steps: 30,
      },
    });

    // Polling loop — IDM-VTON usually finishes in 15–30 s.
    const start = Date.now();
    while (
      prediction.status !== "succeeded" &&
      prediction.status !== "failed" &&
      prediction.status !== "canceled"
    ) {
      if (Date.now() - start > 55_000) {
        return NextResponse.json(
          { error: "Timed out waiting for Replicate prediction." },
          { status: 504 },
        );
      }
      await new Promise((r) => setTimeout(r, 1500));
      prediction = await replicate.predictions.get(prediction.id);
    }

    if (prediction.status !== "succeeded") {
      return NextResponse.json(
        {
          error: "Replicate prediction failed.",
          detail:
            typeof prediction.error === "string"
              ? prediction.error
              : JSON.stringify(prediction.error),
        },
        { status: 502 },
      );
    }

    const output = Array.isArray(prediction.output)
      ? prediction.output[prediction.output.length - 1]
      : (prediction.output as unknown as string);

    if (typeof output !== "string") {
      return NextResponse.json(
        { error: "Unexpected Replicate response shape." },
        { status: 502 },
      );
    }

    return NextResponse.json({ output, id: prediction.id }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: "Replicate call failed.", detail: message }, { status: 500 });
  }
}
