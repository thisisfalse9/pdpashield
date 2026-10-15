import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronDown, LogOut } from "lucide-react";
import { useState } from "react";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarSeparator, useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { NAV } from "./nav";
import logo from "@/assets/logo.png.asset.json";

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const path = useRouterState({ select: (r) => r.location.pathname });
  const [logout, setLogout] = useState(false);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link to="/" className="flex items-center gap-2 px-1 py-2">
          <img src={logo.url} alt="PDPA Shield" className="h-9 w-9 shrink-0 rounded-md bg-sidebar-foreground/95 p-0.5" />
          {!collapsed && (
            <div className="min-w-0">
              <div className="truncate font-display text-sm font-semibold text-sidebar-accent-foreground">PDPA Shield</div>
              <div className="truncate text-[11px] text-sidebar-foreground/60">Data governance workspace</div>
            </div>
          )}
        </Link>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        {NAV.map((g) => {
          const active = g.items.some((i) => i.url === path);
          return (
            <Collapsible key={g.label} defaultOpen={active || g.label === "Overview" || g.label === "Compliance"} className="group/collapsible">
              <SidebarGroup className="py-1">
                <SidebarGroupLabel asChild>
                  <CollapsibleTrigger className="flex w-full items-center text-sidebar-foreground/55 hover:text-sidebar-foreground">
                    {g.label}
                    <ChevronDown className="ml-auto h-3.5 w-3.5 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                  </CollapsibleTrigger>
                </SidebarGroupLabel>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {g.items.map((i) => (
                        <SidebarMenuItem key={i.url}>
                          <SidebarMenuButton asChild isActive={path === i.url} tooltip={i.title}
                            className="data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground">
                            <Link to={i.url}>
                              <i.icon className="h-4 w-4" />
                              <span>{i.title}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
          );
        })}
      </SidebarContent>
      <SidebarSeparator />
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Log Out" onClick={() => setLogout(true)} className="hover:bg-destructive/20">
              <LogOut className="h-4 w-4" />
              <span>Log Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <AlertDialog open={logout} onOpenChange={setLogout}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Log out of PDPA Shield?</AlertDialogTitle>
            <AlertDialogDescription>
              This is a demo workspace without sign-in yet. Logging out will simply end this demo session; your demo data stays in this browser.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => toast.success("Demo session ended", { description: "Sign-in will be available once accounts are enabled." })}>Log out</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sidebar>
  );
}
