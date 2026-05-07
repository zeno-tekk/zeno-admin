"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Trash2, Edit, Plus, Star, StarOff, Eye, EyeOff, Calendar } from "lucide-react";
import { toast } from "sonner";
import useSWR from "swr";
import { getAuthHeaders } from "@/lib/auth";

interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  image: string;
  category: string;
  readTime: string;
  isFeatured: boolean;
  isActive: boolean;
  order: number;
  createdAt: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());
const API_URL = process.env.NEXT_PUBLIC_API_URL;

const emptyForm = {
  title: "",
  excerpt: "",
  content: "",
  author: "",
  image: "",
  category: "",
  readTime: "",
  order: 0,
};

export default function BlogPage() {
  const { data, mutate, isLoading } = useSWR<{ success: boolean; data: BlogPost[] }>(
    `${API_URL}/content/blog/all`,
    fetcher
  );

  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState(emptyForm);

  const posts = data?.data || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...formData, order: Number(formData.order) };

    try {
      const url = editingId
        ? `${API_URL}/content/blog/${editingId}`
        : `${API_URL}/content/blog`;
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(editingId ? "Post updated!" : "Post created!");
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

  const handleEdit = (post: BlogPost) => {
    setFormData({
      title: post.title,
      excerpt: post.excerpt,
      content: post.content || "",
      author: post.author,
      image: post.image || "",
      category: post.category,
      readTime: post.readTime || "",
      order: post.order,
    });
    setEditingId(post.id);
    setIsOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this post?")) return;
    const res = await fetch(`${API_URL}/content/blog/${id}`, { method: "DELETE", headers: getAuthHeaders() });
    if (res.ok) {
      toast.success("Post deleted");
      mutate();
    } else {
      toast.error("Failed to delete post");
    }
  };

  const handleToggle = async (id: number, field: "isActive" | "isFeatured", current: boolean) => {
    const res = await fetch(`${API_URL}/content/blog/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ [field]: !current }),
    });
    if (res.ok) {
      toast.success("Updated!");
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
          <h1 className="text-3xl font-bold">Blog Posts</h1>
          <p className="text-muted-foreground mt-2">Manage your blog content</p>
        </div>
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Post
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Post" : "Add New Post"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Post title"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Excerpt</label>
                <Textarea
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  placeholder="Short description"
                  required
                  rows={2}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Content (optional)</label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Full post content..."
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Author</label>
                  <Input
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    placeholder="Author name"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <Input
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g., AI & ML"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Read Time</label>
                  <Input
                    value={formData.readTime}
                    onChange={(e) => setFormData({ ...formData, readTime: e.target.value })}
                    placeholder="e.g., 5 min read"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Order</label>
                  <Input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Image URL</label>
                <Input
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <Button type="submit" className="w-full">
                {editingId ? "Update Post" : "Create Post"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <Card className="p-6">Loading...</Card>
      ) : posts.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">No blog posts yet.</Card>
      ) : (
        <div className="grid gap-4">
          {posts.map((post) => (
            <Card key={post.id} className="p-6">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-semibold text-lg">{post.title}</h3>
                    {post.isFeatured && (
                      <span className="px-2 py-0.5 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 text-xs rounded-full">
                        Featured
                      </span>
                    )}
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full ${
                        post.isActive
                          ? "bg-green-500/10 text-green-600 dark:text-green-400"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {post.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-sm mb-2">{post.excerpt}</p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                      {post.category}
                    </span>
                    <span>by {post.author}</span>
                    {post.readTime && <span>{post.readTime}</span>}
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(post.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggle(post.id, "isFeatured", post.isFeatured)}
                    title={post.isFeatured ? "Unfeature" : "Feature"}
                  >
                    {post.isFeatured ? (
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ) : (
                      <StarOff className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggle(post.id, "isActive", post.isActive)}
                    title={post.isActive ? "Deactivate" : "Activate"}
                  >
                    {post.isActive ? (
                      <Eye className="w-4 h-4 text-green-500" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-muted-foreground" />
                    )}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(post)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(post.id)}
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
