import { spawn } from "child_process";
import path from "path";
import { NextResponse } from "next/server";
import type { UserInput } from "@/lib/engine/types";
import { trackComputeLatency, trackEngineEvent } from "@/lib/monitoring/events";

export const runtime = "nodejs";

async function proxyToPythonServerless(
  request: Request,
  payload: string
): Promise<NextResponse> {
  const RAILWAY_URL = process.env.NEXT_PUBLIC_ENGINE_URL;
  const origin = new URL(request.url).origin;
  const targetUrl = RAILWAY_URL ? `${RAILWAY_URL}/api/compute` : `${origin}/_/backend/api/py-compute`;

  console.log(`[proxyToPythonServerless] targetUrl: ${targetUrl}, RAILWAY_URL: ${RAILWAY_URL}`);

  try {
    const res = await fetch(targetUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
    });
    
    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await res.text();
      console.error(`[proxyToPythonServerless] Expected JSON, got ${contentType}: ${text.substring(0, 200)}`);
      return NextResponse.json({ ok: false, error: `Invalid proxy response from ${targetUrl}: ${res.status}` }, { status: 502 });
    }

    const data = (await res.json()) as Record<string, unknown>;
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("[proxyToPythonServerless] Fetch failed:", error);
    return NextResponse.json({ ok: false, error: "Failed to reach compute engine" }, { status: 502 });
  }
}

function spawnLocalPython(payload: string): Promise<string> {
  const scriptPath = path.join(process.cwd(), "..", "backend", "scripts", "compute_cli.py");

  return new Promise<string>((resolve, reject) => {
    const proc = spawn("python", [scriptPath], {
      cwd: path.join(process.cwd(), "..", "backend"),
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });
    proc.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    proc.on("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "ENOENT") {
        reject(new Error("ENGINE_UNAVAILABLE"));
        return;
      }
      reject(err);
    });
    proc.on("close", (code) => {
      if (code !== 0 && !stdout.trim()) {
        reject(new Error(stderr || `compute_cli exited with code ${code}`));
      } else {
        resolve(stdout);
      }
    });

    proc.stdin.write(payload);
    proc.stdin.end();
  });
}

export async function POST(request: Request) {
  const startedAt = Date.now();
  try {
    const userInput = (await request.json()) as UserInput;

    if (typeof userInput.age !== "number") {
      return NextResponse.json(
        { ok: false, error: "age is required (number)" },
        { status: 400 }
      );
    }

    const payload = JSON.stringify(userInput);

    let output: string;
    try {
      if (process.env.NEXT_PUBLIC_ENGINE_URL || process.env.NODE_ENV === "production") {
        return proxyToPythonServerless(request, payload);
      }
      output = await spawnLocalPython(payload);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Compute failed";
      if (message === "ENGINE_UNAVAILABLE") {
        return proxyToPythonServerless(request, payload);
      }
      throw err;
    }

    const parsed = JSON.parse(output) as { ok: boolean };
    if (!parsed.ok) {
      trackEngineEvent("compute_failure", {
        source: "server",
        error: "Compute returned ok:false",
        durationMs: Date.now() - startedAt,
      });
      return NextResponse.json(parsed, { status: 422 });
    }
    trackComputeLatency(Date.now() - startedAt, { source: "server" });
    return NextResponse.json(parsed);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Compute failed";
    if (message === "ENGINE_UNAVAILABLE") {
      trackEngineEvent("compute_failure", {
        source: "server",
        error: message,
        engineUnavailable: true,
        durationMs: Date.now() - startedAt,
      });
      return NextResponse.json(
        { ok: false, error: "Tax engine unavailable", code: "ENGINE_UNAVAILABLE" },
        { status: 503 }
      );
    }
    trackEngineEvent("compute_failure", {
      source: "server",
      error: message,
      durationMs: Date.now() - startedAt,
    });
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
