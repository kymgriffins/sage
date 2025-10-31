import { stackServerApp } from "@/stack/server";
import { redirect } from "next/navigation";
import Sidebar from "../dashboard/sidebar";

export default async function MarketAnalysisLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await stackServerApp.getUser();

  if (!user) {
    // User not signed in, redirect to sign-in page
    redirect("/");
  }

  // Create a simple object that can be passed to client components
  const userData = {
    displayName: user.displayName,
    primaryEmail: user.primaryEmail,
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar user={userData} />
      {/* Main Content */}
      <div className="ml-64 pt-16">
        {children}
      </div>
    </div>
  );
}
