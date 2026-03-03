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
  handleRegister: jest.fn(),
}));

jest.mock("react-hot-toast", () => {
  const toastFns = { error: jest.fn(), success: jest.fn() };
  return { __esModule: true, default: toastFns, toast: toastFns };
});

jest.mock("@/store/auth.store", () => ({
  useAuthStore: (selector: any) =>
    selector({ openLoginModal: jest.fn(), openSignupModal: jest.fn() }),
}));

jest.mock("bcryptjs", () => ({}));

import SignupModal from "@/app/(auth)/_components/SignupModal";
import { handleRegister } from "@/lib/actions/auth-action";
import toast from "react-hot-toast";

const mockHandleRegister = handleRegister as jest.Mock;

function renderModal() {
  const onClose = jest.fn();
  render(<SignupModal isOpen={true} onClose={onClose} />);
  return { onClose };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("SignupModal", () => {
  it("renders email, username, and password fields plus Sign Up button", () => {
    renderModal();
    expect(screen.getByPlaceholderText("you@example.com")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("john")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("••••••••")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign up/i }),
    ).toBeInTheDocument();
  });

  it("shows username validation error toast when username is too short", async () => {
    renderModal();

    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("john"), {
      target: { value: "jo" },
    });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "secret1" },
    });
    fireEvent.submit(
      screen.getByRole("button", { name: /sign up/i }).closest("form")!,
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Username must be at least 3 characters long",
        expect.anything(),
      );
    });
    expect(mockHandleRegister).not.toHaveBeenCalled();
  });
});
