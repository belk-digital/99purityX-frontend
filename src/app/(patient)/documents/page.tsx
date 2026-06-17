"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  FileText,
  FileImage,
  File as FileIcon,
  Upload,
  Download,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { UploadDocumentDialog } from "@/components/patient/UploadDocumentDialog";
import { documentsApi } from "@/lib/api/documents";
import type { Document, DocumentType } from "@/types/document";

// ─── helpers ────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function docTypeLabel(t: DocumentType) {
  return t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const typeColors: Record<string, string> = {
  lab_report: "bg-amber-100 text-amber-700",
  prescription: "bg-blue-100 text-blue-700",
  consultation_attachment: "bg-violet-100 text-violet-700",
  medical_record: "bg-emerald-100 text-emerald-700",
  insurance_document: "bg-slate-100 text-slate-600",
  consent_form: "bg-pink-100 text-pink-700",
  optimization_program_document: "bg-teal-100 text-teal-700",
  progress_report: "bg-indigo-100 text-indigo-700",
  other: "bg-slate-100 text-slate-500",
};

function FileTypeIcon({ mime }: { mime: string }) {
  if (mime.startsWith("image/")) return <FileImage className="h-5 w-5 text-violet-600" />;
  if (mime.includes("pdf")) return <FileText className="h-5 w-5 text-red-500" />;
  return <FileIcon className="h-5 w-5 text-slate-500" />;
}

// ─── document card ───────────────────────────────────────────────────────────

function DocumentCard({ doc }: { doc: Document }) {
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    try {
      setDownloading(true);
      const { download_url } = await documentsApi.getDownloadUrl(doc.id);
      window.open(download_url, "_blank");
    } catch {
      toast.error("Failed to get download link");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-50">
              <FileTypeIcon mime={doc.mime_type} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{doc.title}</p>
              <p className="mt-0.5 text-xs text-slate-400 truncate">{doc.original_file_name}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${typeColors[doc.document_type] ?? typeColors.other}`}>
                  {docTypeLabel(doc.document_type)}
                </span>
                <span className="text-xs text-slate-400">{formatFileSize(doc.file_size)}</span>
                <span className="text-xs text-slate-400">{formatDate(doc.uploaded_at)}</span>
              </div>
              {doc.description && (
                <p className="mt-1.5 text-xs text-slate-500 line-clamp-2">{doc.description}</p>
              )}
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleDownload}
            disabled={downloading}
            className="shrink-0"
          >
            <Download className="h-3.5 w-3.5" />
            {downloading ? "..." : "Download"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── skeleton / empty ────────────────────────────────────────────────────────

function ListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/4" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-5 w-12" />
                </div>
              </div>
              <Skeleton className="h-7 w-24 rounded-lg" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── filter bar ──────────────────────────────────────────────────────────────

const filterOptions: { value: DocumentType | "all"; label: string }[] = [
  { value: "all", label: "All Types" },
  { value: "medical_record", label: "Medical Records" },
  { value: "lab_report", label: "Lab Reports" },
  { value: "prescription", label: "Prescriptions" },
  { value: "insurance_document", label: "Insurance" },
  { value: "consent_form", label: "Consent Forms" },
  { value: "progress_report", label: "Progress Reports" },
  { value: "other", label: "Other" },
];

// ─── page ────────────────────────────────────────────────────────────────────

export default function DocumentsPage() {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<DocumentType | "all">("all");

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["documents"],
    queryFn: () => documentsApi.getAll({ limit: 100, status: "active" }),
  });

  const filtered = documents
    .filter((d) => typeFilter === "all" || d.document_type === typeFilter)
    .filter((d) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        d.title.toLowerCase().includes(q) ||
        d.original_file_name.toLowerCase().includes(q) ||
        (d.description?.toLowerCase().includes(q) ?? false)
      );
    })
    .sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Documents</h1>
          <p className="mt-1 text-sm text-slate-500">
            Your medical documents and files
          </p>
        </div>
        <Button onClick={() => setUploadOpen(true)}>
          <Upload className="h-4 w-4" />
          Upload
        </Button>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search documents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as DocumentType | "all")}
          className="flex h-9 rounded-lg border border-input bg-transparent px-3 py-1 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
        >
          {filterOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Stats */}
      {!isLoading && documents.length > 0 && (
        <p className="text-xs text-slate-400">
          Showing {filtered.length} of {documents.length} documents
        </p>
      )}

      {/* List */}
      {isLoading ? (
        <ListSkeleton />
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 py-16 text-center">
          <FileText className="h-10 w-10 text-slate-300 mb-3" />
          <p className="text-sm font-medium text-slate-600">
            {documents.length === 0 ? "No documents yet" : "No documents match your filters"}
          </p>
          {documents.length === 0 && (
            <Button onClick={() => setUploadOpen(true)} size="sm" className="mt-4">
              <Upload className="h-4 w-4" />
              Upload your first document
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((doc) => (
            <DocumentCard key={doc.id} doc={doc} />
          ))}
        </div>
      )}

      <UploadDocumentDialog open={uploadOpen} onOpenChange={setUploadOpen} />
    </div>
  );
}
