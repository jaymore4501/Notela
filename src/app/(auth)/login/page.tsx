"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Sparkles, Loader2, Mail, Lock } from "lucide-react";
import BorderGlow from "@/components/react-bits/BorderGlow";

function LoginForm() {
  const { login } = useAuth();
  const searchParams = useSearchParams();
  const resetSuccess = searchParams?.get("reset") === "success";
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await login(email, password);
      if (!res.success) {
        setError(res.error || "Failed to sign in.");
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-8 relative">
      <div className="w-full max-w-md">
        {/* Brand logo banner */}
        <div className="flex items-center justify-center space-x-3 mb-8">
          <img src="/logo.png" className="w-12 h-12 rounded-xl object-cover border border-black/5 dark:border-white/5 shadow-md" alt="logo" />
          <span className="font-extrabold text-3xl tracking-tight bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
            Notela
          </span>
        </div>

        {/* Login form wrapped in BorderGlow */}
        <BorderGlow glowColor="from-indigo-500/20 via-purple-500/20 to-pink-500/20" duration={5}>
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold tracking-tight text-neutral-800 dark:text-neutral-100">
                Welcome back
              </h2>
              <p className="mt-1.5 text-sm text-neutral-400">
                Sign in to access your academic dashboard.
              </p>
            </div>

            {resetSuccess && (
              <div className="p-3 text-xs text-emerald-500 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-center font-medium">
                Password reset successfully! Please sign in with your new password.
              </div>
            )}

            {error && (
              <div className="p-3 text-xs text-rose-500 bg-rose-500/10 rounded-xl border border-rose-500/20 text-center font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-neutral-400" />
                  <input
                    type="email"
                    required
                    placeholder="student@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 text-sm rounded-xl glass-input text-neutral-800 dark:text-neutral-200"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-xs font-semibold text-indigo-500 hover:underline"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-neutral-400" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 text-sm rounded-xl glass-input text-neutral-800 dark:text-neutral-200"
                  />
                </div>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white font-medium text-sm transition-all shadow-lg hover:shadow-indigo-500/20 flex items-center justify-center space-x-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4.5 h-4.5 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign In</span>
                )}
              </button>
            </form>

            <div className="text-center pt-2">
              <span className="text-xs text-neutral-400">
                Don't have an account?{" "}
                <Link
                  href="/signup"
                  className="font-semibold text-indigo-500 hover:underline"
                >
                  Create one now
                </Link>
              </span>
            </div>
          </div>
        </BorderGlow>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
