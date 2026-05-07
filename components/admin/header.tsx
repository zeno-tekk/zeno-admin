"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import useSWR from "swr";
import {
  Bell,
  Sun,
  Moon,
  LogOut,
  Settings,
  Mail,
  ChevronDown,
  KeyRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import Link from "next/link";

const PAGE_TITLES: Record<string, { title: string; description: string }> = {
  "/admin": { title: "Dashboard", description: "Overview of your website" },
  "/admin/hero-content": { title: "Hero Content", description: "Manage the hero section" },
  "/admin/services": { title: "Services", description: "Manage services and features" },
  "/admin/products": { title: "Products", description: "Manage products and projects" },
  "/admin/team": { title: "Team Members", description: "Manage team members" },
  "/admin/testimonials": { title: "Testimonials", description: "Manage customer testimonials" },
  "/admin/stats": { title: "Statistics", description: "Manage homepage statistics" },
  "/admin/blog": { title: "Blog Posts", description: "Manage blog posts" },
  "/admin/contact": { title: "Contact Messages", description: "View and manage contact messages" },
  "/admin/analytics": { title: "Analytics", description: "Site traffic and visitor insights" },
  "/admin/finance": { title: "Finance", description: "Track income, expenses and profitability" },
  "/admin/settings": { title: "Settings", description: "Manage your account preferences" },
};

interface ContactMessage {
  id: number;
  name: string;
  subject: string;
  isRead: boolean;
  createdAt: string;
}

interface DecodedUser {
  firstName: string;
  lastName: string;
  email: string;
  profilePicture?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const fetcher = (url: string) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
  return fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  }).then((r) => r.json())
}

function decodeToken(token: string): DecodedUser | null {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

export function AdminHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<DecodedUser | null>(null);

  const { data: contactData, mutate: mutateContacts } = useSWR<{
    success: boolean;
    data: ContactMessage[];
  }>(`${API_URL}/content/contact/all`, fetcher, { refreshInterval: 30000 });

  const messages = contactData?.data || [];
  const unread = messages.filter((m) => !m.isRead);
  const unreadCount = unread.length;

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem("token");
    if (token) {
      const decoded = decodeToken(token);
      if (decoded) setUser(decoded);
    }
  }, []);

  const page = PAGE_TITLES[pathname] ?? { title: "Admin", description: "Manage your website" };
  const initials = user
    ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase()
    : "A";

  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/auth/logout`, { method: "POST", credentials: "include" });
    } catch {}
    localStorage.removeItem("token");
    toast.success("Logged out successfully");
    router.replace("/login");
  };

  const handleMarkRead = async (id: number) => {
    await fetch(`${API_URL}/content/contact/${id}/read`, { method: "PATCH" });
    mutateContacts();
  };

  return (
    <header className="bg-card border-b border-border px-6 py-4 flex items-center justify-between">
      {/* Dynamic page title */}
      <div>
        <h2 className="text-lg font-semibold">{page.title}</h2>
        <p className="text-sm text-muted-foreground">{page.description}</p>
      </div>

      <div className="flex items-center gap-1">
        {/* Theme Toggle */}
        {mounted && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="text-muted-foreground hover:text-foreground"
            title="Toggle theme"
          >
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
        )}

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground relative"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full animate-pulse" />
              )}
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between pb-2">
              <span>Notifications</span>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-xs h-5 px-1.5">
                  {unreadCount} new
                </Badge>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            {unread.length === 0 ? (
              <div className="px-3 py-8 text-center">
                <Bell className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-40" />
                <p className="text-sm text-muted-foreground">You're all caught up</p>
              </div>
            ) : (
              <>
                {unread.slice(0, 5).map((msg) => (
                  <DropdownMenuItem
                    key={msg.id}
                    className="flex items-start gap-3 p-3 cursor-pointer"
                    onClick={() => handleMarkRead(msg.id)}
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Mail className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{msg.subject}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(msg.createdAt).toLocaleDateString("en", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <span className="w-2 h-2 bg-primary rounded-full shrink-0 mt-2" />
                  </DropdownMenuItem>
                ))}
                {unreadCount > 5 && (
                  <p className="text-xs text-center text-muted-foreground py-2">
                    +{unreadCount - 5} more
                  </p>
                )}
                <DropdownMenuSeparator />
              </>
            )}

            <DropdownMenuItem asChild>
              <Link
                href="/admin/contact"
                className="w-full justify-center text-sm text-primary cursor-pointer"
              >
                View all messages →
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 px-2 h-10 ml-1"
            >
              <Avatar className="w-8 h-8">
                {user?.profilePicture && (
                  <AvatarImage src={user.profilePicture} alt={user.firstName} />
                )}
                <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium leading-none">
                  {user ? `${user.firstName} ${user.lastName}` : "Admin"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[120px]">
                  {user?.email ?? ""}
                </p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground hidden md:block" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            {/* User info header */}
            <DropdownMenuLabel className="font-normal">
              <div className="flex items-center gap-3">
                <Avatar className="w-9 h-9">
                  {user?.profilePicture && (
                    <AvatarImage src={user.profilePicture} alt={user.firstName} />
                  )}
                  <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">
                    {user ? `${user.firstName} ${user.lastName}` : "Admin"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuItem asChild>
              <Link
                href="/admin/settings"
                className="cursor-pointer flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                Settings
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <Link
                href="/admin/settings#password"
                className="cursor-pointer flex items-center gap-2"
              >
                <KeyRound className="w-4 h-4" />
                Change Password
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              className="text-destructive focus:text-destructive cursor-pointer gap-2"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
