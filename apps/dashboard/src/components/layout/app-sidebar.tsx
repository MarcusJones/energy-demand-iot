"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import {
  BarChart3,
  Building2,
  Calendar,
  Cpu,
  LayoutDashboard,
  Settings,
  TrendingUp,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { ChevronMark } from "@/components/icons/chevron-mark";

const navItems = [
  { title: "Overview", href: "/", icon: LayoutDashboard },
  { title: "Sites", href: "/sites", icon: Building2 },
  { title: "Devices", href: "/devices", icon: Cpu },
  { title: "Analytics", href: "/analytics", icon: BarChart3 },
  { title: "Forecasts", href: "/forecasts", icon: TrendingUp },
  { title: "Schedules", href: "/schedules", icon: Calendar },
  { title: "Settings", href: "/settings", icon: Settings },
];

function CesLogo() {
  const { resolvedTheme } = useTheme();
  const src =
    resolvedTheme === "dark" ? "/ces-logo-white.svg" : "/ces-logo.svg";

  return (
    <Image
      src={src}
      alt="CES — Clean Energy Solutions"
      width={160}
      height={64}
      priority
      className="h-auto w-full max-w-[96px]"
    />
  );
}

export function AppSidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex flex-col items-center gap-1 px-2 py-3 group-data-[collapsible=icon]:hidden">
          <CesLogo />
          <span className="text-lg font-bold tracking-tight">EnergyOS</span>
        </div>
        <div className="hidden items-center justify-center group-data-[collapsible=icon]:flex">
          <ChevronMark className="h-6 w-6" />
        </div>
      </SidebarHeader>

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
                      <span className="flex-1">{item.title}</span>
                      <ChevronMark className="h-3 w-3 shrink-0 group-data-[collapsible=icon]:hidden" />
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="flex flex-col gap-1 px-2 py-1 group-data-[collapsible=icon]:items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">EnergyOS</span>
            <Badge variant="secondary" className="ml-auto text-xs group-data-[collapsible=icon]:hidden">
              v2.3.0
            </Badge>
          </div>
          <span className="text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
            2025.12.21
          </span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
