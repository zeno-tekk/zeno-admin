"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  FileText,
  Users,
  MessageSquare,
  Package,
  LayoutDashboard,
  LogOut,
  Zap,
  BookOpen,
  Mail,
  Activity,
  Settings,
  Wallet,
  History,
  Briefcase,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/admin" },
  { icon: Zap, label: "Hero Content", href: "/admin/hero-content" },
  { icon: FileText, label: "Services", href: "/admin/services" },
  { icon: Package, label: "Products", href: "/admin/products" },
  { icon: Users, label: "Team Members", href: "/admin/team" },
  { icon: MessageSquare, label: "Testimonials", href: "/admin/testimonials" },
  { icon: BarChart3, label: "Statistics", href: "/admin/stats" },
  { icon: BookOpen, label: "Blog Posts", href: "/admin/blog" },
  { icon: Mail, label: "Contact Messages", href: "/admin/contact" },
  { icon: Activity, label: "Analytics", href: "/admin/analytics" },
  { icon: Wallet, label: "Finance", href: "/admin/finance" },
  { icon: Briefcase, label: "Clients", href: "/admin/clients" },
  { icon: History, label: "Activity Logs", href: "/admin/logs" },
  { icon: Settings, label: "Settings", href: "/admin/settings" },
];

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/auth/logout`, { method: "POST", credentials: "include" });
    } catch {
      // ignore network errors on logout
    }
    localStorage.removeItem("token");
    toast.success("Logged out successfully");
    router.replace("/login");
  };

  return (
    <aside className="w-64 bg-card border-r border-border h-screen flex flex-col">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-border">
        <Link href="/admin">
          <img src="/image.png" alt="ZENO TEKK" className="h-10 w-auto object-contain" />
        </Link>
        <p className="text-xs text-muted-foreground mt-1.5">Admin Portal</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {sidebarItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200",
              pathname === item.href
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <item.icon className="w-5 h-5 shrink-0" />
            <span className="font-medium text-sm">{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-border">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2.5 w-full rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium text-sm">Logout</span>
        </button>
      </div>
    </aside>
  );
}
