"use client";

import { useState, useEffect } from "react";

interface SidebarLayoutAdjusterProps {
  children: React.ReactNode;
}

export default function SidebarLayoutAdjuster({ children }: SidebarLayoutAdjusterProps) {
  const [sidebarWidth, setSidebarWidth] = useState(256);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Listen for sidebar state changes from localStorage
  useEffect(() => {
    const updateSidebarState = () => {
      const savedWidth = localStorage.getItem('sidebar-width');
      const savedCollapsed = localStorage.getItem('sidebar-collapsed');

      if (savedWidth) {
        setSidebarWidth(parseInt(savedWidth));
      }
      if (savedCollapsed) {
        setIsCollapsed(savedCollapsed === 'true');
      }
    };

    // Initial load
    updateSidebarState();

    // Listen for storage changes
    window.addEventListener('storage', updateSidebarState);

    // Also listen for custom events from the sidebar
    const handleSidebarChange = () => updateSidebarState();
    window.addEventListener('sidebarStateChange', handleSidebarChange);

    return () => {
      window.removeEventListener('storage', updateSidebarState);
      window.removeEventListener('sidebarStateChange', handleSidebarChange);
    };
  }, []);

  const currentWidth = isCollapsed ? 64 : sidebarWidth;

  return (
    <div
      className="pt-16 transition-all duration-300 ease-in-out"
      style={{ marginLeft: `${currentWidth}px` }}
    >
      {children}
    </div>
  );
}
