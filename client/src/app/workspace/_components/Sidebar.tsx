"use client";

import React, { useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { useAuth } from "../../../../context/AuthContext";
import AccountMenu from "@/app/_components/AccountMenu";
import { useRouter } from "next/navigation";
import WorkspaceRoleModal from "./WorkspaceRoleModal";

interface Note {
  id: string;
  title: string;
}

interface Workspace {
  id: string;
  name: string;
}

interface SidebarProps {
  workspaces: Workspace[];
  selectedWorkspace: Workspace | null;
  setSelectedWorkspace: (workspace: Workspace) => void;
  workspaceNotes: Note[];
  loading?: boolean;
  onInviteClick: () => void;
}

export default function Sidebar({
  workspaces,
  selectedWorkspace,
  setSelectedWorkspace,
  workspaceNotes,
  loading = false,
  onInviteClick,
}: SidebarProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [collapsedWorkspaces, setCollapsedWorkspaces] = useState<
    Record<string, boolean>
  >({});
  const [roleModalOpen, setRoleModalOpen] = useState(false);

  const { user } = useAuth();
  const router = useRouter();

  const toggleCollapse = (workspaceId: string) => {
    setCollapsedWorkspaces((prev) => ({
      ...prev,
      [workspaceId]: !prev[workspaceId],
    }));
  };

  const handleWorkspaceClick = (workspace: Workspace) => {
    setSelectedWorkspace(workspace);

    toggleCollapse(workspace.id);

    router.push(`/workspace/${workspace.id}`);
  };

  return (
    <div className="py-4 px-2 flex flex-col w-68 bg-[#1F1F1F] min-h-screen text-white space-y-12">
      <div>
        {loading ? (
          <div className="text-gray-400 px-4 py-2">Loading Workspaces...</div>
        ) : (
          workspaces.map((workspace) => (
            <div key={workspace.id}>
              <div
                onClick={() => handleWorkspaceClick(workspace)}
                className={`flex items-center gap-3 cursor-pointer rounded-md p-2 hover:bg-white/10 ${
                  selectedWorkspace?.id === workspace.id ? "bg-[#141414]" : ""
                }`}
              >
                <img src="/icons/Case.png" alt="" />
                <span>{workspace.name}</span>
                <img
                  src="/icons/chevdown.png"
                  alt=""
                  className={`ml-auto transition-transform ${
                    collapsedWorkspaces[workspace.id] ? "rotate-180" : ""
                  }`}
                />
              </div>
              {selectedWorkspace && (
                <div
                  className="flex items-center gap-2 cursor-pointer hover:bg-white/10 rounded-md py-2 px-8 mt-2"
                  onClick={() => setRoleModalOpen(true)}
                >
                  <img src="/icons/Settings.png" alt="" />
                  <span className="ml-2">Manage Roles</span>
                </div>
              )}

              {/* Notes under workspace */}
              {collapsedWorkspaces[workspace.id] && (
                <div className="ml-6 mt-2 flex flex-col gap-1">
                  {workspaceNotes.length === 0 ? (
                    <span className="text-gray-500 text-sm">No notes</span>
                  ) : (
                    workspaceNotes.map((note) => (
                      <div
                        key={note.id}
                        className="text-gray-300 text-sm cursor-pointer hover:text-white"
                      >
                        {note.title}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div>
        <div
          className="flex items-center gap-2 cursor-pointer hover:bg-white/10 rounded-md py-2 px-8"
          onClick={() => {
            onInviteClick();
          }}
        >
          <img src="/icons/Message circle.png" alt="" />
          <span className="ml-2">Invite Collaborators</span>
        </div>

        <div
          onClick={() => setIsProfileOpen(true)}
          className="flex items-center gap-2 cursor-pointer hover:bg-white/10 rounded-md px-4 mt-4"
        >
          <span className="ml-2 flex items-center gap-2">
            <AccountMenu
              isModalOpen={isProfileOpen}
              setIsModalOpen={setIsProfileOpen}
            />
            <span>
              <h1>{user?.username}</h1>
              <h1>{user?.email}</h1>
            </span>
          </span>
        </div>
      </div>
      {roleModalOpen && selectedWorkspace && (
        <WorkspaceRoleModal
          workspaceId={selectedWorkspace.id}
          onClose={() => setRoleModalOpen(false)}
        />
      )}
    </div>
  );
}

// SidebarItem for static items
function SidebarItem({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="flex items-center gap-3 cursor-pointer hover:bg-white/10 rounded-md pl-4 pr-3 py-2 transition-colors">
      <div className="w-5 h-5">
        <img src={icon} alt="" />
      </div>
      <span>{title}</span>
      <img src="/icons/dots.svg" width={24} alt="" className="ml-auto" />
    </div>
  );
}
