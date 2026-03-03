import { Suspense } from "react";
import ResetPasswordContent from "../_components/ResetPasswordContent";

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-white">
          Loading...
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
