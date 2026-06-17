"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { AuthCard } from "@/components/auth/AuthCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/lib/api/auth";
import { forgotPasswordSchema, type ForgotPasswordFormValues } from "@/lib/validations/auth";

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const [sentEmail, setSentEmail] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({ resolver: zodResolver(forgotPasswordSchema) });

  async function onSubmit(data: ForgotPasswordFormValues) {
    try {
      await authApi.forgotPassword(data);
      setSentEmail(data.email);
      setSubmitted(true);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail ?? "Something went wrong. Please try again.";
      toast.error(message);
    }
  }

  if (submitted) {
    return (
      <AuthCard title="Check your email" description={`We sent a reset code to ${sentEmail}`}>
        <div className="text-center space-y-4">
          <p className="text-sm text-slate-600">
            Enter the code on the next page to set a new password.
          </p>
          <Link href={`/reset-password?email=${encodeURIComponent(sentEmail)}`}>
            <Button className="w-full">Continue to reset password</Button>
          </Link>
          <Link href="/login" className="block text-sm text-blue-600 hover:underline">
            Back to sign in
          </Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Forgot password?"
      description="Enter your email and we'll send you a reset code"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            {...register("email")}
          />
          {errors.email && (
            <p className="text-xs text-red-500">{errors.email.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Send reset code
        </Button>
      </form>

      <Link
        href="/login"
        className="mt-4 flex items-center justify-center gap-1.5 text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft size={14} />
        Back to sign in
      </Link>
    </AuthCard>
  );
}
