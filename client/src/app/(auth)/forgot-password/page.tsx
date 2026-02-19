"use client";

import { useState } from "react";
import ResetPasswordModal from "../_components/ResetPasswordModal";

export default function ForgotPasswordPage() {
  const [open, setOpen] = useState(true);

  return (
    <ResetPasswordModal
      isOpen={open}
      onClose={() => setOpen(false)}
      mode="request"
    />
  );
}
