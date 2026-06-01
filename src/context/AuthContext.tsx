"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export interface User {
  email: string;
  name: string;
  focusGoal: number; // Daily focus target in minutes
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (name: string, focusGoal: number) => void;
  deleteAccount: () => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_USER_KEY = "notela_auth_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Authenticate session from HTTP-only cookie on startup
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.user) {
          setUser(data.user);
          localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(data.user));
        } else {
          setUser(null);
          localStorage.removeItem(STORAGE_USER_KEY);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load active session:", err);
        setUser(null);
        localStorage.removeItem(STORAGE_USER_KEY);
        setLoading(false);
      });
  }, []);

  // Simple route guard logic
  useEffect(() => {
    if (loading) return;

    const publicPaths = ["/login", "/signup", "/"];
    const isPublic = publicPaths.includes(pathname);

    if (!user && !isPublic) {
      router.push("/login");
    } else if (user && isPublic) {
      router.push("/dashboard");
    }
  }, [user, pathname, loading, router]);

  const login = async (email: string, password: string) => {
    if (!email || !password) {
      return { success: false, error: "Please enter both email and password." };
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || "Invalid email or password." };
      }

      const sessionUser: User = data.user;
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(sessionUser));
      setUser(sessionUser);
      router.push("/dashboard");
      return { success: true };
    } catch (err) {
      return { success: false, error: "An unexpected connection error occurred." };
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName || !trimmedEmail || !password) {
      return { success: false, error: "All fields are required." };
    }
    if (password.length < 6) {
      return { success: false, error: "Password must be at least 6 characters." };
    }

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName, email: trimmedEmail, password }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        return { success: false, error: data.error || "Failed to create account." };
      }

      const sessionUser: User = data.user;
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(sessionUser));
      setUser(sessionUser);
      router.push("/dashboard");
      return { success: true };
    } catch (err) {
      return { success: false, error: "An unexpected connection error occurred." };
    }
  };

  const logout = () => {
    fetch("/api/auth/logout", { method: "POST" })
      .catch((err) => console.error("Failed to invalidate session cookie:", err))
      .finally(() => {
        localStorage.removeItem(STORAGE_USER_KEY);
        setUser(null);
        router.push("/login");
      });
  };

  const updateProfile = (name: string, focusGoal: number) => {
    if (!user) return;

    const updatedUser = { ...user, name, focusGoal };
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(updatedUser));
    setUser(updatedUser);

    fetch("/api/auth/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, focusGoal }),
    }).catch((err) => {
      console.error("Failed to update profile in database:", err);
    });
  };

  const deleteAccount = async () => {
    try {
      const res = await fetch("/api/auth/delete", {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        return { success: false, error: data.error || "Failed to delete account." };
      }

      localStorage.removeItem(STORAGE_USER_KEY);
      setUser(null);
      router.push("/login");
      return { success: true };
    } catch (err) {
      return { success: false, error: "An unexpected connection error occurred." };
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateProfile, deleteAccount }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
