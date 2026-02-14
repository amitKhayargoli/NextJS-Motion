import z from "zod";

export const requestResetSchema = z.object({
  email: z.string().email("Please enter a valid email"),
});

export type RequestResetFormData = z.infer<typeof requestResetSchema>;

export const setNewPasswordSchema = z
  .object({
    newPassword: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Confirm your password"),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type SetNewPasswordFormData = z.infer<typeof setNewPasswordSchema>;
