"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ResetPasswordModal from "./ResetPasswordModal";

export default function ResetPasswordContent() {
  const [open, setOpen] = useState(true);
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get("token");

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Invalid or missing token
      </div>
    );
  }

  return (
    <ResetPasswordModal
      isOpen={open}
      onClose={() => {
        setOpen(false);
        router.push("/");
      }}
      mode="set"
      token={token}
    />
  );
}
