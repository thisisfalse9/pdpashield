import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, ChevronRight, RotateCcw } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioGroup,
  DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { findNav } from "./nav";
import { resetDemo, setState, useStore, type Role } from "@/lib/store";
import { signOut, useSession } from "@/lib/auth";
import { toast } from "sonner";

export function AppTopbar() {
  const path = useRouterState({ select: (r) => r.location.pathname });
  const nav = findNav(path);
  const notices = useStore((s) => s.notices);
  const profile = useStore((s) => s.profile);
  const role = useStore((s) => s.role);
  const { email, ready } = useSession();
  const unread = notices.filter((n) => !n.read).length;
  const initials = profile.name.split(" ").map((w) => w[0]).join("").slice(0, 2);

  return (
    <header className="sticky top-0 z-20 grid h-16 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b bg-card/90 px-4 backdrop-blur">
      <div className="flex min-w-0 items-center gap-3">
        <SidebarTrigger className="shrink-0" />
        <div className="min-w-0">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Link to="/" className="hover:text-foreground">PDPA Shield</Link>
            {nav && (<><ChevronRight className="h-3 w-3" /><span>{nav.group}</span></>)}
          </div>
          <h1 className="truncate text-base font-semibold">{nav?.item.title ?? "Page"}</h1>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
              <Bell className="h-4 w-4" />
              {unread > 0 && <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] text-destructive-foreground">{unread}</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <span className="text-sm font-semibold">Notifications</span>
              <button className="text-xs text-info hover:underline" onClick={() => setState((s) => ({ notices: s.notices.map((n) => ({ ...n, read: true })) }))}>Mark all read</button>
            </div>
            <div className="max-h-80 overflow-auto">
              {notices.length === 0 && <p className="p-4 text-sm text-muted-foreground">You're all caught up.</p>}
              {notices.map((n) => (
                <button key={n.id} onClick={() => setState((s) => ({ notices: s.notices.map((x) => (x.id === n.id ? { ...x, read: true } : x)) }))}
                  className="flex w-full gap-3 border-b px-4 py-3 text-left last:border-0 hover:bg-muted">
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read ? "bg-border" : "bg-brand"}`} />
                  <span className="min-w-0">
                    <span className="block text-sm">{n.title}</span>
                    <span className="text-xs text-muted-foreground">{new Date(n.at).toLocaleString("en-SG")}</span>
                  </span>
                </button>
              ))}
            </div>
            <p className="border-t px-4 py-2 text-[11px] text-muted-foreground">In-app only. Email delivery is not connected.</p>
          </PopoverContent>
        </Popover>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-full p-0.5 pr-2 hover:bg-muted">
              <Avatar className="h-8 w-8"><AvatarFallback className="bg-primary text-xs text-primary-foreground">{initials}</AvatarFallback></Avatar>
              <span className="hidden text-left sm:block">
                <span className="block text-xs font-semibold leading-tight">{profile.name}</span>
                <span className="block text-[11px] leading-tight text-muted-foreground">{role}</span>
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel className="text-xs text-muted-foreground">Preview as role (demo)</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={role} onValueChange={(v) => { setState(() => ({ role: v as Role })); toast(`Now previewing as ${v}`); }}>
              {(["Admin", "DPO", "Compliance Officer", "Business User"] as Role[]).map((r) => (
                <DropdownMenuRadioItem key={r} value={r}>{r}</DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
            {ready && email ? (
              <>
                <DropdownMenuLabel className="text-xs text-muted-foreground">Signed in as {email}</DropdownMenuLabel>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()} onClick={() => void signOut()}>
                  Sign out
                </DropdownMenuItem>
              </>
            ) : (
              <DropdownMenuItem asChild>
                <Link to="/auth">Sign in for live data</Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild><Link to="/settings/profile">Profile & Account</Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link to="/settings/organisation">Organisation Settings</Link></DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => { resetDemo(); toast.success("Demo data reset"); }}>
              <RotateCcw className="mr-2 h-3.5 w-3.5" /> Reset demo data
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
