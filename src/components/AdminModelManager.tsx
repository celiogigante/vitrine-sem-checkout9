import { useState, useEffect } from "react";
import { getModels, addModel, updateModel, deleteModel, BRANDS, type Model } from "@/lib/products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Pencil, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminModelManager() {
  const { toast } = useToast();
  const [models, setModels] = useState<Model[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [modelsPage, setModelsPage] = useState(1);
  const [itemsPerPage] = useState(25);

  // Filtros
  const [filterSearch, setFilterSearch] = useState("");
  const [filterBrand, setFilterBrand] = useState<string>("all");

  const [form, setForm] = useState({
    name: "",
    brand: "Apple",
    description: "",
  });

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      setIsLoading(true);
      const modelList = await getModels();
      setModels(modelList);
    } catch (err) {
      console.error("Error loading models:", err);
      toast({
        title: "Erro ao carregar modelos",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.brand) {
      toast({
        title: "Preencha nome e marca",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      if (editing) {
        await updateModel(editing, {
          name: form.name,
          brand: form.brand,
          description: form.description,
        });
        toast({ title: "Modelo atualizado!" });
      } else {
        await addModel({
          name: form.name,
          brand: form.brand,
          description: form.description,
        });
        toast({ title: "Modelo adicionado!" });
      }

      await loadModels();
      resetForm();
    } catch (err) {
      console.error("Error saving model:", err);
      toast({
        title: "Erro ao salvar modelo",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (model: Model) => {
    setForm({
      name: model.name,
      brand: model.brand,
      description: model.description || "",
    });
    setEditing(model.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja deletar este modelo?")) {
      try {
        await deleteModel(id);
        toast({ title: "Modelo deletado!" });
        await loadModels();
      } catch (err) {
        console.error("Error deleting model:", err);
        toast({
          title: "Erro ao deletar modelo",
          variant: "destructive",
        });
      }
    }
  };

  const resetForm = () => {
    setForm({ name: "", brand: "Apple", description: "" });
    setEditing(null);
    setShowForm(false);
  };

  const filtered = models.filter(m => {
    const matchSearch = filterSearch === "" || m.name.toLowerCase().includes(filterSearch.toLowerCase()) || m.brand.toLowerCase().includes(filterSearch.toLowerCase());
    const matchBrand = filterBrand === "all" || m.brand === filterBrand;
    return matchSearch && matchBrand;
  });

  const paginatedModels = filtered.slice((modelsPage - 1) * itemsPerPage, modelsPage * itemsPerPage);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  const groupedByBrand = paginatedModels.reduce((acc, model) => {
    if (!acc[model.brand]) acc[model.brand] = [];
    acc[model.brand].push(model);
    return acc;
  }, {} as Record<string, Model[]>);

  const allBrands = Array.from(new Set(models.map(m => m.brand))).sort();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Modelos</h2>
        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Novo Modelo
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="rounded-lg border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-sm">Filtros</h3>
          {(filterSearch || filterBrand !== "all") && (
            <button
              onClick={() => {
                setFilterSearch("");
                setFilterBrand("all");
                setModelsPage(1);
              }}
              className="text-xs text-primary hover:underline"
            >
              Limpar filtros
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input
            placeholder="Buscar nome..."
            value={filterSearch}
            onChange={(e) => {
              setFilterSearch(e.target.value);
              setModelsPage(1);
            }}
            className="text-sm"
          />
          <Select value={filterBrand} onValueChange={(v) => {
            setFilterBrand(v);
            setModelsPage(1);
          }}>
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Marca" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas marcas</SelectItem>
              {allBrands.map((b) => (
                <SelectItem key={b} value={b}>{b}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {showForm && (
        <div className="border rounded-lg p-6 bg-muted/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">
              {editing ? "Editar Modelo" : "Novo Modelo"}
            </h3>
            <button onClick={resetForm} className="text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                placeholder="Nome do modelo (ex: iPhone 15 Pro)"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <Select value={form.brand} onValueChange={(value) => setForm({ ...form, brand: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BRANDS.map((brand) => (
                    <SelectItem key={brand} value={brand}>
                      {brand}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Textarea
              placeholder="Descrição (opcional)"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
            />

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={resetForm}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Carregando modelos...</div>
      ) : Object.keys(groupedByBrand).length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">Nenhum modelo cadastrado</div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedByBrand).map(([brand, brandModels]) => (
            <div key={brand} className="space-y-2">
              <h3 className="font-semibold text-lg">{brand}</h3>
              <div className="space-y-2 border rounded-lg divide-y">
                {brandModels.map((model) => (
                  <div key={model.id} className="flex items-center justify-between p-4 hover:bg-muted/50">
                    <div className="flex-1">
                      <p className="font-medium">{model.name}</p>
                      {model.description && <p className="text-sm text-muted-foreground">{model.description}</p>}
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className="text-xs">
                          📊 {model.views} views
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(model)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(model.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Pagination */}
          {filtered.length > itemsPerPage && (
            <div className="flex items-center justify-between px-4 py-3 border-t bg-secondary/30">
              <div className="text-sm text-muted-foreground">
                Mostrando {(modelsPage - 1) * itemsPerPage + 1} a{" "}
                {Math.min(modelsPage * itemsPerPage, filtered.length)} de{" "}
                {filtered.length} modelos
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setModelsPage(Math.max(1, modelsPage - 1))}
                  disabled={modelsPage === 1}
                >
                  ← Anterior
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({
                    length: totalPages,
                  }).map((_, i) => (
                    <Button
                      key={i + 1}
                      variant={
                        modelsPage === i + 1 ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => setModelsPage(i + 1)}
                      className="w-8 h-8 p-0"
                    >
                      {i + 1}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setModelsPage(
                      Math.min(totalPages, modelsPage + 1)
                    )
                  }
                  disabled={modelsPage === totalPages}
                >
                  Próximo →
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
