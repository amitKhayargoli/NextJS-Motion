"use client";
import { useEffect } from "react";
import { useState } from "react";
import Image from "next/image";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { SignupFormData, signupSchema } from "./schema/signupSchema";
import Modal from "../ui/Modal";
import bcrypt from "bcryptjs";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/auth.store";
import api from "@/lib/api/axios";
import { handleRegister } from "@/lib/actions/auth-action";

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SignupModal({ isOpen, onClose }: SignupModalProps) {
  const openLoginModal = useAuthStore((s) => s.openLoginModal);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const [error, setError] = useState("");
  const onSubmit = async (data: SignupFormData) => {
    try {
      const result = await handleRegister(data);
      console.log(result);
      toast.success("Signup Successful with: " + data.email, {
        id: "signupSuccess",
      });
      reset();
      setTimeout(onClose, 400);
    } catch (error: Error | any) {
      toast.error(error.message);
      onClose();
    }
  };

  const [showPassword, setShowPassword] = useState(false);

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
            Create new account
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

        {/* Username */}
        <div className="">
          <label className="label">
            <span className="label-text">Username</span>
          </label>
          <input
            {...register("username")}
            type="text"
            placeholder="john"
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
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            className="input input-bordered w-full bg-white/10 outline-none p-2 rounded-md"
          />

          {/* show password */}
          <div className="flex items-center mt-2 gap-1">
            <input
              type="checkbox"
              className="checkbox checkbox-primary mt-0.5"
              onChange={() => setShowPassword(!showPassword)}
            />
            <label className="label">
              <span className="label-text text-sm">Show Password</span>
            </label>
          </div>
        </div>

        {/* Forgot password */}
        <div className="space-y-4">
          <div className="text-right"></div>
          {/* Submit */}
          <button className="cursor-pointer btn btn-primary w-full bg-[#007400] p-2 rounded-md">
            Sign Up
          </button>
          {/* Footer */}
          <p className="text-center text-sm text-gray-500">
            Already have an account?{" "}
            <span
              className="cursor-pointer text-primary hover:underline text-[#007400]"
              onClick={() => {
                onClose();
                openLoginModal();
              }}
            >
              Sign in
            </span>
          </p>
        </div>
      </form>
    </Modal>
  );
}
