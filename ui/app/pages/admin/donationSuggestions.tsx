import { useEffect, useState } from "react";
import Button from "~/components/Button";
import { useAuth } from "~/contexts/AuthContext";

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

export function DonationSuggestionsPage() {
  const { isAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [data, setData] = useState<DonationResponse | null>(null);
  const [expandedCard, setExpandedCard] = useState<number | null>(null);

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

  useEffect(() => {
    if (isAdmin()) {
      fetchDonationSuggestions();
    }
  }, [isAdmin]);


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getExpirationColor = (days: number) => {
    if (days === 0) return "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30";
    if (days === 1) return "text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30";
    return "text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30";
  };

  const toggleCardExpansion = (recordId: number) => {
    setExpandedCard(expandedCard === recordId ? null : recordId);
  };

  if (!isAdmin()) {
    return (
      <div className="px-8 pt-8">
        <div className="p-4 text-sm text-yellow-300 bg-yellow-900/20 border border-yellow-800 rounded-md">
          Only administrators can view donation suggestions.
        </div>
      </div>
    );
  }

  return (
    <div className="px-8 pt-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Donation Suggestions</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          AI-powered suggestions for donating products that are about to expire
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 text-sm text-red-300 bg-red-900/20 border border-red-800 rounded-md">
          {error}
        </div>
      )}

      {data && (
        <div className="mb-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {data.total_products_expiring}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Products Expiring Soon
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {data.top_10_by_weight.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Top Priority Items
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {data.top_10_by_weight.reduce((sum, item) => sum + item.quantity_kg, 0)} kg
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Total Weight to Donate
              </div>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400 text-center">
            {data.message}
          </div>
        </div>
      )}

      {loading && !data && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-400">Loading donation suggestions...</span>
        </div>
      )}

      {data && data.top_10_by_weight.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Great News!
          </h3>
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
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Record ID: {suggestion.record_id}
                        </p>
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
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getExpirationColor(suggestion.days_until_expiration)}`}>
                        {suggestion.days_until_expiration === 0 ? "Expires Today" : 
                         suggestion.days_until_expiration === 1 ? "Expires Tomorrow" :
                         `Expires in ${suggestion.days_until_expiration} days`}
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
                          {suggestion.warehouse_location.latitude.toFixed(4)}, {suggestion.warehouse_location.longitude.toFixed(4)}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        📍 Warehouse Location
                      </div>
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
                          <div className="flex items-center">
                            <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mr-3">
                              <span className="text-green-600 dark:text-green-400 text-xs">✓</span>
                            </div>
                            <h6 className="font-medium text-gray-900 dark:text-white text-sm">
                              {location.name}
                            </h6>
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
    </div>
  );
}

export default DonationSuggestionsPage;
