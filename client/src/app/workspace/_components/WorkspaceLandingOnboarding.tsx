// WorkspaceLandingOnboarding;
"use client";

import * as React from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  X,
  ArrowLeft,
  ArrowRight,
  PlusCircle,
  Sparkles,
  MessageSquareText,
  Search,
  CheckCircle2,
  ClipboardList,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

// Optional: if you already use shadcn Checkbox, you can swap this for <Checkbox />
// For now, we render a simple check icon + label.
import type { Variants } from "framer-motion";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  username?: string;

  // Your actions:
  onCreateFirstNote: () => void;
  onOpenChat?: () => void;
  onOpenSearch?: () => void;

  // Optional: show workspace name
  workspaceName?: string;
};

type StepId = "welcome" | "create" | "chat" | "search" | "done";

type Step = {
  id: StepId;
  title: string;
  description: string;
  illustrationSrc: string;
  badge?: { icon: React.ReactNode; text: string };
};

const STEPS: Step[] = [
  {
    id: "welcome",
    title: "Welcome to your workspace",
    description:
      "A clean place to capture ideas, create notes, and let MotionAI help you organize everything.",
    illustrationSrc: "https://illustrations.popsy.co/gray/creative-work.svg",
    badge: { icon: <Sparkles className="h-4 w-4" />, text: "Notion-like flow" },
  },
  {
    id: "create",
    title: "Create your first note",
    description:
      "Start with something small. Notes become searchable, shareable, and AI-ready.",
    illustrationSrc: "https://illustrations.popsy.co/gray/note-list.svg",
    badge: { icon: <PlusCircle className="h-4 w-4" />, text: "1 click" },
  },
  {
    id: "chat",
    title: "Ask your workspace chat",
    description:
      "Summarize notes, extract tasks, draft content, or get answers across your workspace knowledge.",
    illustrationSrc: "https://illustrations.popsy.co/gray/online-chat.svg",
    badge: {
      icon: <MessageSquareText className="h-4 w-4" />,
      text: "RAG chat",
    },
  },
  {
    id: "search",
    title: "Find anything instantly",
    description:
      "Use search to quickly jump between notes, threads, and ideas — like a command palette.",
    illustrationSrc: "https://illustrations.popsy.co/gray/searching.svg",
    badge: { icon: <Search className="h-4 w-4" />, text: "Fast lookup" },
  },
  {
    id: "done",
    title: "You’re ready 🚀",
    description:
      "Create a note now, or explore the workspace. You can reopen this anytime from the Workspace button.",
    illustrationSrc: "https://illustrations.popsy.co/gray/product-tour.svg",
    badge: {
      icon: <CheckCircle2 className="h-4 w-4" />,
      text: "All set",
    },
  },
];

function initials(username?: string, email?: string) {
  const base = (username || email || "U").trim();
  const parts = base.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
}

function clampIndex(i: number) {
  return Math.max(0, Math.min(STEPS.length - 1, i));
}

export default function WorkspaceLandingOnboarding({
  open,
  onOpenChange,
  username,
  workspaceName,
  onCreateFirstNote,
  onOpenChat,
  onOpenSearch,
}: Props) {
  const [idx, setIdx] = React.useState(0);
  const step = STEPS[idx];
  const progress = Math.round(((idx + 1) / STEPS.length) * 100);

  // Persist “don’t show again” vibe (simple: remember completed)
  React.useEffect(() => {
    if (!open) return;
    // reset to first when opened (or keep last—your preference)
    setIdx(0);
  }, [open]);

  // ESC handled by Dialog. Click outside closable by default in shadcn Dialog.
  // If you used "modal" prop to lock, keep it default (it closes on outside click).

  const next = () => setIdx((v) => clampIndex(v + 1));
  const prev = () => setIdx((v) => clampIndex(v - 1));

  const goDone = () => setIdx(STEPS.length - 1);

  const handlePrimaryAction = async () => {
    // Step-specific actions
    if (step.id === "create") {
      onOpenChange(false);
      onCreateFirstNote();
      toast.success("Create your first note ✨");
      return;
    }

    if (step.id === "chat") {
      if (onOpenChat) {
        onOpenChange(false);
        onOpenChat();
        toast.success("Opening chat 🤖");
      } else {
        toast("Chat route not wired yet");
        next();
      }
      return;
    }

    if (step.id === "search") {
      if (onOpenSearch) {
        onOpenChange(false);
        onOpenSearch();
        toast.success("Opening search 🔎");
      } else {
        toast("Search not wired yet");
        next();
      }
      return;
    }

    if (step.id === "done") {
      onOpenChange(false);
      toast.success("Welcome onboard!");
      return;
    }

    next();
  };

  const name = (username || "there").trim();
  const titleLine = workspaceName?.trim()
    ? `Welcome to ${workspaceName}`
    : `Welcome, ${name} 👋`;

  const checklist = [
    { id: "create", label: "Create your first note", done: idx > 1 },
    { id: "chat", label: "Ask MotionAI in workspace chat", done: idx > 2 },
    { id: "search", label: "Use search to jump quickly", done: idx > 3 },
  ];

  const primaryLabelByStep: Record<StepId, string> = {
    welcome: "Start tour",
    create: "Create first note",
    chat: onOpenChat ? "Open chat" : "Next",
    search: onOpenSearch ? "Open search" : "Next",
    done: "Finish",
  };

  const secondaryLabelByStep: Record<StepId, string> = {
    welcome: "Skip",
    create: "Skip",
    chat: "Skip",
    search: "Skip",
    done: "Close",
  };

  const onSecondary = () => {
    if (step.id === "done") {
      onOpenChange(false);
      return;
    }
    goDone();
    toast("Skipped — you can revisit later");
  };

  // Motion variants (Notion-like soft slide)
  const cardVariants: Variants = {
    initial: (direction: number) => ({
      opacity: 0,
      x: direction > 0 ? 24 : -24,
      scale: 0.98,
      filter: "blur(6px)",
    }),
    animate: {
      opacity: 1,
      x: 0,
      scale: 1,
      filter: "blur(0px)",
      transition: {
        duration: 0.22,
        ease: "easeInOut" as const, // ✅ key change
      },
    },
    exit: (direction: number) => ({
      opacity: 0,
      x: direction > 0 ? -24 : 24,
      scale: 0.98,
      filter: "blur(6px)",
      transition: {
        duration: 0.18,
        ease: "easeInOut" as const, // ✅ key change
      },
    }),
  };

  const [direction, setDirection] = React.useState(1);

  const goNext = () => {
    setDirection(1);
    next();
  };
  const goPrev = () => {
    setDirection(-1);
    prev();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0f0f10] text-white border border-white/10 rounded-2xl max-w-4xl p-0 overflow-hidden">
        {/* Close button */}
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 z-10 rounded-md p-2 hover:bg-white/10 transition"
          aria-label="Close"
          title="Close"
        >
          <X className="h-4 w-4 text-white/70" />
        </button>

        {/* Soft background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
        </div>

        <div className="relative grid md:grid-cols-2">
          {/* LEFT: Content */}
          <div className="p-7 md:p-8">
            <DialogHeader>
              <DialogTitle className="text-xl md:text-2xl font-semibold">
                {idx === 0 ? titleLine : step.title}
              </DialogTitle>
              <DialogDescription className="text-white/60 mt-2">
                {idx === 0 ? (
                  <>
                    You’ve landed on this workspace. Let’s get you moving in
                    under a minute.
                  </>
                ) : (
                  step.description
                )}
              </DialogDescription>
            </DialogHeader>

            {/* Badge + progress */}
            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80">
                  {step.badge?.icon}
                  <span>{step.badge?.text || "Onboarding"}</span>
                </div>

                <div className="text-xs text-white/50">
                  {idx + 1} / {STEPS.length}
                </div>
              </div>

              <Progress value={progress} className="h-2 bg-white/10" />
            </div>

            {/* Checklist / Steps */}
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <ClipboardList className="h-4 w-4 text-white/70" />
                Onboarding steps
              </div>

              <div className="mt-3 space-y-2">
                {checklist.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center gap-2 text-sm text-white/80"
                  >
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/10 bg-black/20">
                      {c.done ? (
                        <CheckCircle2 className="h-4 w-4 text-white/80" />
                      ) : (
                        <span className="h-2 w-2 rounded-full bg-white/30" />
                      )}
                    </span>
                    <span
                      className={c.done ? "line-through text-white/50" : ""}
                    >
                      {c.label}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-3 text-[11px] text-white/40">
                Tip: You can reopen this tour anytime from the “Workspace”
                button.
              </div>
            </div>

            <Separator className="my-6 bg-white/10" />

            {/* Navigation buttons */}
            <div className="flex items-center justify-between gap-3">
              <Button
                type="button"
                variant="ghost"
                className="hover:bg-white/10"
                onClick={() => {
                  if (idx === 0) return;
                  goPrev();
                }}
                disabled={idx === 0}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="hover:bg-white/10 text-white/80"
                  onClick={onSecondary}
                >
                  {secondaryLabelByStep[step.id]}
                </Button>

                <Button
                  type="button"
                  className="bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl"
                  onClick={async () => {
                    setDirection(1);
                    await handlePrimaryAction();
                  }}
                >
                  {step.id === "create" ? (
                    <PlusCircle className="h-4 w-4 mr-2" />
                  ) : step.id === "chat" ? (
                    <MessageSquareText className="h-4 w-4 mr-2" />
                  ) : step.id === "search" ? (
                    <Search className="h-4 w-4 mr-2" />
                  ) : step.id === "done" ? (
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  {primaryLabelByStep[step.id]}
                  {step.id !== "create" &&
                    step.id !== "chat" &&
                    step.id !== "search" &&
                    step.id !== "done" && (
                      <ArrowRight className="h-4 w-4 ml-2" />
                    )}
                </Button>
              </div>
            </div>
          </div>

          {/* RIGHT: Illustration + animated screen */}
          <div className="relative bg-gradient-to-br from-white/5 to-transparent border-t md:border-t-0 md:border-l border-white/10 p-6 md:p-7">
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs text-white/50">
                {step.id === "welcome"
                  ? "Tour preview"
                  : step.id === "done"
                    ? "Ready to build"
                    : "Next step"}
              </div>

              <div className="hidden md:flex gap-1">
                {STEPS.map((s, i) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setDirection(i > idx ? 1 : -1);
                      setIdx(i);
                    }}
                    className={`h-2.5 w-2.5 rounded-full transition ${
                      i === idx
                        ? "bg-white/70"
                        : "bg-white/20 hover:bg-white/30"
                    }`}
                    aria-label={`Go to step ${i + 1}`}
                    title={s.title}
                  />
                ))}
              </div>
            </div>

            <div className="mt-4 relative rounded-2xl border border-white/10 bg-black/20 overflow-hidden">
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-white/5 blur-2xl" />
                <div className="absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-white/5 blur-2xl" />
              </div>

              <div className="relative p-4">
                <AnimatePresence mode="wait" custom={direction}>
                  <motion.div
                    key={step.id}
                    custom={direction}
                    variants={cardVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="relative"
                  >
                    <div className="text-sm font-medium text-white mb-2">
                      {step.title}
                    </div>
                    <div className="text-xs text-white/60 mb-4">
                      {step.description}
                    </div>

                    <div className="relative w-full aspect-square">
                      <Image
                        src={step.illustrationSrc}
                        alt="Onboarding illustration"
                        fill
                        className="object-contain"
                        priority
                        unoptimized
                      />
                    </div>

                    <div className="mt-3 text-[11px] text-white/40">
                      Illustration: Popsy (Notion-like style)
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Bottom helper strip */}
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm font-medium">Suggested first note</div>
              <div className="text-xs text-white/60 mt-1">
                “Meeting notes + action items” or “Project plan outline”
              </div>

              <div className="mt-3 flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-xl"
                  onClick={() => {
                    onOpenChange(false);
                    onCreateFirstNote();
                    toast.success("Let’s create a note ✍️");
                  }}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Create note
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="hover:bg-white/10 rounded-xl"
                  onClick={() => {
                    if (idx < STEPS.length - 1) {
                      goNext();
                    } else {
                      onOpenChange(false);
                    }
                  }}
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile dots */}
        <div className="md:hidden px-6 pb-5 -mt-2">
          <div className="flex justify-center gap-1.5">
            {STEPS.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setDirection(i > idx ? 1 : -1);
                  setIdx(i);
                }}
                className={`h-2.5 w-2.5 rounded-full transition ${
                  i === idx ? "bg-white/70" : "bg-white/20 hover:bg-white/30"
                }`}
                aria-label={`Go to step ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
