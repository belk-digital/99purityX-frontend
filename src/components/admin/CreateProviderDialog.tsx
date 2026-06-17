"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Stethoscope } from "lucide-react";
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
import { providersApi } from "@/lib/api/providers";

interface CreateProviderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userEmail: string;
}

const emptyForm = {
  provider_type: "",
  speciality: "",
  license_number: "",
  years_experience: "",
  bio: "",
  consultation_fee: "",
};

export function CreateProviderDialog({
  open,
  onOpenChange,
  userId,
  userEmail,
}: CreateProviderDialogProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyForm);

  const mutation = useMutation({
    mutationFn: providersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["providers"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success("Provider profile created!");
      setForm(emptyForm);
      onOpenChange(false);
    },
    onError: (err: { response?: { data?: { detail?: string } } }) => {
      toast.error(err?.response?.data?.detail ?? "Failed to create provider profile");
    },
  });

  function handleChange(field: keyof typeof emptyForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.provider_type || !form.speciality) {
      toast.error("Provider type and speciality are required");
      return;
    }

    mutation.mutate({
      user_id: userId,
      provider_type: form.provider_type,
      speciality: form.speciality,
      license_number: form.license_number || undefined,
      years_experience: form.years_experience ? parseInt(form.years_experience) : undefined,
      bio: form.bio || undefined,
      consultation_fee: form.consultation_fee ? parseFloat(form.consultation_fee) : undefined,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Provider Profile</DialogTitle>
        </DialogHeader>

        <div className="rounded-lg bg-slate-50 p-3 text-sm">
          <p className="font-medium text-slate-800">{userEmail}</p>
          <p className="text-xs text-slate-500 mt-0.5">User ID: {userId.slice(0, 12)}...</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="prov-type">Provider Type *</Label>
              <select
                id="prov-type"
                value={form.provider_type}
                onChange={(e) => handleChange("provider_type", e.target.value)}
                className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
                required
              >
                <option value="">Select...</option>
                <option value="Physician">Physician</option>
                <option value="Specialist">Specialist</option>
                <option value="Nutritionist">Nutritionist</option>
                <option value="Therapist">Therapist</option>
                <option value="Surgeon">Surgeon</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prov-spec">Speciality *</Label>
              <Input
                id="prov-spec"
                value={form.speciality}
                onChange={(e) => handleChange("speciality", e.target.value)}
                placeholder="e.g. General Medicine"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="prov-exp">Years Experience</Label>
              <Input
                id="prov-exp"
                type="number"
                min="0"
                value={form.years_experience}
                onChange={(e) => handleChange("years_experience", e.target.value)}
                placeholder="e.g. 5"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prov-fee">Consultation Fee ($)</Label>
              <Input
                id="prov-fee"
                type="number"
                min="0"
                step="0.01"
                value={form.consultation_fee}
                onChange={(e) => handleChange("consultation_fee", e.target.value)}
                placeholder="e.g. 150"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="prov-license">License Number</Label>
            <Input
              id="prov-license"
              value={form.license_number}
              onChange={(e) => handleChange("license_number", e.target.value)}
              placeholder="Optional"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="prov-bio">Bio</Label>
            <textarea
              id="prov-bio"
              value={form.bio}
              onChange={(e) => handleChange("bio", e.target.value)}
              placeholder="Brief bio about this provider..."
              rows={2}
              className="flex w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none resize-none placeholder:text-muted-foreground focus:border-ring focus:ring-3 focus:ring-ring/50"
            />
          </div>

          <DialogFooter showCloseButton>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Stethoscope className="h-4 w-4" />
                  Create Provider
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
