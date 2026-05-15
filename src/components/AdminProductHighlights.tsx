import { useState, useEffect, useRef } from "react";
import { supabase, Product } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

interface ProductHighlight {
  id: string;
  product_id: string;
  order_index: number;
}

export default function AdminProductHighlights() {
  const { toast } = useToast();
  const [highlights, setHighlights] = useState<ProductHighlight[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [highlightedProductIds, setHighlightedProductIds] = useState<Set<string>>(
    new Set()
  );
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    if (showSuggestions) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSuggestions]);

  const loadData = async () => {
    try {
      setIsLoading(true);

      // Load highlights
      const { data: highlightsData, error: highlightsError } = await supabase
        .from("product_highlights")
        .select("*")
        .order("order_index");

      if (highlightsError) throw highlightsError;

      const highlightsList = (highlightsData || []) as ProductHighlight[];
      setHighlights(highlightsList);
      setHighlightedProductIds(
        new Set(highlightsList.map((h) => h.product_id))
      );

      // Load all products
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (productsError) throw productsError;

      setProducts((productsData || []) as Product[]);
    } catch (err) {
      console.error("Error loading data:", err);
      toast({
        title: "Erro ao carregar dados",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddHighlight = async () => {
    if (selectedProductIds.size === 0) {
      toast({
        title: "Selecione pelo menos um produto",
        variant: "destructive",
      });
      return;
    }

    try {
      const count = selectedProductIds.size;
      const maxOrder = highlights.length > 0 ? Math.max(...highlights.map((h) => h.order_index)) : 0;

      const newHighlights = Array.from(selectedProductIds).map((productId, index) => ({
        product_id: productId,
        order_index: maxOrder + index + 1,
      }));

      const { error } = await supabase.from("product_highlights").insert(newHighlights);

      if (error) throw error;

      setSelectedProductIds(new Set());
      setSearchQuery("");
      loadData();
      toast({ title: `${count} produto(s) adicionado(s) aos destaques!` });
    } catch (err) {
      console.error("Error adding highlight:", err);
      toast({
        title: "Erro ao adicionar destaque",
        variant: "destructive",
      });
    }
  };

  const handleRemoveHighlight = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover este destaque?")) return;

    try {
      const { error } = await supabase
        .from("product_highlights")
        .delete()
        .eq("id", id);

      if (error) throw error;

      loadData();
      toast({ title: "Destaque removido" });
    } catch (err) {
      console.error("Error removing highlight:", err);
      toast({
        title: "Erro ao remover destaque",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  const getProductName = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    return product ? product.name : "Produto não encontrado";
  };

  const availableProducts = products.filter(
    (p) => !highlightedProductIds.has(p.id)
  );

  const filteredProducts = availableProducts.filter((p) => {
    const query = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(query) ||
      (p.brand && p.brand.toLowerCase().includes(query)) ||
      (p.model && p.model.toLowerCase().includes(query))
    );
  });

  return (
    <div className="space-y-6">
      {/* Add highlight */}
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <h2 className="font-semibold text-lg">Adicionar Destaque</h2>
        <p className="text-sm text-muted-foreground">
          Pesquise um produto para adicionar ao carrossel de destaques do hero.
        </p>
        <div className="relative" ref={dropdownRef}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
          <Input
            placeholder="Pesquisar por nome, marca ou modelo..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            className="pl-9"
          />

          {/* Suggestions dropdown */}
          {showSuggestions && availableProducts.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 border rounded-lg bg-card shadow-lg z-50">
              <div className="max-h-64 overflow-y-auto">
                {filteredProducts.length === 0 ? (
                  <div className="p-3 text-sm text-muted-foreground text-center">
                    Nenhum produto encontrado
                  </div>
                ) : (
                  filteredProducts.map((p) => (
                    <label
                      key={p.id}
                      className="flex items-start gap-3 px-3 py-2 hover:bg-secondary/50 border-b last:border-0 transition-colors cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedProductIds.has(p.id)}
                        onCheckedChange={(checked) => {
                          const newSet = new Set(selectedProductIds);
                          if (checked) {
                            newSet.add(p.id);
                          } else {
                            newSet.delete(p.id);
                          }
                          setSelectedProductIds(newSet);
                        }}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{p.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {p.brand} • R$ {p.price.toLocaleString("pt-BR")}
                        </div>
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>
          )}

          {showSuggestions && availableProducts.length === 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 border rounded-lg bg-card shadow-lg z-50">
              <div className="p-3 text-sm text-muted-foreground text-center">
                Todos os produtos já são destaques
              </div>
            </div>
          )}
        </div>

        {selectedProductIds.size > 0 && (
          <div className="bg-secondary/50 p-3 rounded-lg">
            <div className="text-sm font-medium">
              {selectedProductIds.size} produto(s) selecionado(s)
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Clique em "Adicionar Selecionados" para confirmar
            </div>
          </div>
        )}
      </div>

      {/* Fixed button */}
      <div className="fixed bottom-6 right-6 z-40">
        <Button
          onClick={handleAddHighlight}
          disabled={selectedProductIds.size === 0}
          size="lg"
          className="shadow-lg"
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar ({selectedProductIds.size})
        </Button>
      </div>

      {/* Highlights list */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-secondary">
              <tr>
                <th className="text-left p-3 font-medium">Produto</th>
                <th className="text-left p-3 font-medium hidden md:table-cell">
                  Preço
                </th>
                <th className="text-left p-3 font-medium hidden md:table-cell">
                  Marca
                </th>
                <th className="text-right p-3 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {highlights.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-muted-foreground">
                    Nenhum produto em destaque
                  </td>
                </tr>
              ) : (
                highlights.map((highlight) => {
                  const product = products.find(
                    (p) => p.id === highlight.product_id
                  );
                  return (
                    <tr
                      key={highlight.id}
                      className="border-b last:border-0 hover:bg-secondary/50"
                    >
                      <td className="p-3 font-medium">
                        {product?.name || "Produto não encontrado"}
                      </td>
                      <td className="p-3 hidden md:table-cell text-muted-foreground">
                        R$ {product?.price.toLocaleString("pt-BR") || "—"}
                      </td>
                      <td className="p-3 hidden md:table-cell text-muted-foreground">
                        {product?.brand || "—"}
                      </td>
                      <td className="p-3">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleRemoveHighlight(highlight.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
