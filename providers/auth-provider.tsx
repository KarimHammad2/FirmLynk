"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Firm, User } from "@/lib/types";
import { getFirmById } from "@/lib/repositories/firms";
import { getUserById } from "@/lib/repositories/users";
import { setSession, clearSession } from "@/app/actions/auth";

type AuthContextValue = {
  user?: User;
  firm?: Firm;
  login: (user: User) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  isStaff: boolean;
  isClient: boolean;
  initialized: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const STORAGE_KEY = "firmlynk:auth";

const getStoredUser = () => {
  if (typeof window === "undefined") return undefined;

  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved) as User;
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }

  const cookieUserId = document.cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith("firmlynk_user="))
    ?.split("=")?.[1];

  if (cookieUserId) {
    return getUserById(cookieUserId);
  }

  return undefined;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | undefined>();
  const [initialized, setInitialized] = useState(false);
  const firm = user ? getFirmById(user.firmId) : undefined;

  useEffect(() => {
    const storedUser = getStoredUser();
    if (storedUser) {
      setUser(storedUser);
    }
    setInitialized(true);
  }, []);

  const login = async (nextUser: User) => {
    setUser(nextUser);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
    await setSession(nextUser.id);
  };

  const logout = async () => {
    setUser(undefined);
    window.localStorage.removeItem(STORAGE_KEY);
    await clearSession();
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      firm,
      login,
      logout,
      isAdmin: user?.role === "admin",
      isStaff: user?.role === "staff",
      isClient: user?.role === "client",
      initialized,
    }),
    [user, firm, initialized]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}

