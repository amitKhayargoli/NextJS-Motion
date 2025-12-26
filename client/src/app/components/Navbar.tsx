"use client";
import { useAuthStore } from "@/store/auth.store";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { use, useState } from "react";
export default function Navbar() {
  const router = useRouter();
  const openLoginModal = useAuthStore((s) => s.openLoginModal);
  const openSignupModal = useAuthStore((s) => s.openSignupModal);

  return (
    <nav className="flex py-4 px-8 justify-between border-b-1 border-[#375506]">
      <div className="flex items-center space-x-4">
        <Image src="/logo.png" width={40} height={40} alt={""} />
        <h1 className="font-bold text-[#70AA12]">MotionAI</h1>
      </div>

      <ul className="ml-20 flex rounded-full border-1 border-[#375506] px-4 py-2 backdrop-blur-sm">
        <li className="mx-4 cursor-pointer">Product</li>
        <li className="mx-4 cursor-pointer">Pricing</li>
        <li className="mx-4 cursor-pointer">Resources</li>
        <li className="mx-4 cursor-pointer">About</li>
      </ul>
      <div className="flex">
        <button
          className="cursor-pointer mx-4"
          onClick={() => openLoginModal()}
        >
          Sign In
        </button>
        <button
          className="cursor-pointer bg-white/10 px-4 py-2 rounded-full hover:bg-white/20"
          onClick={() => openSignupModal()}
        >
          Get Started
        </button>
      </div>
    </nav>
  );
}
