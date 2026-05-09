import { useState, useEffect } from "react";
import { supabase, Product, Order, Customer } from "@/lib/supabase";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import { Loader2, TrendingUp, ShoppingCart, Users, Eye, Package, DollarSign, MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getWhatsAppClickCount, getWhatsAppClicksRankingByModel, getModelViewsAndWhatsAppClicks } from "@/lib/products";

interface InsightsData {
  totalProducts: number;
  totalViews: number;
  whatsappClicks: number;
  featuredProducts: number;
  promotionProducts: number;
  totalCustomers: number;
  totalOrders: number;
  totalRevenue: number;
  topProducts: Product[];
  topProductsByClicks: Array<{ product_id: string; product_name: string; total_clicks: number }>;
  whatsappClicksByModel: Array<{ modelId: string; modelName: string; totalClicks: number }>;
  modelViewsAndClicks: Array<{ modelId: string; modelName: string; views: number; whatsappClicks: number; conversionRate: number }>;
  conditionDistribution: Array<{ name: string; value: number }>;
  brandDistribution: Array<{ name: string; value: number }>;
  orderStatus: Array<{ status: string; count: number }>;
  averageProductPrice: number;
}

export function Insights() {
  const [data, setData] = useState<InsightsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [showConversionModal, setShowConversionModal] = useState(false);

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    try {
      setIsLoading(true);

      // Load products
      const { data: products, error: productsError } = await supabase
        .from("products")
        .select("*");

      if (productsError) {
        console.error("Error loading products:", productsError);
        throw productsError;
      }

      // Load customers with error handling
      let customerList = [];
      const { data: customers } = await supabase
        .from("customers")
        .select("*");
      if (customers) customerList = customers;

      // Load orders with error handling
      let orderList = [];
      const { data: orders } = await supabase
        .from("orders")
        .select("*");
      if (orders) orderList = orders;

      // Load product clicks with error handling
      let clickList: Array<{ product_id: string }> = [];
      const { data: clicks } = await supabase
        .from("product_clicks")
        .select("product_id");

      if (clicks) {
        clickList = (clicks || []) as Array<{ product_id: string }>;
      }

      const productList = (products || []) as Product[];

      // Calculate metrics
      const totalProducts = productList.length;
      const totalViews = productList.reduce((sum, p) => sum + (p.views || 0), 0);
      const featuredProducts = productList.filter((p) => p.featured).length;
      const promotionProducts = productList.filter((p) => p.promotion).length;
      const totalCustomers = customerList.length;
      const totalOrders = orderList.length;
      const totalRevenue = orderList.reduce((sum, o) => sum + o.total_price, 0);
      const averageProductPrice =
        totalProducts > 0
          ? productList.reduce((sum, p) => sum + p.price, 0) / totalProducts
          : 0;

      // Top products by views
      const topProducts = productList
        .sort((a, b) => (b.views || 0) - (a.views || 0))
        .slice(0, 5);

      // Top products by clicks
      const clickCountMap: Record<string, { name: string; count: number }> = {};
      clickList.forEach((click) => {
        const productId = click.product_id;
        const product = productList.find((p) => p.id === productId);
        if (product) {
          if (!clickCountMap[productId]) {
            clickCountMap[productId] = { name: product.name, count: 0 };
          }
          clickCountMap[productId].count++;
        }
      });
      const topProductsByClicks = Object.entries(clickCountMap)
        .map(([productId, data]) => ({
          product_id: productId,
          product_name: data.name,
          total_clicks: data.count,
        }))
        .sort((a, b) => b.total_clicks - a.total_clicks)
        .slice(0, 5);

      // Condition distribution
      const conditionMap: Record<string, number> = {};
      productList.forEach((p) => {
        conditionMap[p.condition] = (conditionMap[p.condition] || 0) + 1;
      });
      const conditionDistribution = Object.entries(conditionMap).map(
        ([name, value]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          value,
        })
      );

      // Brand distribution
      const brandMap: Record<string, number> = {};
      productList.forEach((p) => {
        brandMap[p.brand] = (brandMap[p.brand] || 0) + 1;
      });
      const brandDistribution = Object.entries(brandMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8);

      // Order status distribution
      const statusMap: Record<string, number> = {};
      orderList.forEach((o) => {
        statusMap[o.status] = (statusMap[o.status] || 0) + 1;
      });
      const orderStatus = Object.entries(statusMap).map(([status, count]) => ({
        status: status.charAt(0).toUpperCase() + status.slice(1),
        count,
      }));

      // Get WhatsApp clicks count
      const whatsappClicks = await getWhatsAppClickCount();

      // Get WhatsApp clicks by model
      const whatsappClicksByModel = await getWhatsAppClicksRankingByModel();

      // Get model views and WhatsApp clicks with conversion rate
      const modelViewsAndClicks = await getModelViewsAndWhatsAppClicks();

      setData({
        totalProducts,
        totalViews,
        whatsappClicks,
        featuredProducts,
        promotionProducts,
        totalCustomers,
        totalOrders,
        totalRevenue,
        topProducts,
        topProductsByClicks,
        whatsappClicksByModel,
        modelViewsAndClicks,
        conditionDistribution,
        brandDistribution,
        orderStatus,
        averageProductPrice,
      });

      setLastRefresh(new Date());
    } catch (err) {
      console.error("Error loading insights:", err);
      const errorMsg = err instanceof Error ? err.message : "Erro ao carregar insights";
      alert(`Erro ao carregar insights: ${errorMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground mb-4">Erro ao carregar os insights</p>
        <button
          onClick={() => {
            setIsLoading(true);
            loadInsights();
          }}
          className="text-primary hover:underline cursor-pointer"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  const COLORS = [
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#06b6d4",
    "#ec4899",
    "#6366f1",
  ];

  return (
    <div className="space-y-6">
      {/* Refresh Info */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <p>Última atualização: {lastRefresh.toLocaleTimeString("pt-BR")}</p>
        <button
          onClick={() => {
            setIsLoading(true);
            loadInsights();
          }}
          disabled={isLoading}
          className="text-primary hover:underline cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Carregando..." : "↻ Atualizar agora"}
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total de Produtos</p>
              <p className="text-2xl font-bold mt-1">{data.totalProducts}</p>
            </div>
            <Package className="h-8 w-8 text-blue-500 opacity-20" />
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total de Visualizações</p>
              <p className="text-2xl font-bold mt-1">{data.totalViews.toLocaleString("pt-BR")}</p>
            </div>
            <Eye className="h-8 w-8 text-purple-500 opacity-20" />
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Cliques no WhatsApp</p>
              <p className="text-2xl font-bold mt-1">{data.whatsappClicks.toLocaleString("pt-BR")}</p>
            </div>
            <MessageCircle className="h-8 w-8 text-green-500 opacity-20" />
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total de Clientes</p>
              <p className="text-2xl font-bold mt-1">{data.totalCustomers}</p>
            </div>
            <Users className="h-8 w-8 text-green-500 opacity-20" />
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total de Pedidos</p>
              <p className="text-2xl font-bold mt-1">{data.totalOrders}</p>
            </div>
            <ShoppingCart className="h-8 w-8 text-orange-500 opacity-20" />
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Faturamento Total</p>
              <p className="text-2xl font-bold mt-1">
                R$ {data.totalRevenue.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-yellow-500 opacity-20" />
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Preço Médio</p>
              <p className="text-2xl font-bold mt-1">
                R$ {data.averageProductPrice.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-red-500 opacity-20" />
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Em Destaque</p>
              <p className="text-2xl font-bold mt-1">{data.featuredProducts}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-indigo-500 opacity-20" />
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Em Promoção</p>
              <p className="text-2xl font-bold mt-1">{data.promotionProducts}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-pink-500 opacity-20" />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Products by Views */}
        <div className="rounded-lg border bg-card p-4">
          <h3 className="font-semibold mb-4">Top 5 Produtos Mais Vistos</h3>
          <div className="space-y-3">
            {data.topProducts.map((product, index) => (
              <div key={product.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground font-medium">#{index + 1}</span>
                  <span className="truncate">{product.name}</span>
                </div>
                <span className="font-bold">{product.views || 0}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products by Clicks */}
        <div className="rounded-lg border bg-card p-4">
          <h3 className="font-semibold mb-4">Top 5 Produtos Mais Clicados</h3>
          <div className="space-y-3">
            {data.topProductsByClicks.length > 0 ? (
              data.topProductsByClicks.map((item, index) => (
                <div key={item.product_id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground font-medium">#{index + 1}</span>
                    <span className="truncate">{item.product_name}</span>
                  </div>
                  <span className="font-bold">{item.total_clicks}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum clique registrado ainda</p>
            )}
          </div>
        </div>

        {/* Model Conversion Rate Analysis */}
        {data.modelViewsAndClicks && data.modelViewsAndClicks.length > 0 && (
          <>
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Taxa de Conversão por Modelo</h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowConversionModal(true)}
                >
                  Ver Detalhes
                </Button>
              </div>

              {/* Bar Chart */}
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.modelViewsAndClicks}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="modelName"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    interval={0}
                  />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => typeof value === 'number' ? value.toFixed(2) : value}
                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '8px', color: '#fff' }}
                  />
                  <Legend />
                  <Bar dataKey="views" name="Visualizações" fill="#3b82f6" />
                  <Bar dataKey="whatsappClicks" name="Cliques WhatsApp" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Conversion Rate Modal */}
            <Dialog open={showConversionModal} onOpenChange={setShowConversionModal}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Taxa de Conversão por Modelo</DialogTitle>
                </DialogHeader>
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-muted">
                      <tr>
                        <th className="text-left p-2 font-semibold">Posição</th>
                        <th className="text-left p-2 font-semibold">Modelo</th>
                        <th className="text-center p-2 font-semibold">Visualizações</th>
                        <th className="text-center p-2 font-semibold">Cliques</th>
                        <th className="text-center p-2 font-semibold">Taxa %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.modelViewsAndClicks.map((model, index) => (
                        <tr key={model.modelId} className="border-b hover:bg-muted/50">
                          <td className="p-2 font-semibold text-muted-foreground">#{index + 1}</td>
                          <td className="p-2 font-medium">{model.modelName}</td>
                          <td className="p-2 text-center">{model.views}</td>
                          <td className="p-2 text-center font-semibold text-green-600">{model.whatsappClicks}</td>
                          <td className="p-2 text-center font-bold text-lg">{model.conversionRate}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </DialogContent>
            </Dialog>
          </>
        )}

        {/* Condition Distribution */}
        {data.conditionDistribution.length > 0 && (
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-semibold mb-4">Distribuição por Condição</h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={data.conditionDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={70}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.conditionDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Brand Distribution */}
        {data.brandDistribution.length > 0 && (
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-semibold mb-4">Top Marcas</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.brandDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Order Status */}
        {data.orderStatus.length > 0 && (
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-semibold mb-4">Status dos Pedidos</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.orderStatus}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
