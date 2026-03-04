"use client";

import * as React from "react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Trash2 } from "lucide-react";

import { useAuth } from "../../../../context/AuthContext";
import {
  handleGetWorkspaceMembers,
  handleUpdateMemberRole,
  handleRemoveMember,
  handleGetPendingRequests,
  handleApproveRequest,
  handleDenyRequest,
} from "@/lib/actions/workspace-action";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent as AlertContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type AccessRequest = {
  id: string;
  userId: string;
  status: string;
  user: {
    id: string;
    username: string;
    email: string;
    profilePicture?: string | null;
  };
};

type WorkspaceUser = {
  userId: string;
  username?: string;
  email?: string;
  role: "OWNER" | "EDITOR" | "VIEWER";
  profilePicture?: string;
};

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  workspaceId: string;
};

function initials(name?: string, email?: string) {
  const src = (name || email || "U").trim();
  const parts = src.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default function WorkspaceRoleModal({
  open,
  onOpenChange,
  workspaceId,
}: Props) {
  const { user } = useAuth();

  const [users, setUsers] = React.useState<WorkspaceUser[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  const [changedRoles, setChangedRoles] = React.useState<
    Map<string, "EDITOR" | "VIEWER">
  >(new Map());

  const [removeOpen, setRemoveOpen] = React.useState(false);
  const [memberToRemove, setMemberToRemove] =
    React.useState<WorkspaceUser | null>(null);
  const [removing, setRemoving] = React.useState(false);

  const [pendingRequests, setPendingRequests] = React.useState<AccessRequest[]>(
    [],
  );
  const [approvingId, setApprovingId] = React.useState<string | null>(null);
  const [denyingId, setDenyingId] = React.useState<string | null>(null);

  const getProfilePictureUrl = (profilePicture?: string) => {
    if (!profilePicture) return "";
    return `${process.env.NEXT_PUBLIC_API_BASE}${profilePicture}`;
  };

  React.useEffect(() => {
    if (!open) return;

    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [membersRes, requestsRes] = await Promise.all([
          handleGetWorkspaceMembers(workspaceId),
          handleGetPendingRequests(workspaceId),
        ]);
        if (!cancelled) {
          if (membersRes.success) setUsers(membersRes.data ?? []);
          else toast.error(membersRes.message || "Failed to load members");

          if (requestsRes.success) setPendingRequests(requestsRes.data ?? []);
        }
      } catch (e: any) {
        if (!cancelled) toast.error(e?.message || "Failed to load members");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, workspaceId]);

  const handleRoleChange = (userId: string, newRole: "EDITOR" | "VIEWER") => {
    setUsers((prev) =>
      prev.map((u) => (u.userId === userId ? { ...u, role: newRole } : u)),
    );
    setChangedRoles((prev) => new Map(prev).set(userId, newRole));
  };

  const handleSaveChanges = async () => {
    if (changedRoles.size === 0) {
      onOpenChange(false);
      return;
    }

    try {
      setSaving(true);

      const promises = Array.from(changedRoles.entries()).map(
        ([userId, role]) => handleUpdateMemberRole(workspaceId, userId, role),
      );

      const results = await Promise.all(promises);
      const failed = results.filter((r: any) => !r.success);

      if (failed.length) {
        toast.error(
          `Some updates failed: ${failed.map((f: any) => f.message).join(", ")}`,
        );
        return;
      }

      toast.success("Roles updated!");
      setChangedRoles(new Map());
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message || "Failed to update roles");
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async (req: AccessRequest) => {
    setApprovingId(req.id);
    try {
      const res = await handleApproveRequest(workspaceId, req.id);
      if (!res.success) {
        toast.error(res.message || "Failed to approve request");
        return;
      }
      // Update the user's role to EDITOR (they're already in the list as VIEWER)
      setUsers((prev) => {
        const exists = prev.some((u) => u.userId === req.user.id);
        if (exists) {
          return prev.map((u) =>
            u.userId === req.user.id ? { ...u, role: "EDITOR" } : u,
          );
        }
        return [
          ...prev,
          {
            userId: req.user.id,
            username: req.user.username,
            email: req.user.email,
            role: "EDITOR",
            profilePicture: req.user.profilePicture ?? undefined,
          },
        ];
      });
      setPendingRequests((prev) => prev.filter((r) => r.id !== req.id));
      toast.success("Request approved");
    } catch (e: any) {
      toast.error(e?.message || "Failed to approve request");
    } finally {
      setApprovingId(null);
    }
  };

  const handleDeny = async (req: AccessRequest) => {
    setDenyingId(req.id);
    try {
      const res = await handleDenyRequest(workspaceId, req.id);
      if (!res.success) {
        toast.error(res.message || "Failed to deny request");
        return;
      }
      setPendingRequests((prev) => prev.filter((r) => r.id !== req.id));
      toast.success("Request denied");
    } catch (e: any) {
      toast.error(e?.message || "Failed to deny request");
    } finally {
      setDenyingId(null);
    }
  };

  const openRemove = (m: WorkspaceUser) => {
    setMemberToRemove(m);
    setRemoveOpen(true);
  };

  const confirmRemove = async () => {
    if (!memberToRemove) return;

    try {
      setRemoving(true);

      const requesterId = (user as any)?._id || (user as any)?.id;

      const res = await handleRemoveMember(
        workspaceId,
        memberToRemove.userId,
        requesterId,
      );

      if (!res.success) {
        toast.error(res.message || "Failed to remove member");
        return;
      }

      setUsers((prev) =>
        prev.filter((u) => u.userId !== memberToRemove.userId),
      );
      setChangedRoles((prev) => {
        const next = new Map(prev);
        next.delete(memberToRemove.userId);
        return next;
      });

      toast.success("Member removed");
      setRemoveOpen(false);
      setMemberToRemove(null);
    } catch (e: any) {
      toast.error(e?.message || "Failed to remove member");
    } finally {
      setRemoving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open ? (
          <DialogContent className="bg-[#121212] text-white border border-white/10 rounded-2xl p-0 overflow-hidden sm:max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.99 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="p-6"
            >
              <DialogHeader>
                <DialogTitle className="text-white">
                  Manage Workspace Roles
                </DialogTitle>
                <DialogDescription className="text-white/60">
                  Change roles for members and remove access when needed.
                </DialogDescription>
              </DialogHeader>

              <Separator className="bg-white/10 my-4" />

              {/* Pending edit-access requests (OWNER only) */}
              {pendingRequests.length > 0 && (
                <div className="mb-5">
                  <div className="text-sm font-medium text-white/70 mb-3">
                    Pending Requests
                    <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#d2ff89] text-black text-xs font-bold px-1">
                      {pendingRequests.length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {pendingRequests.map((req) => {
                      const img = req.user.profilePicture
                        ? `${process.env.NEXT_PUBLIC_API_BASE}${req.user.profilePicture}`
                        : "";
                      const isApproving = approvingId === req.id;
                      const isDenying = denyingId === req.id;
                      const busy = isApproving || isDenying;

                      return (
                        <div
                          key={req.id}
                          className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <Avatar className="h-10 w-10">
                              <AvatarImage
                                src={img}
                                className="aspect-square object-cover"
                              />
                              <AvatarFallback className="bg-white/10 text-white">
                                {initials(req.user.username, req.user.email)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <div className="font-medium truncate">
                                {req.user.username || "Unknown User"}
                              </div>
                              <div className="text-xs text-white/50 truncate">
                                {req.user.email || "No email"}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <Button
                              size="sm"
                              onClick={() => handleApprove(req)}
                              disabled={busy}
                              className="rounded-xl bg-[#d2ff89]/10 text-[#d2ff89] border border-[#d2ff89]/30 hover:bg-[#d2ff89]/20"
                            >
                              {isApproving ? "Approving…" : "Approve"}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeny(req)}
                              disabled={busy}
                              className="rounded-xl bg-red-500/20 text-red-200 border border-red-400/30 hover:bg-red-500/30"
                            >
                              {isDenying ? "Denying…" : "Deny"}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <Separator className="bg-white/10 mt-4 mb-0" />
                </div>
              )}

              {loading ? (
                <div className="py-10 text-sm text-white/60">
                  Loading members…
                </div>
              ) : users.length === 0 ? (
                <div className="py-10 text-sm text-white/60">
                  No members found.
                </div>
              ) : (
                <ScrollArea className="h-[420px] pr-3">
                  <div className="space-y-2">
                    {users.map((m) => {
                      const img = getProfilePictureUrl(m.profilePicture);

                      return (
                        <div
                          key={m.userId}
                          className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <Avatar className="h-10 w-10">
                              <AvatarImage
                                src={img}
                                className="aspect-square object-cover"
                              />
                              <AvatarFallback className="bg-white/10 text-white">
                                {initials(m.username, m.email)}
                              </AvatarFallback>
                            </Avatar>

                            <div className="min-w-0">
                              <div className="font-medium truncate">
                                {m.username || "Unknown User"}
                              </div>
                              <div className="text-xs text-white/50 truncate">
                                {m.email || "No email"}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {m.role === "OWNER" ? (
                              <Badge className="bg-white/10 border-white/10 text-white flex items-center gap-1">
                                <Crown size={14} />
                                OWNER
                              </Badge>
                            ) : (
                              <>
                                <Select
                                  value={m.role}
                                  onValueChange={(v) =>
                                    handleRoleChange(m.userId, v as any)
                                  }
                                >
                                  <SelectTrigger className="bg-black/20 border-white/10 rounded-xl w-[140px]">
                                    <SelectValue placeholder="Role" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-[#121212] border-white/10 text-white">
                                    <SelectItem value="EDITOR">
                                      EDITOR
                                    </SelectItem>
                                    <SelectItem value="VIEWER">
                                      VIEWER
                                    </SelectItem>
                                  </SelectContent>
                                </Select>

                                <Button
                                  variant="destructive"
                                  onClick={() => openRemove(m)}
                                  className="rounded-xl"
                                >
                                  <Trash2 size={16} className="mr-2" />
                                  Remove
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}

              <div className="mt-5 flex justify-end gap-2">
                <Button
                  variant="ghost"
                  onClick={() => onOpenChange(false)}
                  className="rounded-xl text-white hover:bg-white/10"
                  disabled={saving}
                >
                  Close
                </Button>

                <Button
                  onClick={handleSaveChanges}
                  className="rounded-xl bg-white/10 hover:bg-white/20 border border-white/10"
                  disabled={saving || changedRoles.size === 0}
                >
                  {saving ? "Saving…" : "Save changes"}
                </Button>
              </div>

              {/* Remove confirm */}
              <AlertDialog open={removeOpen} onOpenChange={setRemoveOpen}>
                <AlertContent className="bg-[#121212] text-white border border-white/10 rounded-2xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remove member?</AlertDialogTitle>
                    <AlertDialogDescription className="text-white/60">
                      This will remove{" "}
                      <span className="text-white font-medium">
                        {memberToRemove?.username ||
                          memberToRemove?.email ||
                          "this user"}
                      </span>{" "}
                      from this workspace immediately.
                    </AlertDialogDescription>
                  </AlertDialogHeader>

                  <AlertDialogFooter>
                    <AlertDialogCancel
                      className="bg-transparent border border-white/10 text-white hover:bg-white/10"
                      disabled={removing}
                    >
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={confirmRemove}
                      disabled={removing}
                      className="bg-red-500/20 text-red-200 border border-red-400/30 hover:bg-red-500/30"
                    >
                      {removing ? "Removing…" : "Remove"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertContent>
              </AlertDialog>
            </motion.div>
          </DialogContent>
        ) : null}
      </AnimatePresence>
    </Dialog>
  );
}
