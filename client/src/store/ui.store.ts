import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type UIState = {
  sidebarCollapsed: boolean;
  hasHydrated: boolean;

  setSidebarCollapsed: (v: boolean) => void;
  toggleSidebarCollapsed: () => void;
  setHasHydrated: (v: boolean) => void;
};

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      sidebarCollapsed: false,
      hasHydrated: false,

      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),

      toggleSidebarCollapsed: () =>
        set({ sidebarCollapsed: !get().sidebarCollapsed }),

      setHasHydrated: (v) => set({ hasHydrated: v }),
    }),
    {
      name: "motionai-ui",
      version: 1,

      //  Next.js safe storage
      storage: createJSONStorage(() => localStorage),

      //  Only persist what we need
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
      }),

      //  Prevent hydration mismatch flicker
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
