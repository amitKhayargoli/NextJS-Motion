"use client";

import Modal from "../ui/Modal";
import Image from "next/image";

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SignupModal({ isOpen, onClose }: SignupModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="space-y-6">
        {/* Logo */}
        <div className="flex flex-col items-center">
          <Image src="/logo.png" alt="Logo" width={50} height={50} />
          <h2 className="text-[#375506] text-2xl font-bold text-center  mt-2">
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
            type="password"
            placeholder="••••••••"
            className="input input-bordered w-full bg-white/10 outline-none p-2 rounded-md"
          />
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
            Or Continue With{" "}
            <span className="cursor-pointer text-primary hover:underline text-[#007400]">
              Sign in
            </span>
          </p>
        </div>
      </div>
    </Modal>
  );
}
