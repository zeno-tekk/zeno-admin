"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Trash2, Edit, Plus, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import useSWR from "swr";
import { getAuthHeaders } from "@/lib/auth";

interface TeamMember {
  id: number;
  name: string;
  position: string;
  bio?: string;
  image: string;
  email?: string;
  linkedin?: string;
  twitter?: string;
  isActive: boolean;
  order: number;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());
const API_URL = process.env.NEXT_PUBLIC_API_URL;

const emptyForm = { name: "", position: "", bio: "", image: "", email: "", linkedin: "", twitter: "", order: 0 };

export default function TeamPage() {
  const { data, mutate, isLoading } = useSWR<{ success: boolean; data: TeamMember[] }>(
    `${API_URL}/content/team/all`,
    fetcher
  );

  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState(emptyForm);

  const teamMembers = data?.data || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...formData, order: Number(formData.order) };

    try {
      const url = editingId ? `${API_URL}/content/team/${editingId}` : `${API_URL}/content/team`;
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success(editingId ? "Member updated!" : "Member added!");
        mutate();
        setIsOpen(false);
        setEditingId(null);
        setFormData(emptyForm);
      } else {
        const err = await res.json();
        toast.error(err.message || "Operation failed");
      }
    } catch {
      toast.error("Something went wrong");
    }
  };

  const handleEdit = (member: TeamMember) => {
    setFormData({
      name: member.name,
      position: member.position,
      bio: member.bio || "",
      image: member.image,
      email: member.email || "",
      linkedin: member.linkedin || "",
      twitter: member.twitter || "",
      order: member.order,
    });
    setEditingId(member.id);
    setIsOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this team member?")) return;
    const res = await fetch(`${API_URL}/content/team/${id}`, { method: "DELETE", headers: getAuthHeaders() });
    if (res.ok) {
      toast.success("Member deleted");
      mutate();
    } else {
      toast.error("Failed to delete member");
    }
  };

  const handleToggleActive = async (id: number, current: boolean) => {
    const res = await fetch(`${API_URL}/content/team/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ isActive: !current }),
    });
    if (res.ok) {
      toast.success(current ? "Member hidden" : "Member visible");
      mutate();
    } else {
      toast.error("Failed to update");
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setEditingId(null);
      setFormData(emptyForm);
    }
    setIsOpen(open);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Team Management</h1>
          <p className="text-muted-foreground mt-2">Manage your team members</p>
        </div>
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Member
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Member" : "Add New Member"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Name</label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Full name" required />
              </div>
              <div>
                <label className="text-sm font-medium">Position</label>
                <Input value={formData.position} onChange={(e) => setFormData({ ...formData, position: e.target.value })} placeholder="Job position" required />
              </div>
              <div>
                <label className="text-sm font-medium">Bio (optional)</label>
                <Textarea value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} placeholder="Short bio" />
              </div>
              <div>
                <label className="text-sm font-medium">Image URL</label>
                <Input value={formData.image} onChange={(e) => setFormData({ ...formData, image: e.target.value })} placeholder="https://..." required />
              </div>
              <div>
                <label className="text-sm font-medium">Email (optional)</label>
                <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="Email address" />
              </div>
              <div>
                <label className="text-sm font-medium">LinkedIn (optional)</label>
                <Input value={formData.linkedin} onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })} placeholder="LinkedIn URL" />
              </div>
              <div>
                <label className="text-sm font-medium">Twitter (optional)</label>
                <Input value={formData.twitter} onChange={(e) => setFormData({ ...formData, twitter: e.target.value })} placeholder="Twitter handle" />
              </div>
              <div>
                <label className="text-sm font-medium">Order</label>
                <Input type="number" value={formData.order} onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })} />
              </div>
              <Button type="submit" className="w-full">{editingId ? "Update Member" : "Create Member"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <Card className="p-6">Loading...</Card>
      ) : teamMembers.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">No team members yet.</Card>
      ) : (
        <div className="grid gap-4">
          {teamMembers.map((member) => (
            <Card key={member.id} className={`p-6 ${!member.isActive ? "opacity-60" : ""}`}>
              <div className="flex gap-4 justify-between items-start">
                {member.image && (
                  <img src={member.image} alt={member.name} className="w-14 h-14 rounded-full object-cover shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <h3 className="font-semibold text-lg">{member.name}</h3>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${member.isActive ? "bg-green-500/10 text-green-600 dark:text-green-400" : "bg-muted text-muted-foreground"}`}>
                      {member.isActive ? "Active" : "Hidden"}
                    </span>
                  </div>
                  <p className="text-primary text-sm font-medium">{member.position}</p>
                  {member.bio && <p className="text-muted-foreground text-sm mt-1">{member.bio}</p>}
                  <div className="mt-2 space-y-0.5">
                    {member.email && <p className="text-xs text-muted-foreground">✉ {member.email}</p>}
                    {member.linkedin && <p className="text-xs text-muted-foreground">in {member.linkedin}</p>}
                    {member.twitter && <p className="text-xs text-muted-foreground">𝕏 {member.twitter}</p>}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => handleToggleActive(member.id, member.isActive)} title={member.isActive ? "Hide" : "Show"}>
                    {member.isActive ? <Eye className="w-4 h-4 text-green-500" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(member)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(member.id)} className="text-destructive hover:text-destructive">
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
