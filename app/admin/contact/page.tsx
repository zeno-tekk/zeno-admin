"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Mail, MailOpen, Calendar } from "lucide-react";
import { toast } from "sonner";
import useSWR from "swr";
import { getAuthHeaders } from "@/lib/auth";

interface ContactMessage {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

const fetcher = (url: string) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
  return fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  }).then((r) => r.json())
}
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function ContactPage() {
  const { data, mutate, isLoading } = useSWR<{ success: boolean; data: ContactMessage[] }>(
    `${API_URL}/content/contact/all`,
    fetcher
  );

  const messages = data?.data || [];
  const unreadCount = messages.filter((m) => !m.isRead).length;

  const handleToggleRead = async (id: number) => {
    try {
      await fetch(`${API_URL}/content/contact/${id}/read`, { method: "PATCH", headers: getAuthHeaders() });
      mutate();
    } catch {
      toast.error("Failed to update message");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this message?")) return;
    try {
      const res = await fetch(`${API_URL}/content/contact/${id}`, { method: "DELETE", headers: getAuthHeaders() });
      if (res.ok) {
        toast.success("Message deleted");
        mutate();
      } else {
        toast.error("Failed to delete message");
      }
    } catch {
      toast.error("Failed to delete message");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Contact Messages</h1>
        <p className="text-muted-foreground mt-2">
          {unreadCount > 0 ? (
            <span className="text-primary font-medium">{unreadCount} unread</span>
          ) : (
            "All messages read"
          )}{" "}
          · {messages.length} total
        </p>
      </div>

      {isLoading ? (
        <Card className="p-6">Loading...</Card>
      ) : messages.length === 0 ? (
        <Card className="p-12 text-center">
          <Mail className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No messages yet.</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {messages.map((msg) => (
            <Card
              key={msg.id}
              className={`p-6 transition-all ${msg.isRead ? "opacity-70" : "border-primary/40"}`}
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {msg.isRead ? (
                      <MailOpen className="w-4 h-4 text-muted-foreground shrink-0" />
                    ) : (
                      <Mail className="w-4 h-4 text-primary shrink-0" />
                    )}
                    <h3 className="font-semibold truncate">{msg.subject}</h3>
                    {!msg.isRead && (
                      <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-xs rounded-full shrink-0">
                        New
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
                    <span className="font-medium text-foreground">{msg.name}</span>
                    <span>·</span>
                    <span>{msg.email}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(msg.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{msg.message}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleRead(msg.id)}
                    title={msg.isRead ? "Mark as unread" : "Mark as read"}
                  >
                    {msg.isRead ? <Mail className="w-4 h-4" /> : <MailOpen className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(msg.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
