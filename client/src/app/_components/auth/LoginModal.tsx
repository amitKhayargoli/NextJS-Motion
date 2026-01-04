"use client";
import { useEffect } from "react";
import { toast } from "react-hot-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Modal from "../ui/Modal";
import Image from "next/image";
import { LoginFormData, loginSchema } from "./schema/loginSchema";
import bcrypt from "bcryptjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import axios from "axios";
import api from "@/lib/axios";
interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const openSignupModal = useAuthStore((s) => s.openSignupModal);

  const router = useRouter();

  const {
    register,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      const response = await api.post("/auth/login", data);

      const token = response.data.token;

      if (token && typeof window !== "undefined") {
        localStorage.setItem("authToken", token);

        // Success feedback and Redirect
        console.log(response.data);
        onClose();
        router.push("/dashboard");
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Something went wrong";

      toast.error(errorMessage);
    }

    reset();
    onClose();
  };

  useEffect(() => {
    Object.entries(errors).forEach(([field, error]) => {
      if (error?.message) {
        toast.error(error.message, { id: field });
      }
    });
  }, [errors]);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        {/* Logo */}
        <div className="flex flex-col items-center">
          <Image src="/logo.png" alt="Logo" width={50} height={50} />
          <h2 className="text-[#cffb87] text-2xl font-bold text-center  mt-2">
            MotionAI
          </h2>

          <p className="text-center text-2xl font-bold text-white">
            Welcome Back!
          </p>
        </div>

        {/* Email */}
        <div className="">
          <label className="label">
            <span className="label-text">Email</span>
          </label>
          <input
            {...register("email")}
            type="email"
            placeholder="you@example.com"
            className="input input-bordered w-full bg-white/10 outline-none p-2 rounded-md"
          />
        </div>

        {/* Password */}
        <div className="">
          <label className="label">
            <span className="label-text">Password</span>
          </label>
          <input
            {...register("password")}
            type="password"
            placeholder="••••••••"
            className="input input-bordered w-full bg-white/10 outline-none p-2 rounded-md"
          />
        </div>

        {/* Forgot password */}
        <div className="space-y-4">
          <div className="text-right">
            <button className="text-sm text-primary hover:underline text-[#AE4700]">
              Forgot password?
            </button>
          </div>
          {/* Submit */}
          <button className="cursor-pointer btn btn-primary w-full bg-[#007400] p-2 rounded-md">
            Sign In
          </button>
          {/* Footer */}
          <p className="text-center text-sm text-gray-500">
            Don’t have an account?{" "}
            <span
              className="cursor-pointer text-primary hover:underline text-[#007400]"
              onClick={() => {
                onClose();
                openSignupModal();
              }}
            >
              Sign up
            </span>
          </p>
        </div>
      </form>
    </Modal>
  );
}
