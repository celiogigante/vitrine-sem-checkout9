import { Link } from "react-router-dom";
import {
  Shield,
  CheckCircle,
  Headphones,
  ArrowRight,
  MessageCircle,
  Truck,
  Star,
  Award,
  Zap,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/ProductCard";
import HeroCarousel from "@/components/HeroCarousel";
import { useEffect, useMemo, useState } from "react";
import { supabase, type Product } from "@/lib/supabase";
import { getSettings } from "@/lib/products";

const ICONS: Record<string, any> = {
  Shield,
  CheckCircle,
  Headphones,
  Truck,
  Star,
  Award,
  Zap
};

interface HeroConfig {
  hero_name: string;
  hero_image_url: string | null;
  hero_logo_url: string | null;
  carousel_title: string;
}

const transformProduct = (product: any): Product => {
  return {
    id: product.id,
    name: product.name,
    brand: product.brand,
    price: product.price,
    originalPrice: product.original_price,
    description: product.description,
    condition: product.condition,
    status: product.status,
    battery: product.battery_percentage,
    generalState: product.general_condition,
    images: product.images || [],
    videoUrl: product.video_url,
    specs: product.specs || {},
    featured: product.featured,
    promotion: product.promotion,
    isOnRequest: product.is_on_request,
    views: product.views || 0,
    createdAt: product.created_at,
  };
};

const Home = () => {
  const [s, setS] = useState(getSettings());
  const [brandFilter, setBrandFilter] = useState<string>("all");
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [heroConfig, setHeroConfig] = useState<HeroConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mobileColumns, setMobileColumns] = useState<1 | 2>(1);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 9;

  useEffect(() => {
    const h = () => setS(getSettings());
    window.addEventListener("settings-updated", h);
    return () => window.removeEventListener("settings-updated", h);
  }, []);

  useEffect(() => {
    // Diagnostic: Check Supabase connectivity
    console.log("Home component mounted, testing Supabase connection...");

    // Test basic fetch to Supabase
    const testUrl = import.meta.env.VITE_SUPABASE_URL;
    if (testUrl) {
      fetch(`${testUrl}/rest/v1/`, {
        headers: {
          "apikey": import.meta.env.VITE_SUPABASE_ANON_KEY || "",
        }
      })
        .then(r => {
          console.log("Supabase connectivity test:", r.status);
        })
        .catch(err => {
          console.error("Supabase connectivity test failed:", err);
        });
    }

    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setLoadError(null);

      // Load products with retry logic
      let productsData = null;
      let productsError = null;

      try {
        const response = await supabase
          .from("products")
          .select("*")
          .order("created_at", { ascending: false });
        productsData = response.data;
        productsError = response.error;
      } catch (fetchErr) {
        console.error("Network error loading products:", fetchErr);
        productsError = fetchErr as any;
      }

      if (productsError) {
        console.error("Erro ao carregar produtos:", productsError);
        setLoadError("Não foi possível carregar os produtos. Verifique sua conexão com a internet ou tente novamente em alguns momentos.");
        setProducts([]);
        setBrands([]);
        return;
      }

      const productList = (productsData || []).map(transformProduct);
      setProducts(productList);

      // Load brands from brands table
      try {
        const { data: brandsData, error: brandsError } = await supabase
          .from("brands")
          .select("name")
          .eq("is_visible", true)
          .order("order_index");

        if (brandsError) {
          // Fallback: extract from products if brands table doesn't exist yet
          const uniqueBrands = Array.from(new Set(productList.map(p => p.brand)))
            .filter(Boolean)
            .sort();
          setBrands(uniqueBrands);
        } else {
          const uniqueBrands = (brandsData || []).map(b => b.name).sort();
          setBrands(uniqueBrands);
        }
      } catch (err) {
        console.error("Erro ao carregar brands:", err);
        // Fallback to extracting from products
        const uniqueBrands = Array.from(new Set(productList.map(p => p.brand)))
          .filter(Boolean)
          .sort();
        setBrands(uniqueBrands);
      }

      // Load hero config
      try {
        const { data: configData, error: configError } = await supabase
          .from("hero_config")
          .select("*")
          .limit(1)
          .single();

        if (configError && configError.code !== "PGRST116") {
          console.error("Erro ao carregar config do hero:", configError);
        }

        if (configData) {
          setHeroConfig(configData as HeroConfig);
        }
      } catch (err) {
        console.error("Erro ao carregar hero config:", err);
      }
    } catch (err) {
      console.error("Erro inesperado ao carregar dados:", err);
      setLoadError("Erro ao carregar dados. Verifique sua conexão com a internet.");
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = useMemo(
    () =>
      brandFilter === "all"
        ? products
        : products.filter((p) => p.brand === brandFilter),
    [products, brandFilter]
  );

  const featured = filtered.filter((p) => p.featured).slice(0, 4);
  const vitrine = filtered.filter((p) => !p.featured);
  const totalPages = Math.ceil(vitrine.length / ITEMS_PER_PAGE);
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const list = vitrine.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  return (
    <div>
      {/* Error Banner */}
      {loadError && (
        <div className="bg-red-900/80 text-red-100 p-4">
          <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <p>{loadError}</p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => loadData()}
              className="whitespace-nowrap"
            >
              Tentar Novamente
            </Button>
          </div>
        </div>
      )}

      {/* Hero */}
      <section className="relative overflow-hidden text-white bg-black pt-6" style={{ minHeight: "576px" }}>
        <div className="container mx-auto px-4 py-0 relative h-full">
          <div className="grid grid-cols-1 md:grid-cols-10 gap-8 h-full items-center">
            {/* Left side - Logo/Image (30%) */}
            <div className="flex items-center justify-center py-0 md:col-span-3">
              <img
                src={heroConfig?.hero_logo_url || heroConfig?.hero_image_url || "https://uuwpzxpsvltqhrtadirk.supabase.co/storage/v1/object/public/products/webp%20logo.webp"}
                alt={heroConfig?.hero_name || "Logo"}
                className="h-auto w-full max-w-2xl rounded-lg shadow-xl"
              />
            </div>

            {/* Right side - Carousel (70%) */}
            <div className="flex flex-col items-center justify-center py-0 md:col-span-7">
              <div className="w-full mb-6">
                <h2 className="text-2xl font-bold text-center md:text-left">
                  {heroConfig?.carousel_title || "Promoções"}
                </h2>
              </div>
              <div className="w-full h-96 md:h-[461px] bg-white rounded-lg overflow-hidden shadow-2xl">
                <HeroCarousel />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured */}
      <section className="container mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-white">Em destaque</h2>

          {/* Mobile columns toggle - Only visible on mobile */}
          <div className="md:hidden flex gap-0">
            <button
              onClick={() => setMobileColumns(2)}
              className={`px-3 py-1 rounded-l-md text-sm font-medium transition-colors ${
                mobileColumns === 2
                  ? "bg-white text-black"
                  : "bg-gray-700 text-white hover:bg-gray-600"
              }`}
            >
              2 colunas
            </button>
            <button
              onClick={() => setMobileColumns(1)}
              className={`px-3 py-1 rounded-r-md text-sm font-medium transition-colors ${
                mobileColumns === 1
                  ? "bg-white text-black"
                  : "bg-gray-700 text-white hover:bg-gray-600"
              }`}
            >
              1 coluna
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin" />
          </div>
        ) : (
          <div className={`grid ${mobileColumns === 1 ? "grid-cols-1" : "grid-cols-2"} md:grid-cols-4 gap-4`} style={{ gridAutoRows: "1fr" }}>
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      {/* Vitrine */}
      <section className="container mx-auto px-4 pb-16">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-white">Vitrine</h2>

          {/* Mobile columns toggle - Only visible on mobile */}
          <div className="md:hidden flex gap-0">
            <button
              onClick={() => setMobileColumns(2)}
              className={`px-3 py-1 rounded-l-md text-sm font-medium transition-colors ${
                mobileColumns === 2
                  ? "bg-white text-black"
                  : "bg-gray-700 text-white hover:bg-gray-600"
              }`}
            >
              2 colunas
            </button>
            <button
              onClick={() => setMobileColumns(1)}
              className={`px-3 py-1 rounded-r-md text-sm font-medium transition-colors ${
                mobileColumns === 1
                  ? "bg-white text-black"
                  : "bg-gray-700 text-white hover:bg-gray-600"
              }`}
            >
              1 coluna
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin" />
          </div>
        ) : (
          <>
            <div className={`grid ${mobileColumns === 1 ? "grid-cols-1" : "grid-cols-2"} md:grid-cols-4 gap-4`} style={{ gridAutoRows: "1fr" }}>
              {list.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 rounded-md bg-gray-800 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700"
                >
                  ← Anterior
                </button>
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 rounded-md transition-colors ${
                        currentPage === page
                          ? "bg-yellow-400 text-black font-medium"
                          : "bg-gray-800 text-white hover:bg-gray-700"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 rounded-md bg-gray-800 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700"
                >
                  Próxima →
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* WhatsApp CTA */}
      <section className="text-center py-16">
        <h2 className="text-3xl font-bold text-white">
          {s.whatsappSectionTitle}
        </h2>
        <p className="text-white">{s.whatsappSectionText}</p>

        <Button
          size="lg"
          onClick={() => window.open(`https://wa.me/${s.whatsappNumber}`, "_blank")}
        >
          <MessageCircle className="mr-2" />
          {s.whatsappSectionCta}
        </Button>
      </section>
    </div>
  );
};

export default Home;
