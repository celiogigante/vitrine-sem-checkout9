import { useState, useEffect } from "react";
import { getSettings, saveSettings, CardFormat, getProducts, type Product } from "@/lib/products";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import ProductCard from "./ProductCard";

const CARD_FORMATS: { id: CardFormat; name: string; description: string }[] = [
  {
    id: "compact",
    name: "Compacto",
    description: "Formato mais compacto com botão de ação destacado. Similar ao seu print.",
  },
  {
    id: "modern",
    name: "Moderno",
    description: "Design atual otimizado com badges detalhadas e múltiplas informações.",
  },
  {
    id: "premium",
    name: "Premium",
    description: "Design sofisticado com efeitos visuais avançados e layout premium.",
  },
];

export default function AdminCardFormatManager() {
  const [selectedFormat, setSelectedFormat] = useState<CardFormat>("compact");
  const [isLoading, setIsLoading] = useState(true);
  const [sampleProduct, setSampleProduct] = useState<Product | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const loadData = async () => {
      try {
        const settings = getSettings();
        setSelectedFormat(settings.cardFormat);

        const products = await getProducts();
        if (products.length > 0) {
          setSampleProduct(products[0]);
        }
      } catch (err) {
        console.error("Error loading data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const handleSaveFormat = (format: CardFormat) => {
    try {
      const settings = getSettings();
      settings.cardFormat = format;
      saveSettings(settings);
      setSelectedFormat(format);
      toast({
        title: "Sucesso",
        description: `Formato de card alterado para: ${CARD_FORMATS.find(f => f.id === format)?.name}`,
      });
    } catch (err) {
      console.error("Error saving format:", err);
      toast({
        title: "Erro",
        description: "Erro ao salvar o formato de card",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-2">Formato dos Cards de Produtos</h2>
        <p className="text-muted-foreground">
          Escolha o formato que será utilizado em todas as páginas do site
        </p>
      </div>

      {sampleProduct ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {CARD_FORMATS.map((format) => (
            <div key={format.id}>
              <Card
                className={`p-4 mb-4 cursor-pointer transition-all ${
                  selectedFormat === format.id
                    ? "border-blue-600 border-2 bg-blue-50"
                    : "border-gray-200 hover:border-gray-400"
                }`}
              >
                <h3 className="font-bold text-lg mb-2">{format.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {format.description}
                </p>

                {selectedFormat === format.id && (
                  <div className="bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full inline-block mb-4">
                    Ativo
                  </div>
                )}
              </Card>

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 mb-4">
                <ProductCard product={sampleProduct} />
              </div>

              <Button
                onClick={() => handleSaveFormat(format.id)}
                variant={selectedFormat === format.id ? "default" : "outline"}
                className="w-full"
                disabled={selectedFormat === format.id}
              >
                {selectedFormat === format.id ? "Ativo" : "Selecionar"}
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-yellow-800 font-medium">
            Nenhum produto encontrado. Adicione produtos para visualizar o preview dos formatos.
          </p>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">ℹ️ Informação</h4>
        <p className="text-sm text-blue-800">
          Todos os cards de produtos em todas as páginas serão alterados para o
          formato selecionado imediatamente.
        </p>
      </div>
    </div>
  );
}
