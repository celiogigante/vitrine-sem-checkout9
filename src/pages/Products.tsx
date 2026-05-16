import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { SlidersHorizontal, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ProductCard from "@/components/ProductCard";
import SearchAutoComplete from "@/components/SearchAutoComplete";
import { conditionLabel } from "@/lib/productHelpers";
import { getProducts, type Product } from "@/lib/products";
import { supabase } from "@/lib/supabase";

const CONDITIONS = ["novo", "seminovo", "excelente", "bom", "regular"] as const;

const Products = () => {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [brand, setBrand] = useState(searchParams.get("brand") || "all");
  const [condition, setCondition] = useState("all");
  const [sort, setSort] = useState("recent");
  const [mobileColumns, setMobileColumns] = useState<1 | 2>(1);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    setSearch(searchParams.get("search") || "");
    setBrand(searchParams.get("brand") || "all");
    setCurrentPage(1);
  }, [searchParams]);

  const loadProducts = async () => {
    try {
      const productList = await getProducts();
      setProducts(productList);

      // Load brands from brands table
      const { data: brandsData } = await supabase
        .from("brands")
        .select("name")
        .eq("is_visible", true)
        .order("order_index");

      if (brandsData) {
        setBrands(brandsData.map(b => b.name));
      }
    } catch (err) {
      console.error("Erro ao carregar produtos:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = useMemo(() => {
    let list = products.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.brand.toLowerCase().includes(search.toLowerCase());
      const matchBrand = brand === "all" || p.brand === brand;
      const matchCondition = condition === "all" || p.condition === condition;
      return matchSearch && matchBrand && matchCondition;
    });

    if (sort === "price-asc") list.sort((a, b) => a.price - b.price);
    else if (sort === "price-desc") list.sort((a, b) => b.price - a.price);
    else if (sort === "views") list.sort((a, b) => b.views - a.views);

    // Vendidos sempre por último
    list.sort((a, b) => (a.status === "vendido" ? 1 : 0) - (b.status === "vendido" ? 1 : 0));

    return list;
  }, [products, search, brand, condition, sort]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedList = filtered.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-white">Nossos celulares</h1>

      {/* Filters */}
      <div className="flex flex-col gap-3 mb-8">
        <div className="flex flex-col md:flex-row gap-3">
          <SearchAutoComplete
            products={products}
            value={search}
            onChange={setSearch}
            placeholder="Buscar celular..."
          />
          <Select value={brand} onValueChange={setBrand}>
            <SelectTrigger className="w-full md:w-40"><SelectValue placeholder="Marca" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as marcas</SelectItem>
              {brands.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={condition} onValueChange={setCondition}>
            <SelectTrigger className="w-full md:w-40"><SelectValue placeholder="Condição" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas condições</SelectItem>
              {CONDITIONS.map(c => <SelectItem key={c} value={c}>{conditionLabel(c)}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-full md:w-44"><SlidersHorizontal className="mr-2 h-4 w-4" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Mais recentes</SelectItem>
              <SelectItem value="price-asc">Menor preço</SelectItem>
              <SelectItem value="price-desc">Maior preço</SelectItem>
              <SelectItem value="views">Mais vistos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Mobile columns toggle - Only visible on mobile */}
        <div className="md:hidden flex gap-2">
          <button
            onClick={() => setMobileColumns(2)}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex-1 ${
              mobileColumns === 2
                ? "bg-white text-black"
                : "bg-gray-700 text-white hover:bg-gray-600"
            }`}
          >
            2 colunas
          </button>
          <button
            onClick={() => setMobileColumns(1)}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex-1 ${
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
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-lg">Nenhum produto encontrado.</p>
          <p className="text-sm">Tente ajustar os filtros.</p>
        </div>
      ) : (
        <div>
          <p className="text-sm text-muted-foreground mb-4">
            {filtered.length} produto{filtered.length !== 1 ? "s" : ""} encontrado{filtered.length !== 1 ? "s" : ""} - Página {currentPage} de {totalPages}
          </p>
          <div className={`grid ${mobileColumns === 1 ? "grid-cols-1" : "grid-cols-2"} md:grid-cols-4 gap-4`}>
            {paginatedList.map(p => <ProductCard key={p.id} product={p} />)}
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
              <div className="flex gap-1 flex-wrap justify-center">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => {
                      setCurrentPage(page);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
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
                onClick={() => {
                  setCurrentPage(Math.min(totalPages, currentPage + 1));
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                disabled={currentPage === totalPages}
                className="px-3 py-2 rounded-md bg-gray-800 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700"
              >
                Próxima →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Products;
