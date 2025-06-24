'use client';

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function AuthErrorWrapper() {
  return (
    <Suspense>
      <AuthError />
    </Suspense>
  );
}

function AuthError() {
  const searchParams = useSearchParams();
  const error = searchParams ? searchParams.get("error") : null;

  const errorMessages: Record<string, string> = {
    Configuration: "There is a problem with the server configuration.",
    AccessDenied: "You do not have permission to sign in.",
    Verification: "The verification link may have expired or already been used.",
    Default: "An error occurred during authentication.",
  };

  const errorMessage = error ? errorMessages[error] || errorMessages.Default : errorMessages.Default;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-6 shadow-lg">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
            Authentication Error
          </h2>
          <p className="mt-2 text-sm text-gray-600">{errorMessage}</p>
        </div>
        <div className="mt-8">
          <Link
            href="/auth/login"
            className="group relative flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Return to Login
          </Link>
        </div>
      </div>
    </div>
  );
} 