import { loginSchema } from "@/app/(auth)/schema/loginSchema";

describe("loginSchema", () => {
  it("rejects empty email with 'Email is required'", () => {
    const result = loginSchema.safeParse({ email: "", password: "abc123" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const emailErrors = result.error.flatten().fieldErrors.email;
      expect(emailErrors).toContain("Email is required");
    }
  });

  it("rejects invalid email format with 'Invalid email address'", () => {
    const result = loginSchema.safeParse({
      email: "notanemail",
      password: "abc123",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const emailErrors = result.error.flatten().fieldErrors.email;
      expect(emailErrors).toContain("Invalid email address");
    }
  });

  it("rejects password shorter than 6 characters", () => {
    const result = loginSchema.safeParse({ email: "a@b.com", password: "hi" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const pwErrors = result.error.flatten().fieldErrors.password;
      expect(pwErrors).toContain("Password must be at least 6 characters long");
    }
  });

  it("rejects empty password", () => {
    const result = loginSchema.safeParse({ email: "a@b.com", password: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const pwErrors = result.error.flatten().fieldErrors.password;
      expect(pwErrors!.length).toBeGreaterThan(0);
    }
  });

  it("accepts valid email and password", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "secret1",
    });
    expect(result.success).toBe(true);
  });
});
