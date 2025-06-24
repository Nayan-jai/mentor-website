export const dynamic = "force-dynamic";

"use client";

import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import { useState, useEffect, Suspense } from "react";
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="w-full max-w-md p-4">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center">
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center text-green-600">
                  <i className="fas fa-check-circle mr-2"></i>
                  <p className="text-sm font-medium">{message}</p>
                </div>
              </div>
              <button
                onClick={() => router.push("/auth/login")}
                className="text-blue-600 hover:text-blue-500 font-medium"
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-0 m-0 pb-6 pt-28">
      <div className="w-full h-full flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl w-full h-full p-8 sm:p-16 flex flex-col lg:flex-row min-h-[480px] max-w-6xl mx-auto">
          {/* Left: Form */}
          <div className="flex-1 flex flex-col justify-center">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome Back
              </h1>
              <p className="text-gray-600">
                Sign in to continue your mentoring journey
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center text-red-600">
                  <i className="fas fa-exclamation-circle mr-2"></i>
                  <p className="text-sm font-medium">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="mt-1"
                  placeholder="name@example.com"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    href="/auth/forgot-password"
                    className="text-sm font-medium text-blue-600 hover:text-blue-500"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="mt-1"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
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

            <p className="mt-8 text-center text-sm text-gray-600">
              Don&apos;t have an account?{" "}
              <Link
                href="/auth/register"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Sign up now
              </Link>
            </p>
          </div>
          {/* Right: Illustration/Info */}
          <div className="hidden lg:flex flex-1 items-center justify-center bg-blue-50 rounded-2xl ml-8 min-h-[300px]">
            <img src="/res/emblem.webp" alt="Ashoka Emblem - Government of India" className="h-full w-full max-h-full object-contain p-4" />
          </div>
        </div>
      </div>
    </div>
  );
} 