"use client";

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
  TrendingUp,
  LogOut,
  Zap
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

  return (
    <div className="fixed left-0 top-16 h-full w-64 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-r border-white/10">
      <div className="flex flex-col h-full">
        {/* Sidebar Header */}
        <div className="p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-foreground">Dashboard</h2>
          <p className="text-sm text-muted-foreground">Trading Intelligence</p>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className="w-full justify-start gap-3 h-10 px-3 text-left"
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm">{item.label}</span>
                    {item.badge && (
                      <Badge variant="outline" className="text-xs px-1 py-0 ml-auto">
                        {item.badge}
                      </Badge>
                    )}
                  </Button>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Marketing Banner */}
        <div className="mx-4 mb-4">
          <div className="bg-gradient-to-br from-cyan-500/10 to-purple-500/20 border border-cyan-400/20 rounded-xl p-4 text-center">
            <Zap className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
            <p className="text-xs text-cyan-300 font-medium mb-1">Upgrade to Pro</p>
            <p className="text-xs text-muted-foreground mb-3">
              Unlimited analysis & advanced features
            </p>
            <Button
              size="sm"
              className="w-full bg-cyan-500 hover:bg-cyan-600 text-white text-xs h-8"
              onClick={() => window.open('/pricing', '_blank')}
            >
              Upgrade Now
            </Button>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-white/10 space-y-3">
          <div className="text-xs text-muted-foreground">
            <p>Logged in as:</p>
            <p className="font-medium text-foreground truncate">{user.displayName || user.primaryEmail}</p>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2 text-xs h-8 hover:bg-destructive/10 hover:border-destructive/20"
            onClick={() => {
              const { useUser } = require("@stackframe/stack");
              const user = useUser();
              user.signOut();
            }}
          >
            <LogOut className="w-3 h-3" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}
