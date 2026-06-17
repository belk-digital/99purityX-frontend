"use client";

import { Suspense } from "react";
import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";

import { AuthCard } from "@/components/auth/AuthCard";
import { OtpInput } from "@/components/auth/OtpInput";
import { Button } from "@/components/ui/button";
import { authApi } from "@/lib/api/auth";
import { verifyEmailSchema, type VerifyEmailFormValues } from "@/lib/validations/auth";

function VerifyEmailForm() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") ?? "";
  const [resendCooldown, setResendCooldown] = useState(0);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<VerifyEmailFormValues>({ resolver: zodResolver(verifyEmailSchema) });

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  async function onSubmit(data: VerifyEmailFormValues) {
    try {
      await authApi.verifyEmail({ email, otp: data.otp });
      toast.success("Email verified! Please sign in.");
      router.push("/login");
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail ?? "Invalid or expired code. Try again.";
      toast.error(message);
    }
  }

  async function resend() {
    try {
      await authApi.resendOtp({ email });
      setResendCooldown(60);
      toast.success("A new code has been sent to your email.");
    } catch {
      toast.error("Could not resend code. Please try again.");
    }
  }

  return (
    <AuthCard title="Check your email" description={`We sent a 6-digit code to ${email || "your email"}`}>
      <div className="flex justify-center mb-6">
        <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
          <MailCheck className="text-blue-600" size={32} />
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Controller
          name="otp"
          control={control}
          defaultValue=""
          render={({ field }) => (
            <OtpInput value={field.value} onChange={field.onChange} disabled={isSubmitting} />
          )}
        />
        {errors.otp && (
          <p className="text-xs text-red-500 text-center">{errors.otp.message}</p>
        )}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Verify email
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-slate-600">
        Didn&apos;t receive it?{" "}
        <button
          type="button"
          onClick={resend}
          disabled={resendCooldown > 0}
          className="text-blue-600 font-medium hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
        </button>
      </p>
    </AuthCard>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>}>
      <VerifyEmailForm />
    </Suspense>
  );
}
