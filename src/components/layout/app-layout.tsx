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
import { navItems, bottomNavItems, signOutNavItem, type NavItem, getNavItemsForUser } from "@/lib/nav-items";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger as ShadCNAccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { Navbar } from "./navbar";
import { ChevronDown } from "lucide-react";
import { useSession } from "next-auth/react";

// Custom Party Icon SVG - Wird für Sidebar Header und Header-Platzhalter verwendet
// const PartyIcon = () => (
//   <svg width=\"24\" height=\"24\" viewBox=\"0 0 100 100\" fill=\"currentColor\" xmlns=\"http://www.w3.org/2000/svg\">
//     <path d=\"M20,80 L20,30 L30,20 L40,30 L40,80 L35,85 L35,40 L25,40 L25,85 L20,80 Z M50,80 L50,10 L55,5 L60,10 L60,80 L50,80 Z M70,80 L70,30 L80,20 L90,30 L90,80 L85,85 L85,40 L75,40 L75,85 L70,80 Z\" />
//   </svg>
// );


function SidebarNav() {
  const pathname = usePathname();
  const { state: sidebarState } = useSidebar();
  const { data: session } = useSession();
  const [openAccordionValue, setOpenAccordionValue] = React.useState<string | undefined>(undefined);

  const displayNavItems = React.useMemo(() => {
    return getNavItemsForUser(session?.user?.isFraktionsvorstand);
  }, [session?.user?.isFraktionsvorstand]);

  React.useEffect(() => {
    if (sidebarState === "expanded") {
      let activeParentTitleBasedOnPath: string | undefined = undefined;
      displayNavItems.forEach(item => {
        if (item.isChidren && item.children && item.children.some(child => child.href === pathname)) {
          activeParentTitleBasedOnPath = item.title;
        }
      });

      // If a parent is active based on path AND (nothing is open OR the active path indicates a DIFFERENT parent than currently open)
      if (activeParentTitleBasedOnPath !== undefined) {
        if (openAccordionValue === undefined || (openAccordionValue !== undefined && activeParentTitleBasedOnPath !== openAccordionValue)) {
          setOpenAccordionValue(activeParentTitleBasedOnPath);
        }
      }
      // If no parent is active based on the path, but something is open, this effect should not close it.
      // Manual closure is handled by handleAccordionChange.
    }
    // When sidebar collapses, we might want to clear the open accordion
    // else if (sidebarState === "collapsed" && openAccordionValue !== undefined) { 
    //   setOpenAccordionValue(undefined); 
    // }
  }, [pathname, sidebarState, displayNavItems]); // Removed openAccordionValue from dependencies

  const handleAccordionChange = React.useCallback((value: string) => {
    setOpenAccordionValue(prevValue => (prevValue === value ? undefined : value));
  }, []);

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
      const isCurrentlyOpen = openAccordionValue === item.title;
      
      // Removed console log from here: [SidebarNav] Evaluating render for parent...

      return (
        <div key={index} className="w-full">
          <SidebarMenuItem>
            <SidebarMenuButton
              variant="default"
              className={cn(
                "w-full justify-start h-9 mb-1",
                sidebarState === "collapsed" ? "px-0 justify-center" : "px-2"
              )}
              tooltip={sidebarState === "collapsed" ? item.title : undefined}
              onClick={() => {
                if (sidebarState === "expanded") {
                  handleAccordionChange(item.title);
                }
              }}
              aria-expanded={isCurrentlyOpen}
            >
              <div className={cn("flex items-center gap-2 w-full", sidebarState === "collapsed" ? "justify-center" : "")}>
                <item.icon className={cn("h-5 w-5 shrink-0", sidebarState === "collapsed" ? "mx-auto" : "")} />
                {sidebarState === "expanded" && <span className="truncate flex-1">{item.title}</span>}
                {sidebarState === "expanded" && item.children && (
                  <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isCurrentlyOpen ? "rotate-180" : "")} />
                )}
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {sidebarState === "expanded" && (
            <Accordion type="single" collapsible className="w-full px-0" value={openAccordionValue}>
              <AccordionItem value={item.title} className="border-none overflow-hidden">
                <AccordionContent className="pt-1 pb-0 pl-2">
                  {openAccordionValue === item.title && (
                    <SidebarMenu className="border-l border-sidebar-border ml-[10px] pl-2">
                      {item.children.map((child, childIndex) => renderNavItem(child, childIndex, true))}
                    </SidebarMenu>
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
        </div>
      );
    }

    // For direct links (not parent categories)
    const commonProps = {
      variant: "default" as const,
      className: cn(
        "w-full justify-start h-9",
        isActive && !isSubItem && "bg-sidebar-accent text-sidebar-accent-foreground",
        sidebarState === "collapsed" ? "px-0 justify-center" : "px-2",
        isSubItem ? "h-8 text-sm ml-2" : "" 
      ),
      tooltip: sidebarState === "collapsed" ? item.title : undefined,
    };

    const content = (
      <div className={cn("flex items-center gap-2 w-full", sidebarState === "collapsed" ? "justify-center" : "")}>
        <item.icon className={cn("h-5 w-5 shrink-0", sidebarState === "collapsed" ? "mx-auto" : (isSubItem ? "ml-1" : "")) } />
        {sidebarState === "expanded" && <span className="truncate">{item.title}</span>}
      </div>
    );

    if (isSubItem) {
       return (
         <SidebarMenuSubItem key={item.href || index}>
           <Link href={item.href || "#"} passHref={false}>
             <SidebarMenuSubButton
               {...commonProps}
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
    <div className="flex flex-col flex-grow h-full">
      <ScrollArea className="flex-grow">
        <SidebarMenu className="px-2 pt-2">
          {displayNavItems.map((item, index) => renderNavItem(item, index))}
        </SidebarMenu>

        {bottomNavItems.length > 0 && (
          <SidebarMenu className="px-2 mt-2">
            {bottomNavItems.map((item, index) => renderNavItem(item, index))}
          </SidebarMenu>
        )}
      </ScrollArea>
      
      <div className="mt-auto px-2 pb-2">
        <SidebarMenu>
          {renderNavItem(signOutNavItem, navItems.length + bottomNavItems.length)}
        </SidebarMenu>
      </div>
    </div>
  );
}

export function AppLayout({ children }: PropsWithChildren) {
  return (
    <SidebarProvider defaultOpen>
      <Sidebar className="border-r">
        <SidebarHeader className="p-0">
          {/* Das erste NavItem (isHeader=true) rendert das Logo im SidebarNav */}
        </SidebarHeader>
        <SidebarContent className="p-0 flex flex-col">
          <SidebarNav />
        </SidebarContent>
      </Sidebar>
      <SidebarInset className="flex flex-col">
        <Navbar />
        <main className="flex-1 overflow-auto p-4 sm:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
