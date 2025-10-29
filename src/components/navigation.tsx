"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Home,
  Package,
  Search,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

export function Navigation() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  const navItems = [
    {
      href: '/',
      label: 'Home',
      icon: Home,
      description: 'Landing page'
    },
    {
      href: '/dashboard',
      label: 'Dashboard',
      icon: Package,
      description: 'Channel tracking overview'
    },
    {
      href: '/myapis',
      label: 'My APIs',
      icon: Settings,
      description: 'API documentation',
      badge: 'NEW'
    },
    {
      href: '/pricing',
      label: 'Pricing',
      icon: BarChart3,
      description: 'Subscription plans'
    }
  ];

  return (
    <nav className={`fixed top-0 left-0 z-50 h-16 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-white/10`}>
      <div className="flex h-16 items-center px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 mr-6">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">SAGE</span>
          </div>
          {!isCollapsed && (
            <span className="font-semibold text-foreground">SAGE Ai</span>
          )}
        </Link>

        {/* Navigation Links */}
        <div className="flex gap-1">
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
                  {!isCollapsed && (
                    <>
                      <span className="text-sm">{item.label}</span>
                      {item.badge && (
                        <Badge variant="outline" className="text-xs px-1 py-0">
                          {item.badge}
                        </Badge>
                      )}
                    </>
                  )}
                </Button>
              </Link>
            );
          })}
        </div>

        {/* Collapse Toggle */}
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto text-muted-foreground hover:text-foreground"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </Button>
      </div>
    </nav>
  );
}
