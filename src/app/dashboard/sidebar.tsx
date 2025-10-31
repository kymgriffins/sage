"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Home,
  Package,
  Search,
  BarChart3,
  Settings,
  TrendingUp,
  LogOut,
  Zap,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useUser } from "@stackframe/stack";

const sidebarItems = [
  {
    href: '/dashboard',
    label: 'Overview',
    icon: Home,
    exact: true
  },
  {
    href: '/market-analysis',
    label: 'Stock Analysis',
    icon: TrendingUp,
    badge: null
  },
  // {
  //   href: '/dashboard/channels',
  //   label: 'My Channels',
  //   icon: Package,
  //   badge: null
  // },
  {
    href: '/dashboard/discover',
    label: 'Discover',
    icon: Search,
    badge: 'NEW'
  },
  {
    href: '/dashboard/analytics',
    label: 'Analytics',
    icon: BarChart3,
    badge: null
  },
  {
    href: '/dashboard/settings',
    label: 'Settings',
    icon: Settings,
    badge: null
  }
];

interface SidebarProps {
  user: {
    displayName?: string | null;
    primaryEmail?: string | null;
  };
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const [sidebarWidth, setSidebarWidth] = useState(256); // Default 16rem (256px)
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<HTMLDivElement>(null);

  // Load saved sidebar state from localStorage
  useEffect(() => {
    const savedWidth = localStorage.getItem('sidebar-width');
    const savedCollapsed = localStorage.getItem('sidebar-collapsed');

    if (savedWidth) {
      setSidebarWidth(parseInt(savedWidth));
    }
    if (savedCollapsed) {
      setIsCollapsed(savedCollapsed === 'true');
    }
  }, []);

  // Save sidebar state to localStorage and dispatch custom event
  useEffect(() => {
    localStorage.setItem('sidebar-width', sidebarWidth.toString());
    localStorage.setItem('sidebar-collapsed', isCollapsed.toString());
    // Dispatch custom event to notify layout of changes
    window.dispatchEvent(new CustomEvent('sidebarStateChange'));
  }, [sidebarWidth, isCollapsed]);

  // Handle mouse down for resizing
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  };

  // Handle mouse move for resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const newWidth = e.clientX;
      // Constrain width between 200px and 400px
      const constrainedWidth = Math.max(200, Math.min(400, newWidth));
      setSidebarWidth(constrainedWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const currentWidth = isCollapsed ? 64 : sidebarWidth;

  return (
    <>
      <div
        ref={sidebarRef}
        className="fixed left-0 top-16 h-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-r border-white/10 transition-all duration-300 ease-in-out overflow-hidden"
        style={{ width: `${currentWidth}px` }}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            {!isCollapsed && (
              <div>
                <h2 className="text-lg font-bold text-foreground">Dashboard</h2>
                <p className="text-xs text-muted-foreground">Trading Intelligence</p>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleCollapse}
              className="h-8 w-8 p-0 hover:bg-white/5"
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Sidebar Navigation */}
          <nav className="flex-1 overflow-y-auto p-2">
            <div className="space-y-1">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      className={`w-full justify-start gap-3 h-10 px-3 text-left transition-all duration-200 ${
                        isCollapsed ? 'px-2' : ''
                      }`}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      {!isCollapsed && (
                        <>
                          <span className="text-sm truncate">{item.label}</span>
                          {item.badge && (
                            <Badge variant="outline" className="text-xs px-1 py-0 ml-auto">
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
          </nav>

          {/* Marketing Banner */}
          {!isCollapsed && (
            <div className="mx-2 mb-4">
              <div className="bg-gradient-to-br from-cyan-500/10 to-purple-500/20 border border-cyan-400/20 rounded-xl p-3 text-center">
                <Zap className="w-5 h-5 text-cyan-400 mx-auto mb-2" />
                <p className="text-xs text-cyan-300 font-medium mb-1">Upgrade to Pro</p>
                <p className="text-xs text-muted-foreground mb-2">
                  Unlimited analysis
                </p>
                <Button
                  size="sm"
                  className="w-full bg-cyan-500 hover:bg-cyan-600 text-white text-xs h-7"
                  onClick={() => window.open('/pricing', '_blank')}
                >
                  Upgrade
                </Button>
              </div>
            </div>
          )}

          {/* Sidebar Footer */}
          <div className="p-2 border-t border-white/10 space-y-2">
            {!isCollapsed && (
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-muted-foreground">
                  <p>Logged in as:</p>
                  <p className="font-medium text-foreground truncate">{user.displayName || user.primaryEmail}</p>
                </div>
                <ThemeToggle />
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              className={`w-full justify-start gap-2 text-xs h-8 hover:bg-destructive/10 hover:border-destructive/20 ${
                isCollapsed ? 'px-2' : ''
              }`}
              onClick={() => {
                const { useUser } = require("@stackframe/stack");
                const user = useUser();
                user.signOut();
              }}
            >
              <LogOut className="w-3 h-3" />
              {!isCollapsed && <span>Sign Out</span>}
            </Button>
          </div>
        </div>

        {/* Resize Handle */}
        {!isCollapsed && (
          <div
            ref={resizeRef}
            className="absolute top-0 right-0 w-1 h-full bg-transparent hover:bg-cyan-400/20 cursor-col-resize transition-colors duration-200"
            onMouseDown={handleMouseDown}
          />
        )}
      </div>
    </>
  );
}
