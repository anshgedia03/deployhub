"use client";

import * as React from "react";
import { Home, LayoutGrid, MessageCircle, FolderOpen, Globe, LogOut, ChevronRight } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import LogoIcon from "@/public/trend-agent-logo.svg";
import Image from "next/image";
import { usePathname, useRouter, Link } from "@/i18n/routing";
import { useTranslations, useLocale } from "next-intl";
import { useAuthStore } from "@/store/useAuthStore";
import { useProjectStore } from "@/store/useProjectStore";
import type { IconType } from "react-icons";
import { RiChatSmileAiFill, RiChatSmileAiLine, RiDashboardFill, RiDashboardLine, RiFolder5Fill, RiFolder5Line, RiHome6Fill, RiHome6Line } from "react-icons/ri";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { state, isMobile } = useSidebar();
  const isCollapsed = state === "collapsed";
  const pathName = usePathname();
  const locale = useLocale();
  const { logout, user } = useAuthStore();
  const { currentProject, currentSession } = useProjectStore();
  const router = useRouter();
  const t = useTranslations("Navigation");

  const handleLogout = async () => {
    await logout();
    router.push("/auth/signin");
  };

  const onLanguageChange = (newLocale: "en" | "de") => {
    router.replace(pathName, { locale: newLocale });
  };

  const isPathActive = (path: string) => {
    const cleanPath = path.replace(/\/$/, "");
    const cleanPathName = pathName?.replace(/\/$/, "") || "";
    return cleanPath === cleanPathName;
  };

  const getDynamicUrl = (baseUrl: string) => {
    if (baseUrl === "/dashboard" || baseUrl === "/chat") {
      if (currentProject?._id && currentSession?._id) {
        return `${baseUrl}?projectId=${currentProject._id}&sessionId=${currentSession._id}`;
      }
    }
    return baseUrl;
  };

  // Navigation items data
  type NavItem = { title: string, url: string, icon: IconType | [IconType, IconType] }
  const navItems: NavItem[] = [
    { title: t("home"), icon: [RiHome6Line, RiHome6Fill], url: "/home" },
    { title: t("dashboard"), icon: [RiDashboardLine, RiDashboardFill], url: "/dashboard" },
    { title: t("chat"), icon: [RiChatSmileAiLine, RiChatSmileAiFill], url: "/chat" },
    { title: t("fileManager"), icon: [RiFolder5Line, RiFolder5Fill], url: "/file-manager" },
  ];

  return (
    <aside className={`max-w-56 ${isMobile ? "ml-0" : "ml-2"} `}>
      <Sidebar
        variant="sidebar"
        collapsible="icon"
        className="lg:[--sidebar-width:14rem] mt-1.5 ml-2 rounded-[1rem] h-[calc(99dvh-5px)] border-purple-500/20 bg-[linear-gradient(180deg,#23113C_0%,#100820_100%)] text-white flex flex-col transition-all duration-200 shadow-2xl overflow-hidden"
        {...props}
        id="tour-home-sidebar"
      >
        {/* Header - Logo */}
        <SidebarHeader className={`flex items-center pt-8 pb-2 bg-transparent transition-transfrom duration-300 ${isCollapsed ? "justify-center" : "px-4"}`}>
          <Link href="/home" className={`relative flex items-center gap-3 group transition-all duration-300 hover:scale-105`}>
            <Image src={LogoIcon} alt="Logo" width={50} height={50} loading="eager" className="brightness-125 drop-shadow-[0_0_8px_rgba(124,58,237,0.5)] shrink" />
            {!isCollapsed && (
              <span className="font-bold text-lg tracking-tight text-white whitespace-nowrap overflow-hidden">
                Trend Agent
              </span>
            )}
          </Link>
          <Separator className={`bg-white/10 mt-4 transition-all duration-300 ${isCollapsed ? "w-12" : "w-full"}`} />
        </SidebarHeader>

        {/* Sidebar Content */}
        <SidebarContent className="flex flex-col gap-6 mt-2 py-0 bg-transparent overflow-hidden px-0 ">
          <SidebarMenu className={`flex flex-col gap-4 w-full ${isCollapsed ? "items-center" : "px-3"}`}>
            {navItems.map((item) => {
              const isActive = isPathActive(item.url);
              const dynamicUrl = getDynamicUrl(item.url);
              const isIconArray = (icon: NavItem['icon']): icon is [IconType, IconType] => {
                return Array.isArray(icon);
              };
              const IconComponent: IconType = (isIconArray(item.icon)) ? isActive ? item.icon[1] : item.icon[0] : item.icon;
              return (
                <SidebarMenuItem key={item.title} className="w-full flex justify-center ">
                  <SidebarMenuButton
                    asChild
                    tooltip={{ children: item.title }}
                    className={`flex items-center transition-transform duration-300 group overflow-hidden ${isCollapsed ? "justify-center rounded-full " : "justify-start w-full px-4 py-6 rounded-xl"
                      } ${isActive
                        ? "bg-[#7C3AED] text-white shadow-[0_0_20px_rgba(124,58,237,0.6)] hover:bg-[#7C3AED]/70 hover:text-white "
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                      }`}
                  >
                    <Link href={dynamicUrl as any} className="flex items-center w-full">
                      <IconComponent
                        strokeWidth={0}
                        className={`shrink-0 w-6! h-6! transition-transform duration-300 ${!isActive && "group-hover:scale-110"}`}
                      />
                      {!isCollapsed && (
                        <span className="font-semibold whitespace-nowrap overflow-hidden text-md">
                          {item.title}
                        </span>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarContent>

        {/* Footer - User & Language */}
        <SidebarFooter className={`flex flex-col gap-8 pb-0 bg-transparent px-0 mb-5 ${isCollapsed ? "ml-4 " : "px-3"}`}>
          <SidebarMenu>
            {/* Language Selector */}
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    tooltip={{ children: "Language" }}
                    className="text-gray-300 hover:bg-white/10! hover:text-white " 
                  >
                    <Globe />
                    {!isCollapsed && <span className="font-medium">{locale === 'en' ? 'English' : 'Deutsch'}</span>}
                    {!isCollapsed && <ChevronRight className="ml-auto opacity-50" size={14} />}
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="right" align="start" className="w-40 ml-3">
                  <DropdownMenuItem onClick={() => onLanguageChange('en')}>English</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onLanguageChange('de')}>Deutsch</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>

            <Separator className="my-2 bg-white/10" />

            {/* User Profile */}
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip={{ children: "User menu" }}
                className="text-gray-300 hover:bg-white/10! hover:text-white"
              >
                <Avatar className={`${isCollapsed ? "h-7 w-7 -ml-1.25" : "h-8 w-8"} border-2 border-white/20 bg-purple-500/20`}>
                  <AvatarFallback className="text-white bg-purple-600 font-bold">{user?.name?.[0]?.toUpperCase() || "U"}</AvatarFallback>
                </Avatar>
                {!isCollapsed && (
                  <>
                    <div className="flex flex-col items-start text-left leading-tight overflow-hidden">
                      <span className="truncate font-medium text-sm text-white max-w-[120px]">{user?.name || "User"}</span>
                    </div>
                    <LogOut
                      className="ml-auto text-red-400 hover:text-red-300 cursor-pointer"
                      size={16}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleLogout();
                      }}
                    />
                  </>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
    </aside>
  );
}