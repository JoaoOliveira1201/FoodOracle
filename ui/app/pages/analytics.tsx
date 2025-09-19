import { useState, useEffect } from "react";
import { useNavigate } from "react-router";

interface FinancialMetrics {
  total_revenue: number;
  total_orders: number;
  average_order_value: number;
  completed_orders: number;
  pending_orders: number;
  cancelled_orders: number;
  total_quotes_value: number;
  approved_quotes_count: number;
  rejected_quotes_count: number;
  pending_quotes_count: number;
}

interface InventoryMetrics {
  total_in_stock_kg: number;
  total_sold_kg: number;
  total_discarded_kg: number;
  total_donated_kg: number;
  total_products: number;
  products_requiring_refrigeration: number;
  inventory_turnover_rate: number;
  loss_percentage: number;
  waste_percentage: number;
  total_warehouses: number;
}

interface OperationalMetrics {
  total_trips: number;
  completed_trips: number;
  in_progress_trips: number;
  pending_trips: number;
  trip_completion_rate: number;
  total_transfers: number;
  total_suppliers: number;
  total_buyers: number;
  total_drivers: number;
}

interface ProductPerformance {
  product_id: number;
  name: string;
  total_sold_kg: number;
  total_revenue: number;
  total_discarded_kg: number;
  total_donated_kg: number;
  loss_rate: number;
}

interface WarehouseAnalytics {
  warehouse_id: number;
  name: string;
  location: string | null;
  total_stock_kg: number;
  products_count: number;
  utilization_percentage: number;
}

interface TimeSeriesData {
  date: string;
  revenue: number;
  orders_count: number;
  products_sold_kg: number;
  products_discarded_kg: number;
}

interface EnvironmentalImpact {
  meals: number;
  water_liters: number;
  co2_kg: number;
}

interface AnalyticsData {
  financial: FinancialMetrics;
  inventory: InventoryMetrics;
  operational: OperationalMetrics;
  top_products: ProductPerformance[];
  warehouse_analytics: WarehouseAnalytics[];
  time_series: TimeSeriesData[];
  analysis_timestamp: string;
}

export function Analytics() {
  const navigate = useNavigate();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [daysBack, setDaysBack] = useState(30);
  const [activeSection, setActiveSection] = useState("overview");

  useEffect(() => {
    fetchAnalytics();
  }, [daysBack]);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `http://localhost:8000/analytics/comprehensive?days_back=${daysBack}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || "Failed to fetch analytics data");
      }
    } catch (err) {
      setError("Failed to connect to the server");
      console.error("Error fetching analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-PT').format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  // Environmental impact calculations
  // Based on average food waste impact studies:
  // - 1 kg of food = approximately 2.5 meals
  // - 1 kg of food = approximately 1000 liters of water (considering production water footprint)
  // - 1 kg of food = approximately 3.3 kg CO2 equivalent (production, transport, disposal)
  const calculateEnvironmentalImpact = (foodKg: number): EnvironmentalImpact => {
    return {
      meals: Math.round(foodKg * 2.5),
      water_liters: Math.round(foodKg * 1000),
      co2_kg: Math.round(foodKg * 3.3 * 100) / 100, // Round to 2 decimal places
    };
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'sold':
      case 'approved':
        return 'text-green-600 bg-green-100';
      case 'pending':
      case 'in_progress':
        return 'text-yellow-600 bg-yellow-100';
      case 'cancelled':
      case 'discarded':
      case 'rejected':
        return 'text-red-600 bg-red-100';
      case 'donated':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const renderKPICard = (title: string, value: string | number, subtitle?: string, trend?: string, icon?: string) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {typeof value === 'number' ? formatNumber(value) : value}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-xl">{icon}</span>
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-3">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            trend.startsWith('+') ? 'text-green-700 bg-green-100' : 'text-red-700 bg-red-100'
          }`}>
            {trend}
          </span>
        </div>
      )}
    </div>
  );

  const renderInventoryChart = () => {
    if (!analyticsData) return null;

    const { inventory } = analyticsData;
    const total = inventory.total_sold_kg + inventory.total_discarded_kg + inventory.total_donated_kg + inventory.total_in_stock_kg;

    const data = [
      { label: 'In Stock', value: inventory.total_in_stock_kg, color: 'bg-blue-500', percentage: (inventory.total_in_stock_kg / total * 100) },
      { label: 'Sold', value: inventory.total_sold_kg, color: 'bg-green-500', percentage: (inventory.total_sold_kg / total * 100) },
      { label: 'Donated', value: inventory.total_donated_kg, color: 'bg-yellow-500', percentage: (inventory.total_donated_kg / total * 100) },
      { label: 'Discarded', value: inventory.total_discarded_kg, color: 'bg-red-500', percentage: (inventory.total_discarded_kg / total * 100) },
    ];

    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Inventory Distribution</h3>
        <div className="space-y-4">
          {data.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded-full ${item.color}`}></div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.label}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">{formatNumber(item.value)} kg</span>
                <span className="text-xs text-gray-500 dark:text-gray-500">{formatPercentage(item.percentage)}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex space-x-1 h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          {data.map((item, index) => (
            <div
              key={index}
              className={item.color}
              style={{ width: `${item.percentage}%` }}
            ></div>
          ))}
        </div>
      </div>
    );
  };

  const renderProductPerformanceTable = () => {
    if (!analyticsData?.top_products) return null;

    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Products Performance</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Sold (kg)
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Loss Rate
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {analyticsData.top_products.map((product) => (
                <tr key={product.product_id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                    {product.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                    {formatNumber(product.total_sold_kg)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                    {formatCurrency(product.total_revenue)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      product.loss_rate < 10 ? 'text-green-800 bg-green-100' :
                      product.loss_rate < 25 ? 'text-yellow-800 bg-yellow-100' :
                      'text-red-800 bg-red-100'
                    }`}>
                      {formatPercentage(product.loss_rate)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderWarehouseAnalytics = () => {
    if (!analyticsData?.warehouse_analytics) return null;

    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Warehouse Analytics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {analyticsData.warehouse_analytics.map((warehouse) => (
            <div key={warehouse.warehouse_id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">{warehouse.name}</h4>
              {warehouse.location && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{warehouse.location}</p>
              )}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Stock:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{formatNumber(warehouse.total_stock_kg)} kg</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Products:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{warehouse.products_count}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Utilization:</span>
                  <span className={`font-medium ${
                    warehouse.utilization_percentage > 80 ? 'text-red-600' :
                    warehouse.utilization_percentage > 60 ? 'text-yellow-600' :
                    'text-green-600'
                  }`}>
                    {formatPercentage(warehouse.utilization_percentage)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderTimeSeriesChart = () => {
    if (!analyticsData?.time_series.length) return null;

    const maxRevenue = Math.max(...analyticsData.time_series.map(d => d.revenue));
    const maxOrders = Math.max(...analyticsData.time_series.map(d => d.orders_count));

    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Revenue & Orders Trend</h3>
        <div className="h-64 flex items-end justify-between space-x-1">
          {analyticsData.time_series.slice(-14).map((data, index) => (
            <div key={index} className="flex-1 flex flex-col items-center space-y-1">
              <div className="w-full flex flex-col justify-end h-48 space-y-1">
                <div
                  className="bg-blue-500 rounded-t"
                  style={{ height: `${(data.revenue / maxRevenue) * 100}%` }}
                  title={`Revenue: ${formatCurrency(data.revenue)}`}
                ></div>
                <div
                  className="bg-green-500 rounded-t"
                  style={{ height: `${(data.orders_count / maxOrders) * 100}%` }}
                  title={`Orders: ${data.orders_count}`}
                ></div>
              </div>
              <span className="text-xs text-gray-600 dark:text-gray-400 transform -rotate-45 origin-top-left">
                {new Date(data.date).toLocaleDateString('pt-PT', { month: 'short', day: 'numeric' })}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-center space-x-6">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Revenue</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Orders</span>
          </div>
        </div>
      </div>
    );
  };

  const renderEnvironmentalImpact = () => {
    if (!analyticsData) return null;

    const discardedImpact = calculateEnvironmentalImpact(analyticsData.inventory.total_discarded_kg);
    const donatedImpact = calculateEnvironmentalImpact(analyticsData.inventory.total_donated_kg);

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Lost Environmental Impact */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Environmental Impact Lost</h3>
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
              <span className="text-red-600 dark:text-red-400 text-xl">⚠️</span>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            From {formatNumber(analyticsData.inventory.total_discarded_kg)} kg of discarded food
          </p>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">🍽️</span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Meals Lost</span>
              </div>
              <span className="text-lg font-bold text-red-600 dark:text-red-400">
                {formatNumber(discardedImpact.meals)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">💧</span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Water Wasted</span>
              </div>
              <span className="text-lg font-bold text-red-600 dark:text-red-400">
                {formatNumber(discardedImpact.water_liters)} L
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">🌍</span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">CO₂ Emissions</span>
              </div>
              <span className="text-lg font-bold text-red-600 dark:text-red-400">
                {discardedImpact.co2_kg} kg
              </span>
            </div>
          </div>
        </div>

        {/* Saved Environmental Impact */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Environmental Impact Saved</h3>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
              <span className="text-green-600 dark:text-green-400 text-xl">💚</span>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            From {formatNumber(analyticsData.inventory.total_donated_kg)} kg of donated food
          </p>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">🍽️</span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Meals Provided</span>
              </div>
              <span className="text-lg font-bold text-green-600 dark:text-green-400">
                {formatNumber(donatedImpact.meals)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">💧</span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Water Saved</span>
              </div>
              <span className="text-lg font-bold text-green-600 dark:text-green-400">
                {formatNumber(donatedImpact.water_liters)} L
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">🌱</span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">CO₂ Avoided</span>
              </div>
              <span className="text-lg font-bold text-green-600 dark:text-green-400">
                {donatedImpact.co2_kg} kg
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading && !analyticsData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 px-4 py-8 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-4 text-gray-600 dark:text-gray-300">Loading analytics data...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 px-4 py-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/home")}
            className="mb-4 inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-2">
                Analytics Dashboard
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300">
                Comprehensive platform metrics and performance insights
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={daysBack}
                onChange={(e) => setDaysBack(Number(e.target.value))}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
                <option value={365}>Last year</option>
              </select>
              <button
                onClick={fetchAnalytics}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Refreshing...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {analyticsData && (
          <div className="space-y-8">
            {/* KPI Section */}
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Key Performance Indicators</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {renderKPICard(
                  "Total Revenue",
                  formatCurrency(analyticsData.financial.total_revenue),
                  `${analyticsData.financial.completed_orders} completed orders`,
                  undefined,
                  "💰"
                )}
                {renderKPICard(
                  "Products in Stock",
                  `${formatNumber(analyticsData.inventory.total_in_stock_kg)} kg`,
                  `${analyticsData.inventory.total_products} total products`,
                  undefined,
                  "📦"
                )}
                {renderKPICard(
                  "Trip Completion Rate",
                  formatPercentage(analyticsData.operational.trip_completion_rate),
                  `${analyticsData.operational.completed_trips}/${analyticsData.operational.total_trips} trips`,
                  undefined,
                  "🚚"
                )}
                {renderKPICard(
                  "Loss Percentage",
                  formatPercentage(analyticsData.inventory.loss_percentage),
                  "Donated + Discarded",
                  undefined,
                  "⚠️"
                )}
              </div>
            </div>

            {/* Financial Overview */}
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Financial Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {renderKPICard("Average Order Value", formatCurrency(analyticsData.financial.average_order_value))}
                {renderKPICard("Pending Orders", analyticsData.financial.pending_orders)}
                {renderKPICard("Cancelled Orders", analyticsData.financial.cancelled_orders)}
                {renderKPICard("Approved Quotes", analyticsData.financial.approved_quotes_count)}
                {renderKPICard("Rejected Quotes", analyticsData.financial.rejected_quotes_count)}
                {renderKPICard("Pending Quotes", analyticsData.financial.pending_quotes_count)}
              </div>
            </div>

            {/* Inventory & Operations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {renderInventoryChart()}
              {renderTimeSeriesChart()}
            </div>

            {/* Environmental Impact */}
            <div>
              <div className="flex items-center space-x-2 mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Environmental Impact</h2>
                <div className="relative group">
                  <button className="w-5 h-5 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 rounded-full flex items-center justify-center transition-colors">
                    <svg className="w-3 h-3 text-gray-600 dark:text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <div className="absolute left-1/2 transform -translate-x-1/2 bottom-full mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                    <div className="text-center">
                      <div>Calculations based on:</div>
                      <div>• Average meal size ~400g</div>
                      <div>• Production water footprint</div>
                      <div>• Production, transport & disposal emissions</div>
                    </div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
                  </div>
                </div>
              </div>
              {renderEnvironmentalImpact()}
            </div>

            {/* Operational Metrics */}
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Operational Metrics</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {renderKPICard("Total Users", analyticsData.operational.total_suppliers + analyticsData.operational.total_buyers + analyticsData.operational.total_drivers)}
                {renderKPICard("Suppliers", analyticsData.operational.total_suppliers)}
                {renderKPICard("Buyers", analyticsData.operational.total_buyers)}
                {renderKPICard("Drivers", analyticsData.operational.total_drivers)}
                {renderKPICard("Warehouses", analyticsData.inventory.total_warehouses)}
                {renderKPICard("Warehouse Transfers", analyticsData.operational.total_transfers)}
                {renderKPICard("Products Need Refrigeration", analyticsData.inventory.products_requiring_refrigeration)}
                {renderKPICard("Inventory Turnover", formatPercentage(analyticsData.inventory.inventory_turnover_rate))}
              </div>
            </div>

            {/* Product Performance Table */}
            {renderProductPerformanceTable()}

            {/* Warehouse Analytics */}
            {renderWarehouseAnalytics()}

            {/* Last Updated */}
            <div className="text-center text-sm text-gray-500 dark:text-gray-400">
              Last updated: {new Date(analyticsData.analysis_timestamp).toLocaleString('pt-PT')}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}