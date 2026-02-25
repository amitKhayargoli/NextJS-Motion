"use client";

import NoteEditor from "./NoteEditor";
import { useWorkspaceStore } from "@/store/workspace.store";

type Role = "VIEWER" | "EDITOR" | "OWNER";

export default function NoteEditorWrapper({
  note,
  userRole,
}: {
  note: any;
  userRole?: Role;
}) {
  const finalRole = (userRole ?? "VIEWER") as Role;

  return <NoteEditor note={note} userRole={finalRole} />;
}
