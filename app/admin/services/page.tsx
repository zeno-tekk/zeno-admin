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

interface Service {
  id: number;
  title: string;
  description: string;
  icon: string;
  features: string[];
  learnMore?: string | null;
  isActive: boolean;
  order: number;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());
const API_URL = process.env.NEXT_PUBLIC_API_URL;

const emptyForm = { title: "", description: "", icon: "", features: "", order: 0 };

export default function ServicesPage() {
  const { data, mutate, isLoading } = useSWR<{ success: boolean; data: Service[] }>(
    `${API_URL}/content/services/all`,
    fetcher
  );

  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState(emptyForm);

  const services = data?.data || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const featuresArray = formData.features.split(",").map((f) => f.trim()).filter(Boolean);
    const payload = { ...formData, features: featuresArray, order: Number(formData.order) };

    try {
      const url = editingId ? `${API_URL}/content/services/${editingId}` : `${API_URL}/content/services`;
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success(editingId ? "Service updated!" : "Service created!");
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

  const handleEdit = (service: Service) => {
    setFormData({
      title: service.title,
      description: service.description,
      icon: service.icon,
      features: service.features.join(", "),
      order: service.order,
    });
    setEditingId(service.id);
    setIsOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this service?")) return;
    const res = await fetch(`${API_URL}/content/services/${id}`, { method: "DELETE", headers: getAuthHeaders() });
    if (res.ok) {
      toast.success("Service deleted");
      mutate();
    } else {
      toast.error("Failed to delete service");
    }
  };

  const handleToggleActive = async (id: number, current: boolean) => {
    const res = await fetch(`${API_URL}/content/services/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ isActive: !current }),
    });
    if (res.ok) {
      toast.success(current ? "Service hidden" : "Service visible");
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
          <h1 className="text-3xl font-bold">Services Management</h1>
          <p className="text-muted-foreground mt-2">Manage your service offerings</p>
        </div>
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Service
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Service" : "Add New Service"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Service title" required />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Service description" required />
              </div>
              <div>
                <label className="text-sm font-medium">Icon (lucide name)</label>
                <Input value={formData.icon} onChange={(e) => setFormData({ ...formData, icon: e.target.value })} placeholder="e.g., Code2, Smartphone" required />
              </div>
              <div>
                <label className="text-sm font-medium">Features (comma-separated)</label>
                <Textarea value={formData.features} onChange={(e) => setFormData({ ...formData, features: e.target.value })} placeholder="Feature 1, Feature 2, Feature 3" />
              </div>
              <div>
                <label className="text-sm font-medium">Order</label>
                <Input type="number" value={formData.order} onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })} />
              </div>
              <Button type="submit" className="w-full">{editingId ? "Update Service" : "Create Service"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <Card className="p-6">Loading...</Card>
      ) : services.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">No services yet.</Card>
      ) : (
        <div className="grid gap-4">
          {services.map((service) => (
            <Card key={service.id} className={`p-6 ${!service.isActive ? "opacity-60" : ""}`}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-lg">{service.title}</h3>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${service.isActive ? "bg-green-500/10 text-green-600 dark:text-green-400" : "bg-muted text-muted-foreground"}`}>
                      {service.isActive ? "Active" : "Hidden"}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-sm">{service.description}</p>
                  <div className="mt-2 space-y-0.5">
                    <p className="text-xs text-muted-foreground">Icon: {service.icon}</p>
                    {service.features.length > 0 && (
                      <p className="text-xs text-muted-foreground">Features: {service.features.join(", ")}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleToggleActive(service.id, service.isActive)} title={service.isActive ? "Hide" : "Show"}>
                    {service.isActive ? <Eye className="w-4 h-4 text-green-500" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(service)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(service.id)} className="text-destructive hover:text-destructive">
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
