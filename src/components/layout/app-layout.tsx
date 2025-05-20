"use client";
import React from "react";
import type { PropsWithChildren } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarInset,
  useSidebar,
} from "@/components/ui/sidebar";
import { navItems, bottomNavItems, type NavItem } from "@/lib/nav-items";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger as ShadCNAccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

// Custom Party Icon SVG - Wird für Sidebar Header und Header-Platzhalter verwendet
// const PartyIcon = () => (
//   <svg width=\"24\" height=\"24\" viewBox=\"0 0 100 100\" fill=\"currentColor\" xmlns=\"http://www.w3.org/2000/svg\">
//     <path d=\"M20,80 L20,30 L30,20 L40,30 L40,80 L35,85 L35,40 L25,40 L25,85 L20,80 Z M50,80 L50,10 L55,5 L60,10 L60,80 L50,80 Z M70,80 L70,30 L80,20 L90,30 L90,80 L85,85 L85,40 L75,40 L75,85 L70,80 Z\" />
//   </svg>
// );


function SidebarNav() {
  const pathname = usePathname();
  const { state: sidebarState } = useSidebar();

  const renderNavItem = (item: NavItem, index: number, isSubItem = false) => {
    const isActive = item.href === pathname || (item.children && item.children.some(child => child.href === pathname));

    if (item.isHeader) {
      return (
        <div key={index} className={cn("flex items-center justify-center px-2 py-2 h-16 border-b", sidebarState === "collapsed" ? "" : "")}>
          <Image src="/images/logo.svg" alt="Logo" width={sidebarState === 'collapsed' ? 32 : 100} height={32} className="transition-all duration-300 ease-in-out" />
        </div>
      );
    }

    if (item.isChidren && item.children) {
      const isParentActive = item.children.some(child => child.href === pathname);
      const defaultAccordionValue = isParentActive && sidebarState === "expanded" ? item.title : undefined;

      return (
        <Accordion type="single" collapsible className="w-full px-0" key={index} defaultValue={defaultAccordionValue}>
          <AccordionItem value={item.title} className="border-none">
            <AccordionTriggerNoChevron
              className={cn(
                "w-full flex items-center justify-between hover:no-underline hover:bg-sidebar-accent rounded-md px-2 py-2 text-sm group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-0",
                sidebarState === "collapsed" ? "justify-center" : "",
                isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : ""
              )}
              showChevron={sidebarState === "expanded"}
            >
              <div className={cn("flex items-center gap-2", sidebarState === "collapsed" ? "justify-center w-full" : "")}>
                <item.icon className="h-5 w-5 shrink-0" />
                {sidebarState === "expanded" && <span className="truncate">{item.title}</span>}
              </div>
            </AccordionTriggerNoChevron>
            {sidebarState === "expanded" && (
              <AccordionContent className="pt-1 pb-0 pl-4">
                <SidebarMenu>
                  {item.children.map((child, childIndex) => (
                    renderNavItem(child, childIndex, true)
                  ))}
                </SidebarMenu>
              </AccordionContent>
            )}
          </AccordionItem>
        </Accordion>
      );
    }

    const commonProps = {
      variant: "default" as const,
      className: cn(
        "w-full justify-start h-9",
        isActive && !isSubItem && "bg-sidebar-accent text-sidebar-accent-foreground",
        sidebarState === "collapsed" ? "px-0 justify-center" : "px-2"
      ),
      tooltip: sidebarState === "collapsed" ? item.title : undefined,
    };

    const content = (
      <div className={cn("flex items-center gap-2 w-full", sidebarState === "collapsed" ? "justify-center" : "")}>
        <item.icon className={cn("h-5 w-5 shrink-0", sidebarState === "collapsed" ? "mx-auto" : "")} />
        {sidebarState === "expanded" && <span className="truncate">{item.title}</span>}
      </div>
    );

    if (isSubItem) {
       return (
        <SidebarMenuSubItem key={item.href || index}>
          <Link href={item.href || "#"} passHref={false}>
            <SidebarMenuSubButton
              {...commonProps}
              className={cn(
                "w-full justify-start h-8 text-sm", 
                isActive && "bg-sidebar-accent text-sidebar-accent-foreground",
                sidebarState === "collapsed" ? "px-0 justify-center" : "px-2",
                commonProps.className 
              )}
              isActive={isActive}
            >
              {content}
            </SidebarMenuSubButton>
          </Link>
        </SidebarMenuSubItem>
      );
    }

    return (
      <SidebarMenuItem key={item.href || index}>
        <Link href={item.href || "#"} passHref={false}>
          <SidebarMenuButton {...commonProps} isActive={isActive && !item.children}>
            {content}
          </SidebarMenuButton>
        </Link>
      </SidebarMenuItem>
    );
  };

  return (
    <div className="flex flex-col flex-grow">
      <SidebarMenu className="px-2">
        {navItems.map((item, index) => renderNavItem(item, index))}
      </SidebarMenu>

      <div className="mt-auto px-2">
        <SidebarMenu>
            {bottomNavItems.map((item, index) => renderNavItem(item, index))}
        </SidebarMenu>
      </div>
    </div>
  );
}

const AccordionTriggerNoChevron = React.forwardRef<
  React.ElementRef<typeof ShadCNAccordionTrigger>,
  React.ComponentPropsWithoutRef<typeof ShadCNAccordionTrigger> & { showChevron?: boolean }
>(({ className, children, showChevron = true, ...props }, ref) => (
  <ShadCNAccordionTrigger
    ref={ref}
    className={cn(
      "py-2 hover:no-underline",
      !showChevron && "[&>svg.lucide-chevron-down]:hidden",
      className
    )}
    {...props}
  >
    {children}
  </ShadCNAccordionTrigger>
));
AccordionTriggerNoChevron.displayName = "AccordionTriggerNoChevron";


export function AppLayout({ children }: PropsWithChildren) {
  return (
    <SidebarProvider defaultOpen>
      <Sidebar className="border-r">
        <SidebarHeader className="p-0 border-b">
          {/* Das erste NavItem (isHeader=true) rendert das Logo im SidebarNav */}
        </SidebarHeader>
        <SidebarContent className="p-0">
          <ScrollArea className="h-full">
            <SidebarNav />
          </ScrollArea>
        </SidebarContent>
        <SidebarFooter className="p-2 border-t">
          {/* BottomNavItems werden im SidebarNav gerendert */}
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="flex flex-col">
        <main className="flex-1 overflow-auto p-4 sm:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
