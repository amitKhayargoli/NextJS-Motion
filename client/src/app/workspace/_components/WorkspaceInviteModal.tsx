"use client";

import { useState } from "react";

interface Props {
  inviteLink: string;
  onClose: () => void;
}

export default function WorkspaceInviteModal({ inviteLink, onClose }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-xl shadow-lg p-6 bg-[#131313]">
        <h2 className="text-2xl font-semibold mb-2">Invite collaborators</h2>

        <p className="text-gray-600 mb-4">
          Share this link to invite others to your workspace.
        </p>

        <div className="flex items-center gap-2">
          <input
            readOnly
            value={inviteLink}
            className="flex-1 border rounded-md px-3 py-2 text-sm bg-gray-100"
          />
          <button
            onClick={handleCopy}
            className="px-4 py-2 bg-black text-white rounded-md"
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full border py-2 rounded-md hover:bg-gray-50"
        >
          Close
        </button>
      </div>
    </div>
  );
}
