import { useWorkspaceStore, Workspace } from "@/store/workspace.store";

const mockWorkspaces: Workspace[] = [
  { id: "ws-1", name: "Alpha", userRole: "OWNER", ownerId: "user-1" },
  { id: "ws-2", name: "Beta", userRole: "EDITOR", ownerId: "user-2" },
];

beforeEach(() => {
  useWorkspaceStore.setState({ workspaces: [], activeWorkspaceId: null });
});

describe("workspaceStore", () => {
  it("setWorkspaces stores the provided list", () => {
    useWorkspaceStore.getState().setWorkspaces(mockWorkspaces);
    expect(useWorkspaceStore.getState().workspaces).toEqual(mockWorkspaces);
  });

  it("getActiveWorkspace returns the workspace matching activeWorkspaceId", () => {
    useWorkspaceStore.setState({
      workspaces: mockWorkspaces,
      activeWorkspaceId: "ws-2",
    });
    const active = useWorkspaceStore.getState().getActiveWorkspace();
    expect(active).toEqual(mockWorkspaces[1]);
  });

  it("getActiveWorkspace returns null when activeWorkspaceId has no match", () => {
    useWorkspaceStore.setState({
      workspaces: mockWorkspaces,
      activeWorkspaceId: "ws-999",
    });
    expect(useWorkspaceStore.getState().getActiveWorkspace()).toBeNull();
  });
});
