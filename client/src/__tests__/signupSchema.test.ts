import { signupSchema } from "@/app/(auth)/schema/signupSchema";

describe("signupSchema", () => {
  it("rejects empty email with 'Email is required'", () => {
    const result = signupSchema.safeParse({
      email: "",
      username: "john",
      password: "abc123",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.email).toContain(
        "Email is required",
      );
    }
  });

  it("rejects username shorter than 3 characters", () => {
    const result = signupSchema.safeParse({
      email: "a@b.com",
      username: "jo",
      password: "abc123",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const usernameErrors = result.error.flatten().fieldErrors.username;
      expect(usernameErrors).toContain(
        "Username must be at least 3 characters long",
      );
    }
  });

  it("rejects password shorter than 6 characters", () => {
    const result = signupSchema.safeParse({
      email: "a@b.com",
      username: "john",
      password: "hi",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const pwErrors = result.error.flatten().fieldErrors.password;
      expect(pwErrors).toContain("Password must be at least 6 characters long");
    }
  });

  it("rejects invalid email format with 'Invalid email address'", () => {
    const result = signupSchema.safeParse({
      email: "bademail",
      username: "john",
      password: "abc123",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const emailErrors = result.error.flatten().fieldErrors.email;
      expect(emailErrors).toContain("Invalid email address");
    }
  });

  it("accepts valid email, username, and password", () => {
    const result = signupSchema.safeParse({
      email: "user@example.com",
      username: "john",
      password: "secret1",
    });
    expect(result.success).toBe(true);
  });
});
