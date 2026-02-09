"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { useAuth } from "../../../../context/AuthContext";

interface WorkspaceUser {
  userId: string;
  name: string;
  email: string;
  avatar: string;
  role: "OWNER" | "EDITOR" | "VIEWER";
}

interface Props {
  workspaceId: string;
  onClose: () => void;
}

export default function WorkspaceRoleModal({ workspaceId, onClose }: Props) {
  const { user } = useAuth();
  // Dummy data simulating a join of User + UserRoles
  const [users, setUsers] = useState<WorkspaceUser[]>([
    {
      userId: user?.id,
      name: user?.username,
      email: user?.email,
      role: "OWNER",
      avatar: `${process.env.NEXT_PUBLIC_API_BASE}${user.profilePicture}`,
    },
    {
      userId: "2",
      name: "Bob Smith",
      email: "bob@example.com",
      role: "EDITOR",
      avatar: "https://i.pravatar.cc/150?img=2",
    },
    {
      userId: "3",
      name: "Charlie Brown",
      email: "charlie@example.com",
      role: "VIEWER",
      avatar: "https://i.pravatar.cc/150?img=3",
    },
  ]);

  const handleRoleChange = (userId: string, newRole: "EDITOR" | "VIEWER") => {
    setUsers((prev) =>
      prev.map((user) =>
        user.userId === userId ? { ...user, role: newRole } : user,
      ),
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-[#131313] rounded-xl shadow-lg p-6 text-white">
        <h2 className="text-2xl font-semibold mb-4">Manage Workspace Roles</h2>

        <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto">
          {users.map((user) => (
            <div
              key={user.userId}
              className="flex items-center justify-between gap-4 bg-[#1F1F1F] p-3 rounded-md"
            >
              <div className="flex items-center gap-3">
                <Avatar>
                  <img src={user.avatar} alt={user.name} />
                </Avatar>
                <div>
                  <p className="font-semibold">{user.name}</p>
                  <p className="text-gray-400 text-sm">{user.email}</p>
                </div>
              </div>

              <div>
                {user.role === "OWNER" ? (
                  <span className="bg-blue-500 px-2 py-1 rounded text-sm">
                    OWNER
                  </span>
                ) : (
                  <select
                    className="bg-[#131313] border border-gray-600 rounded-md px-2 py-1 text-white"
                    value={user.role}
                    onChange={(e) =>
                      handleRoleChange(
                        user.userId,
                        e.target.value as "EDITOR" | "VIEWER",
                      )
                    }
                  >
                    <option value="EDITOR">EDITOR</option>
                    <option value="VIEWER">VIEWER</option>
                  </select>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            className="px-4 py-2 border rounded-md hover:bg-gray-700"
            onClick={onClose}
          >
            Close
          </button>
          <button
            className="px-4 py-2 bg-blue-600 rounded-md hover:bg-blue-700"
            onClick={() => alert("Roles saved (dummy)")}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
