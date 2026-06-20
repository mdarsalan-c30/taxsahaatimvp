"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FileText, Loader2, X } from "lucide-react";

const MAX_FILES = 5;
const AUTO_UPLOAD_DELAY_MS = 700;

interface Form16UploadZoneProps {
  uploading: boolean;
  isConnected: boolean;
  highlighted?: boolean;
  onUpload: (files: File[], password?: string) => Promise<void>;
}

function filesFingerprint(files: File[]): string {
  return files.map((f) => `${f.name}:${f.size}:${f.lastModified}`).join("|");
}

export function Form16UploadZone({
  uploading,
  isConnected,
  highlighted,
  onUpload,
}: Form16UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [password, setPassword] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [autoUploadPending, setAutoUploadPending] = useState(false);
  const lastUploadedFingerprint = useRef<string>("");
  const lastAutoAttemptFingerprint = useRef<string>("");
  const uploadInFlight = useRef(false);

  const addFiles = useCallback((incoming: FileList | File[]) => {
    const pdfs = Array.from(incoming).filter(
      (file) =>
        file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
    );
    if (pdfs.length === 0) return;

    setSelectedFiles((current) => {
      const names = new Set(current.map((f) => f.name));
      const merged = [...current];
      for (const file of pdfs) {
        if (merged.length >= MAX_FILES) break;
        if (!names.has(file.name)) {
          merged.push(file);
          names.add(file.name);
        }
      }
      return merged;
    });
  }, []);

  const removeFile = useCallback((index: number) => {
    setSelectedFiles((current) => current.filter((_, i) => i !== index));
    lastUploadedFingerprint.current = "";
    lastAutoAttemptFingerprint.current = "";
  }, []);

  const runUpload = useCallback(async () => {
    if (selectedFiles.length === 0 || uploadInFlight.current || uploading) {
      return;
    }

    const fingerprint = `${filesFingerprint(selectedFiles)}::${password.trim()}`;
    if (fingerprint === lastUploadedFingerprint.current) {
      return;
    }

    uploadInFlight.current = true;
    setAutoUploadPending(true);
    lastAutoAttemptFingerprint.current = fingerprint;
    try {
      const trimmedPassword = password.trim();
      await onUpload(
        selectedFiles,
        trimmedPassword.length > 0 ? trimmedPassword : undefined
      );
      lastUploadedFingerprint.current = fingerprint;
      setSelectedFiles([]);
      setPassword("");
      if (inputRef.current) inputRef.current.value = "";
    } catch {
      // Keep files selected; user can fix password and retry manually or via re-select
    } finally {
      uploadInFlight.current = false;
      setAutoUploadPending(false);
    }
  }, [onUpload, password, selectedFiles, uploading]);

  useEffect(() => {
    if (selectedFiles.length === 0) return;

    const fingerprint = `${filesFingerprint(selectedFiles)}::${password.trim()}`;
    if (fingerprint === lastAutoAttemptFingerprint.current) return;

    const timer = window.setTimeout(() => {
      void runUpload();
    }, AUTO_UPLOAD_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [selectedFiles, password, runUpload]);

  const isProcessing = uploading || autoUploadPending;

  return (
    <div
      className={`card-premium flex flex-col p-4 sm:p-5 ${
        highlighted
          ? "ring-2 ring-primary/20 border-primary/30 sm:col-span-2 2xl:col-span-3"
          : ""
      }`}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-zinc-900">
            Form 16
            <span className="ml-1 text-xs font-normal text-rose-600">Required</span>
          </h3>
          <p className="mt-1 text-sm text-zinc-600">
            Upload PDF from employer. Files are parsed automatically — add Part A,
            Part B, and annexure separately if needed.
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
            isConnected
              ? "bg-emerald-100 text-emerald-800"
              : "bg-blue-50 text-blue-800"
          }`}
        >
          {isConnected ? "Connected" : "Manual"}
        </span>
      </div>

      <div
        className={`mt-3 rounded-lg border-2 border-dashed px-4 py-5 text-center transition ${
          dragOver
            ? "border-primary bg-primary/5"
            : "border-zinc-200 bg-zinc-50/50"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files.length > 0) {
            addFiles(e.dataTransfer.files);
          }
        }}
      >
        <p className="text-sm text-zinc-700">
          Drop Part A, Part B, and Annexure (12BA) PDFs here
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          1–{MAX_FILES} PDF files · parsing starts automatically
        </p>
        <label className="mt-3 inline-flex cursor-pointer items-center justify-center rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50">
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,application/pdf"
            multiple
            className="hidden"
            disabled={isProcessing}
            onChange={(e) => {
              if (e.target.files) addFiles(e.target.files);
            }}
          />
          Choose PDFs
        </label>
      </div>

      {selectedFiles.length > 0 && (
        <ul className="mt-3 space-y-2">
          {selectedFiles.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm"
            >
              <FileText className="size-4 shrink-0 text-zinc-500" />
              <span className="min-w-0 flex-1 truncate text-zinc-800">{file.name}</span>
              <button
                type="button"
                aria-label={`Remove ${file.name}`}
                className="rounded p-1 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-800"
                disabled={isProcessing}
                onClick={() => removeFile(index)}
              >
                <X className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {isProcessing && (
        <div
          role="status"
          className="mt-3 flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-900"
        >
          <Loader2 className="size-4 shrink-0 animate-spin" />
          Reading and parsing Form 16…
        </div>
      )}

      <label className="mt-3 block">
        <span className="text-xs font-medium text-zinc-700">
          PDF password (optional)
        </span>
        <input
          type="password"
          autoComplete="off"
          value={password}
          disabled={isProcessing}
          placeholder="Often your PAN in capitals"
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400"
          onChange={(e) => {
            lastUploadedFingerprint.current = "";
            lastAutoAttemptFingerprint.current = "";
            setPassword(e.target.value);
          }}
        />
        <span className="mt-1 block text-xs text-zinc-500">
          Sent only with upload — never stored on this device. Re-parses when
          changed.
        </span>
      </label>

      <button
        type="button"
        disabled={isProcessing || selectedFiles.length === 0}
        className="mt-4 inline-flex w-full items-center justify-center rounded-lg bg-primary px-3 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        onClick={() => {
          lastAutoAttemptFingerprint.current = "";
          void runUpload();
        }}
      >
        {isProcessing
          ? "Processing…"
          : isConnected
            ? "Re-parse files"
            : `Parse ${selectedFiles.length} file${selectedFiles.length === 1 ? "" : "s"}`}
      </button>
    </div>
  );
}
