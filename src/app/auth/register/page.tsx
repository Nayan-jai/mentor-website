"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;
    const role = formData.get("role") as string;

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
          role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to register");
      }

      // Redirect to login page after successful registration
      router.push("/auth/login");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-screen min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 m-0">
      <div className="flex-1 flex flex-col justify-center md:justify-start">
        <div className="w-full flex justify-center">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full p-8 sm:p-16 flex flex-col lg:flex-row min-h-[480px] max-w-6xl mx-auto my-8 lg:my-12 overflow-y-auto" style={{maxHeight: 'calc(100vh - 64px)'}}>
            {/* Left: Form */}
            <div className="flex-1 flex flex-col justify-center">
              <div className="text-center mb-6 lg:mt-4">
                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">
                  Create Account
                </h1>
                <p className="text-gray-600 dark:text-slate-400 text-sm">
                  Join our mentoring community today
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900/60 rounded-xl">
                  <div className="flex items-center text-red-600 dark:text-red-400">
                    <i className="fas fa-exclamation-circle mr-2"></i>
                    <p className="text-sm font-medium">{error}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-gray-700 dark:text-slate-200 font-semibold text-xs">Full Name</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    required
                    className="mt-1 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-400"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <Label htmlFor="email" className="text-gray-700 dark:text-slate-200 font-semibold text-xs">Email Address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="mt-1 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-400"
                    placeholder="name@example.com"
                  />
                </div>

                <div>
                  <Label htmlFor="password" className="text-gray-700 dark:text-slate-200 font-semibold text-xs">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    className="mt-1 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-400"
                    placeholder="••••••••"
                  />
                  <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-1">Password must be at least 8 characters.</p>
                </div>

                <div>
                  <Label htmlFor="confirmPassword" className="text-gray-700 dark:text-slate-200 font-semibold text-xs">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    className="mt-1 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-400"
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="role" className="text-gray-700 dark:text-slate-200 font-semibold text-xs">I want to join as a</Label>
                  <select
                    id="role"
                    name="role"
                    required
                    className="mt-1 block w-full rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="">Select your role</option>
                    <option value="STUDENT">Student</option>
                    <option value="MENTOR">Mentor</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {loading ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Creating account...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-user-plus mr-2"></i>
                      Create Account
                    </>
                  )}
                </button>
              </form>

              <p className="mt-4 text-center text-sm text-gray-600 dark:text-slate-400">
                Already have an account?{" "}
                <Link
                  href="/auth/login"
                  className="font-bold text-blue-600 dark:text-blue-400 hover:text-blue-500"
                >
                  Sign in
                </Link>
              </p>
            </div>
            {/* Right: Illustration/Info */}
            <div className="hidden lg:flex flex-1 items-center justify-center bg-blue-50 border border-blue-100 rounded-3xl ml-8 min-h-[300px]">
              <img src="/res/emblem.webp" alt="Ashoka Emblem - Government of India" className="h-full w-full max-h-full object-contain p-4" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 