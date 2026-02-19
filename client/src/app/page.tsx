"use client";

import LoginModal from "./(auth)/_components/LoginModal";
import SignupModal from "./(auth)/_components/SignupModal";
import Hero from "./_components/Hero";
import Navbar from "./_components/Navbar";
import { useAuthStore } from "@/store/auth.store";

export default function Home() {
  const {
    isLoginModalOpen,
    isSignupModalOpen,
    closeLoginModal,
    closeSignupModal,
  } = useAuthStore();
  return (
    <div className="min-h-screen bg-home-gradient">
      <Navbar />
      <Hero />

      <LoginModal isOpen={isLoginModalOpen} onClose={closeLoginModal} />
      <SignupModal isOpen={isSignupModalOpen} onClose={closeSignupModal} />
    </div>
  );
}
