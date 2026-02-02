"use client";

import * as React from "react";
import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ReactDOM from "react-dom";
import { toast } from "react-hot-toast";
import { Mail, Trash2 } from "lucide-react";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// MUI
import {
  Box,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  Divider,
  IconButton,
  Tooltip,
  createTheme,
  ThemeProvider,
} from "@mui/material";
import PersonAdd from "@mui/icons-material/PersonAdd";
import Logout from "@mui/icons-material/Logout";

// Auth + Server Action
import { useAuth } from "../../../context/AuthContext";
import { clearAuthCookies } from "@/lib/cookie";
import { handleUpdateProfile } from "@/lib/actions/auth-action";

/* -------------------- THEME -------------------- */
const darkTheme = createTheme({ palette: { mode: "dark" } });

/* -------------------- MODAL -------------------- */
const Modal = ({ isOpen, children }: any) => {
  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-3xl bg-white dark:bg-[#1d1f21] shadow-lg overflow-hidden">
        {children}
      </div>
    </div>,
    document.body,
  );
};

/* -------------------- SCHEMA -------------------- */
const updateProfileSchema = z.object({
  email: z.string().email(),
  username: z.string().min(2),
  image: z.instanceof(File).optional(),
});

type UpdateProfileData = z.infer<typeof updateProfileSchema>;

interface AccountMenuProps {
  isModalOpen: boolean;
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

/* -------------------- COMPONENT -------------------- */
export default function AccountMenu({
  isModalOpen,
  setIsModalOpen,
}: AccountMenuProps) {
  const { user, setUser } = useAuth();
  const router = useRouter();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const imageUrl = user?.profilePicture
    ? `${process.env.NEXT_PUBLIC_API_BASE_URL}${user.profilePicture}`
    : "/placeholder-profile.png";

  const fileInputRef = useRef<HTMLInputElement>(null);

  const openMenu = Boolean(anchorEl);

  const {
    register,
    handleSubmit,
    control,
    formState: { isSubmitting },
  } = useForm<UpdateProfileData>({
    resolver: zodResolver(updateProfileSchema),
    values: {
      email: user?.email || "",
      username: user?.username || "",
    },
  });

  /* -------------------- IMAGE HANDLERS -------------------- */
  const handleImageChange = (
    file: File | undefined,
    onChange: (file: File | undefined) => void,
  ) => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreviewImage(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreviewImage(null);
    }
    onChange(file);
  };

  const removeImage = (onChange?: (file?: File) => void) => {
    setPreviewImage(null);
    onChange?.(undefined);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  /* -------------------- SUBMIT -------------------- */
  const onSubmit = async (data: UpdateProfileData) => {
    try {
      const formData = new FormData();
      formData.append("email", data.email);
      formData.append("username", data.username);

      if (data.image) {
        formData.append("image", data.image);
      }

      const response = await handleUpdateProfile(formData);

      if (!response.success) {
        throw new Error(response.message || "Update failed");
      }

      toast.success("Profile updated successfully");

      // Optional: sync updated user locally
      setUser?.((prev: any) => ({
        ...prev,
        email: data.email,
        username: data.username,
        profilePicture: response.data.profilePicture ?? prev.profilePicture,
      }));

      setPreviewImage(null);
      setModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Profile update failed");
    }
  };

  /* -------------------- LOGOUT -------------------- */
  const handleLogout = async () => {
    await clearAuthCookies();
    router.push("/login");
  };

  /* -------------------- UI -------------------- */
  return (
    <ThemeProvider theme={darkTheme}>
      <Box sx={{ display: "flex", alignItems: "center" }}>
        <Tooltip title="Account settings">
          <IconButton
            onClick={(e) => setAnchorEl(e.currentTarget)}
            size="small"
          >
            <Avatar
              sx={{ width: 32, height: 32, bgcolor: "#7366ff" }}
              src={imageUrl || "/placeholder-profile.png"}
            />
          </IconButton>
        </Tooltip>
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={openMenu}
        onClose={() => setAnchorEl(null)}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            setModalOpen(true);
          }}
        >
          <Avatar src={imageUrl || "/placeholder-profile.png"} />
          {user?.email}
        </MenuItem>

        <Divider />

        <MenuItem component={Link} href="/login">
          <ListItemIcon>
            <PersonAdd fontSize="small" />
          </ListItemIcon>
          Add another account
        </MenuItem>

        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <Logout fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>

      {/* -------------------- MODAL -------------------- */}
      <Modal isOpen={modalOpen}>
        <div className="p-8">
          <h2 className="text-xl font-bold mb-6 dark:text-white">
            Edit Profile
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Image */}
            <div className="flex items-center gap-6">
              {previewImage ? (
                <div className="relative">
                  <img
                    src={previewImage}
                    className="w-20 h-20 rounded-full object-cover"
                  />
                  <Controller
                    name="image"
                    control={control}
                    render={({ field: { onChange } }) => (
                      <button
                        type="button"
                        onClick={() => removeImage(onChange)}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-6 h-6"
                      >
                        ✕
                      </button>
                    )}
                  />
                </div>
              ) : (
                <img
                  src={imageUrl}
                  className="w-20 h-20 rounded-full object-cover"
                />
              )}

              <Controller
                name="image"
                control={control}
                render={({ field: { onChange } }) => (
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      handleImageChange(e.target.files?.[0], onChange)
                    }
                  />
                )}
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4" />
                <input
                  {...register("email")}
                  className="pl-10 p-2 w-full border rounded-md dark:bg-transparent"
                />
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium mb-1">Username</label>
              <input
                {...register("username")}
                className="p-2 w-full border rounded-md dark:bg-transparent"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-between pt-4">
              <button
                type="button"
                className="flex items-center gap-2 text-red-600"
              >
                <Trash2 size={16} />
                Delete user
              </button>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="border px-4 py-2 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-black text-white px-6 py-2 rounded-md"
                >
                  {isSubmitting ? "Saving..." : "Save changes"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </Modal>
    </ThemeProvider>
  );
}
