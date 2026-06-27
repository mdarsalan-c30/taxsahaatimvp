import { spawn } from "child_process";
import path from "path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

async function proxyToPythonServerless(
  request: Request,
  payload: string
): Promise<NextResponse> {
  const origin = new URL(request.url).origin;
  const res = await fetch(`${origin}/_/backend/api/layer2`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

function spawnLocalPython(payload: string): Promise<string> {
  const scriptPath = path.join(process.cwd(), "..", "backend", "scripts", "layer2_cli.py");

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
        reject(new Error(stderr || `layer2_cli exited with code ${code}`));
      } else {
        resolve(stdout);
      }
    });

    proc.stdin.write(payload);
    proc.stdin.end();
  });
}

export async function POST(request: Request) {
  try {
    const payloadObj = await request.json();
    const payload = JSON.stringify(payloadObj);

    let output: string;
    try {
      output = await spawnLocalPython(payload);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Compute failed";
      if (message === "ENGINE_UNAVAILABLE") {
        return proxyToPythonServerless(request, payload);
      }
      throw err;
    }

    const parsed = JSON.parse(output);
    if (!parsed.ok) {
      return NextResponse.json(parsed, { status: 422 });
    }
    return NextResponse.json(parsed);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Compute failed";
    if (message === "ENGINE_UNAVAILABLE") {
      return NextResponse.json(
        { ok: false, error: "Tax engine unavailable", code: "ENGINE_UNAVAILABLE" },
        { status: 503 }
      );
    }
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
