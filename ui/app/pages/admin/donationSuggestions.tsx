import { useEffect, useState } from "react";
import Button from "~/components/Button";
import { useAuth } from "~/contexts/AuthContext";
import { LocationInfoModal } from "~/components/LocationInfoModal";

interface DonationLocation {
  name: string;
}

interface DonationSuggestion {
  record_id: number;
  product_name: string;
  quantity_kg: number;
  warehouse_name: string;
  warehouse_location: {
    latitude: number;
    longitude: number;
  };
  expiration_date: string;
  days_until_expiration: number;
  suggested_donation_locations: DonationLocation[];
}

interface DonationResponse {
  total_products_expiring: number;
  top_10_by_weight: DonationSuggestion[];
  message: string;
}

interface EnvironmentalImpact {
  meals: number;
  water_liters: number;
  co2_kg: number;
}

interface InventoryMetrics {
  total_discarded_kg: number;
  total_donated_kg: number;
}

export function DonationSuggestionsPage() {
  const { isAdmin, isSupplier } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [data, setData] = useState<DonationResponse | null>(null);
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const [inventoryData, setInventoryData] = useState<InventoryMetrics | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{
    name: string;
    address?: string;
  } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchDonationSuggestions = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("http://localhost:8000/donation-suggestions/expiring-products");
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}`);
      }
      const result: DonationResponse = await response.json();
      setData(result);
    } catch (e: any) {
      setError(e?.message || "Failed to fetch donation suggestions");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchInventoryData = async () => {
    try {
      const response = await fetch("http://localhost:8000/analytics/comprehensive?days_back=30");
      if (response.ok) {
        const analyticsData = await response.json();
        setInventoryData({
          total_discarded_kg: analyticsData.inventory.total_discarded_kg,
          total_donated_kg: analyticsData.inventory.total_donated_kg,
        });
      }
    } catch (err) {
      console.error("Error fetching inventory data:", err);
    }
  };

  useEffect(() => {
    if (isAdmin()) {
      fetchDonationSuggestions();
      fetchInventoryData();
    }
  }, [isAdmin]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("pt-PT").format(value);
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

  const getExpirationColor = (days: number) => {
    if (days === 0) return "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30";
    if (days === 1) return "text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30";
    return "text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30";
  };

  const toggleCardExpansion = (recordId: number) => {
    setExpandedCard(expandedCard === recordId ? null : recordId);
  };

  const handleGetLocationInfo = (locationName: string, suggestion: DonationSuggestion) => {
    setSelectedLocation({
      name: locationName,
      address: suggestion.warehouse_name + ", " +
        suggestion.warehouse_location.latitude + ", " +
        suggestion.warehouse_location.longitude
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedLocation(null);
  };

  const renderEnvironmentalImpact = () => {
    if (!inventoryData) return null;

    const discardedImpact = calculateEnvironmentalImpact(inventoryData.total_discarded_kg);
    const donatedImpact = calculateEnvironmentalImpact(inventoryData.total_donated_kg);

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Lost Environmental Impact */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Environmental Impact Lost</h3>
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
              <span className="text-red-600 dark:text-red-400 text-xl">⚠️</span>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            From {formatNumber(inventoryData.total_discarded_kg)} kg of discarded food
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
              <span className="text-lg font-bold text-red-600 dark:text-red-400">{discardedImpact.co2_kg} kg</span>
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
            From {formatNumber(inventoryData.total_donated_kg)} kg of donated food
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
              <span className="text-lg font-bold text-green-600 dark:text-green-400">{donatedImpact.co2_kg} kg</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Allow administrators and suppliers to view donation suggestions
  if (!isAdmin() && !isSupplier()) {
    return (
      <div className="px-8 pt-8">
        <div className="p-4 text-sm text-yellow-300 bg-yellow-900/20 border border-yellow-800 rounded-md">
          Only administrators and suppliers can view donation suggestions.
        </div>
      </div>
    );
  }

  return (
    <div className="px-8 pt-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Smart Donation Assistant</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Match near-expiry products with local charities using AI to cut waste and support communities.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 text-sm text-red-300 bg-red-900/20 border border-red-800 rounded-md">{error}</div>
      )}

      {data && (
        <div className="mb-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {data.total_products_expiring}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Products Expiring Soon</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {data.top_10_by_weight.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Top Priority Items</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {data.top_10_by_weight.reduce((sum, item) => sum + item.quantity_kg, 0)} kg
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Weight to Donate</div>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400 text-center">{data.message}</div>
        </div>
      )}

      {/* Environmental Impact */}
      <div>
        <div className="flex items-center space-x-2 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Environmental Impact</h2>
          <div className="relative group">
            <button className="w-5 h-5 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 rounded-full flex items-center justify-center transition-colors">
              <svg className="w-3 h-3 text-gray-600 dark:text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
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

      {loading && !data && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-400">Loading donation suggestions...</span>
        </div>
      )}

      {data && data.top_10_by_weight.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Great News!</h3>
          <p className="text-gray-600 dark:text-gray-400">
            No products are expiring in the next 3 days. Your inventory management is on track!
          </p>
        </div>
      )}

      {data && data.top_10_by_weight.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Priority Donation Items (Top 10 by Weight)
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {data.top_10_by_weight.map((suggestion, index) => (
              <div
                key={suggestion.record_id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg flex items-center justify-center text-white font-bold text-sm mr-3">
                        #{index + 1}
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {suggestion.product_name}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Record ID: {suggestion.record_id}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {suggestion.quantity_kg} kg
                      </div>
                    </div>
                  </div>

                  {/* Expiration Info */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getExpirationColor(suggestion.days_until_expiration)}`}
                      >
                        {suggestion.days_until_expiration === 0
                          ? "Expires Today"
                          : suggestion.days_until_expiration === 1
                            ? "Expires Tomorrow"
                            : `Expires in ${suggestion.days_until_expiration} days`}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(suggestion.expiration_date)}
                    </div>
                  </div>

                  {/* Warehouse Info */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {suggestion.warehouse_name}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {suggestion.warehouse_location.latitude.toFixed(4)},{" "}
                          {suggestion.warehouse_location.longitude.toFixed(4)}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">📍 Warehouse Location</div>
                    </div>
                  </div>

                  {/* Donation Locations */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                        Suggested Donation Locations ({suggestion.suggested_donation_locations.length})
                      </h5>
                      <Button
                        label={expandedCard === suggestion.record_id ? "Show Less" : "Show All"}
                        color="secondary"
                        size="extra-small"
                        onClick={() => toggleCardExpansion(suggestion.record_id)}
                      />
                    </div>

                    <div className="space-y-2">
                      {suggestion.suggested_donation_locations
                        .slice(0, expandedCard === suggestion.record_id ? undefined : 3)
                        .map((location, locationIndex) => (
                          <div
                            key={locationIndex}
                            className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 bg-gray-50 dark:bg-gray-700"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center flex-1">
                                <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                                  <span className="text-green-600 dark:text-green-400 text-xs">✓</span>
                                </div>
                                <h6 className="font-medium text-gray-900 dark:text-white text-sm">{location.name}</h6>
                              </div>
                              <button
                                onClick={() => handleGetLocationInfo(location.name, suggestion)}
                                className="ml-3 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-md transition-colors flex-shrink-0 flex items-center"
                              >
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Get Info
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>

                    {suggestion.suggested_donation_locations.length > 3 && expandedCard !== suggestion.record_id && (
                      <div className="text-center mt-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          +{suggestion.suggested_donation_locations.length - 3} more locations
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Location Info Modal */}
      {selectedLocation && (
        <LocationInfoModal
          isOpen={isModalOpen}
          onClose={closeModal}
          locationName={selectedLocation.name}
          locationAddress={selectedLocation.address}
        />
      )}
    </div>
  );
}

export default DonationSuggestionsPage;
