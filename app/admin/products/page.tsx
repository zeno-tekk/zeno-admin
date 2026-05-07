"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Trash2, Edit, Plus, Eye, EyeOff, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import useSWR from "swr";
import { getAuthHeaders } from "@/lib/auth";

interface Product {
  id: number;
  title: string;
  description: string;
  category: string;
  image: string;
  url?: string;
  isActive: boolean;
  order: number;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());
const API_URL = process.env.NEXT_PUBLIC_API_URL;

const emptyForm = { title: "", description: "", category: "", image: "", url: "", order: 0 };

export default function ProductsPage() {
  const { data, mutate, isLoading } = useSWR<{ success: boolean; data: Product[] }>(
    `${API_URL}/content/products/all`,
    fetcher
  );

  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState(emptyForm);

  const products = data?.data || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...formData, order: Number(formData.order) };

    try {
      const url = editingId ? `${API_URL}/content/products/${editingId}` : `${API_URL}/content/products`;
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success(editingId ? "Product updated!" : "Product created!");
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

  const handleEdit = (product: Product) => {
    setFormData({
      title: product.title,
      description: product.description,
      category: product.category,
      image: product.image,
      url: product.url || "",
      order: product.order,
    });
    setEditingId(product.id);
    setIsOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this product?")) return;
    const res = await fetch(`${API_URL}/content/products/${id}`, { method: "DELETE", headers: getAuthHeaders() });
    if (res.ok) {
      toast.success("Product deleted");
      mutate();
    } else {
      toast.error("Failed to delete product");
    }
  };

  const handleToggleActive = async (id: number, current: boolean) => {
    const res = await fetch(`${API_URL}/content/products/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ isActive: !current }),
    });
    if (res.ok) {
      toast.success(current ? "Product hidden" : "Product visible");
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
          <h1 className="text-3xl font-bold">Products Management</h1>
          <p className="text-muted-foreground mt-2">Manage your product portfolio</p>
        </div>
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Product" : "Add New Product"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Product title" required />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Product description" required />
              </div>
              <div>
                <label className="text-sm font-medium">Category</label>
                <Input value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} placeholder="e.g., Web, Mobile, AI/ML" required />
              </div>
              <div>
                <label className="text-sm font-medium">Image URL</label>
                <Input value={formData.image} onChange={(e) => setFormData({ ...formData, image: e.target.value })} placeholder="https://..." required />
              </div>
              <div>
                <label className="text-sm font-medium">Project URL (optional)</label>
                <Input value={formData.url} onChange={(e) => setFormData({ ...formData, url: e.target.value })} placeholder="https://..." />
              </div>
              <div>
                <label className="text-sm font-medium">Order</label>
                <Input type="number" value={formData.order} onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })} />
              </div>
              <Button type="submit" className="w-full">{editingId ? "Update Product" : "Create Product"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <Card className="p-6">Loading...</Card>
      ) : products.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">No products yet.</Card>
      ) : (
        <div className="grid gap-4">
          {products.map((product) => (
            <Card key={product.id} className={`p-6 ${!product.isActive ? "opacity-60" : ""}`}>
              <div className="flex gap-4 justify-between items-start">
                {product.image && (
                  <img src={product.image} alt={product.title} className="w-20 h-14 object-cover rounded-md shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-semibold text-lg">{product.title}</h3>
                    <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">{product.category}</span>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${product.isActive ? "bg-green-500/10 text-green-600 dark:text-green-400" : "bg-muted text-muted-foreground"}`}>
                      {product.isActive ? "Active" : "Hidden"}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-sm">{product.description}</p>
                  {product.url && (
                    <a href={product.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1 mt-1">
                      <ExternalLink className="w-3 h-3" /> View project
                    </a>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => handleToggleActive(product.id, product.isActive)} title={product.isActive ? "Hide" : "Show"}>
                    {product.isActive ? <Eye className="w-4 h-4 text-green-500" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(product)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(product.id)} className="text-destructive hover:text-destructive">
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
