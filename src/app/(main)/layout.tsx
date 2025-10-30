import { Navigation } from "@/components/navigation";
import { StructuredData } from "@/components/structured-data";
import ErrorBoundary from "@/components/error-boundary";
import { Toaster } from "@/components/ui/toaster";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navigation />
      <div className="pt-16"> {/* Account for fixed navigation height */}
        <ErrorBoundary>
          {children}
        </ErrorBoundary>

        {/* Structured Data for SEO */}
        <StructuredData type="software" />

        {/* Toast Notifications */}
        <Toaster />
      </div>
    </>
  );
}
