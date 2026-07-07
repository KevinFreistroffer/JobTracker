"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/", label: "Job Tracker" },
  { href: "/application-materials", label: "Application & Prep" },
  { href: "/jd-library", label: "JD Library" },
  { href: "/ai-requirements", label: "AI Requirements" },
] as const;

export function AppNav() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  return (
    <nav className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const isActive =
              tab.href === "/"
                ? pathname === "/"
                : pathname.startsWith(tab.href);

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "border-b-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors",
                  isActive
                    ? "border-slate-900 text-slate-900"
                    : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700",
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>

        <div className="flex shrink-0 items-center gap-3 py-2">
          {status === "authenticated" && session?.user ? (
            <>
              {session.user.image ? (
                <img
                  src={session.user.image}
                  alt=""
                  className="h-8 w-8 rounded-full"
                />
              ) : null}
              <span className="hidden text-sm text-slate-600 sm:inline">
                {session.user.name ?? session.user.email}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => signOut({ callbackUrl: "/api/auth/signin" })}
              >
                Sign out
              </Button>
            </>
          ) : status === "unauthenticated" ? (
            <Link
              href="/api/auth/signin"
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Sign in with GitHub
            </Link>
          ) : null}
        </div>
      </div>
    </nav>
  );
}
