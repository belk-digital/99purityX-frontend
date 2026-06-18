"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Upload, FileUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { documentsApi } from "@/lib/api/documents";
import { patientsApi } from "@/lib/api/patients";
import type { DocumentType } from "@/types/document";

interface UploadDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const docTypeOptions: { value: DocumentType; label: string }[] = [
  { value: "medical_record", label: "Medical Record" },
  { value: "insurance_document", label: "Insurance Document" },
  { value: "lab_report", label: "Lab Report" },
  { value: "prescription", label: "Prescription" },
  { value: "consent_form", label: "Consent Form" },
  { value: "progress_report", label: "Progress Report" },
  { value: "other", label: "Other" },
];

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function UploadDocumentDialog({ open, onOpenChange }: UploadDocumentDialogProps) {
  const queryClient = useQueryClient();
  const { data: patientProfile } = useQuery({
    queryKey: ["patient", "me"],
    queryFn: patientsApi.getMe,
  });
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [docType, setDocType] = useState<DocumentType>("medical_record");
  const [description, setDescription] = useState("");

  const mutation = useMutation({
    mutationFn: documentsApi.upload,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Document uploaded!");
      resetForm();
      onOpenChange(false);
    },
    onError: (err: { response?: { data?: { detail?: string } } }) => {
      toast.error(err?.response?.data?.detail ?? "Upload failed");
    },
  });

  function resetForm() {
    setFile(null);
    setTitle("");
    setDocType("medical_record");
    setDescription("");
    if (fileRef.current) fileRef.current.value = "";
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      toast.error("Please select a file");
      return;
    }
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title.trim());
    formData.append("document_type", docType);
    formData.append("patient_id", patientProfile?.id ?? "");
    if (description.trim()) formData.append("description", description.trim());

    mutation.mutate(formData);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* File picker */}
          <div className="space-y-1.5">
            <Label>File *</Label>
            {file ? (
              <div className="flex items-center justify-between rounded-lg border border-input p-3">
                <div className="flex items-center gap-2 min-w-0">
                  <FileUp className="h-4 w-4 shrink-0 text-teal-600" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{file.name}</p>
                    <p className="text-xs text-slate-400">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setFile(null); if (fileRef.current) fileRef.current.value = ""; }}
                  className="text-xs text-red-500 hover:underline"
                >
                  Remove
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-200 p-6 text-sm text-slate-500 hover:border-teal-300 hover:text-teal-600 transition-colors"
              >
                <Upload className="h-5 w-5" />
                Click to select a file
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.txt"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  if (f.size > 10 * 1024 * 1024) {
                    toast.error("File must be under 10 MB");
                    return;
                  }
                  setFile(f);
                  if (!title) setTitle(f.name.replace(/\.[^.]+$/, ""));
                }
              }}
            />
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="doc-title">Title *</Label>
            <Input
              id="doc-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Document title"
              required
            />
          </div>

          {/* Type */}
          <div className="space-y-1.5">
            <Label htmlFor="doc-type">Type</Label>
            <select
              id="doc-type"
              value={docType}
              onChange={(e) => setDocType(e.target.value as DocumentType)}
              className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
            >
              {docTypeOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="doc-desc">Description</Label>
            <textarea
              id="doc-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description..."
              rows={2}
              className="flex w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none resize-none placeholder:text-muted-foreground focus:border-ring focus:ring-3 focus:ring-ring/50"
            />
          </div>

          <DialogFooter showCloseButton>
            <Button type="submit" disabled={mutation.isPending || !file}>
              {mutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Upload
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
