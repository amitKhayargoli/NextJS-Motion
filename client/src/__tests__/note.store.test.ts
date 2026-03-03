import { useNotesStore } from "@/store/note.store";

jest.mock("@/lib/actions/note-action", () => ({
  handleGetWorkspaceNotes: jest.fn(),
  handleDeleteNote: jest.fn(),
}));

import {
  handleGetWorkspaceNotes,
  handleDeleteNote,
} from "@/lib/actions/note-action";

const mockGet = handleGetWorkspaceNotes as jest.Mock;
const mockDelete = handleDeleteNote as jest.Mock;

beforeEach(() => {
  useNotesStore.setState({
    notesByWorkspaceId: {},
    loadingByWorkspace: {},
    errorByWorkspace: {},
  });
  jest.clearAllMocks();
});

describe("notesStore", () => {
  it("fetchNotes normalizes the API response and clears loading state", async () => {
    mockGet.mockResolvedValueOnce({
      success: true,
      data: [
        { id: "n-1", title: "First Note", updatedAt: "2024-01-01" },
        { _id: "n-2", title: "Second Note", type: "text" },
      ],
    });

    await useNotesStore.getState().fetchNotes("ws-1");

    const state = useNotesStore.getState();
    expect(state.notesByWorkspaceId["ws-1"]).toEqual([
      {
        id: "n-1",
        title: "First Note",
        updatedAt: "2024-01-01",
        type: undefined,
        status: undefined,
      },
      {
        id: "n-2",
        title: "Second Note",
        updatedAt: undefined,
        type: "text",
        status: undefined,
      },
    ]);
    expect(state.loadingByWorkspace["ws-1"]).toBe(false);
  });

  it("deleteNoteOptimistic rolls back to the original list when the API call fails", async () => {
    const initial = [
      { id: "n-1", title: "Keep" },
      { id: "n-2", title: "Delete me" },
    ];
    useNotesStore.setState({ notesByWorkspaceId: { "ws-1": initial } });

    mockDelete.mockResolvedValueOnce({
      success: false,
      message: "Server error",
    });

    const result = await useNotesStore
      .getState()
      .deleteNoteOptimistic({ workspaceId: "ws-1", noteId: "n-2" });

    expect(result.success).toBe(false);
    expect(useNotesStore.getState().notesByWorkspaceId["ws-1"]).toEqual(
      initial,
    );
  });
});
