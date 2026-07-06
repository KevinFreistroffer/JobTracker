import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">Access denied</h1>
        <p className="mt-3 text-sm text-slate-600">
          This app is restricted to the owner&apos;s GitHub account. Sign in
          with an authorized account to continue.
        </p>
        <Link
          href="/api/auth/signin"
          className="mt-6 inline-block rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Sign in with GitHub
        </Link>
      </div>
    </div>
  );
}
