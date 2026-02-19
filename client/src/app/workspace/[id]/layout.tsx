import React from "react";
import WorkspaceShell from "../_components/WorkspaceShell";

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <WorkspaceShell workspaceId={id}>{children}</WorkspaceShell>;
}
