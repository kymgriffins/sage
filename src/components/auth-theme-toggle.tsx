"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { AuthButton } from "@/components/auth-button";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";

interface AuthThemeToggleProps {
  className?: string;
}

export function AuthThemeToggle({ className }: AuthThemeToggleProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Check if we're on the dashboard (authenticated routes)
  const isAuthenticated = pathname?.startsWith('/dashboard') || pathname?.startsWith('/myapis');

  // If authenticated, show more options
  if (isAuthenticated) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Link href="/myapis">
          <Button variant="ghost" size="sm" className="text-sm">
            My APIs
          </Button>
        </Link>
        <Link href="/pricing">
          <Button variant="ghost" size="sm" className="text-sm">
            Pricing
          </Button>
        </Link>
        <ThemeToggle />
        <AuthButton />
      </div>
    );
  }

  // Not authenticated - show simplified version
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Link href="/pricing">
        <Button variant="ghost" size="sm" className="text-sm">
          Pricing
        </Button>
      </Link>
      <ThemeToggle />
      <AuthButton />
    </div>
  );
}

// Mobile version (if needed in the future)
export function MobileAuthThemeToggle({ className }: AuthThemeToggleProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={className}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden"
      >
        {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </Button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-48 bg-background/95 backdrop-blur border border-white/20 rounded-lg shadow-lg p-4 z-50 md:hidden">
          <div className="space-y-2">
            <Link href="/pricing">
              <Button variant="ghost" className="w-full justify-start text-sm">
                Pricing
              </Button>
            </Link>
            <div className="flex items-center justify-between">
              <span className="text-sm">Theme</span>
              <ThemeToggle />
            </div>
            <div className="pt-2 border-t border-white/20">
              <AuthButton />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
