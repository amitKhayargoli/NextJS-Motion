import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

jest.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, open }: any) => (open ? <div>{children}</div> : null),
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <div>{children}</div>,
  DialogDescription: ({ children }: any) => <div>{children}</div>,
}));

jest.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, disabled, type, ...rest }: any) => (
    <button
      type={type ?? "button"}
      onClick={onClick}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  ),
}));

jest.mock("@/components/ui/input", () => ({
  Input: React.forwardRef((props: any, ref: any) => (
    <input ref={ref} {...props} />
  )),
}));

jest.mock("@/components/ui/separator", () => ({
  Separator: () => <hr />,
}));

jest.mock("react-hot-toast", () => {
  const t = { error: jest.fn(), success: jest.fn() };
  return { __esModule: true, default: t };
});

import WorkspaceOnboardingModal from "@/app/workspace/_components/WorkspaceOnboardingModal";

function renderModal(
  overrides: Partial<{
    open: boolean;
    onCreate: jest.Mock;
    onJoin: jest.Mock;
  }> = {},
) {
  const props = {
    open: true,
    onOpenChange: jest.fn(),
    onCreate: jest.fn().mockResolvedValue(undefined),
    onJoin: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
  render(<WorkspaceOnboardingModal {...props} />);
  return props;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("WorkspaceOnboardingModal", () => {
  it("renders Create Workspace and Join Workspace buttons", () => {
    renderModal();
    expect(
      screen.getByRole("button", { name: /create workspace/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /join workspace/i }),
    ).toBeInTheDocument();
  });

  it("shows inline error 'Workspace name is required' when name is too short", async () => {
    renderModal();

    fireEvent.change(screen.getByPlaceholderText("My Workspace"), {
      target: { value: "a" },
    });

    await waitFor(() => {
      expect(
        screen.getByText("Workspace name is required"),
      ).toBeInTheDocument();
    });
  });

  it("calls onCreate with the workspace name when form is submitted with valid data", async () => {
    const { onCreate } = renderModal();

    fireEvent.change(screen.getByPlaceholderText("My Workspace"), {
      target: { value: "My Workspace" },
    });

    fireEvent.submit(
      screen
        .getByRole("button", { name: /create workspace/i })
        .closest("form")!,
    );

    await waitFor(() => {
      expect(onCreate).toHaveBeenCalledWith("My Workspace");
    });
  });
});
