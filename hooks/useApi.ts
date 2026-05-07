import useSWR from "swr";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export interface Service {
  id: number;
  title: string;
  description: string;
  icon: string;
  features: string[];
  learnMore?: string | null;
  isActive: boolean;
  order: number;
}

export interface Product {
  id: number;
  title: string;
  description: string;
  category: string;
  image: string;
  url?: string;
  isActive: boolean;
  order: number;
}

export interface TeamMember {
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

export interface Testimonial {
  id: number;
  clientName: string;
  clientCompany: string;
  content: string;
  clientImage?: string;
  rating: number;
  isActive: boolean;
  order: number;
}

export interface Stat {
  id: number;
  label: string;
  value: string;
  description?: string;
  isActive: boolean;
  order: number;
}

export interface HeroContent {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  ctaButton1Text: string;
  ctaButton1Url: string;
  ctaButton2Text: string;
  ctaButton2Url: string;
  badge: string;
}

// Services
export const useServices = () => {
  const { data, error, isLoading, mutate } = useSWR<{ success: boolean; data: Service[] }>(
    API_URL ? `${API_URL}/content/services` : null,
    fetcher,
    { revalidateOnFocus: false, revalidateOnReconnect: false }
  );
  return {
    services: data?.data || [],
    isLoading,
    error,
    mutate,
  };
};

// Products
export const useProducts = () => {
  const { data, error, isLoading, mutate } = useSWR<{ success: boolean; data: Product[] }>(
    API_URL ? `${API_URL}/content/products` : null,
    fetcher,
    { revalidateOnFocus: false, revalidateOnReconnect: false }
  );
  return {
    products: data?.data || [],
    isLoading,
    error,
    mutate,
  };
};

// Team Members
export const useTeamMembers = () => {
  const { data, error, isLoading, mutate } = useSWR<{ success: boolean; data: TeamMember[] }>(
    API_URL ? `${API_URL}/content/team` : null,
    fetcher,
    { revalidateOnFocus: false, revalidateOnReconnect: false }
  );
  return {
    teamMembers: data?.data || [],
    isLoading,
    error,
    mutate,
  };
};

// Testimonials
export const useTestimonials = () => {
  const { data, error, isLoading, mutate } = useSWR<{ success: boolean; data: Testimonial[] }>(
    API_URL ? `${API_URL}/content/testimonials` : null,
    fetcher,
    { revalidateOnFocus: false, revalidateOnReconnect: false }
  );
  return {
    testimonials: data?.data || [],
    isLoading,
    error,
    mutate,
  };
};

// Stats
export const useStats = () => {
  const { data, error, isLoading, mutate } = useSWR<{ success: boolean; data: Stat[] }>(
    API_URL ? `${API_URL}/content/stats` : null,
    fetcher,
    { revalidateOnFocus: false, revalidateOnReconnect: false }
  );
  return {
    stats: data?.data || [],
    isLoading,
    error,
    mutate,
  };
};

export interface BlogPost {
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

// Blog Posts
export const useBlogPosts = () => {
  const { data, error, isLoading, mutate } = useSWR<{ success: boolean; data: BlogPost[] }>(
    API_URL ? `${API_URL}/content/blog` : null,
    fetcher,
    { revalidateOnFocus: false, revalidateOnReconnect: false }
  );
  return {
    posts: data?.data || [],
    isLoading,
    error,
    mutate,
  };
};

// Hero Content
export const useHeroContent = () => {
  const { data, error, isLoading, mutate } = useSWR<{ success: boolean; data: HeroContent }>(
    API_URL ? `${API_URL}/content/hero-content` : null,
    fetcher,
    { revalidateOnFocus: false, revalidateOnReconnect: false }
  );
  return {
    heroContent: data?.data,
    isLoading,
    error,
    mutate,
  };
};
