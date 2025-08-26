'use client';

import { FileExplorer } from "@/components/FileExplorer";
import { LoginForm } from "@/components/LoginForm";
import { useAuth } from "@/context/AuthContext";
import { JSX } from "react";

export default function Home(): JSX.Element {
  const { token, isAuthReady }: { token: string | null; isAuthReady: boolean } = useAuth();

  return !isAuthReady ? <></> : (
    <main className="flex min-h-screen content-center flex-col p-4 sm:p-12 md:p-24 bg-gray-100">
      {!token ? (
        <LoginForm />
      ) : (
        <FileExplorer />
      )}
    </main>
  );
}
