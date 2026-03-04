"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Building2, Link2, PlusCircle, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreate: (name: string) => Promise<void>;
  onJoin: (codeOrLink: string) => Promise<void>;
}

const createSchema = z.object({
  workspaceName: z.string().min(2, "Workspace name is required"),
});

const joinSchema = z.object({
  inviteLink: z.string().min(6, "Invite code is required"),
});

type CreateForm = z.infer<typeof createSchema>;
type JoinForm = z.infer<typeof joinSchema>;

export default function WorkspaceOnboardingModal({
  open,
  onOpenChange,
  onCreate,
  onJoin,
}: Props) {
  const createForm = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: { workspaceName: "" },
    mode: "onChange",
  });

  const {
    register: registerCreate,
    handleSubmit: handleSubmitCreate,
    watch: watchCreate,
    reset: resetCreate,
    formState: { errors: createErrors, isSubmitting: isCreating },
  } = createForm;

  const joinForm = useForm<JoinForm>({
    resolver: zodResolver(joinSchema),
    defaultValues: { inviteLink: "" },
    mode: "onChange",
  });

  const {
    register: registerJoin,
    handleSubmit: handleSubmitJoin,
    watch: watchJoin,
    reset: resetJoin,
    formState: { errors: joinErrors, isSubmitting: isJoining },
  } = joinForm;

  const workspaceName = watchCreate("workspaceName");
  const inviteLink = watchJoin("inviteLink");

  // Optional: reset when the modal closes
  React.useEffect(() => {
    if (!open) {
      resetCreate();
      resetJoin();
    }
  }, [open, resetCreate, resetJoin]);

  const handleCreateSubmit = async (data: CreateForm) => {
    try {
      await onCreate(data.workspaceName.trim());
      toast.success("Workspace created");
      onOpenChange(false); //  close
    } catch (err: any) {
      toast.error(err?.message || "Failed to create workspace");
    }
  };

  const handleJoinSubmit = async (data: JoinForm) => {
    try {
      await onJoin(data.inviteLink.trim());
      toast.success("Joined workspace");
      onOpenChange(false); //  close
    } catch (err: any) {
      toast.error(err?.message || "Failed to join workspace");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* shadcn DialogContent already includes an X button.
          Overlay click also triggers onOpenChange(false). */}
      <DialogContent className="bg-[#121212] text-white border border-white/10 rounded-2xl max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Users className="h-5 w-5 text-white/70" />
            Welcome
          </DialogTitle>
          <DialogDescription className="text-white/60">
            Start by creating a workspace or join an existing one.
          </DialogDescription>
        </DialogHeader>

        {/* CREATE */}
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="h-4 w-4 text-white/60" />
            <div className="text-sm font-semibold">Create workspace</div>
          </div>

          <form
            onSubmit={handleSubmitCreate(handleCreateSubmit)}
            className="space-y-3"
          >
            <div className="space-y-1.5">
              <label className="text-xs text-white/60">Workspace name</label>
              <Input
                {...registerCreate("workspaceName")}
                placeholder="My Workspace"
                className="bg-black/30 border-white/10 text-white placeholder:text-white/40"
              />
              {createErrors.workspaceName && (
                <p className="text-xs text-red-400">
                  {createErrors.workspaceName.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={!workspaceName?.trim() || isCreating}
              className="w-full bg-white/10 hover:bg-white/15 border border-white/10"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              {isCreating ? "Creating..." : "Create Workspace"}
            </Button>
          </form>
        </div>

        <div className="flex items-center gap-3">
          <Separator className="bg-white/10 flex-1" />
          <span className="text-[11px] text-white/40">OR</span>
          <Separator className="bg-white/10 flex-1" />
        </div>

        {/* JOIN */}
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Link2 className="h-4 w-4 text-white/60" />
            <div className="text-sm font-semibold">Join workspace</div>
          </div>

          <form
            onSubmit={handleSubmitJoin(handleJoinSubmit)}
            className="space-y-3"
          >
            <div className="space-y-1.5">
              <label className="text-xs text-white/60">Invite code</label>
              <Input
                {...registerJoin("inviteLink")}
                placeholder="Paste invite code"
                className="bg-black/30 border-white/10 text-white placeholder:text-white/40"
              />
              {joinErrors.inviteLink && (
                <p className="text-xs text-red-400">
                  {joinErrors.inviteLink.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              variant="secondary"
              disabled={!inviteLink?.trim() || isJoining}
              className="w-full bg-white/10 hover:bg-white/15 border border-white/10 text-white"
            >
              <Users className="h-4 w-4 mr-2" />
              {isJoining ? "Joining..." : "Join Workspace"}
            </Button>
          </form>
        </div>

        <div className="text-[11px] text-white/40">
          Tip: You can invite teammates from the workspace sidebar later.
        </div>
      </DialogContent>
    </Dialog>
  );
}
