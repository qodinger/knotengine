"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Command } from "lucide-react";
import { AuthBackground } from "@/components/auth/auth-background";

export default function VerifyPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyContent />
    </Suspense>
  );
}

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const email = searchParams.get("email");
  const [error, setError] = useState<string | null>(
    !token || !email ? "Missing verification details." : null,
  );

  useEffect(() => {
    if (!token || !email) {
      return;
    }

    const verify = async () => {
      try {
        const result = await signIn("magic-link", {
          email,
          token,
          redirect: false,
          callbackUrl: "/dashboard",
        });

        if (result?.error) {
          setError("This link is invalid or has expired.");
        } else {
          router.push("/dashboard");
        }
      } catch {
        setError("An unexpected error occurred.");
      }
    };

    verify();
  }, [searchParams, router, token, email]);

  return (
    <div className="relative container grid min-h-screen flex-col items-center justify-center lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col overflow-hidden bg-[#050505] p-10 text-white lg:flex dark:border-r">
        <AuthBackground />
        <div className="relative z-20 flex items-center gap-2 text-lg font-medium">
          <div className="bg-primary text-primary-foreground flex h-10 w-10 items-center justify-center rounded-lg">
            <Command className="h-6 w-6" />
          </div>
          <span className="text-xl font-bold tracking-tight">KnotEngine</span>
        </div>
      </div>

      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-87.5">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-bold tracking-tight">
              {error ? "Verification Failed" : "Verifying identity"}
            </h1>
            <p className="text-muted-foreground text-sm">
              {error ? error : "Please wait while we secure your session..."}
            </p>
          </div>

          {!error && (
            <div className="flex justify-center py-8">
              <span className="border-primary/30 border-t-primary h-8 w-8 animate-spin rounded-full border-2" />
            </div>
          )}

          {error && (
            <a
              href="/login"
              className="text-primary text-center text-sm font-medium hover:underline"
            >
              Back to login
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
