export default function WorkspaceHomePage() {
  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-5 flex items-center gap-3">
        <span className="text-sm text-muted-foreground">
          Select a note from the sidebar, or create a new one (⌘K).
        </span>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium">No note selected</p>
          <p className="text-muted-foreground text-sm">
            Pick a note from the sidebar to start editing.
          </p>
        </div>
      </div>
    </div>
  );
}
