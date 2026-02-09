"use client";

import { useForm } from "react-hook-form";

interface Props {
  onCreate: (name: string) => Promise<void>;
  onJoin: (inviteLink: string) => Promise<void>;
}

export default function WorkspaceOnboardingModal({ onCreate, onJoin }: Props) {
  // 🔹 Create Workspace Form
  const createForm = useForm<{ workspaceName: string }>();
  const {
    register: registerCreate,
    handleSubmit: handleSubmitCreate,
    watch: watchCreate,
    reset: resetCreate,
    formState: { errors: createErrors, isSubmitting: isCreating },
  } = createForm;

  // 🔹 Join Workspace Form
  const joinForm = useForm<{ inviteLink: string }>();
  const {
    register: registerJoin,
    handleSubmit: handleSubmitJoin,
    watch: watchJoin,
    reset: resetJoin,
    formState: { errors: joinErrors, isSubmitting: isJoining },
  } = joinForm;

  const workspaceName = watchCreate("workspaceName");
  const inviteLink = watchJoin("inviteLink");

  const handleCreateSubmit = async (data: { workspaceName: string }) => {
    try {
      await onCreate(data.workspaceName);
      resetCreate();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleJoinSubmit = async (data: { inviteLink: string }) => {
    try {
      await onJoin(data.inviteLink);
      resetJoin();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-xl shadow-lg p-6 ">
        {/*  dark:bg-gray-900 */}
        <h2 className="text-2xl font-semibold mb-2">👋 Welcome</h2>
        <p className="text-gray-600 mb-6">
          Create your first workspace or join an existing one.
        </p>

        {/* ================= CREATE WORKSPACE ================= */}
        <form
          onSubmit={handleSubmitCreate(handleCreateSubmit)}
          className="mb-6"
        >
          <label className="block text-sm font-medium mb-1">
            Workspace name
          </label>
          <input
            {...registerCreate("workspaceName", {
              required: "Workspace name is required",
            })}
            className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring"
            placeholder="My Workspace"
          />
          {createErrors.workspaceName && (
            <span className="text-red-500 text-sm">
              {createErrors.workspaceName.message}
            </span>
          )}
          <button
            type="submit"
            disabled={!workspaceName || isCreating}
            className="mt-3 w-full bg-black text-white py-2 rounded-md hover:bg-black/90 disabled:opacity-50"
          >
            {isCreating ? "Creating..." : "Create Workspace"}
          </button>
        </form>

        {/* ================= DIVIDER ================= */}
        <div className="flex items-center my-4">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="px-3 text-gray-400 text-sm">OR</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* ================= JOIN WORKSPACE ================= */}
        <form onSubmit={handleSubmitJoin(handleJoinSubmit)}>
          <label className="block text-sm font-medium mb-1">Invite link</label>
          <input
            {...registerJoin("inviteLink", {
              required: "Invite link is required",
            })}
            className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring"
            placeholder="Paste invite link"
          />
          {joinErrors.inviteLink && (
            <span className="text-red-500 text-sm">
              {joinErrors.inviteLink.message}
            </span>
          )}
          <button
            type="submit"
            disabled={!inviteLink || isJoining}
            className="mt-3 w-full border py-2 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            {isJoining ? "Joining..." : "Join Workspace"}
          </button>
        </form>
      </div>
    </div>
  );
}
