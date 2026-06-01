"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Mail, Lock, Key, ArrowLeft } from "lucide-react";
import BorderGlow from "@/components/react-bits/BorderGlow";

export default function ForgotPasswordPage() {
  const router = useRouter();
  
  // Form states
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Status states
  const [step, setStep] = useState<1 | 2>(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [simulatedCode, setSimulatedCode] = useState<string | null>(null);

  // Handle Request Code Submission
  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "No account found with this email.");
      } else {
        // Successful code request
        setSimulatedCode(data.devCode || null);
        setStep(2);
      }
    } catch (err) {
      setError("An unexpected connection error occurred.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Reset Password Submission
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, password }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Verification failed. Check your code.");
      } else {
        // Redirection on success with reset query param
        router.push("/login?reset=success");
      }
    } catch (err) {
      setError("An unexpected connection error occurred.");
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

        {/* Form Container wrapped in BorderGlow */}
        <BorderGlow glowColor="from-indigo-500/20 via-purple-500/20 to-pink-500/20" duration={5}>
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold tracking-tight text-neutral-800 dark:text-neutral-100">
                {step === 1 ? "Reset Password" : "Enter Verification Code"}
              </h2>
              <p className="mt-1.5 text-sm text-neutral-400">
                {step === 1
                  ? "Enter your registered email to request a reset code."
                  : "Type the verification code and set your new password."}
              </p>
            </div>

            {/* Display Simulated Email Code for Testing */}
            {step === 2 && simulatedCode && (
              <div className="p-3 text-xs text-indigo-500 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-center font-medium animate-pulse">
                Demo Mode: Reset code is <strong>{simulatedCode}</strong>
              </div>
            )}

            {error && (
              <div className="p-3 text-xs text-rose-500 bg-rose-500/10 rounded-xl border border-rose-500/20 text-center font-medium">
                {error}
              </div>
            )}

            {step === 1 ? (
              /* STEP 1: Enter Email */
              <form onSubmit={handleRequestCode} className="space-y-4">
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

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white font-medium text-sm transition-all shadow-lg hover:shadow-indigo-500/20 flex items-center justify-center space-x-2 cursor-pointer animate-fade-in"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4.5 h-4.5 animate-spin" />
                      <span>Sending Code...</span>
                    </>
                  ) : (
                    <span>Request Reset Code</span>
                  )}
                </button>
              </form>
            ) : (
              /* STEP 2: Enter Code and New Passwords */
              <form onSubmit={handleResetPassword} className="space-y-4">
                {/* Code */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                    Verification Code
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-neutral-400" />
                    <input
                      type="text"
                      required
                      placeholder="6-digit code"
                      maxLength={6}
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 text-sm rounded-xl glass-input text-neutral-800 dark:text-neutral-200"
                    />
                  </div>
                </div>

                {/* New Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-neutral-400" />
                    <input
                      type="password"
                      required
                      placeholder="At least 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 text-sm rounded-xl glass-input text-neutral-800 dark:text-neutral-200"
                    />
                  </div>
                </div>

                {/* Confirm New Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-neutral-400" />
                    <input
                      type="password"
                      required
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 text-sm rounded-xl glass-input text-neutral-800 dark:text-neutral-200"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white font-medium text-sm transition-all shadow-lg hover:shadow-indigo-500/20 flex items-center justify-center space-x-2 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4.5 h-4.5 animate-spin" />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <span>Reset Password</span>
                  )}
                </button>
              </form>
            )}

            <div className="text-center pt-2">
              <button
                onClick={() => {
                  if (step === 2) {
                    setStep(1);
                    setError("");
                  } else {
                    router.push("/login");
                  }
                }}
                className="text-xs text-neutral-400 font-semibold hover:underline inline-flex items-center space-x-1 hover:text-indigo-500 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{step === 2 ? "Back to Email Request" : "Back to Sign In"}</span>
              </button>
            </div>
          </div>
        </BorderGlow>
      </div>
    </div>
  );
}
