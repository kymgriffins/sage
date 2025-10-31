"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AuthThemeToggle } from "./auth-theme-toggle";
import {
  Home,
  Package,
  Search,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  User,
  Menu,
  X
} from "lucide-react";

export function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  const navItems = [
    {
      href: '/market-analysis',
      label: 'Stock Analysis',
      icon: BarChart3,
      description: 'Live market data & analysis',
      badge: 'BETA'
    },
    {
      href: '/dashboard',
      label: 'Dashboard',
      icon: Package,
      description: 'Channel tracking overview'
    },
    {
      href: '/pricing',
      label: 'Pricing',
      icon: BarChart3,
      description: 'Subscription plans'
    }
  ];

  return (
    <>
      <nav className={`fixed top-0 left-0 z-50 h-16 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-white/10`}>
        <div className="flex h-16 items-center px-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 mr-6">
            <div className="relative">
              <div className="w-3 h-3 bg-cyan-400 rounded-full animate-ping" />
              <span className="absolute top-0 left-0 w-3 h-3 bg-cyan-400 rounded-full"></span>
            </div>
            <span className="text-xl font-light text-foreground dark:text-white tracking-tight">SAGE</span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
              const Icon = item.icon;

              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    className={`flex items-center gap-2 h-9 px-3 ${
                      isActive
                        ? "bg-white/10 text-foreground border-white/20"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                    }`}
                    title={item.description}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm">{item.label}</span>
                    {item.badge && (
                      <Badge variant="outline" className="text-xs px-1 py-0">
                        {item.badge}
                      </Badge>
                    )}
                  </Button>
                </Link>
              );
            })}
          </div>

          {/* Right Side - Mobile Menu Button & Controls */}
          <div className="flex items-center gap-2 ml-auto">
            <AuthThemeToggle />
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden border-t border-white/10 bg-background/95 backdrop-blur">
            <div className="px-4 py-4 space-y-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
                const Icon = item.icon;

                return (
                  <Link key={item.href} href={item.href} onClick={() => setIsMenuOpen(false)}>
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      size="sm"
                      className={`w-full justify-start flex items-center gap-2 h-10 px-3 ${
                        isActive
                          ? "bg-white/10 text-foreground border-white/20"
                          : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                      }`}
                      title={item.description}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm">{item.label}</span>
                      {item.badge && (
                        <Badge variant="outline" className="text-xs px-1 py-0">
                          {item.badge}
                        </Badge>
                      )}
                    </Button>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
    </>
  );
}
