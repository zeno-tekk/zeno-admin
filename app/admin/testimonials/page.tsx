"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Trash2, Edit, Plus, Star, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import useSWR from "swr";
import { getAuthHeaders } from "@/lib/auth";

interface Testimonial {
  id: number;
  clientName: string;
  clientCompany: string;
  content: string;
  clientImage?: string;
  rating: number;
  isActive: boolean;
  order: number;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());
const API_URL = process.env.NEXT_PUBLIC_API_URL;

const emptyForm = { clientName: "", clientCompany: "", content: "", clientImage: "", rating: 5, order: 0 };

export default function TestimonialsPage() {
  const { data, mutate, isLoading } = useSWR<{ success: boolean; data: Testimonial[] }>(
    `${API_URL}/content/testimonials/all`,
    fetcher
  );

  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState(emptyForm);

  const testimonials = data?.data || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...formData, rating: Number(formData.rating), order: Number(formData.order) };

    try {
      const url = editingId ? `${API_URL}/content/testimonials/${editingId}` : `${API_URL}/content/testimonials`;
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success(editingId ? "Testimonial updated!" : "Testimonial added!");
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

  const handleEdit = (t: Testimonial) => {
    setFormData({
      clientName: t.clientName,
      clientCompany: t.clientCompany,
      content: t.content,
      clientImage: t.clientImage || "",
      rating: t.rating,
      order: t.order,
    });
    setEditingId(t.id);
    setIsOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this testimonial?")) return;
    const res = await fetch(`${API_URL}/content/testimonials/${id}`, { method: "DELETE", headers: getAuthHeaders() });
    if (res.ok) {
      toast.success("Testimonial deleted");
      mutate();
    } else {
      toast.error("Failed to delete testimonial");
    }
  };

  const handleToggleActive = async (id: number, current: boolean) => {
    const res = await fetch(`${API_URL}/content/testimonials/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ isActive: !current }),
    });
    if (res.ok) {
      toast.success(current ? "Testimonial hidden" : "Testimonial visible");
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
          <h1 className="text-3xl font-bold">Testimonials Management</h1>
          <p className="text-muted-foreground mt-2">Manage customer testimonials</p>
        </div>
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Testimonial
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Testimonial" : "Add New Testimonial"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Client Name</label>
                <Input value={formData.clientName} onChange={(e) => setFormData({ ...formData, clientName: e.target.value })} placeholder="Client name" required />
              </div>
              <div>
                <label className="text-sm font-medium">Client Company</label>
                <Input value={formData.clientCompany} onChange={(e) => setFormData({ ...formData, clientCompany: e.target.value })} placeholder="Company name" required />
              </div>
              <div>
                <label className="text-sm font-medium">Testimonial Content</label>
                <Textarea value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} placeholder="Testimonial text" required />
              </div>
              <div>
                <label className="text-sm font-medium">Client Image URL (optional)</label>
                <Input value={formData.clientImage} onChange={(e) => setFormData({ ...formData, clientImage: e.target.value })} placeholder="https://..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Rating (1–5)</label>
                  <Input type="number" min="1" max="5" value={formData.rating} onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="text-sm font-medium">Order</label>
                  <Input type="number" value={formData.order} onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })} />
                </div>
              </div>
              <Button type="submit" className="w-full">{editingId ? "Update Testimonial" : "Create Testimonial"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <Card className="p-6">Loading...</Card>
      ) : testimonials.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">No testimonials yet.</Card>
      ) : (
        <div className="grid gap-4">
          {testimonials.map((t) => (
            <Card key={t.id} className={`p-6 ${!t.isActive ? "opacity-60" : ""}`}>
              <div className="flex gap-4 justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-semibold">{t.clientName}</h3>
                    <div className="flex">
                      {[...Array(Math.floor(t.rating))].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${t.isActive ? "bg-green-500/10 text-green-600 dark:text-green-400" : "bg-muted text-muted-foreground"}`}>
                      {t.isActive ? "Active" : "Hidden"}
                    </span>
                  </div>
                  <p className="text-primary text-sm font-medium">{t.clientCompany}</p>
                  <p className="text-muted-foreground text-sm mt-2">{t.content}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => handleToggleActive(t.id, t.isActive)} title={t.isActive ? "Hide" : "Show"}>
                    {t.isActive ? <Eye className="w-4 h-4 text-green-500" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(t)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(t.id)} className="text-destructive hover:text-destructive">
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
