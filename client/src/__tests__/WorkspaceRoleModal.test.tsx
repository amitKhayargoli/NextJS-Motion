import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

jest.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, open }: any) => (open ? <div>{children}</div> : null),
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <div>{children}</div>,
  DialogDescription: ({ children }: any) => <div>{children}</div>,
}));

jest.mock("@/components/ui/alert-dialog", () => ({
  AlertDialog: ({ children, open }: any) =>
    open ? <div>{children}</div> : null,
  AlertDialogContent: ({ children }: any) => <div>{children}</div>,
  AlertDialogHeader: ({ children }: any) => <div>{children}</div>,
  AlertDialogTitle: ({ children }: any) => <div>{children}</div>,
  AlertDialogDescription: ({ children }: any) => <div>{children}</div>,
  AlertDialogFooter: ({ children }: any) => <div>{children}</div>,
  AlertDialogAction: ({ children, onClick, disabled }: any) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
  AlertDialogCancel: ({ children, disabled }: any) => (
    <button disabled={disabled}>{children}</button>
  ),
}));

jest.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, disabled, ...rest }: any) => (
    <button onClick={onClick} disabled={disabled} {...rest}>
      {children}
    </button>
  ),
}));

jest.mock("@/components/ui/scroll-area", () => ({
  ScrollArea: ({ children }: any) => <div>{children}</div>,
}));

jest.mock("@/components/ui/separator", () => ({
  Separator: () => <hr />,
}));

jest.mock("@/components/ui/badge", () => ({
  Badge: ({ children }: any) => <span>{children}</span>,
}));

jest.mock("@/components/ui/avatar", () => ({
  Avatar: ({ children }: any) => <div>{children}</div>,
  AvatarImage: ({ src }: any) => (src ? <img alt="" src={src} /> : null),
  AvatarFallback: ({ children }: any) => <span>{children}</span>,
}));

jest.mock("@/components/ui/select", () => ({
  Select: ({ children }: any) => <div>{children}</div>,
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children, value }: any) => (
    <div data-value={value}>{children}</div>
  ),
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
}));

jest.mock("react-hot-toast", () => {
  const t = { error: jest.fn(), success: jest.fn() };
  return { __esModule: true, default: t };
});

jest.mock("../../context/AuthContext", () => ({
  useAuth: () => ({ user: { _id: "owner-1" } }),
}));

jest.mock("@/lib/actions/workspace-action", () => ({
  handleGetWorkspaceMembers: jest.fn(),
  handleUpdateMemberRole: jest.fn(),
  handleRemoveMember: jest.fn(),
  handleGetPendingRequests: jest.fn(),
  handleApproveRequest: jest.fn(),
  handleDenyRequest: jest.fn(),
}));

import WorkspaceRoleModal from "@/app/workspace/_components/WorkspaceRoleModal";
import {
  handleGetWorkspaceMembers,
  handleGetPendingRequests,
  handleApproveRequest,
} from "@/lib/actions/workspace-action";

const mockGetMembers = handleGetWorkspaceMembers as jest.Mock;
const mockGetPending = handleGetPendingRequests as jest.Mock;
const mockApprove = handleApproveRequest as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe("WorkspaceRoleModal", () => {
  it("shows loading state initially when modal opens", () => {
    mockGetMembers.mockReturnValue(new Promise(() => {}));
    mockGetPending.mockReturnValue(new Promise(() => {}));

    const onOpenChange = jest.fn();
    render(
      <WorkspaceRoleModal
        open={true}
        onOpenChange={onOpenChange}
        workspaceId="ws-1"
      />,
    );

    expect(screen.getByText("Loading members…")).toBeInTheDocument();
  });

  it("renders member username after data loads", async () => {
    mockGetMembers.mockResolvedValueOnce({
      success: true,
      data: [
        {
          userId: "u-2",
          username: "Alice",
          email: "alice@test.com",
          role: "EDITOR",
        },
      ],
    });
    mockGetPending.mockResolvedValueOnce({ success: true, data: [] });

    const onOpenChange = jest.fn();
    render(
      <WorkspaceRoleModal
        open={true}
        onOpenChange={onOpenChange}
        workspaceId="ws-1"
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeInTheDocument();
    });
  });

  it("calls handleApproveRequest when Approve button is clicked", async () => {
    mockGetMembers.mockResolvedValueOnce({ success: true, data: [] });
    mockGetPending.mockResolvedValueOnce({
      success: true,
      data: [
        {
          id: "req-1",
          userId: "u-3",
          status: "PENDING",
          user: { id: "u-3", username: "Bob", email: "bob@test.com" },
        },
      ],
    });
    mockApprove.mockResolvedValueOnce({ success: true });

    const onOpenChange = jest.fn();
    render(
      <WorkspaceRoleModal
        open={true}
        onOpenChange={onOpenChange}
        workspaceId="ws-1"
      />,
    );

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /approve/i }),
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /approve/i }));

    await waitFor(() => {
      expect(mockApprove).toHaveBeenCalledWith("ws-1", "req-1");
    });
  });
});
