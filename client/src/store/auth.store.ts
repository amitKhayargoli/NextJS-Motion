import { create } from "zustand";

type AuthModalState = {
  isLoginModalOpen: boolean;
  isSignupModalOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  openSignupModal: () => void;
  closeSignupModal: () => void;
};

export const useAuthStore = create<AuthModalState>((set) => ({
  isLoginModalOpen: false,
  isSignupModalOpen: false,

  openLoginModal: () => set({ isLoginModalOpen: true }),
  closeLoginModal: () => set({ isLoginModalOpen: false }),
  openSignupModal: () => set({ isSignupModalOpen: true }),
  closeSignupModal: () => set({ isSignupModalOpen: false }),
}));
