import { spawn, execSync } from "node:child_process";
import path from "node:path";
import { draftToUserInput } from "@/lib/engine/draftToUserInput";
import type { ComputeResponse, ITRResult, UserInput } from "@/lib/engine/types";
import type {
  BatchRunSummary,
  ScenarioRunResult,
  SimulationScenario,
} from "./types";

const ENGINE_UNAVAILABLE = "ENGINE_UNAVAILABLE";

let pythonAvailable: boolean | null = null;
let pythonCommand = "python3";

export function isPythonEngineAvailable(): boolean {
  if (pythonAvailable !== null) return pythonAvailable;
  
  // Try python3 first
  try {
    const out = execSync("python3 --version", { stdio: "pipe" }).toString();
    if (out.toLowerCase().includes("python")) {
      pythonCommand = "python3";
      pythonAvailable = true;
      return true;
    }
  } catch {
    // Ignore and try python
  }

  // Try python
  try {
    const out = execSync("python --version", { stdio: "pipe" }).toString();
    if (out.toLowerCase().includes("python")) {
      pythonCommand = "python";
      pythonAvailable = true;
      return true;
    }
  } catch {
    // Both failed
  }

  pythonAvailable = false;
  return false;
}

function spawnCompute(userInput: UserInput): Promise<ComputeResponse> {
  let scriptPath = path.join(process.cwd(), "..", "backend", "scripts", "compute_cli.py");
  if (!require("fs").existsSync(scriptPath)) {
    scriptPath = path.join(process.cwd(), "scripts", "compute_cli.py");
  }
  const payload = JSON.stringify(userInput);

  return new Promise((resolve, reject) => {
    const proc = spawn(pythonCommand, [scriptPath], {
      cwd: process.cwd(),
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
        reject(new Error(ENGINE_UNAVAILABLE));
        return;
      }
      reject(err);
    });

    proc.on("close", (code) => {
      if (!stdout.trim()) {
        reject(new Error(stderr || `compute_cli exited with code ${code}`));
        return;
      }
      try {
        resolve(JSON.parse(stdout) as ComputeResponse);
      } catch {
        reject(new Error(`Invalid JSON from compute_cli: ${stdout.slice(0, 200)}`));
      }
    });

    proc.stdin.write(payload);
    proc.stdin.end();
  });
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function validateComputeResult(
  result: ITRResult,
  expectedForm?: string
): string | null {
  const rc = result.regime_comparison;
  if (!rc) return "Missing regime_comparison";

  if (!isFiniteNumber(result.income_heads.gross_total_income)) {
    return "gross_total_income is not finite";
  }
  if (result.income_heads.gross_total_income < 0) {
    return "gross_total_income is negative";
  }

  for (const regime of [rc.old, rc.new] as const) {
    if (!isFiniteNumber(regime.total_tax) || regime.total_tax < 0) {
      return `Invalid total_tax for ${regime.regime}`;
    }
    if (!isFiniteNumber(regime.net_payable)) {
      return `net_payable is not finite for ${regime.regime}`;
    }
  }

  if (
    !isFiniteNumber(result.confidence.completeness_score) ||
    result.confidence.completeness_score < 0 ||
    result.confidence.completeness_score > 100
  ) {
    return "completeness_score out of range";
  }

  if (rc.recommended_regime !== "old" && rc.recommended_regime !== "new") {
    return `Invalid recommended_regime: ${rc.recommended_regime}`;
  }

  if (!isFiniteNumber(rc.tax_saving) || rc.tax_saving < 0) {
    return "tax_saving is invalid";
  }

  const rec = rc.recommended_regime;
  const slab = rec === "old" ? rc.old : rc.new;
  const netDelta = Math.abs(slab.net_payable - (slab.total_tax + (slab.late_filing_fee ?? 0) - slab.tds_and_advance_tax));
  if (netDelta > 1) {
    return `net_payable mismatch (delta ${netDelta})`;
  }

  if (expectedForm && result.profile.itr_form !== expectedForm) {
    return `Expected ${expectedForm}, got ${result.profile.itr_form}`;
  }

  for (const r of result.recommendations) {
    if (!["green", "yellow", "red"].includes(r.risk)) {
      return `Invalid recommendation risk: ${r.risk}`;
    }
    if (!r.gov_section) {
      return "Recommendation missing gov_section";
    }
  }

  return null;
}

export async function runScenario(scenario: SimulationScenario): Promise<ScenarioRunResult> {
  const startedAt = Date.now();

  try {
    const userInput =
      scenario.userInput ?? draftToUserInput(scenario.draftSlice);
    const response = await spawnCompute(userInput);

    if (!response.ok || !response.result) {
      return {
        id: scenario.id,
        passed: false,
        error: response.error ?? "Compute returned ok:false",
        durationMs: Date.now() - startedAt,
      };
    }

    const validationError = validateComputeResult(
      response.result,
      scenario.expected.itrForm
    );

    if (validationError) {
      return {
        id: scenario.id,
        passed: false,
        error: validationError,
        durationMs: Date.now() - startedAt,
        itrForm: response.result.profile.itr_form,
        recommendedRegime: response.result.regime_comparison.recommended_regime,
      };
    }

    if (scenario.expected.handoffKeys?.length) {
      const handoff = response.handoff ?? {};
      for (const key of scenario.expected.handoffKeys) {
        if (!(key in handoff)) {
          return {
            id: scenario.id,
            passed: false,
            error: `Missing handoff key: ${key}`,
            durationMs: Date.now() - startedAt,
          };
        }
      }
    }

    return {
      id: scenario.id,
      passed: true,
      durationMs: Date.now() - startedAt,
      itrForm: response.result.profile.itr_form,
      recommendedRegime: response.result.regime_comparison.recommended_regime,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      id: scenario.id,
      passed: false,
      error: message,
      durationMs: Date.now() - startedAt,
    };
  }
}

async function runWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let index = 0;

  async function worker(): Promise<void> {
    while (index < items.length) {
      const i = index++;
      results[i] = await fn(items[i]);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () =>
    worker()
  );
  await Promise.all(workers);
  return results;
}

export async function runBatch(
  scenarios: SimulationScenario[],
  options: { concurrency?: number } = {}
): Promise<BatchRunSummary> {
  const startedAt = Date.now();
  const concurrency = options.concurrency ?? 10;

  const results = await runWithConcurrency(scenarios, concurrency, runScenario);

  const failures = results.filter((r) => !r.passed);
  return {
    total: scenarios.length,
    passed: results.length - failures.length,
    failed: failures.length,
    skipped: 0,
    durationMs: Date.now() - startedAt,
    failures,
  };
}
