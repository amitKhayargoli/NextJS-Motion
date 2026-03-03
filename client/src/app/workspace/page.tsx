import { redirect } from "next/navigation";
import { getTokenCookie } from "@/lib/cookie";
import { handleGetWorkspaces } from "@/lib/actions/workspace-action";
import WorkspaceRedirectClient from "./_components/WorkspaceRedirectClient";

export default async function WorkspacePage() {
  const token = await getTokenCookie();
  if (!token) redirect("/");

  const res = await handleGetWorkspaces();
  const workspaces = res?.success ? (res.data ?? []) : [];

  return <WorkspaceRedirectClient initialWorkspaces={workspaces} />;
}
