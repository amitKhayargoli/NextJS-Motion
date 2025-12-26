"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Modal from "../ui/Modal";
import Image from "next/image";
import { LoginFormData, loginSchema } from "./schema/loginSchema";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginFormData) => {
    console.log(data);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        {/* Logo */}
        <div className="flex flex-col items-center">
          <Image src="/logo.png" alt="Logo" width={50} height={50} />
          <h2 className="text-[#375506] text-2xl font-bold text-center  mt-2">
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
            <span className="cursor-pointer text-primary hover:underline text-[#007400]">
              Sign up
            </span>
          </p>
        </div>
      </form>
    </Modal>
  );
}
