import { supabase } from "@/lib/supabase";
import type { ProductVariant } from "@/lib/supabase";

export type ProductStatus = "disponivel" | "vendido" | "reservado";

export interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  originalPrice?: number;
  description: string;
  condition: "novo" | "seminovo" | "excelente" | "bom" | "regular";
  status: ProductStatus;
  battery?: number;
  generalState?: string;
  slug: string;
  images: string[];
  videoUrl?: string;
  specs: Record<string, string>;
  featured: boolean;
  promotion: boolean;
  views: number;
  createdAt: string;
  isOnRequest?: boolean;
}

/**
 * Convert Supabase snake_case to our camelCase interface
 */
function fromSupabaseProduct(data: any): Product {
  return {
    id: data.id,
    name: data.name,
    brand: data.brand,
    price: data.price,
    originalPrice: data.original_price,
    description: data.description,
    condition: data.condition,
    status: data.status || "disponivel",
    battery: data.battery_percentage,
    generalState: data.general_condition,
    slug: data.slug || slugify(data.name),
    images: data.images || [],
    videoUrl: data.video_url,
    specs: data.specs || {},
    featured: data.featured || false,
    promotion: data.promotion || false,
    views: data.views || 0,
    createdAt: data.created_at ? data.created_at.split("T")[0] : new Date().toISOString().split("T")[0],
    isOnRequest: data.is_on_request || false,
  };
}

/**
 * Convert our camelCase interface to Supabase snake_case
 */
function toSupabaseProduct(product: Product) {
  return {
    id: product.id,
    name: product.name,
    brand: product.brand,
    price: product.price,
    original_price: product.originalPrice,
    description: product.description,
    condition: product.condition,
    status: product.status,
    battery_percentage: product.battery,
    general_condition: product.generalState,
    slug: product.slug,
    images: product.images,
    video_url: product.videoUrl,
    specs: product.specs,
    featured: product.featured,
    promotion: product.promotion,
    views: product.views,
    created_at: product.createdAt,
    is_on_request: product.isOnRequest || false,
  };
}

export function slugify(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

/**
 * Fetch all products from Supabase
 */
export async function getProducts(): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching products:", error);
      return [];
    }

    return (data || []).map(fromSupabaseProduct);
  } catch (err) {
    console.error("Exception fetching products:", err);
    return [];
  }
}

/**
 * Fetch a single product by ID or slug
 */
export async function getProduct(id: string): Promise<Product | undefined> {
  try {
    // Try by ID first
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .or(`id.eq.${id},slug.eq.${id}`)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching product:", error);
      return undefined;
    }

    return data ? fromSupabaseProduct(data) : undefined;
  } catch (err) {
    console.error("Exception fetching product:", err);
    return undefined;
  }
}

/**
 * Create a new product in Supabase
 */
export async function addProduct(
  product: Omit<Product, "id" | "views" | "createdAt" | "slug"> & { slug?: string }
): Promise<Product | null> {
  try {
    const slug = product.slug || slugify(product.name);
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("products")
      .insert([
        {
          name: product.name,
          brand: product.brand,
          price: product.price,
          original_price: product.originalPrice,
          description: product.description,
          condition: product.condition,
          status: product.status,
          battery_percentage: product.battery,
          general_condition: product.generalState,
          slug,
          images: product.images,
          video_url: product.videoUrl,
          specs: product.specs,
          featured: product.featured,
          promotion: product.promotion,
          is_on_request: product.isOnRequest || false,
          views: 0,
          created_at: now,
          updated_at: now,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error creating product:", error);
      return null;
    }

    return data ? fromSupabaseProduct(data) : null;
  } catch (err) {
    console.error("Exception creating product:", err);
    return null;
  }
}

/**
 * Update an existing product in Supabase
 */
export async function updateProduct(
  id: string,
  data: Partial<Product>
): Promise<Product | undefined> {
  try {
    const updateData: any = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.brand !== undefined) updateData.brand = data.brand;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.originalPrice !== undefined) updateData.original_price = data.originalPrice;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.condition !== undefined) updateData.condition = data.condition;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.battery !== undefined) updateData.battery_percentage = data.battery;
    if (data.generalState !== undefined) updateData.general_condition = data.generalState;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.images !== undefined) updateData.images = data.images;
    if (data.videoUrl !== undefined) updateData.video_url = data.videoUrl;
    if (data.specs !== undefined) updateData.specs = data.specs;
    if (data.featured !== undefined) updateData.featured = data.featured;
    if (data.promotion !== undefined) updateData.promotion = data.promotion;
    if (data.views !== undefined) updateData.views = data.views;
    if (data.isOnRequest !== undefined) updateData.is_on_request = data.isOnRequest;

    updateData.updated_at = new Date().toISOString();

    const { data: updated, error } = await supabase
      .from("products")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating product:", error);
      return undefined;
    }

    return updated ? fromSupabaseProduct(updated) : undefined;
  } catch (err) {
    console.error("Exception updating product:", err);
    return undefined;
  }
}

/**
 * Delete a product from Supabase
 */
export async function deleteProduct(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting product:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Exception deleting product:", err);
    return false;
  }
}

/**
 * Increment views counter for a product
 */
export async function incrementViews(id: string): Promise<void> {
  try {
    // Get current views
    const product = await getProduct(id);
    if (!product) return;

    // Update views
    await updateProduct(id, { views: product.views + 1 });
  } catch (err) {
    console.error("Exception incrementing views:", err);
  }
}

// ===== Site Settings =====
export interface BenefitItem { icon: string; title: string; desc: string; }
export interface TrustItem { icon: string; text: string; }
export interface SiteSettings {
  whatsappNumber: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImage: string;
  heroCtaText: string;
  trustItems: TrustItem[];
  whatsappSectionTitle: string;
  whatsappSectionText: string;
  whatsappSectionCta: string;
  benefits: BenefitItem[];
  footerName: string;
  footerDesc: string;
  footerEmail: string;
  footerPhone: string;
  footerInstagram: string;
}

const SETTINGS_KEY = "cellstore_settings";

const defaultSettings: SiteSettings = {
  whatsappNumber: "5566992473929",
  heroTitle: "Celulares seminovos com garantia e qualidade",
  heroSubtitle: "Aparelhos testados, revisados e prontos para uso. Economize até 50% comprando seminovos com segurança.",
  heroImage: "",
  heroCtaText: "Fale conosco",
  trustItems: [
    { icon: "Shield", text: "Garantia de 90 dias" },
    { icon: "CheckCircle", text: "100% Testados" },
    { icon: "Truck", text: "Entrega rápida" },
    { icon: "Headphones", text: "Suporte dedicado" },
  ],
  whatsappSectionTitle: "Encontrou o que procura?",
  whatsappSectionText: "Fale agora com nossa equipe pelo WhatsApp e tire todas as suas dúvidas.",
  whatsappSectionCta: "Falar no WhatsApp",
  benefits: [
    { icon: "Shield", title: "Garantia de 90 dias", desc: "Todos os aparelhos possuem garantia contra defeitos." },
    { icon: "CheckCircle", title: "100% Testados", desc: "Cada celular passa por mais de 30 testes de qualidade." },
    { icon: "Headphones", title: "Suporte dedicado", desc: "Atendimento rápido e personalizado via WhatsApp." },
  ],
  footerName: "Master Cell",
  footerDesc: "Celulares seminovos testados e com garantia. Qualidade e confiança para você.",
  footerEmail: "contato@mastercell.com.br",
  footerPhone: "(66) 99247-3929",
  footerInstagram: "@mastercellbg",
};

export function getSettings(): SiteSettings {
  const stored = localStorage.getItem(SETTINGS_KEY);
  const settings = stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings;

  // Ensure critical contact info is always up to date
  const updatedSettings = {
    ...settings,
    whatsappNumber: defaultSettings.whatsappNumber,
    footerPhone: defaultSettings.footerPhone,
    footerInstagram: defaultSettings.footerInstagram,
  };

  return updatedSettings;
}

export function saveSettings(s: SiteSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  window.dispatchEvent(new Event("settings-updated"));
}

export function getWhatsAppLink(product?: Product): string {
  const s = getSettings();
  const message = product
    ? `Olá, tenho interesse no *${product.name}*, ainda está disponível?`
    : "Olá! Gostaria de mais informações.";
  return `https://wa.me/${s.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

export const BRANDS = ["Apple", "Samsung", "Motorola", "Xiaomi"];
export const CONDITIONS: Product["condition"][] = ["novo", "seminovo", "excelente", "bom", "regular"];
export const STATUSES: ProductStatus[] = ["disponivel", "vendido", "reservado"];

export function conditionLabel(c: Product["condition"]): string {
  const map: Record<string, string> = { novo: "Novo", seminovo: "Seminovo", excelente: "Excelente", bom: "Bom", regular: "Regular" };
  return map[c] || c;
}

export function conditionColor(c: Product["condition"]): string {
  const map: Record<string, string> = { novo: "bg-accent text-accent-foreground", seminovo: "bg-blue-500 text-white", excelente: "bg-emerald-500 text-white", bom: "bg-yellow-500 text-white", regular: "bg-orange-500 text-white" };
  return map[c] || "";
}

export function statusLabel(s: ProductStatus): string {
  return { disponivel: "Disponível", vendido: "Vendido", reservado: "Reservado" }[s];
}

export function statusColor(s: ProductStatus): string {
  return {
    disponivel: "bg-emerald-500 text-white",
    vendido: "bg-muted text-muted-foreground",
    reservado: "bg-amber-500 text-white",
  }[s];
}

// ===== Product Variants (Variações de Produtos) =====

export async function getProductVariants(productId: string): Promise<ProductVariant[]> {
  try {
    const { data, error } = await supabase
      .from("product_variants")
      .select("*")
      .eq("product_id", productId)
      .order("order_index", { ascending: true });

    if (error) {
      console.error("Error fetching variants:", error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("Exception fetching variants:", err);
    return [];
  }
}

export async function addProductVariant(
  productId: string,
  variant: Omit<ProductVariant, "id" | "product_id" | "created_at" | "updated_at">
): Promise<ProductVariant | null> {
  try {
    const { data, error } = await supabase
      .from("product_variants")
      .insert([
        {
          product_id: productId,
          sku: variant.sku,
          color: variant.color || null,
          storage: variant.storage || null,
          ram: variant.ram || null,
          condition: variant.condition,
          specific_defects: variant.specific_defects || null,
          price: variant.price,
          original_price: variant.original_price || null,
          stock_quantity: variant.stock_quantity,
          status: variant.status,
          order_index: variant.order_index,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error creating variant:", error);
      return null;
    }

    return data || null;
  } catch (err) {
    console.error("Exception creating variant:", err);
    return null;
  }
}

export async function updateProductVariant(
  variantId: string,
  data: Partial<ProductVariant>
): Promise<ProductVariant | undefined> {
  try {
    const updateData: any = {};

    if (data.sku !== undefined) updateData.sku = data.sku;
    if (data.color !== undefined) updateData.color = data.color;
    if (data.storage !== undefined) updateData.storage = data.storage;
    if (data.ram !== undefined) updateData.ram = data.ram;
    if (data.condition !== undefined) updateData.condition = data.condition;
    if (data.specific_defects !== undefined) updateData.specific_defects = data.specific_defects;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.original_price !== undefined) updateData.original_price = data.original_price;
    if (data.stock_quantity !== undefined) updateData.stock_quantity = data.stock_quantity;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.order_index !== undefined) updateData.order_index = data.order_index;

    const { data: updated, error } = await supabase
      .from("product_variants")
      .update(updateData)
      .eq("id", variantId)
      .select()
      .single();

    if (error) {
      console.error("Error updating variant:", error);
      return undefined;
    }

    return updated || undefined;
  } catch (err) {
    console.error("Exception updating variant:", err);
    return undefined;
  }
}

export async function deleteProductVariant(variantId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("product_variants")
      .delete()
      .eq("id", variantId);

    if (error) {
      console.error("Error deleting variant:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Exception deleting variant:", err);
    return false;
  }
}
