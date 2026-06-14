import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="flex flex-col items-center gap-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-white tracking-tight">
            Alert Dedup Pipeline
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Sign in to access your dashboard
          </p>
        </div>
        <SignIn />
      </div>
    </main>
  );
}