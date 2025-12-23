"use client";

import LoginModal from "./components/auth/LoginModal";
import SignupModal from "./components/auth/SignupModal";
import Hero from "./components/Hero";
import Navbar from "./components/Navbar";
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
