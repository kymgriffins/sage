import { stackServerApp } from "@/stack/server";
import { redirect } from "next/navigation";
import Sidebar from "./sidebar";
import SidebarLayoutAdjuster from "./sidebar-layout-adjuster";

export default async function DashboardLayout({
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
      {/* Client component to handle dynamic margin adjustment */}
      <SidebarLayoutAdjuster>
        {children}
      </SidebarLayoutAdjuster>
    </div>
  );
}
