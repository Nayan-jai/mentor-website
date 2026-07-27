"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import { Suspense } from "react";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPageWrapper() {
  return (
    <Suspense>
      <LoginPage />
    </Suspense>
  );
}

function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role) {
      console.log("Session in useEffect:", session); // Debug log
      if (session.user.role === "ADMIN") {
        router.push("/dashboard/admin");
      } else if (session.user.role === "MENTOR") {
        router.push("/dashboard/mentor");
      } else if (session.user.role === "STUDENT") {
        router.push("/dashboard/student");
      }
    }
  }, [status, session, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        setError(result.error);
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("An error occurred during sign in.");
    } finally {
      setLoading(false);
    }
  };

  // Show success message if redirected from password reset
  const message = searchParams?.get("message");
  if (message) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 p-4">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-8">
            <div className="text-center">
              <div className="mb-6 p-4 bg-green-50 dark:bg-emerald-950/60 border border-green-200 dark:border-emerald-900/60 rounded-lg">
                <div className="flex items-center text-green-600 dark:text-emerald-400">
                  <i className="fas fa-check-circle mr-2"></i>
                  <p className="text-sm font-medium">{message}</p>
                </div>
              </div>
              <button
                onClick={() => router.push("/auth/login")}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-500 font-medium text-sm"
              >
                Return to login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center dark:bg-slate-950 dark:text-white">
        <div className="flex justify-center items-center">
          <div aria-label="Orange and tan hamster running in a metal wheel" role="img" className="wheel-and-hamster">
            <div className="wheel"></div>
            <div className="hamster">
              <div className="hamster__body">
                <div className="hamster__head">
                  <div className="hamster__ear"></div>
                  <div className="hamster__eye"></div>
                  <div className="hamster__nose"></div>
                </div>
                <div className="hamster__limb hamster__limb--fr"></div>
                <div className="hamster__limb hamster__limb--fl"></div>
                <div className="hamster__limb hamster__limb--br"></div>
                <div className="hamster__limb hamster__limb--bl"></div>
                <div className="hamster__tail"></div>
              </div>
            </div>
            <div className="spoke"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 p-0 m-0">
      <div className="flex-1 flex flex-col justify-center md:justify-start">
        <div className="w-full flex justify-center">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full p-8 sm:p-16 flex flex-col lg:flex-row min-h-[480px] max-w-6xl mx-auto my-8 lg:my-12" style={{maxHeight: 'calc(100vh - 64px)'}}>
            {/* Left: Form */}
            <div className="flex-1 flex flex-col justify-center min-h-0">
              <div className="text-center mb-8 lg:mt-8">
                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">
                  Welcome Back
                </h1>
                <p className="text-gray-600 dark:text-slate-400 text-sm">
                  Sign in to continue your mentoring journey
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900/60 rounded-xl">
                  <div className="flex items-center text-red-600 dark:text-red-400">
                    <i className="fas fa-exclamation-circle mr-2"></i>
                    <p className="text-sm font-medium">{error}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="email" className="text-gray-700 dark:text-slate-200 font-semibold text-sm">Email Address</Label>
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
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-gray-700 dark:text-slate-200 font-semibold text-sm">Password</Label>
                    <Link
                      href="/auth/forgot-password"
                      className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-500"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    className="mt-1 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-400"
                    placeholder="••••••••"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {loading ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Signing in...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-sign-in-alt mr-2"></i>
                      Sign In
                    </>
                  )}
                </button>
              </form>

              <p className="mt-8 text-center text-sm text-gray-600 dark:text-slate-400">
                Don&apos;t have an account?{" "}
                <Link
                  href="/auth/register"
                  className="font-bold text-blue-600 dark:text-blue-400 hover:text-blue-500"
                >
                  Sign up now
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