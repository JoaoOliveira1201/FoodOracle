import { useState, useEffect } from "react";
import { useNavigate } from "react-router";

interface SeasonalSuggestion {
  title: string;
  summary: string;
}

interface SeasonalAnalysisResponse {
  analysis_date: string;
  season: string;
  suggestions: SeasonalSuggestion[];
  current_inventory_summary: {
    total_products: number;
    total_stock_kg: number;
    refrigeration_products: number;
    average_shelf_life: number;
  };
  seasonal_trends: {
    seasonal_readiness_score: number;
    high_demand_coverage: number;
    average_loss_rate: number;
  };
}

export default function BusinessInsights() {
  const navigate = useNavigate();
  const [seasonalData, setSeasonalData] = useState<SeasonalAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSeasonalExpanded, setIsSeasonalExpanded] = useState(true);

  useEffect(() => {
    fetchSeasonalSuggestions();
  }, []);

  const fetchSeasonalSuggestions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch("http://localhost:8000/seasonal-suggestions/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        const data = await response.json();
        setSeasonalData(data);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || "Failed to fetch seasonal suggestions");
      }
    } catch (err) {
      setError("Failed to connect to the server");
      console.error("Error fetching seasonal suggestions:", err);
    } finally {
      setLoading(false);
    }
  };

  const getSeasonalIcon = (season: string) => {
    switch (season.toLowerCase()) {
      case "spring":
        return "🌸";
      case "summer":
        return "☀️";
      case "autumn":
        return "🍂";
      case "winter":
        return "❄️";
      default:
        return "📊";
    }
  };

  const getSeasonalColor = (season: string) => {
    switch (season.toLowerCase()) {
      case "spring":
        return "from-green-400 to-emerald-500";
      case "summer":
        return "from-yellow-400 to-orange-500";
      case "autumn":
        return "from-orange-400 to-red-500";
      case "winter":
        return "from-blue-400 to-indigo-500";
      default:
        return "from-gray-400 to-gray-500";
    }
  };

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
                Business Insights
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300">
                AI-powered recommendations and strategic business intelligence
              </p>
            </div>
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl shadow-lg flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Seasonal Suggestions Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setIsSeasonalExpanded(!isSeasonalExpanded)}
              className="flex items-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg p-2 transition-colors"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg mr-3 flex items-center justify-center">
                <span className="text-white text-lg">
                  {seasonalData ? getSeasonalIcon(seasonalData.season) : "📊"}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                Seasonal Suggestions
              </h2>
              <svg
                className={`w-6 h-6 ml-3 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${
                  isSeasonalExpanded ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <button
              onClick={fetchSeasonalSuggestions}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analyzing...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh Analysis
                </>
              )}
            </button>
          </div>

          {/* Collapsible Content */}
          <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
            isSeasonalExpanded ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
          }`}>
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

            {loading && !seasonalData && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  <span className="ml-4 text-gray-600 dark:text-gray-300">Loading seasonal analysis...</span>
                </div>
              </div>
            )}

            {seasonalData && (
              <div className="space-y-6">
                {/* Season Overview */}
                <div className={`bg-gradient-to-r ${getSeasonalColor(seasonalData.season)} rounded-2xl shadow-lg p-6 text-white`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-bold mb-2">
                        {getSeasonalIcon(seasonalData.season)} {seasonalData.season.charAt(0).toUpperCase() + seasonalData.season.slice(1)} Season
                      </h3>
                      <p className="text-lg opacity-90">
                        Analysis for {new Date(seasonalData.analysis_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold">
                        {seasonalData.seasonal_trends.seasonal_readiness_score.toFixed(0)}%
                      </div>
                      <div className="text-sm opacity-90">Seasonal Readiness</div>
                    </div>
                  </div>
                </div>

                {/* Inventory Summary */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {seasonalData.current_inventory_summary.total_products}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Total Products</div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {seasonalData.current_inventory_summary.total_stock_kg} kg
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Total Stock</div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {seasonalData.seasonal_trends.high_demand_coverage.toFixed(0)}%
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">High Demand Coverage</div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {seasonalData.seasonal_trends.average_loss_rate.toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Average Loss Rate</div>
                  </div>
                </div>

                {/* AI Suggestions */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                    <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    AI Recommendations
                  </h3>
                  
                  {seasonalData.suggestions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      <p>No specific recommendations available at this time.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {seasonalData.suggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                            {suggestion.title}
                          </h4>
                          <p className="text-gray-600 dark:text-gray-300 text-sm">
                            {suggestion.summary}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Future sections can be added here */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            More Insights Coming Soon
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Additional business intelligence features will be added here, including market trends, 
            performance analytics, and predictive insights.
          </p>
        </div>
      </div>
    </div>
  );
}
