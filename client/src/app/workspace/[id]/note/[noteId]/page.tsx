import NoteEditorWrapper from "@/app/workspace/_components/notes/NoteEditorWrapper";
import { handleGetNote } from "@/lib/actions/note-action";

export default async function NotePage({
  params,
}: {
  params: Promise<{ id: string; noteId: string }>;
}) {
  const { id: workspaceId, noteId } = await params;

  const res = await handleGetNote(noteId, workspaceId);

  if (!res.success || !res.data) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">
          Note not found or access denied.
        </p>
      </div>
    );
  }

  // supports both shapes:
  const payload: any = res.data;
  const note = payload.note ?? payload;
  const userRole = payload.userRole;

  return (
    <div className="h-full overflow-hidden">
      <NoteEditorWrapper note={note} userRole={userRole} />
    </div>
  );
}
