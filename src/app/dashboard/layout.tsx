"use client";

import { useUser } from "@stackframe/stack";
import { redirect } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = useUser();

  if (user === null) {
    // User not signed in, redirect to sign-in page
    redirect("/");
  }

  return (
    <div>
      {children}
    </div>
  );
}
