"use client";

import * as React from "react";
import toast from "react-hot-toast";
import { Copy, Check, X } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  inviteLink: string;
  onJoin?: (inviteLink: string) => Promise<void> | void;
};

export default function InviteCollaboratorsModal({
  open,
  onOpenChange,
  inviteLink,
  onJoin,
}: Props) {
  const [copied, setCopied] = React.useState(false);
  const [joinValue, setJoinValue] = React.useState("");

  React.useEffect(() => {
    if (!open) {
      setCopied(false);
      setJoinValue("");
    }
  }, [open]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      toast.success("Invite code copied");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const join = async () => {
    const v = joinValue.trim();
    if (!v) return;

    try {
      await onJoin?.(v);
      toast.success("Joining workspace...");
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message || "Could not join workspace");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#121212] text-white border border-white/10 sm:max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-white">Invite Collaborators</DialogTitle>
          <DialogDescription className="text-white/60">
            Share this code with your teammates.
          </DialogDescription>
        </DialogHeader>

        {/* Invite code Section */}
        <div className="space-y-2">
          <p className="text-xs text-white/60">Invite code</p>

          <div className="flex gap-2">
            <Input
              readOnly
              value={inviteLink}
              className="bg-black/20 border-white/10 text-white rounded-xl"
            />

            <Button
              onClick={copy}
              variant="secondary"
              className="rounded-xl border border-white/10 bg-black/20 hover:bg-white/5 text-white"
            >
              {copied ? (
                <span className="flex items-center gap-2">
                  <Check size={16} />
                  Copied
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Copy size={16} />
                  Copy
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* Optional Join Section */}
        {onJoin && (
          <div className="space-y-2 pt-4">
            <p className="text-xs text-white/60">Or join with an Invite code</p>

            <div className="flex gap-2">
              <Input
                value={joinValue}
                onChange={(e) => setJoinValue(e.target.value)}
                placeholder="Paste Invite code..."
                className="bg-black/20 border-white/10 text-white rounded-xl"
              />

              <Button
                onClick={join}
                disabled={!joinValue.trim()}
                className="rounded-xl border border-white/10 bg-white/10 hover:bg-white/20 text-white disabled:opacity-50"
              >
                Join
              </Button>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="rounded-xl text-white hover:bg-white/10"
          >
            <X size={16} className="mr-2" />
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
