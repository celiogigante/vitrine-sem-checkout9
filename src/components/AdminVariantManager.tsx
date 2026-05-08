import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Pencil, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  getProductVariants,
  addProductVariant,
  updateProductVariant,
  deleteProductVariant,
  CONDITIONS,
  conditionLabel,
  STATUSES,
  statusLabel,
} from "@/lib/products";
import type { ProductVariant } from "@/lib/supabase";

interface AdminVariantManagerProps {
  productId: string;
}

export default function AdminVariantManager({ productId }: AdminVariantManagerProps) {
  const { toast } = useToast();
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [form, setForm] = useState({
    sku: "",
    color: "",
    storage: "",
    ram: "",
    condition: "seminovo" as const,
    specific_defects: "",
    price: 0,
    original_price: undefined as number | undefined,
    stock_quantity: 1,
    status: "disponivel" as const,
  });

  useEffect(() => {
    loadVariants();
  }, [productId]);

  const loadVariants = async () => {
    setIsLoading(true);
    try {
      const data = await getProductVariants(productId);
      setVariants(data);
    } catch (err) {
      console.error("Error loading variants:", err);
      toast({
        title: "Erro ao carregar variações",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      sku: "",
      color: "",
      storage: "",
      ram: "",
      condition: "seminovo",
      specific_defects: "",
      price: 0,
      original_price: undefined,
      stock_quantity: 1,
      status: "disponivel",
    });
    setEditing(null);
    setShowForm(false);
  };

  const handleSave = async () => {
    if (!form.sku || !form.price) {
      toast({
        title: "Preencha SKU e preço",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      if (editing) {
        const updated = await updateProductVariant(editing, {
          sku: form.sku,
          color: form.color || undefined,
          storage: form.storage || undefined,
          ram: form.ram || undefined,
          condition: form.condition,
          specific_defects: form.specific_defects || undefined,
          price: form.price,
          original_price: form.original_price,
          stock_quantity: form.stock_quantity,
          status: form.status,
        });

        if (updated) {
          setVariants(variants.map((v) => (v.id === editing ? updated : v)));
          toast({ title: "Variação atualizada!" });
        }
      } else {
        const newVariant = await addProductVariant(productId, {
          sku: form.sku,
          color: form.color || undefined,
          storage: form.storage || undefined,
          ram: form.ram || undefined,
          condition: form.condition,
          specific_defects: form.specific_defects || undefined,
          price: form.price,
          original_price: form.original_price,
          stock_quantity: form.stock_quantity,
          status: form.status,
          order_index: variants.length,
        });

        if (newVariant) {
          setVariants([...variants, newVariant]);
          toast({ title: "Variação adicionada!" });
        }
      }
      resetForm();
    } catch (err) {
      console.error("Error saving variant:", err);
      toast({
        title: "Erro ao salvar variação",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (variant: ProductVariant) => {
    setForm({
      sku: variant.sku,
      color: variant.color || "",
      storage: variant.storage || "",
      ram: variant.ram || "",
      condition: variant.condition,
      specific_defects: variant.specific_defects || "",
      price: variant.price,
      original_price: variant.original_price || undefined,
      stock_quantity: variant.stock_quantity,
      status: variant.status,
    });
    setEditing(variant.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja deletar esta variação?")) return;

    try {
      const success = await deleteProductVariant(id);
      if (success) {
        setVariants(variants.filter((v) => v.id !== id));
        toast({ title: "Variação removida" });
      } else {
        toast({
          title: "Erro ao deletar variação",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Error deleting variant:", err);
      toast({
        title: "Erro ao deletar variação",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg">Variações de Produtos</h3>
          <p className="text-sm text-muted-foreground">Cadastre diferentes versões deste produto</p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)} size="sm">
            <Plus className="mr-1 h-4 w-4" /> Adicionar Variação
          </Button>
        )}
      </div>

      {showForm && (
        <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium">{editing ? "Editar Variação" : "Nova Variação"}</h4>
            <button
              onClick={resetForm}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* SKU e Specs Básicos */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Input
              placeholder="SKU (ex: IP17-PRETO-128)"
              value={form.sku}
              onChange={(e) => setForm({ ...form, sku: e.target.value })}
              className="text-sm"
            />
            <Input
              placeholder="Cor (ex: Preto)"
              value={form.color}
              onChange={(e) => setForm({ ...form, color: e.target.value })}
              className="text-sm"
            />
            <Input
              placeholder="Armazenamento (ex: 128GB)"
              value={form.storage}
              onChange={(e) => setForm({ ...form, storage: e.target.value })}
              className="text-sm"
            />
            <Input
              placeholder="RAM (ex: 6GB)"
              value={form.ram}
              onChange={(e) => setForm({ ...form, ram: e.target.value })}
              className="text-sm"
            />
          </div>

          {/* Preço e Estoque */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Input
              type="number"
              placeholder="Preço (R$)"
              value={form.price || ""}
              onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
              className="text-sm"
            />
            <Input
              type="number"
              placeholder="Preço original (opcional)"
              value={form.original_price || ""}
              onChange={(e) =>
                setForm({ ...form, original_price: Number(e.target.value) || undefined })
              }
              className="text-sm"
            />
            <Input
              type="number"
              placeholder="Estoque"
              min="1"
              value={form.stock_quantity}
              onChange={(e) => setForm({ ...form, stock_quantity: Number(e.target.value) })}
              className="text-sm"
            />
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as any })}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {statusLabel(s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Condição e Defeitos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Select value={form.condition} onValueChange={(v) => setForm({ ...form, condition: v as any })}>
              <SelectTrigger className="text-sm">
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
          </div>

          <Textarea
            placeholder="Defeitos específicos (ex: Face ID off, vidro marcado, etc)"
            value={form.specific_defects}
            onChange={(e) => setForm({ ...form, specific_defects: e.target.value })}
            className="text-sm min-h-20"
          />

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={resetForm} size="sm">
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving} size="sm">
              {isSaving ? "Salvando..." : "Salvar Variação"}
            </Button>
          </div>
        </div>
      )}

      {/* Lista de Variações */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Carregando variações...</div>
        ) : variants.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Nenhuma variação cadastrada. Comece adicionando uma!
          </div>
        ) : (
          variants.map((variant) => (
            <div
              key={variant.id}
              className="rounded-lg border bg-card p-4 flex items-start justify-between hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline">{variant.sku}</Badge>
                  {variant.color && <Badge variant="secondary">{variant.color}</Badge>}
                  {variant.storage && <Badge variant="secondary">{variant.storage}</Badge>}
                  {variant.ram && <Badge variant="secondary">{variant.ram}</Badge>}
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="font-semibold">R$ {variant.price.toFixed(2)}</span>
                  {variant.original_price && (
                    <span className="text-muted-foreground line-through">
                      R$ {variant.original_price.toFixed(2)}
                    </span>
                  )}
                  <span className="text-muted-foreground">
                    Estoque: {variant.stock_quantity}
                  </span>
                  <Badge className="text-xs">{statusLabel(variant.status)}</Badge>
                  <Badge className="text-xs">{conditionLabel(variant.condition)}</Badge>
                </div>
                {variant.specific_defects && (
                  <p className="text-sm text-orange-600">Defeitos: {variant.specific_defects}</p>
                )}
              </div>
              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => handleEdit(variant)}
                  className="text-muted-foreground hover:text-foreground p-2"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(variant.id)}
                  className="text-muted-foreground hover:text-destructive p-2"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
