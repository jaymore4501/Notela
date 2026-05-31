"use client";

import React from "react";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-50 dark:bg-zinc-950">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        <span className="mt-2 text-sm text-neutral-400">Loading your workspace...</span>
      </div>
    );
  }

  if (!user) {
    return null; // AuthContext handles redirect to /login
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen w-screen bg-transparent overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Navbar */}
        <Navbar />

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
          {children}
        </main>
      </div>
    </div>
  );
}
