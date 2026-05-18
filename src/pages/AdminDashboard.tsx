import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/authContext";
import { supabase } from "@/lib/supabase";
import { getProducts, updateProduct, deleteProduct, addProduct, BRANDS, getModels, type Product, type Model } from "@/lib/products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ImageUpload } from "@/components/ImageUpload";
import { Insights } from "@/components/Insights";
import AdminMenuManager from "@/components/AdminMenuManager";
import AdminHeroConfig from "@/components/AdminHeroConfig";
import AdminProductHighlights from "@/components/AdminProductHighlights";
import AdminBrandsManager from "@/components/AdminBrandsManager";
import AdminModelManager from "@/components/AdminModelManager";
import AdminVariantManager from "@/components/AdminVariantManager";
import ModelSelector from "@/components/ModelSelector";
import { Pencil, Trash2, Plus, LogOut, Loader2, BarChart3, Package, Menu, Image, Star, Tag, Database, Power, Grid2x2, Layers } from "lucide-react";
import MigrationHelper from "@/components/MigrationHelper";
import AdminCardFormatManager from "@/components/AdminCardFormatManager";
import { useToast } from "@/hooks/use-toast";

const CONDITIONS = ["novo", "seminovo", "excelente", "bom", "regular"];

const conditionLabel = (c: string) => {
  const map: Record<string, string> = {
    novo: "Novo",
    seminovo: "Seminovo",
    excelente: "Excelente",
    bom: "Bom",
    regular: "Regular",
  };
  return map[c] || c;
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, session } = useAuth();
  const { toast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [modelViewsMap, setModelViewsMap] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"insights" | "produtos" | "menu" | "marcas" | "modelos" | "hero" | "destaques" | "formato" | "migracao">("insights");
  const [productsPage, setProductsPage] = useState(1);
  const [itemsPerPage] = useState(50);

  // Filtros
  const [filterSearch, setFilterSearch] = useState("");
  const [filterBrand, setFilterBrand] = useState<string>("all");
  const [filterModel, setFilterModel] = useState<string>("all");
  const [filterCondition, setFilterCondition] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const [form, setForm] = useState({
    name: "",
    brand: "Apple",
    model_id: undefined as string | undefined,
    price: 0,
    original_price: undefined as number | undefined,
    description: "",
    condition: "seminovo",
    status: "disponivel" as "disponivel" | "vendido" | "reservado",
    battery_percentage: undefined as number | undefined,
    general_condition: "",
    images: [] as string[],
    video_url: "",
    specs: {} as Record<string, string>,
    featured: false,
    promotion: false,
    is_on_request: false,
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const productList = await getProducts();
      setProducts(productList);

      // Load brands from brands table
      const { data: brandsData } = await supabase
        .from("brands")
        .select("name")
        .order("order_index");

      if (brandsData && brandsData.length > 0) {
        setBrands(brandsData.map(b => b.name));
      } else {
        setBrands(BRANDS);
      }

      // Load models
      const modelsList = await getModels();
      setModels(modelsList);

      // Create a map of model views
      const viewsMap: Record<string, number> = {};
      modelsList.forEach(model => {
        viewsMap[model.id] = model.views;
      });
      setModelViewsMap(viewsMap);
    } catch (err) {
      console.error("Error loading products:", err);
      toast({
        title: "Erro ao carregar produtos",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.price) {
      toast({
        title: "Preencha nome e preço",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const productData = {
        name: form.name,
        brand: form.brand,
        modelId: form.model_id,
        price: form.price,
        originalPrice: form.original_price || undefined,
        description: form.description,
        condition: form.condition,
        status: form.status,
        battery: form.battery_percentage || undefined,
        generalState: form.general_condition || "",
        images: form.images.filter((i) => i.trim()),
        videoUrl: form.video_url || undefined,
        specs: form.specs,
        featured: form.featured,
        promotion: form.promotion,
        isOnRequest: form.is_on_request,
      };

      if (editing) {
        await updateProduct(editing, productData);
        toast({ title: "Produto atualizado!" });
      } else {
        await addProduct(productData);
        toast({ title: "Produto adicionado!" });
      }

      await loadProducts();
      resetForm();
    } catch (err) {
      console.error("Error saving product:", err);
      toast({
        title: "Erro ao salvar produto",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = async (product: Product) => {
    setForm({
      name: product.name,
      brand: product.brand,
      model_id: product.modelId,
      price: product.price,
      original_price: product.originalPrice || undefined,
      description: product.description,
      condition: product.condition,
      status: product.status || "disponivel",
      battery_percentage: product.battery || undefined,
      general_condition: product.generalState || "",
      images: product.images && product.images.length ? product.images : [],
      video_url: product.videoUrl || "",
      specs: product.specs,
      featured: product.featured,
      promotion: product.promotion,
      is_on_request: product.isOnRequest || false,
    });
    setEditing(product.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja deletar este produto?")) return;

    try {
      const success = await deleteProduct(id);
      if (success) {
        setProducts(products.filter((p) => p.id !== id));
        toast({ title: "Produto removido" });
      } else {
        toast({
          title: "Erro ao deletar produto",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Error deleting product:", err);
      toast({
        title: "Erro ao deletar produto",
        variant: "destructive",
      });
    }
  };

  const handleToggleStatus = async (product: Product) => {
    const newStatus = product.status === "disponivel" ? "vendido" : "disponivel";
    try {
      await updateProduct(product.id, { status: newStatus });
      setProducts(
        products.map((p) =>
          p.id === product.id ? { ...p, status: newStatus } : p
        )
      );
      toast({
        title: newStatus === "vendido" ? "Marcado como Vendido" : "Marcado como Disponível",
      });
    } catch (err) {
      console.error("Error toggling status:", err);
      toast({
        title: "Erro ao atualizar status",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setForm({
      name: "",
      brand: "Apple",
      model_id: undefined,
      price: 0,
      original_price: undefined,
      description: "",
      condition: "seminovo",
      status: "disponivel",
      battery_percentage: undefined,
      general_condition: "",
      images: [],
      video_url: "",
      specs: {},
      featured: false,
      promotion: false,
      is_on_request: false,
    });
    setEditing(null);
    setShowForm(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Painel Admin</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Bem-vindo, {user?.email}
          </p>
        </div>
        <div className="flex gap-2">
          {activeTab === "produtos" && (
            <Button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              size="sm"
            >
              <Plus className="mr-1 h-4 w-4" /> Novo produto
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="mr-1 h-4 w-4" /> Sair
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b overflow-x-auto pb-0">
        <button
          onClick={() => setActiveTab("insights")}
          className={`flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "insights"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          Insights
        </button>
        <button
          onClick={() => setActiveTab("produtos")}
          className={`flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "produtos"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Package className="h-4 w-4" />
          Produtos
        </button>
        <button
          onClick={() => setActiveTab("menu")}
          className={`flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "menu"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Menu className="h-4 w-4" />
          Menu
        </button>
        <button
          onClick={() => setActiveTab("marcas")}
          className={`flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "marcas"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Tag className="h-4 w-4" />
          Marcas
        </button>
        <button
          onClick={() => setActiveTab("modelos")}
          className={`flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "modelos"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Grid2x2 className="h-4 w-4" />
          Modelos
        </button>
        <button
          onClick={() => setActiveTab("hero")}
          className={`flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "hero"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Image className="h-4 w-4" />
          Hero
        </button>
        <button
          onClick={() => setActiveTab("destaques")}
          className={`flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "destaques"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Star className="h-4 w-4" />
          Destaques
        </button>
        <button
          onClick={() => setActiveTab("formato")}
          className={`flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "formato"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Layers className="h-4 w-4" />
          Formato
        </button>
        <button
          onClick={() => setActiveTab("migracao")}
          className={`flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "migracao"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Database className="h-4 w-4" />
          Migração
        </button>
      </div>

      {/* Insights Tab */}
      {activeTab === "insights" && (
        <div className="mb-8">
          <Insights />
        </div>
      )}

      {/* Menu Tab */}
      {activeTab === "menu" && (
        <div className="mb-8">
          <AdminMenuManager />
        </div>
      )}

      {/* Marcas Tab */}
      {activeTab === "marcas" && (
        <div className="mb-8">
          <AdminBrandsManager />
        </div>
      )}

      {/* Modelos Tab */}
      {activeTab === "modelos" && (
        <div className="mb-8">
          <AdminModelManager />
        </div>
      )}

      {/* Hero Tab */}
      {activeTab === "hero" && (
        <div className="mb-8">
          <AdminHeroConfig />
        </div>
      )}

      {/* Destaques Tab */}
      {activeTab === "destaques" && (
        <div className="mb-8">
          <AdminProductHighlights />
        </div>
      )}

      {/* Formato Tab */}
      {activeTab === "formato" && (
        <div className="mb-8">
          <AdminCardFormatManager />
        </div>
      )}

      {/* Migração Tab */}
      {activeTab === "migracao" && (
        <div className="mb-8">
          <MigrationHelper />
        </div>
      )}

      {/* Products Tab */}
      {activeTab === "produtos" && (
        <>
          {/* Filters */}
          <div className="mb-6 rounded-lg border bg-card p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Filtros</h3>
              {(filterSearch || filterBrand !== "all" || filterModel !== "all" || filterCondition !== "all" || filterStatus !== "all") && (
                <button
                  onClick={() => {
                    setFilterSearch("");
                    setFilterBrand("all");
                    setFilterModel("all");
                    setFilterCondition("all");
                    setFilterStatus("all");
                    setProductsPage(1);
                  }}
                  className="text-xs text-primary hover:underline"
                >
                  Limpar filtros
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
              <Input
                placeholder="Buscar nome..."
                value={filterSearch}
                onChange={(e) => {
                  setFilterSearch(e.target.value);
                  setProductsPage(1);
                }}
                className="text-sm"
              />
              <Select value={filterBrand} onValueChange={(v) => {
                setFilterBrand(v);
                setProductsPage(1);
              }}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Marca" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas marcas</SelectItem>
                  {brands.map((b) => (
                    <SelectItem key={b} value={b}>{b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterModel} onValueChange={(v) => {
                setFilterModel(v);
                setProductsPage(1);
              }}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Modelo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos modelos</SelectItem>
                  {models.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterCondition} onValueChange={(v) => {
                setFilterCondition(v);
                setProductsPage(1);
              }}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Condição" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {CONDITIONS.map((c) => (
                    <SelectItem key={c} value={c}>{conditionLabel(c)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={(v) => {
                setFilterStatus(v);
                setProductsPage(1);
              }}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="disponivel">Disponível</SelectItem>
                  <SelectItem value="vendido">Vendido</SelectItem>
                  <SelectItem value="reservado">Reservado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {showForm && (
            <div className="mb-8 rounded-xl border bg-card p-6 space-y-6">
              <h2 className="font-semibold text-lg">
                {editing ? "Editar produto" : "Novo produto"}
              </h2>

              {/* Básico */}
              <div className="space-y-2">
                <h3 className="font-medium text-sm text-muted-foreground">
                  {form.name || "Título do anúncio"}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    placeholder="Nome do produto"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                  <Select
                    value={form.brand}
                    onValueChange={(v) => {
                      setForm({ ...form, brand: v, model_id: undefined });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione marca" />
                    </SelectTrigger>
                    <SelectContent>
                      {brands.map((b) => (
                        <SelectItem key={b} value={b}>
                          {b}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <ModelSelector
                    value={form.model_id}
                    onSelect={(modelId) => setForm({ ...form, model_id: modelId || undefined })}
                    brand={form.brand}
                  />
                </div>
              </div>

              {/* Preços */}
              <div className="space-y-2">
                <h3 className="font-medium text-sm text-muted-foreground">Preços</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    type="number"
                    placeholder="Preço (R$)"
                    value={form.price || ""}
                    onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                  />
                  <Input
                    type="number"
                    placeholder="Preço original (opcional)"
                    value={form.original_price || ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        original_price: Number(e.target.value) || undefined,
                      })
                    }
                  />
                </div>
              </div>

              {/* Status e Condição */}
              <div className="space-y-2">
                <h3 className="font-medium text-sm text-muted-foreground">Status e Condição</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as any })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="disponivel">Disponível</SelectItem>
                      <SelectItem value="vendido">Vendido</SelectItem>
                      <SelectItem value="reservado">Reservado</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={form.condition} onValueChange={(v) => setForm({ ...form, condition: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Condição" />
                    </SelectTrigger>
                    <SelectContent>
                      {CONDITIONS.map((c) => (
                        <SelectItem key={c} value={c}>
                          {conditionLabel(c)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    placeholder="Bateria (%)"
                    min="0"
                    max="100"
                    value={form.battery_percentage || ""}
                    onChange={(e) => setForm({ ...form, battery_percentage: Number(e.target.value) || undefined })}
                  />
                </div>
                <Textarea
                  placeholder="Estado geral do produto (ex: Sem arranhões, Vidro levemente marcado)"
                  value={form.general_condition}
                  onChange={(e) => setForm({ ...form, general_condition: e.target.value })}
                  className="min-h-16"
                />
              </div>

              {/* Mídia */}
              <div className="space-y-2">
                <h3 className="font-medium text-sm text-muted-foreground">Imagens e Vídeo</h3>
                <ImageUpload
                  onImagesUrls={(urls) => setForm({ ...form, images: urls })}
                  onVideoUrl={(url) => setForm({ ...form, video_url: url })}
                  currentImages={form.images}
                  currentVideo={form.video_url}
                />
              </div>

              {/* Descrição */}
              <div className="space-y-2">
                <h3 className="font-medium text-sm text-muted-foreground">Descrição</h3>
                <Textarea
                  placeholder="Descrição detalhada do produto"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="min-h-24"
                />
              </div>

              {/* Especificações */}
              <div className="space-y-2">
                <h3 className="font-medium text-sm text-muted-foreground">Especificações</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {["RAM", "CHIP", "TELA", "BATERIA", "CÂMERA", "ARMAZENAMENTO"].map((key) => (
                    <Input
                      key={key}
                      placeholder={key}
                      value={form.specs[key] || ""}
                      onChange={(e) => setForm({ ...form, specs: { ...form.specs, [key]: e.target.value } })}
                    />
                  ))}
                </div>
              </div>

              {/* Flags */}
              <div className="space-y-2">
                <h3 className="font-medium text-sm text-muted-foreground">Opções</h3>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.featured}
                      onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                    />
                    Destaque
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.promotion}
                      onChange={(e) => setForm({ ...form, promotion: e.target.checked })}
                    />
                    Promoção
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.is_on_request}
                      onChange={(e) => setForm({ ...form, is_on_request: e.target.checked })}
                    />
                    Por Pedido (até 3 dias úteis)
                  </label>
                </div>
              </div>

              {/* Botões */}
              <div className="flex gap-2 pt-4">
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : editing ? (
                    "Salvar Alterações"
                  ) : (
                    "Adicionar Produto"
                  )}
                </Button>
                <Button variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {/* Product list */}
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-secondary">
                  <tr>
                    <th className="text-left p-3 font-medium">Produto</th>
                    <th className="text-left p-3 font-medium hidden md:table-cell">
                      Marca
                    </th>
                    <th className="text-left p-3 font-medium">Preço</th>
                    <th className="text-left p-3 font-medium hidden md:table-cell">
                      Condição
                    </th>
                    <th className="text-left p-3 font-medium hidden md:table-cell">
                      Status
                    </th>
                    <th className="text-left p-3 font-medium hidden md:table-cell">
                      Views
                    </th>
                    <th className="text-right p-3 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const filtered = products.filter(p => {
                      const matchSearch = filterSearch === "" || p.name.toLowerCase().includes(filterSearch.toLowerCase()) || p.brand.toLowerCase().includes(filterSearch.toLowerCase());
                      const matchBrand = filterBrand === "all" || p.brand === filterBrand;
                      const matchModel = filterModel === "all" || p.modelId === filterModel;
                      const matchCondition = filterCondition === "all" || p.condition === filterCondition;
                      const matchStatus = filterStatus === "all" || p.status === filterStatus;
                      return matchSearch && matchBrand && matchModel && matchCondition && matchStatus;
                    });

                    if (filtered.length === 0) {
                      return (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-muted-foreground">
                            {products.length === 0 ? "Nenhum produto cadastrado" : "Nenhum produto encontrado com esses filtros"}
                          </td>
                        </tr>
                      );
                    }

                    return filtered.slice((productsPage - 1) * itemsPerPage, productsPage * itemsPerPage).map((p) => (
                      <tr
                        key={p.id}
                        className="border-b last:border-0 hover:bg-secondary/50"
                      >
                        <td className="p-3 font-medium">{p.name}</td>
                        <td className="p-3 hidden md:table-cell text-muted-foreground">
                          {p.brand}
                        </td>
                        <td className="p-3">
                          R$ {p.price.toLocaleString("pt-BR")}
                        </td>
                        <td className="p-3 hidden md:table-cell">
                          <Badge variant="outline">{conditionLabel(p.condition)}</Badge>
                        </td>
                        <td className="p-3 hidden md:table-cell">
                          <Badge variant={
                            (p as any).status === "vendido" ? "destructive" :
                            (p as any).status === "reservado" ? "secondary" : "default"
                          }>
                            {(p as any).status === "vendido" ? "Vendido" :
                             (p as any).status === "reservado" ? "Reservado" : "Disponível"}
                          </Badge>
                        </td>
                        <td className="p-3 hidden md:table-cell text-muted-foreground">
                          <div>
                            <div className="font-medium">{modelViewsMap[p.modelId || ''] || 0}</div>
                            <div className="text-xs text-muted-foreground">
                              {p.modelId ? "views do modelo" : "sem modelo"}
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              title={p.status === "disponivel" ? "Marcar como Vendido" : "Marcar como Disponível"}
                              onClick={() => handleToggleStatus(p)}
                              className={p.status === "vendido" ? "text-destructive" : "text-green-600"}
                            >
                              <Power className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleEdit(p)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDelete(p.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {(() => {
              const filtered = products.filter(p => {
                const matchSearch = filterSearch === "" || p.name.toLowerCase().includes(filterSearch.toLowerCase()) || p.brand.toLowerCase().includes(filterSearch.toLowerCase());
                const matchBrand = filterBrand === "all" || p.brand === filterBrand;
                const matchModel = filterModel === "all" || p.modelId === filterModel;
                const matchCondition = filterCondition === "all" || p.condition === filterCondition;
                const matchStatus = filterStatus === "all" || p.status === filterStatus;
                return matchSearch && matchBrand && matchModel && matchCondition && matchStatus;
              });
              const totalPages = Math.ceil(filtered.length / itemsPerPage);

              return filtered.length > itemsPerPage ? (
                <div className="flex items-center justify-between px-4 py-3 border-t bg-secondary/30">
                  <div className="text-sm text-muted-foreground">
                    Mostrando {filtered.length === 0 ? 0 : (productsPage - 1) * itemsPerPage + 1} a{" "}
                    {Math.min(productsPage * itemsPerPage, filtered.length)} de{" "}
                    {filtered.length} produtos
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setProductsPage(Math.max(1, productsPage - 1))}
                      disabled={productsPage === 1}
                    >
                      ← Anterior
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }).map((_, i) => (
                        <Button
                          key={i + 1}
                          variant={
                            productsPage === i + 1 ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() => setProductsPage(i + 1)}
                          className="w-8 h-8 p-0"
                        >
                          {i + 1}
                        </Button>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setProductsPage(Math.min(totalPages, productsPage + 1))}
                      disabled={productsPage === totalPages}
                    >
                      Próximo →
                    </Button>
                  </div>
                </div>
              ) : null;
            })()}
          </div>
        </>
      )}
    </div>
  );
}
