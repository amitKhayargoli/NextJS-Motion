import React from "react";
import { render, screen } from "@testing-library/react";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
  useParams: () => ({ id: "ws-1" }),
}));

jest.mock("zustand/react/shallow", () => ({
  useShallow: (selector: any) => selector,
}));

jest.mock("@/store/workspace.store", () => ({
  useWorkspaceStore: jest.fn(),
}));

jest.mock("@/store/note.store", () => ({
  useNotesStore: jest.fn(),
}));

jest.mock("@/lib/actions/rag-action", () => ({
  handleCreateRagThread: jest.fn(),
}));

jest.mock("@/lib/actions/workspace-action", () => ({
  handleCreateWorkspace: jest.fn(),
  handleGetWorkspaces: jest.fn(),
  handleJoinWorkspace: jest.fn(),
  handleRequestEditAccess: jest.fn(),
  handleGetMyAccessRequest: jest
    .fn()
    .mockResolvedValue({ data: { status: null } }),
  handleGetPendingRequests: jest.fn().mockResolvedValue({ data: [] }),
}));

jest.mock("react-hot-toast", () => {
  const t = { error: jest.fn(), success: jest.fn() };
  return { __esModule: true, default: t };
});

jest.mock("@/app/workspace/_components/WorkspaceRoleModal", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("@/app/workspace/_components/WorkspaceOnboardingModal", () => ({
  __esModule: true,
  default: () => null,
}));

import WorkspaceHomePage from "@/app/workspace/[id]/page";
import { useWorkspaceStore } from "@/store/workspace.store";
import { useNotesStore } from "@/store/note.store";

const mockWorkspaceStore = useWorkspaceStore as unknown as jest.Mock;
const mockNotesStore = useNotesStore as unknown as jest.Mock;

function setupStores({
  userRole = "EDITOR",
  notes = [],
  loading = false,
}: {
  userRole?: "OWNER" | "EDITOR" | "VIEWER";
  notes?: any[];
  loading?: boolean;
}) {
  mockWorkspaceStore.mockImplementation((selector: any) =>
    selector({
      workspaces: [
        { id: "ws-1", name: "Test Workspace", userRole, ownerId: "owner-1" },
      ],
      activeWorkspaceId: "ws-1",
      setWorkspaces: jest.fn(),
      setActiveWorkspaceId: jest.fn(),
      getActiveWorkspace: jest.fn(),
    }),
  );

  mockNotesStore.mockImplementation((selector: any) =>
    selector({
      notesByWorkspaceId: { "ws-1": notes },
      loadingByWorkspace: { "ws-1": loading },
      errorByWorkspace: {},
      fetchNotes: jest.fn(),
      setNotes: jest.fn(),
      deleteNoteOptimistic: jest.fn(),
    }),
  );
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("WorkspaceHomePage", () => {
  it("shows 'No notes found' when workspace has no notes", () => {
    setupStores({ userRole: "EDITOR", notes: [] });
    render(<WorkspaceHomePage />);
    expect(screen.getByText("No notes found")).toBeInTheDocument();
  });

  it("shows 'Manage Roles' button when the current user is OWNER", () => {
    setupStores({ userRole: "OWNER", notes: [] });
    render(<WorkspaceHomePage />);
    expect(
      screen.getByRole("button", { name: /manage roles/i }),
    ).toBeInTheDocument();
  });

  it("shows 'Request Edit Access' button when the current user is VIEWER", () => {
    setupStores({ userRole: "VIEWER", notes: [] });
    render(<WorkspaceHomePage />);
    expect(
      screen.getByRole("button", { name: /request edit access/i }),
    ).toBeInTheDocument();
  });
});
