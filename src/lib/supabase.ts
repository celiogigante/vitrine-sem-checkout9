import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  const errors = [];
  if (!supabaseUrl) errors.push("VITE_SUPABASE_URL is missing");
  if (!supabaseAnonKey) errors.push("VITE_SUPABASE_ANON_KEY is missing");

  console.error("⚠️  Supabase Configuration Error:");
  console.error(errors.join(", "));
  console.error("Please configure these environment variables in your .env.local file");
  console.error("See .env.example for the required format");
}

if (supabaseUrl) {
  console.log("✓ Supabase URL configured:", supabaseUrl);
}

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-key",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);

// Tipos para as tabelas
export interface Model {
  id: string;
  name: string;
  brand: string;
  description?: string;
  views: number;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  model_id?: string;
  price: number;
  original_price?: number;
  description: string;
  condition: "novo" | "seminovo" | "excelente" | "bom" | "regular";
  status: "disponivel" | "vendido" | "reservado";
  battery_percentage?: number;
  general_condition?: string;
  slug?: string;
  images: string[];
  video_url?: string;
  specs: Record<string, string>;
  featured: boolean;
  promotion: boolean;
  is_on_request: boolean;
  views: number;
  created_at: string;
  updated_at: string;
}

export interface SiteConfig {
  id: string;
  whatsapp_number: string;
  banner_title: string;
  banner_subtitle: string;
  banner_image?: string;
  brand_name: string;
  is_store_mode: boolean;
  is_customer_registration_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  user_id?: string;
  email?: string;
  phone?: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  customer_id: string;
  total_price: number;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  items: unknown[];
  payment_method?: string;
  shipping_tracking_number?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  sku: string;
  color?: string;
  storage?: string;
  ram?: string;
  condition: "novo" | "seminovo" | "excelente" | "bom" | "regular";
  specific_defects?: string;
  price: number;
  original_price?: number;
  stock_quantity: number;
  status: "disponivel" | "vendido" | "reservado";
  order_index: number;
  created_at: string;
  updated_at: string;
}
