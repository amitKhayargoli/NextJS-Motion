"use client";

import Image from "next/image";
import { Mail, Lock, Eye, EyeOff, X } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

import {
  RequestResetFormData,
  requestResetSchema,
  SetNewPasswordFormData,
  setNewPasswordSchema,
} from "../schema/resetPasswordSchema";

import {
  handleRequestPasswordReset,
  handleResetPassword,
} from "@/lib/actions/auth-action";

// Props:
// - mode="request": user enters email -> send reset link/otp
// - mode="set": user enters new password -> uses token (from url) to reset
interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: "request" | "set";
  token?: string; // required for mode="set"
}

export default function ResetPasswordModal({
  isOpen,
  onClose,
  mode = "request",
  token = "",
}: ResetPasswordModalProps) {
  const router = useRouter();
  const isSetMode = mode === "set";

  // Password toggles only needed in set mode
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // ---------- REQUEST RESET FORM ----------
  const requestForm = useForm<RequestResetFormData>({
    resolver: zodResolver(requestResetSchema),
    mode: "onSubmit",
  });

  // ---------- SET NEW PASSWORD FORM ----------
  const setForm = useForm<SetNewPasswordFormData>({
    resolver: zodResolver(setNewPasswordSchema),
    mode: "onSubmit",
  });

  // If modal closes, clear everything
  useEffect(() => {
    if (!isOpen) {
      setError(null);
      requestForm.reset();
      setForm.reset();
      setShowPassword(false);
      setShowConfirmPassword(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Toast Zod errors (similar to your LoginModal pattern)
  useEffect(() => {
    const errors = isSetMode
      ? setForm.formState.errors
      : requestForm.formState.errors;
    Object.entries(errors).forEach(([field, err]) => {
      const msg = (err as any)?.message;
      if (msg) toast.error(msg, { id: field });
    });
  }, [isSetMode, requestForm.formState.errors, setForm.formState.errors]);

  const onSubmitRequest = (values: RequestResetFormData) => {
    setError(null);

    startTransition(async () => {
      try {
        // 🔁 Replace with your actual server action
        // Expected: { success: boolean; message?: string }
        const result = await handleRequestPasswordReset(values.email);

        if (result?.success) {
          toast.success(
            result.message || "Reset instructions sent to your email.",
          );
          onClose();
          requestForm.reset();
          return;
        }

        throw new Error(result?.message || "Failed to send reset instructions");
      } catch (err: any) {
        toast.error(err?.message || "Failed to send reset instructions");
        setError(err?.message || "Failed to send reset instructions");
      }
    });
  };

  const onSubmitSet = (values: SetNewPasswordFormData) => {
    setError(null);

    startTransition(async () => {
      try {
        if (!token) throw new Error("Reset token is missing.");

        const result = await handleResetPassword(token, values.newPassword);

        if (result.success) {
          toast.success("Password has been reset successfully.");
          onClose();
          setForm.reset();
          return router.push("/login");
        }

        throw new Error(result.message || "Failed to reset password");
      } catch (err: any) {
        toast.error(err?.message || "Failed to reset password");
        setError(err?.message || "Failed to reset password");
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-md bg-[#0b0f0c] rounded-2xl shadow-lg p-8 md:p-10 border border-white/10">
        {/* CLOSE BUTTON */}
        <div className="flex justify-end mb-4">
          <button type="button" className="cursor-pointer" onClick={onClose}>
            <X className="text-white" />
          </button>
        </div>

        {/* Logo header */}
        <div className="flex flex-col items-center mb-6">
          <Image src="/logo.png" alt="Logo" width={50} height={50} />
          <h2 className="text-[#cffb87] text-2xl font-bold text-center mt-2">
            MotionAI
          </h2>
          <p className="text-center text-2xl font-bold text-white mt-1">
            {isSetMode ? "Reset Password" : "Forgot Password?"}
          </p>
          <p className="text-center text-sm text-gray-400 mt-1">
            {isSetMode
              ? "Enter a new password for your account"
              : "Enter your email to receive reset instructions"}
          </p>
        </div>

        {/* ERROR */}
        {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

        {/* --------- REQUEST MODE --------- */}
        {!isSetMode && (
          <form
            onSubmit={requestForm.handleSubmit(onSubmitRequest)}
            className="space-y-4"
          >
            {/* EMAIL */}
            <div>
              <label className="label">
                <span className="label-text text-white/80">Email</span>
              </label>
              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50"
                />
                <input
                  type="email"
                  placeholder="you@example.com"
                  {...requestForm.register("email")}
                  className={`w-full pl-10 pr-3 py-3 border rounded-lg
                    bg-white/10 text-white placeholder-white/40
                    focus:outline-none focus:ring-1
                    ${
                      requestForm.formState.errors.email
                        ? "border-red-500 focus:ring-red-500"
                        : "border-white/10 focus:ring-[#007400]"
                    }`}
                />
              </div>
              {requestForm.formState.errors.email && (
                <p className="text-sm text-red-400 mt-2">
                  {requestForm.formState.errors.email.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={requestForm.formState.isSubmitting || pending}
              className="w-full bg-[#007400] text-white py-3 rounded-lg
                         hover:bg-[#0a8a0a] transition disabled:opacity-60"
            >
              {requestForm.formState.isSubmitting || pending
                ? "Sending..."
                : "Send Reset Link"}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full text-sm text-[#AE4700] hover:underline"
            >
              Back
            </button>
          </form>
        )}

        {/* --------- SET MODE --------- */}
        {isSetMode && (
          <form
            onSubmit={setForm.handleSubmit(onSubmitSet)}
            className="space-y-4"
          >
            {/* NEW PASSWORD */}
            <div>
              <label className="label">
                <span className="label-text text-white/80">New Password</span>
              </label>
              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50"
                />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="New password"
                  autoComplete="new-password"
                  {...setForm.register("newPassword")}
                  className={`w-full pl-10 pr-10 py-3 border rounded-lg
                    bg-white/10 text-white placeholder-white/40
                    focus:outline-none focus:ring-1
                    ${
                      setForm.formState.errors.newPassword
                        ? "border-red-500 focus:ring-red-500"
                        : "border-white/10 focus:ring-[#007400]"
                    }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {setForm.formState.errors.newPassword && (
                <p className="text-sm text-red-400 mt-2">
                  {setForm.formState.errors.newPassword.message}
                </p>
              )}
            </div>

            {/* CONFIRM PASSWORD */}
            <div>
              <label className="label">
                <span className="label-text text-white/80">
                  Confirm Password
                </span>
              </label>
              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50"
                />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                  {...setForm.register("confirmPassword")}
                  className={`w-full pl-10 pr-10 py-3 border rounded-lg
                    bg-white/10 text-white placeholder-white/40
                    focus:outline-none focus:ring-1
                    ${
                      setForm.formState.errors.confirmPassword
                        ? "border-red-500 focus:ring-red-500"
                        : "border-white/10 focus:ring-[#007400]"
                    }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
              {setForm.formState.errors.confirmPassword && (
                <p className="text-sm text-red-400 mt-2">
                  {setForm.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={setForm.formState.isSubmitting || pending}
              className="w-full bg-[#007400] text-white py-3 rounded-lg
                         hover:bg-[#0a8a0a] transition disabled:opacity-60"
            >
              {setForm.formState.isSubmitting || pending
                ? "Resetting password..."
                : "Reset Password"}
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                router.push("/login");
              }}
              className="w-full text-sm text-[#AE4700] hover:underline"
            >
              Back to login
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
