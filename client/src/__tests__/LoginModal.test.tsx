import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

jest.mock("@/app/_components/ui/Modal", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => <img {...props} />,
}));

jest.mock("@/lib/actions/auth-action", () => ({
  handleLogin: jest.fn(),
}));

jest.mock("react-hot-toast", () => {
  const toastFns = { error: jest.fn(), success: jest.fn() };
  return { __esModule: true, default: toastFns, toast: toastFns };
});

jest.mock("../../context/AuthContext", () => ({
  useAuth: () => ({ checkAuth: jest.fn().mockResolvedValue(undefined) }),
}));

jest.mock("@/store/auth.store", () => ({
  useAuthStore: (selector: any) =>
    selector({ openSignupModal: jest.fn(), openLoginModal: jest.fn() }),
}));

jest.mock("bcryptjs", () => ({}));

jest.mock("@/app/(auth)/_components/ResetPasswordModal", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import LoginModal from "@/app/(auth)/_components/LoginModal";
import { handleLogin } from "@/lib/actions/auth-action";
import toast from "react-hot-toast";

const mockHandleLogin = handleLogin as jest.Mock;

function renderModal() {
  const onClose = jest.fn();
  render(<LoginModal isOpen={true} onClose={onClose} />);
  return { onClose };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("LoginModal", () => {
  it("renders email field, password field, and Sign In button", () => {
    renderModal();
    expect(screen.getByPlaceholderText("you@example.com")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("••••••••")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign in/i }),
    ).toBeInTheDocument();
  });

  it("shows email validation error toast when submitted with empty email", async () => {
    renderModal();
    fireEvent.submit(
      screen.getByRole("button", { name: /sign in/i }).closest("form")!,
    );
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Email is required",
        expect.anything(),
      );
    });
  });

  it("calls handleLogin with email and password when form is valid", async () => {
    mockHandleLogin.mockResolvedValueOnce({ success: true });
    renderModal();

    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "secret1" },
    });
    fireEvent.submit(
      screen.getByRole("button", { name: /sign in/i }).closest("form")!,
    );

    await waitFor(() => {
      expect(mockHandleLogin).toHaveBeenCalledWith({
        email: "user@example.com",
        password: "secret1",
      });
    });
  });
});
