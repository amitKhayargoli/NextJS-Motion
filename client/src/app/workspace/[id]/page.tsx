"use client";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { useEffect, useState } from "react";
import React from "react";
import Sidebar from "../_components/Sidebar";
import WorkspaceOnboardingModal from "../_components/WorkspaceOnboardingModal";

import {
  handleCreateWorkspace,
  handleGetWorkspaces,
  handleJoinWorkspace,
} from "@/lib/actions/workspace-action";
import { handleGetWorkspaceNotes } from "@/lib/actions/note-action";
import { useRouter, useParams } from "next/navigation";
import WorkspaceInviteModal from "../_components/WorkspaceInviteModal";
import { useAuth } from "../../../../context/AuthContext";

export default function Page() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useParams();
  const workspaceId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [loadingWorkspaces, setLoadingWorkspaces] = useState(true);
  const [selectedWorkspace, setSelectedWorkspace] = useState<any>(null);
  const [workspaceNotes, setWorkspaceNotes] = useState<any[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);

  const shouldShowOnboarding = !loadingWorkspaces && workspaces.length === 0;
  const workspace = workspaces.find((w) => w.id === workspaceId);

  // 🔹 Fetch user workspaces on load
  useEffect(() => {
    if (!user) return;

    const fetchWorkspaces = async () => {
      setLoadingWorkspaces(true);
      try {
        const res = await handleGetWorkspaces();
        if (res.success) {
          setWorkspaces(res.data);
        } else {
          console.error("Failed to fetch workspaces:", res.message);
        }
      } catch (err) {
        console.error("Failed to fetch workspaces", err);
      } finally {
        setLoadingWorkspaces(false);
      }
    };

    fetchWorkspaces();
  }, [user]);

  // 🔹 Fetch notes for the selected workspace
  useEffect(() => {
    if (!selectedWorkspace || !workspaceId) return;

    const fetchNotes = async () => {
      setLoadingNotes(true);
      try {
        const res = await handleGetWorkspaceNotes(workspaceId);
        if (res.success) {
          setWorkspaceNotes(res.data);
          console.log(res.data);
        } else {
          console.error("Failed to fetch notes:", res.message);
          setWorkspaceNotes([]);
        }
      } catch (err) {
        console.error("Failed to fetch notes", err);
        setWorkspaceNotes([]);
      } finally {
        setLoadingNotes(false);
      }
    };

    fetchNotes();
  }, [selectedWorkspace]);

  // 🔥 Redirect logic
  useEffect(() => {
    if (loading) return;

    // If user HAS workspaces → go to first workspace
    if (workspaces.length > 0) {
      router.replace(`/workspace/${workspaces[0].id}`);
    }
  }, [loading, workspaces, router]);

  // 🔹 Create workspace handler
  const handleCreate = async (name: string) => {
    try {
      const res = await handleCreateWorkspace({ name });
      if (res.success) {
        const updated = await handleGetWorkspaces();
        if (updated.success) setWorkspaces(updated.data);
      } else {
        alert(res.message || "Failed to create workspace");
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // 🔹 Join workspace handler
  const handleJoin = async (inviteLink: string) => {
    try {
      const res = await handleJoinWorkspace(inviteLink);
      if (res.success) {
        const updated = await handleGetWorkspaces();
        if (updated.success) setWorkspaces(updated.data);
      } else {
        alert(res.message || "Failed to join workspace");
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <>
      <div className="flex">
        <Sidebar
          workspaces={workspaces}
          selectedWorkspace={selectedWorkspace}
          setSelectedWorkspace={(ws) => {
            setSelectedWorkspace(ws);
          }}
          workspaceNotes={workspaceNotes}
          loading={loadingWorkspaces || loadingNotes}
          onInviteClick={() => {
            if (!selectedWorkspace) return alert("Select a workspace first");
            setInviteOpen(true);
          }}
        />
        <div className="flex-1 flex flex-col">
          {/* Existing UI untouched */}
          <div className="px-4 py-5 flex items-center gap-3 cursor-pointer rounded-md p-2">
            <img src="/icons/Case.png" alt="" />
            <span>Motion Workspace / </span>
            <img src="/icons/Tick Square.png" alt="" />
            <span>Get Started </span>
          </div>

          <img src="/workspace-cover.png" alt="Logo" />

          <div className="p-16">
            <div className="text-gray-400 flex flex-col">
              <h1 className="text-5xl font-bold text-white">
                Welcome to MotionAI
              </h1>
              <h2 className="text-2xl font-semibold mb-6">
                Your Unified Workspace for Intelligent Productivity.
              </h2>

              <p className="text-xl mb-8 max-w-3xl">
                MotionAI ends the fragmentation in your workflow. We merge
                notes, audio, tasks, and meeting summaries into one intelligent
                platform, letting you focus on impact, not tools.
              </p>

              <div className="flex flex-col gap-4">
                <span className="text-white font-bold text-xl mb-2">
                  Key Features:
                </span>

                {/* List with Dots */}
                <div className="flex flex-col gap-3">
                  {[
                    "Unified Meeting Hub",
                    "AI-Powered Transcription",
                    "Chat with Your Knowledge Base (MindSpace)",
                    "Desktop-Class Experience",
                  ].map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 text-lg"
                    >
                      <div className="h-1.5 w-1.5 rounded-full bg-white" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <p className="mt-10 text-lg text-gray-300">
                Ready to start? Your first project is waiting. Begin by creating
                a new <span className="text-white font-semibold"> Note </span>{" "}
                or linking your
                <span className="text-white font-semibold"> calendar</span>.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 🔹 Onboarding Modal */}
      {shouldShowOnboarding && (
        <WorkspaceOnboardingModal onCreate={handleCreate} onJoin={handleJoin} />
      )}

      {inviteOpen && selectedWorkspace && (
        <WorkspaceInviteModal
          inviteLink={`${process.env.NEXT_PUBLIC_APP_URL}/workspace/join/${selectedWorkspace.inviteLink}`}
          onClose={() => setInviteOpen(false)}
        />
      )}
      {/* 🔹 Loading placeholder */}
      {/* {loadingWorkspaces && (
        // <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 text-white text-lg">
        //   Loading Workspaces...
        // </div>
        <DotLottieReact src="/Loading.lottie" loop autoplay />
      )} */}
    </>
  );
}
