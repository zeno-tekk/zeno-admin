"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Save, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import useSWR from "swr";
import { getAuthHeaders } from "@/lib/auth";

interface HeroContent {
  title: string;
  subtitle: string;
  description: string;
  ctaButton1Text: string;
  ctaButton1Url: string;
  ctaButton2Text: string;
  ctaButton2Url: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function HeroContentPage() {
  const { data, mutate, isLoading } = useSWR<{ success: boolean; data: HeroContent }>(
    `${API_URL}/content/hero-content`,
    fetcher
  );

  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<HeroContent>({
    title: "",
    subtitle: "",
    description: "",
    ctaButton1Text: "",
    ctaButton1Url: "",
    ctaButton2Text: "",
    ctaButton2Url: "",
  });
  const [loaded, setLoaded] = useState(false);

  // Populate form once data arrives
  if (data?.data && !loaded) {
    setFormData(data.data);
    setLoaded(true);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/content/hero-content`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        toast.success("Hero content updated successfully!");
        mutate();
      } else {
        const err = await res.json();
        toast.error(err.message || "Failed to update hero content");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const field = (
    label: string,
    key: keyof HeroContent,
    placeholder: string,
    multiline = false
  ) => (
    <div>
      <label className="text-sm font-medium block mb-1">{label}</label>
      {multiline ? (
        <Textarea
          value={formData[key]}
          onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
          placeholder={placeholder}
          rows={3}
        />
      ) : (
        <Input
          value={formData[key]}
          onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
          placeholder={placeholder}
        />
      )}
    </div>
  );

  return (
    <div className="space-y-6 max-w-full">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Hero Content</h1>
          <p className="text-muted-foreground mt-2">Edit the homepage hero section</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => { setLoaded(false); mutate(); }}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <Card className="p-6">Loading...</Card>
      ) : (
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {field("Main Title", "title", "e.g., Transform Ideas Into Innovative Software")}
            {field("Highlighted Subtitle (part of title to highlight)", "subtitle", "e.g., Innovative Software")}
            {field("Description", "description", "Hero section description...", true)}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">CTA Button 1</p>
                {field("Button Text", "ctaButton1Text", "e.g., Explore Services")}
                {field("Button URL", "ctaButton1Url", "e.g., /services")}
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">CTA Button 2</p>
                {field("Button Text", "ctaButton2Text", "e.g., View Our Work")}
                {field("Button URL", "ctaButton2Url", "e.g., /products")}
              </div>
            </div>

            <Button type="submit" disabled={saving} className="w-full gap-2">
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
}
