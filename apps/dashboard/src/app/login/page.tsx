"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Command, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthBackground } from "@/components/auth/auth-background";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Cookies from "js-cookie";

function LoginContent() {
  const searchParams = useSearchParams();
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      console.log(`[Auth] Affiliate referral detected: ${ref}`);
      // Store for 30 days
      Cookies.set("knot_affiliate_id", ref, { expires: 30 });
    }
  }, [searchParams]);

  const handleSignIn = async (provider: "google" | "github") => {
    setLoadingProvider(provider);
    await signIn(provider, { callbackUrl: "/dashboard" });
  };

  return (
    <div className="grid gap-3">
      <Button
        id="signin-google"
        variant="outline"
        size="lg"
        className="gap-3 h-11 font-medium"
        disabled={loadingProvider !== null}
        onClick={() => handleSignIn("google")}
      >
        {loadingProvider === "google" ? (
          <span className="h-4 w-4 rounded-full border-2 border-foreground/30 border-t-foreground animate-spin" />
        ) : (
          <GoogleIcon />
        )}
        Continue with Google
      </Button>

      <Button
        id="signin-github"
        variant="outline"
        size="lg"
        className="gap-3 h-11 font-medium"
        disabled={loadingProvider !== null}
        onClick={() => handleSignIn("github")}
      >
        {loadingProvider === "github" ? (
          <span className="h-4 w-4 rounded-full border-2 border-foreground/30 border-t-foreground animate-spin" />
        ) : (
          <Github className="h-4 w-4" />
        )}
        Continue with GitHub
      </Button>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="container relative min-h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      {/* Left panel */}
      <div className="relative hidden h-full flex-col bg-[#050505] p-10 text-white lg:flex dark:border-r overflow-hidden">
        <AuthBackground />

        <div className="relative z-20 flex items-center text-lg font-medium gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-[0_0_20px_rgba(255,255,255,0.15)]">
            <Command className="h-6 w-6" />
          </div>
          <span className="font-bold tracking-tight text-xl">
            KnotEngine Dashboard
          </span>
        </div>

        <div className="relative z-20 mt-auto backdrop-blur-sm bg-black/10 p-8 rounded-2xl border border-white/5 shadow-2xl">
          <blockquote className="space-y-4">
            <p className="text-xl font-medium leading-relaxed tracking-tight">
              &ldquo;KnotEngine has completely transformed how we handle
              cross-chain settlements. The non-custodial HD derivation is a game
              changer for our infrastructure security.&rdquo;
            </p>
            <footer className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-linear-to-tr from-emerald-500 to-blue-500" />
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white">
                  Sofia Davis
                </span>
                <span className="text-xs text-zinc-400 font-medium">
                  CTO at Nexus Defi
                </span>
              </div>
            </footer>
          </blockquote>
        </div>
      </div>

      {/* Right panel */}
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Welcome to KnotEngine
            </h1>
            <p className="text-sm text-muted-foreground">
              Sign in to access your merchant dashboard
            </p>
          </div>

          <Suspense
            fallback={
              <div className="h-28 w-full animate-pulse bg-muted rounded-md" />
            }
          >
            <LoginContent />
          </Suspense>

          <p className="px-8 text-center text-xs text-muted-foreground leading-relaxed">
            By continuing, you agree to our{" "}
            <a
              href="/terms"
              className="underline underline-offset-4 hover:text-primary"
            >
              Terms of Service
            </a>{" "}
            and{" "}
            <a
              href="/privacy"
              className="underline underline-offset-4 hover:text-primary"
            >
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
