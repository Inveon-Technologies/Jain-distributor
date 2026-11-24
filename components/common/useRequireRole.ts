"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp, UserRole } from "@/context/AppContext";

/** Sends visitors without a session (or with the wrong role) back to the login page. Returns true once allowed. */
export function useRequireRole(role: UserRole): boolean {
  const router = useRouter();
  const { authReady, currentUser } = useApp();
  const allowed = authReady && currentUser?.role === role;

  useEffect(() => {
    if (authReady && currentUser?.role !== role) router.replace("/");
  }, [authReady, currentUser, role, router]);

  return allowed;
}
