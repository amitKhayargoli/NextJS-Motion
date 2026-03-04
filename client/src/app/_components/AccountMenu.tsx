"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Mail, Trash2, LogOut, User, Upload, X } from "lucide-react";

import { useAuth } from "../../../context/AuthContext";
import { handleUpdateProfile } from "@/lib/actions/auth-action";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

const updateProfileSchema = z.object({
  email: z.string().email("Enter a valid email"),
  username: z.string().min(2, "Username must be at least 2 characters"),
  image: z.instanceof(File).optional(),
});

type UpdateProfileData = z.infer<typeof updateProfileSchema>;

type AccountMenuProps = {
  isModalOpen: boolean;
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;

  /** If true: do NOT render the dropdown/avatar trigger (Sidebar already has avatar). */
  hideTrigger?: boolean;

  /** Optional custom trigger node if you DO want a trigger */
  triggerNode?: React.ReactNode;
};

function initials(username?: string, email?: string) {
  const base = (username || email || "U").trim();
  const parts = base.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
}

export default function AccountMenu({
  isModalOpen,
  setIsModalOpen,
  hideTrigger = false,
  triggerNode,
}: AccountMenuProps) {
  const router = useRouter();
  const { user, setUser, logout } = useAuth();

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);

  const profilePictureSrc = React.useMemo(() => {
    if (!user?.profilePicture) return undefined;
    return `${process.env.NEXT_PUBLIC_API_BASE}${user.profilePicture}`;
  }, [user?.profilePicture]);

  const form = useForm<UpdateProfileData>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      email: "",
      username: "",
      image: undefined,
    },
  });

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { isSubmitting, errors },
  } = form;

  // Keep form synced with user changes (login/logout/profile update)
  React.useEffect(() => {
    reset({
      email: user?.email || "",
      username: user?.username || "",
      image: undefined,
    });
  }, [user?.email, user?.username, reset]);

  // Cleanup preview object URL
  React.useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const openFilePicker = () => fileInputRef.current?.click();

  const clearPreview = (onChange?: (v?: File) => void) => {
    onChange?.(undefined);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onSubmit = async (data: UpdateProfileData) => {
    try {
      const formData = new FormData();
      formData.append("email", data.email);
      formData.append("username", data.username);
      if (data.image) formData.append("image", data.image);

      const response = await handleUpdateProfile(formData);
      if (!response?.success)
        throw new Error(response?.message || "Update failed");

      toast.success("Profile updated");

      setUser?.((prev: any) => ({
        ...prev,
        email: data.email,
        username: data.username,
        profilePicture: response?.data?.profilePicture ?? prev?.profilePicture,
      }));

      setIsModalOpen(false);
      clearPreview();
    } catch (err: any) {
      toast.error(err?.message || "Profile update failed");
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out");
      setIsModalOpen(false);
      router.push("/");
    } catch (e: any) {
      toast.error(e?.message || "Logout failed");
    }
  };

  const trigger = triggerNode ? (
    triggerNode
  ) : (
    <button type="button" className="outline-none">
      <Avatar className="h-8 w-8">
        {/* IMPORTANT: render AvatarImage only when src exists */}
        {profilePictureSrc ? (
          <AvatarImage
            src={profilePictureSrc}
            className="aspect-square object-cover"
          />
        ) : null}
        <AvatarFallback className="bg-white/10 text-white">
          {initials(user?.username, user?.email)}
        </AvatarFallback>
      </Avatar>
    </button>
  );

  return (
    <>
      {/* Dropdown trigger is optional (Sidebar can hide it) */}
      {!hideTrigger && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className="w-64 bg-[#121212] border border-white/10 text-white"
          >
            <DropdownMenuLabel className="text-white/80">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9 shrink-0">
                  {profilePictureSrc ? (
                    <AvatarImage
                      src={profilePictureSrc}
                      className="aspect-square object-cover"
                    />
                  ) : null}
                  <AvatarFallback className="bg-white/10 text-white">
                    {initials(user?.username, user?.email)}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0">
                  <div className="font-medium truncate">
                    {user?.username || "User"}
                  </div>
                  <div className="text-xs text-white/50 truncate">
                    {user?.email || "No email"}
                  </div>
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator className="bg-white/10" />

            <DropdownMenuItem
              className="cursor-pointer hover:bg-white/5 focus:bg-white/5"
              onClick={() => setIsModalOpen(true)}
            >
              <User className="h-4 w-4 mr-2 text-white/70" />
              Edit profile
            </DropdownMenuItem>

            <DropdownMenuItem
              asChild
              className="cursor-pointer hover:bg-white/5 focus:bg-white/5"
            >
              <Link href="/">
                <Mail className="h-4 w-4 mr-2 text-white/70" />
                Add another account
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="bg-white/10" />

            <DropdownMenuItem
              className="cursor-pointer text-red-200 hover:bg-red-500/10 focus:bg-red-500/10"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Dialog is ALWAYS mounted so Sidebar can open it even when hideTrigger=true */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-[#121212] text-white border border-white/10 rounded-2xl max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Profile</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="flex items-center gap-5">
              <Avatar className="h-20 w-20 shrink-0 overflow-hidden rounded-full">
                {/* IMPORTANT: avoid empty src, render only when we have it */}
                {previewUrl || profilePictureSrc ? (
                  <AvatarImage
                    src={previewUrl || profilePictureSrc}
                    className="aspect-square object-cover"
                  />
                ) : null}
                <AvatarFallback className="bg-white/10 text-white text-lg">
                  {initials(user?.username, user?.email)}
                </AvatarFallback>
              </Avatar>

              <div className="flex flex-col gap-2">
                <Controller
                  name="image"
                  control={control}
                  render={({ field: { onChange } }) => (
                    <>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;

                          // Replace old preview
                          if (previewUrl) URL.revokeObjectURL(previewUrl);

                          const url = URL.createObjectURL(file);
                          setPreviewUrl(url);
                          onChange(file);
                        }}
                      />

                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={openFilePicker}
                          className="bg-white/10 hover:bg-white/15 border border-white/10"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Upload
                        </Button>

                        {previewUrl && (
                          <Button
                            type="button"
                            variant="ghost"
                            className="hover:bg-white/10"
                            onClick={() => clearPreview(onChange)}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Remove
                          </Button>
                        )}
                      </div>

                      <div className="text-[11px] text-white/40">
                        PNG/JPG recommended • Max 5MB
                      </div>
                    </>
                  )}
                />
              </div>
            </div>

            <Separator className="bg-white/10" />

            <div className="space-y-1.5">
              <label className="text-sm text-white/70">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
                <Input
                  {...register("email")}
                  className="pl-10 bg-black/30 border-white/10 text-white placeholder:text-white/40"
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-400">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm text-white/70">Username</label>
              <Input
                {...register("username")}
                className="bg-black/30 border-white/10 text-white placeholder:text-white/40"
              />
              {errors.username && (
                <p className="text-xs text-red-400">
                  {errors.username.message}
                </p>
              )}
            </div>

            <Separator className="bg-white/10" />

            <div className="flex items-center justify-between gap-3">
              <Button
                type="button"
                variant="ghost"
                className="text-red-200 hover:text-red-100 hover:bg-red-500/10"
                onClick={() => toast("Delete functionality not wired yet")}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete user
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="hover:bg-white/10"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-white/10 hover:bg-white/15 border border-white/10"
                >
                  {isSubmitting ? "Saving..." : "Save changes"}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
