"use client";
import LoginModal from "@/app/(auth)/_components/LoginModal";
import SignupModal from "@/app/(auth)/_components/SignupModal";
import { useAuthStore } from "@/store/auth.store";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const {
    openLoginModal,
    openSignupModal,
    isLoginModalOpen,
    isSignupModalOpen,
    closeLoginModal,
    closeSignupModal,
  } = useAuthStore();
  const router = useRouter();

  return (
    <>
      <nav className="flex py-4 px-8 justify-between border-b-1 border-[#375506]">
        <div
          className="flex items-center space-x-2 cursor-pointer"
          onClick={() => router.push("/")}
        >
          <Image src="/logo.png" width={40} height={40} alt={""} />
          <h1 className="font-bold text-[#70AA12]">MotionAI</h1>
        </div>

        <ul className="hidden ml-20 lg:flex rounded-full border-1 border-[#375506] px-4 py-2 backdrop-blur-sm">
          <li className="mx-4">
            <Link href="/product" className="hover:underline">
              Product
            </Link>
          </li>
          <li className="mx-4">
            <Link href="/pricing" className="hover:underline">
              Pricing
            </Link>
          </li>
          <li className="mx-4">
            <Link href="/how-it-works" className="hover:underline">
              How it Works
            </Link>
          </li>
          <li className="mx-4">
            <Link href="/about" className="hover:underline">
              About
            </Link>
          </li>
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

      <LoginModal isOpen={isLoginModalOpen} onClose={closeLoginModal} />
      <SignupModal isOpen={isSignupModalOpen} onClose={closeSignupModal} />
    </>
  );
}
