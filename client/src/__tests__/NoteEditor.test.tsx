import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

jest.mock("quill", () => ({
  __esModule: true,
  default: class {
    enable() {}
    on() {}
    off() {}
    getLength() {
      return 1;
    }
    setSelection() {}
    getText() {
      return "";
    }
    clipboard = { dangerouslyPasteHTML() {} };
    root = { innerHTML: "", parentElement: null };
  },
}));

jest.mock("@/lib/actions/note-action", () => ({
  handleUpdateNote: jest.fn(),
  handleAddSummary: jest.fn(),
}));

import NoteEditor from "@/app/workspace/_components/notes/NoteEditor";
import { handleAddSummary } from "@/lib/actions/note-action";

const mockAddSummary = handleAddSummary as jest.Mock;

const BASE_NOTE = {
  id: "note-1",
  workspaceId: "ws-1",
  title: "Test Note",
  content: "<p>Hello</p>",
  status: "PUBLISHED",
  summary: null,
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("NoteEditor", () => {
  it("renders title input with placeholder 'Note Title'", () => {
    render(<NoteEditor note={BASE_NOTE} userRole="EDITOR" />);
    expect(screen.getByPlaceholderText("Note Title")).toBeInTheDocument();
  });

  it("title input is disabled when userRole is VIEWER", () => {
    render(<NoteEditor note={BASE_NOTE} userRole="VIEWER" />);
    expect(screen.getByPlaceholderText("Note Title")).toBeDisabled();
  });

  it("calls handleAddSummary with note id and workspaceId when Summarize is clicked", async () => {
    mockAddSummary.mockResolvedValueOnce({
      success: true,
      data: { summary: "A short summary" },
    });

    render(<NoteEditor note={BASE_NOTE} userRole="EDITOR" />);

    fireEvent.click(screen.getByRole("button", { name: /summarize/i }));

    await waitFor(() => {
      expect(mockAddSummary).toHaveBeenCalledWith("note-1", "ws-1");
    });
  });
});
