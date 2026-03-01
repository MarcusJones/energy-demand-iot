"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Building2,
  Calendar,
  Cpu,
  LayoutDashboard,
  Settings,
  TrendingUp,
  Zap,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";

const navItems = [
  { title: "Overview", href: "/", icon: LayoutDashboard },
  { title: "Sites", href: "/sites", icon: Building2 },
  { title: "Devices", href: "/devices", icon: Cpu },
  { title: "Analytics", href: "/analytics", icon: BarChart3 },
  { title: "Forecasts", href: "/forecasts", icon: TrendingUp },
  { title: "Schedules", href: "/schedules", icon: Calendar },
  { title: "Settings", href: "/settings", icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.href)}
                    tooltip={item.title}
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="flex items-center gap-2 px-2 py-1">
          <Zap className="h-4 w-4 text-brand-accent" />
          <span className="text-sm font-semibold">EnergyOS</span>
          <Badge variant="secondary" className="ml-auto text-xs">
            v0.1.0
          </Badge>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
