"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, TrendingUp } from "lucide-react";
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
import { goalsApi } from "@/lib/api/goals";
import type { HealthGoal } from "@/types/goal";

interface LogProgressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal: HealthGoal;
}

export function LogProgressDialog({ open, onOpenChange, goal }: LogProgressDialogProps) {
  const queryClient = useQueryClient();
  const [value, setValue] = useState("");
  const [notes, setNotes] = useState("");

  const mutation = useMutation({
    mutationFn: goalsApi.recordProgress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      queryClient.invalidateQueries({ queryKey: ["goal", goal.id] });
      toast.success("Progress recorded!");
      setValue("");
      setNotes("");
      onOpenChange(false);
    },
    onError: (err: { response?: { data?: { detail?: string } } }) => {
      toast.error(err?.response?.data?.detail ?? "Failed to record progress");
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const num = parseFloat(value);
    if (isNaN(num)) {
      toast.error("Please enter a valid number");
      return;
    }
    mutation.mutate({
      goal_id: goal.id,
      value: num,
      notes: notes || undefined,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Log Progress</DialogTitle>
        </DialogHeader>

        <div className="rounded-lg bg-slate-50 p-3 text-sm">
          <p className="font-medium text-slate-800">{goal.title}</p>
          <p className="mt-0.5 text-xs text-slate-500">
            Target: {goal.target_value ?? "—"}
            {goal.unit && ` ${goal.unit}`}
            {goal.current_value != null && (
              <span className="ml-2">· Current: {goal.current_value}{goal.unit && ` ${goal.unit}`}</span>
            )}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="progress-value">
              Value{goal.unit ? ` (${goal.unit})` : ""} *
            </Label>
            <Input
              id="progress-value"
              type="number"
              step="any"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={`e.g. ${goal.current_value ?? goal.start_value ?? "0"}`}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="progress-notes">Notes</Label>
            <textarea
              id="progress-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes about this entry..."
              rows={2}
              className="flex w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none resize-none placeholder:text-muted-foreground focus:border-ring focus:ring-3 focus:ring-ring/50"
            />
          </div>

          <DialogFooter showCloseButton>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <TrendingUp className="h-4 w-4" />
                  Log Progress
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
