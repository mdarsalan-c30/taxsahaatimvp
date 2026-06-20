"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { buildEligibilityForm16Url } from "@/lib/filing/routes";
import { useDraftStore, type FieldConfidence } from "@/lib/store/draft";
import type { ParseMode } from "@/lib/parsers/form16";
import { Form16UploadZone } from "@/components/filing/connectors/Form16UploadZone";
import { FILING_WORKSPACE } from "@/lib/design/layout";

export type ConnectorStatus = "connected" | "manual" | "coming_soon";

export interface Connector {
  id: string;
  name: string;
  description: string;
  status: ConnectorStatus;
  required?: boolean;
  accept?: string;
}

const PRIMARY_CONNECTORS: Connector[] = [
  {
    id: "ais",
    name: "AIS",
    description: "Annual Information Statement from incometax.gov.in",
    status: "manual",
    accept: ".pdf,.json",
  },
];

const SECONDARY_CONNECTORS: Connector[] = [
  {
    id: "form26as",
    name: "Form 26AS",
    description: "TDS credit statement — authority for tax credits claimed",
    status: "manual",
    accept: ".pdf,.json",
  },
  {
    id: "cams",
    name: "CAMS",
    description: "Consolidated capital gains statement (CAMS/KFintech)",
    status: "manual",
    accept: ".pdf,.csv",
  },
];

const COMING_SOON_CONNECTORS: Connector[] = [
  {
    id: "mfcentral",
    name: "MFCentral",
    description: "Import mutual fund capital gains and dividends",
    status: "coming_soon",
  },
  {
    id: "groww",
    name: "Groww",
    description: "Broker statement for equity and MF transactions",
    status: "coming_soon",
  },
  {
    id: "zerodha",
    name: "Zerodha",
    description: "Console tax P&L and contract notes",
    status: "coming_soon",
  },
];

const STATUS_STYLES: Record<
  ConnectorStatus,
  { label: string; className: string }
> = {
  connected: {
    label: "Connected",
    className: "bg-emerald-100 text-emerald-800",
  },
  manual: {
    label: "Manual",
    className: "bg-blue-50 text-blue-800",
  },
  coming_soon: {
    label: "Coming soon",
    className: "bg-zinc-100 text-zinc-600",
  },
};

interface ParsedUpload {
  connectorId: string;
  fields: Record<string, string | number>;
  filename: string;
  filenames?: string[];
  fieldConfidence?: Record<string, FieldConfidence>;
  parseMode?: ParseMode;
  warnings?: string[];
  demo?: boolean;
  parsedAt?: string;
}

interface ConnectorGridProps {
  onUploadComplete?: (result: ParsedUpload) => void;
  highlightConnectorId?: string;
  form16FastPath?: boolean;
  /** Append parsed Form 16 as another employer (job-change flow). */
  appendAsEmployer?: boolean;
}

function ConnectorCard({
  connector,
  isConnected,
  uploading,
  onUpload,
}: {
  connector: Connector;
  isConnected: boolean;
  uploading: boolean;
  onUpload: (connector: Connector, file: File) => void;
}) {
  const status: ConnectorStatus = isConnected ? "connected" : connector.status;
  const badge = STATUS_STYLES[status];
  const isDisabled = connector.status === "coming_soon";

  return (
    <div className="card-premium flex flex-col p-4 sm:p-5">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-zinc-900">{connector.name}</h3>
          <p className="mt-1 text-tier-feature text-zinc-600">{connector.description}</p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}
        >
          {badge.label}
        </span>
      </div>

      {connector.accept && !isDisabled && (
        <label className="mt-auto cursor-pointer">
          <input
            type="file"
            accept={connector.accept}
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void onUpload(connector, file);
            }}
          />
          <span className="inline-flex w-full items-center justify-center rounded-lg bg-primary px-3 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90">
            {uploading ? "Uploading…" : isConnected ? "Replace file" : "Upload"}
          </span>
        </label>
      )}

      {isDisabled && (
        <p className="mt-auto text-xs text-zinc-500">Account connect coming soon</p>
      )}
    </div>
  );
}

export default function ConnectorGrid({
  onUploadComplete,
  highlightConnectorId,
  form16FastPath = false,
  appendAsEmployer = false,
}: ConnectorGridProps) {
  const router = useRouter();
  const {
    connectedConnectors,
    setConnectorConnected,
    mergeParsedFields,
    ensureIncomeChip,
    setItrConfirmed,
  } = useDraftStore();
  const connected = new Set(connectedConnectors);
  const [uploading, setUploading] = useState<string | null>(null);
  const [lastParsed, setLastParsed] = useState<ParsedUpload | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [comingSoonOpen, setComingSoonOpen] = useState(false);

  const applyParsedResponse = useCallback(
    (
      connectorId: string,
      data: {
        fields: Record<string, string | number>;
        fieldConfidence?: Record<string, FieldConfidence>;
        parseMode?: ParseMode;
        warnings?: string[];
        demo?: boolean;
        parsedAt?: string;
        filename?: string;
        filenames?: string[];
        files?: Array<{ name: string; partKind: string }>;
      },
      displayFilename: string
    ) => {
      setConnectorConnected(connectorId);
      const parsed: ParsedUpload = {
        connectorId,
        fields: data.fields,
        filename: displayFilename,
        filenames: data.filenames,
        fieldConfidence: data.fieldConfidence,
        parseMode: data.parseMode,
        warnings: data.warnings,
        demo: data.demo,
        parsedAt: data.parsedAt,
      };
      mergeParsedFields(connectorId, {
        fields: data.fields,
        fieldConfidence: data.fieldConfidence,
        parseMode: data.parseMode,
        warnings: data.warnings,
        demo: data.demo,
        filename: displayFilename,
        filenames: data.filenames,
        parsedParts: data.files?.map((f) => ({
          name: f.name,
          partKind: f.partKind,
        })),
        parsedAt: data.parsedAt,
        appendAsEmployer: connectorId === "form16" ? appendAsEmployer : false,
      });
      setLastParsed(parsed);
      if (connectorId === "form16") {
        ensureIncomeChip("salary");
        if (form16FastPath) {
          setItrConfirmed(false);
        }
      }
      onUploadComplete?.(parsed);
    },
    [
      appendAsEmployer,
      form16FastPath,
      mergeParsedFields,
      onUploadComplete,
      setConnectorConnected,
      ensureIncomeChip,
      setItrConfirmed,
    ]
  );

  const handleUpload = useCallback(
    async (connector: Connector, file: File) => {
      setUploading(connector.id);
      setUploadError(null);
      try {
        const form = new FormData();
        form.append("file", file);
        form.append("connectorId", connector.id);

        const res = await fetch("/api/documents/upload", {
          method: "POST",
          body: form,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Upload failed");

        applyParsedResponse(connector.id, data, file.name);
      } catch (error) {
        setUploadError(
          error instanceof Error ? error.message : "Upload failed"
        );
      } finally {
        setUploading(null);
      }
    },
    [applyParsedResponse]
  );

  const handleForm16Upload = useCallback(
    async (files: File[], password?: string) => {
      setUploading("form16");
      setUploadError(null);
      try {
        const form = new FormData();
        form.append("connectorId", "form16");
        for (const file of files) {
          form.append("files", file);
        }
        if (password) {
          form.append("password", password);
        }

        const res = await fetch("/api/documents/upload", {
          method: "POST",
          body: form,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Upload failed");

        const displayName =
          files.length === 1
            ? files[0].name
            : `${files.length} files (${files.map((f) => f.name).join(", ")})`;

        trackEvent("form16_upload", {
          fileCount: files.length,
          filename: files.map((f) => f.name).join(", "),
        });

        applyParsedResponse("form16", data, displayName);

        if (form16FastPath) {
          router.push(buildEligibilityForm16Url());
        }
      } catch (error) {
        setUploadError(
          error instanceof Error ? error.message : "Upload failed"
        );
        throw error;
      } finally {
        setUploading(null);
      }
    },
    [applyParsedResponse, form16FastPath, router]
  );

  return (
    <div className="space-y-6">
      <div
        role="status"
        className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
      >
        <strong>Document parsing.</strong> Form 16 PDFs are parsed automatically
        when possible. Other connectors still use demo sample numbers — verify
        every figure against your documents before filing.
      </div>

      <div>
        <h3 className="mb-3 text-tier-feature font-semibold uppercase tracking-wide text-slate-500">
          Start here
        </h3>
        <div className={FILING_WORKSPACE.cardGrid}>
          <Form16UploadZone
            uploading={uploading === "form16"}
            isConnected={connected.has("form16")}
            highlighted={highlightConnectorId === "form16"}
            onUpload={handleForm16Upload}
          />
          {PRIMARY_CONNECTORS.map((connector) => (
            <ConnectorCard
              key={connector.id}
              connector={connector}
              isConnected={connected.has(connector.id)}
              uploading={uploading === connector.id}
              onUpload={handleUpload}
            />
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-tier-feature font-semibold uppercase tracking-wide text-slate-500">
          Also recommended
        </h3>
        <div className={FILING_WORKSPACE.cardGrid}>
          {SECONDARY_CONNECTORS.map((connector) => (
            <ConnectorCard
              key={connector.id}
              connector={connector}
              isConnected={connected.has(connector.id)}
              uploading={uploading === connector.id}
              onUpload={handleUpload}
            />
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-zinc-50/80">
        <button
          type="button"
          onClick={() => setComingSoonOpen((open) => !open)}
          className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-zinc-700"
          aria-expanded={comingSoonOpen}
        >
          <span>Connect accounts (coming soon)</span>
          <ChevronDown
            className={`size-4 shrink-0 transition-transform ${
              comingSoonOpen ? "rotate-180" : ""
            }`}
          />
        </button>
        {comingSoonOpen && (
          <div className="space-y-3 border-t border-zinc-200 px-4 pb-4 pt-3">
            {COMING_SOON_CONNECTORS.map((connector) => (
              <div
                key={connector.id}
                className="flex items-start justify-between gap-3 rounded-lg bg-white px-3 py-2.5"
              >
                <div>
                  <p className="text-sm font-medium text-zinc-900">
                    {connector.name}
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-600">
                    {connector.description}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
                  Coming soon
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {uploadError && (
        <div
          role="alert"
          className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900"
        >
          {uploadError}
        </div>
      )}

      {lastParsed && (
        <div
          className={`rounded-lg border p-4 text-sm ${
            lastParsed.demo
              ? "border-amber-200 bg-amber-50"
              : "border-emerald-200 bg-emerald-50"
          }`}
        >
          <p
            className={`font-medium ${
              lastParsed.demo ? "text-amber-900" : "text-emerald-900"
            }`}
          >
            {lastParsed.demo ? "Demo fallback" : "Parsed from PDF"} —{" "}
            {lastParsed.filenames && lastParsed.filenames.length > 1
              ? `${lastParsed.filenames.length} files uploaded`
              : lastParsed.filename}
          </p>
          {lastParsed.filenames && lastParsed.filenames.length > 1 && (
            <ul className="mt-1 list-inside list-disc text-xs text-emerald-800/80">
              {lastParsed.filenames.map((name) => (
                <li key={name}>{name}</li>
              ))}
            </ul>
          )}
          <p
            className={`mt-1 text-xs ${
              lastParsed.demo ? "text-amber-800/80" : "text-emerald-800/80"
            }`}
          >
            {lastParsed.demo
              ? "Sample numbers shown — confirm amounts match your actual Form 16."
              : "Review extracted fields on the next screen before filing."}
          </p>
          {lastParsed.warnings && lastParsed.warnings.length > 0 && (
            <ul className="mt-2 space-y-1 text-xs text-amber-800">
              {lastParsed.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          )}
          {form16FastPath &&
            lastParsed.connectorId === "form16" &&
            !lastParsed.demo && (
              <p className="mt-3 text-sm font-medium text-emerald-900">
                Next:{" "}
                <Link
                  href={buildEligibilityForm16Url()}
                  className="text-primary underline underline-offset-2 hover:text-primary/80"
                >
                  Tell us what else you earned this year
                </Link>
              </p>
            )}
          <ul
            className={`mt-2 space-y-1 ${
              lastParsed.demo ? "text-amber-800" : "text-emerald-800"
            }`}
          >
            {Object.entries(lastParsed.fields).map(([key, value]) => (
              <li key={key}>
                {key}: {String(value)}
                {lastParsed.fieldConfidence?.[key] &&
                  lastParsed.fieldConfidence[key] !== "high" && (
                    <span className="ml-1 text-xs opacity-80">
                      ({lastParsed.fieldConfidence[key]})
                    </span>
                  )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
