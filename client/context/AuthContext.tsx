"use client";
import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import {
  clearAuthCookies,
  getTokenCookie,
  getUserData,
} from "../src/lib/cookie";
import { useRouter } from "next/navigation";

import { useWorkspaceStore } from "@/store/workspace.store";
import { useNotesStore } from "@/store/note.store"; // adjust if your path differs

interface AuthContextProps {
  isAuthenticated: boolean;
  setIsAuthenticated: (value: boolean) => void;
  user: any;
  setUser: (user: any) => void;
  logout: () => Promise<void>;
  loading: boolean;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  const checkAuth = async () => {
    try {
      const token = await getTokenCookie();
      const user = await getUserData();
      setUser(user);
      setIsAuthenticated(!!token);
    } catch (err) {
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const logout = async () => {
    try {
      // 1) clear auth cookies/token
      await clearAuthCookies();

      // 2) ✅ clear user-scoped localStorage keys
      try {
        localStorage.removeItem("lastOpenedWorkspaceId");
        localStorage.removeItem("motionai-workspace-store");
        // if you persist other stores, clear them too:
        localStorage.removeItem("motionai-notes-store");
      } catch {}

      // 3) ✅ reset zustand in-memory state (prevents previous user's sidebar)
      try {
        // Add reset() to your stores if you don’t have it,
        // or use setWorkspaces([]) etc.
        useWorkspaceStore.getState().setWorkspaces([]);
        useWorkspaceStore.getState().setActiveWorkspaceId(null);

        const notesState: any = useNotesStore.getState();
        if (typeof notesState.reset === "function") {
          notesState.reset();
        } else if (typeof notesState.setNotes === "function") {
          notesState.setNotes([]);
        }
      } catch {}

      // 4) clear auth state
      setIsAuthenticated(false);
      setUser(null);

      // 5) redirect
      router.replace("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        setIsAuthenticated,
        user,
        setUser,
        logout,
        loading,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
