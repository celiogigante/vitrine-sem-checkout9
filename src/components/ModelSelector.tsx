import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Search, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface Model {
  id: string;
  name: string;
  brand: string;
}

interface ModelSelectorProps {
  value?: string;
  onSelect: (modelId: string) => void;
  brand?: string;
}

export default function ModelSelector({ value, onSelect, brand }: ModelSelectorProps) {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [models, setModels] = useState<Model[]>([]);
  const [filteredModels, setFilteredModels] = useState<Model[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newModelName, setNewModelName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const selectedModel = models.find(m => m.id === value);

  useEffect(() => {
    loadModels();
  }, []);

  useEffect(() => {
    const filtered = models.filter(m => {
      const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase());
      const matchesBrand = !brand || m.brand === brand;
      return matchesSearch && matchesBrand;
    });
    setFilteredModels(filtered);
  }, [search, models, brand]);

  const loadModels = async () => {
    try {
      const { data } = await supabase
        .from("models")
        .select("id, name, brand")
        .order("name");
      
      if (data) {
        setModels(data);
      }
    } catch (err) {
      console.error("Error loading models:", err);
    }
  };

  const handleCreateModel = async () => {
    if (!newModelName.trim()) {
      toast({ title: "Digite um nome para o modelo", variant: "destructive" });
      return;
    }

    if (!brand) {
      toast({ title: "Selecione uma marca primeiro", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("models")
        .insert({
          name: newModelName.trim(),
          brand: brand,
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setModels([...models, data]);
        onSelect(data.id);
        setNewModelName("");
        setShowNewForm(false);
        setIsOpen(false);
        setSearch("");
        toast({ title: "Modelo cadastrado com sucesso!" });
      }
    } catch (err) {
      console.error("Error creating model:", err);
      toast({ title: "Erro ao cadastrar modelo", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          placeholder="Buscar modelo..."
          value={isOpen ? search : selectedModel?.name || ""}
          onChange={(e) => {
            setSearch(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="pl-9 pr-9"
        />
        {selectedModel && !isOpen && (
          <button
            onClick={() => {
              onSelect("");
              setSearch("");
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card border rounded-md shadow-lg z-50 max-h-72 overflow-y-auto">
          {showNewForm ? (
            <div className="p-3 border-b space-y-2">
              <Input
                placeholder="Nome do novo modelo"
                value={newModelName}
                onChange={(e) => setNewModelName(e.target.value)}
                autoFocus
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleCreateModel}
                  disabled={isLoading || !newModelName.trim()}
                  className="flex-1"
                >
                  Salvar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setShowNewForm(false);
                    setNewModelName("");
                  }}
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          ) : null}

          <div className="max-h-60 overflow-y-auto">
            {filteredModels.length > 0 ? (
              filteredModels.map((model) => (
                <button
                  key={model.id}
                  onClick={() => {
                    onSelect(model.id);
                    setIsOpen(false);
                    setSearch("");
                  }}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors ${
                    value === model.id ? "bg-accent" : ""
                  }`}
                >
                  <div className="font-medium">{model.name}</div>
                  <div className="text-xs text-muted-foreground">{model.brand}</div>
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                Nenhum modelo encontrado
              </div>
            )}
          </div>

          {!showNewForm && (
            <button
              onClick={() => setShowNewForm(true)}
              className="w-full px-3 py-2 text-left text-sm border-t hover:bg-accent transition-colors flex items-center gap-2 text-primary"
            >
              <Plus className="h-4 w-4" />
              Cadastrar novo modelo
            </button>
          )}
        </div>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
