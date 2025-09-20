import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import Button from "~/components/Button";

interface UserDetail {
  user_id: number;
  name: string;
  contact_info: string | null;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  } | null;
  role: string;
}

interface SupplierStatistics {
  total_products_registered: number;
  total_quantity_kg: number;
  total_records: number;
  quality_distribution: {
    Good: number;
    "Sub-optimal": number;
    Bad: number;
  };
  quality_percentages: {
    Good: number;
    "Sub-optimal": number;
    Bad: number;
  };
  status_distribution: {
    InStock: number;
    Sold: number;
    Discarded: number;
  };
  status_percentages: {
    InStock: number;
    Sold: number;
    Discarded: number;
  };
  average_quality_score: number;
  total_revenue_generated: number;
  average_days_to_sell: number;
  performance_rating: string;
  products_list: string[];
  supplier_tier: string;
  tier_score: number;
  tier_breakdown: {
    quality_component: number;
    quantity_component: number;
    success_rate_component: number;
  };
}

export function UserInfo() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
  const [supplierStats, setSupplierStats] = useState<SupplierStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchUserDetail() {
      try {
        const response = await fetch(`http://localhost:8000/users/${id}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setUserDetail(data);
        
        // If user is a supplier, fetch their statistics
        if (data.role === "Supplier") {
          fetchSupplierStats();
        } else {
          setStatsLoading(false);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch user details");
      } finally {
        setLoading(false);
      }
    }

    async function fetchSupplierStats() {
      try {
        const response = await fetch(`http://localhost:8000/product-records/supplier/${id}/statistics`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setSupplierStats(data);
      } catch (err) {
        console.warn("Failed to fetch supplier statistics:", err);
        // Don't set error state for stats, just log it
      } finally {
        setStatsLoading(false);
      }
    }

    if (id) {
      fetchUserDetail();
    }
  }, [id]);

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "Administrator":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      case "Supplier":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "Buyer":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "TruckDriver":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "TruckDriver":
        return "Truck Driver";
      default:
        return role;
    }
  };

  const getTierInfo = (tier: string) => {
    switch (tier.toLowerCase()) {
      case "platinum":
        return {
          image: "/platinum.png",
          color: "from-purple-500 to-pink-500",
          bgColor: "bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20",
          borderColor: "border-purple-300 dark:border-purple-700",
          textColor: "text-purple-800 dark:text-purple-200"
        };
      case "gold":
        return {
          image: "/gold.png",
          color: "from-yellow-400 to-orange-400",
          bgColor: "bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/20 dark:to-orange-900/20",
          borderColor: "border-yellow-300 dark:border-yellow-700",
          textColor: "text-yellow-800 dark:text-yellow-200"
        };
      case "silver":
        return {
          image: "/silver.png",
          color: "from-gray-400 to-gray-500",
          bgColor: "bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700/20 dark:to-gray-800/20",
          borderColor: "border-gray-300 dark:border-gray-600",
          textColor: "text-gray-800 dark:text-gray-200"
        };
      case "bronze":
        return {
          image: "/bronze.png",
          color: "from-orange-600 to-red-600",
          bgColor: "bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/20 dark:to-red-900/20",
          borderColor: "border-orange-300 dark:border-orange-700",
          textColor: "text-orange-800 dark:text-orange-200"
        };
      case "basic":
      default:
        return {
          image: "/basic.png",
          color: "from-gray-500 to-gray-600",
          bgColor: "bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/20 dark:to-gray-900/20",
          borderColor: "border-gray-200 dark:border-gray-600",
          textColor: "text-gray-700 dark:text-gray-300"
        };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-gray-600">Loading user details...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-28 pt-14">
        <div className="p-4 text-sm text-red-300 bg-red-900/20 border border-red-800 rounded-md">
          Error: {error}
        </div>
        <div className="mt-4">
          <Button color="secondary" label="Back to Users" onClick={() => navigate("/users")} />
        </div>
      </div>
    );
  }

  if (!userDetail) {
    return (
      <div className="px-28 pt-14">
        <div className="p-4 text-sm text-gray-300">
          User not found.
        </div>
        <div className="mt-4">
          <Button color="secondary" label="Back to Users" onClick={() => navigate("/users")} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="flex items-center justify-between px-28 pt-14">
        <h1 className="text-4xl font-bold">User: {userDetail.name}</h1>
        <div className="flex space-x-4">
          <Button 
            color="primary" 
            label="Edit User" 
            onClick={() => navigate(`/users/edit/${userDetail.user_id}`)} 
          />
          <Button color="secondary" label="Back to Users" onClick={() => navigate("/users")} />
        </div>
      </div>

      {/* User Details */}
      <div className="px-28 pt-6">
        <div className="bg-gray-800 p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-2xl font-semibold mb-4 text-white">User Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-300">
            <div className="space-y-4">
              <div>
                <span className="font-medium text-gray-100">User ID:</span>
                <div className="mt-1">{userDetail.user_id}</div>
              </div>
              
              <div>
                <span className="font-medium text-gray-100">Name:</span>
                <div className="mt-1 text-lg">{userDetail.name}</div>
              </div>

              <div>
                <span className="font-medium text-gray-100">Contact Information:</span>
                <div className="mt-1">{userDetail.contact_info || "Not provided"}</div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <span className="font-medium text-gray-100">Role:</span>
                <div className="mt-2">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRoleBadgeColor(userDetail.role)}`}
                  >
                    {getRoleDisplayName(userDetail.role)}
                  </span>
                </div>
              </div>

              <div>
                <span className="font-medium text-gray-100">Location:</span>
                <div className="mt-1">
                  {userDetail.location 
                    ? (
                        <div className="space-y-2">
                          {userDetail.location.address && (
                            <div className="text-sm">
                              <div className="font-medium text-gray-200">{userDetail.location.address}</div>
                            </div>
                          )}
                          <div className="text-xs text-gray-400 space-y-1">
                            <div>Latitude: {userDetail.location.latitude.toFixed(6)}</div>
                            <div>Longitude: {userDetail.location.longitude.toFixed(6)}</div>
                          </div>
                        </div>
                      )
                    : "Not provided"
                  }
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Supplier Statistics Dashboard */}
        {userDetail.role === "Supplier" && !statsLoading && supplierStats && (
          <div className="bg-gray-800 p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-2xl font-semibold mb-6 text-white">Supplier Performance Dashboard</h2>
            
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {/* Total Products */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="text-sm font-medium text-blue-600 dark:text-blue-400">Products Registered</div>
                <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{supplierStats.total_products_registered}</div>
              </div>
              
              {/* Total Quantity */}
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <div className="text-sm font-medium text-green-600 dark:text-green-400">Total Quantity</div>
                <div className="text-2xl font-bold text-green-900 dark:text-green-100">{supplierStats.total_quantity_kg} kg</div>
              </div>
              
              {/* Total Revenue */}
              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                <div className="text-sm font-medium text-purple-600 dark:text-purple-400">Revenue Generated</div>
                <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">${supplierStats.total_revenue_generated}</div>
              </div>
              
              {/* Performance Rating */}
              <div className={`p-4 rounded-lg border ${
                supplierStats.performance_rating === "Excellent" ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" :
                supplierStats.performance_rating === "Good" ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800" :
                supplierStats.performance_rating === "Average" ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800" :
                "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
              }`}>
                <div className={`text-sm font-medium ${
                  supplierStats.performance_rating === "Excellent" ? "text-green-600 dark:text-green-400" :
                  supplierStats.performance_rating === "Good" ? "text-blue-600 dark:text-blue-400" :
                  supplierStats.performance_rating === "Average" ? "text-yellow-600 dark:text-yellow-400" :
                  "text-red-600 dark:text-red-400"
                }`}>Performance Rating</div>
                <div className={`text-2xl font-bold ${
                  supplierStats.performance_rating === "Excellent" ? "text-green-900 dark:text-green-100" :
                  supplierStats.performance_rating === "Good" ? "text-blue-900 dark:text-blue-100" :
                  supplierStats.performance_rating === "Average" ? "text-yellow-900 dark:text-yellow-100" :
                  "text-red-900 dark:text-red-100"
                }`}>{supplierStats.performance_rating}</div>
              </div>
            </div>
            
            {/* Quality Distribution */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3 text-white">Quality Distribution</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="text-sm font-medium text-green-600 dark:text-green-400">Good Quality</div>
                  <div className="text-lg font-bold text-green-900 dark:text-green-100">{supplierStats.quality_distribution.Good} kg</div>
                  <div className="text-xs text-green-600 dark:text-green-400">{supplierStats.quality_percentages.Good}%</div>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <div className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Sub-optimal</div>
                  <div className="text-lg font-bold text-yellow-900 dark:text-yellow-100">{supplierStats.quality_distribution["Sub-optimal"]} kg</div>
                  <div className="text-xs text-yellow-600 dark:text-yellow-400">{supplierStats.quality_percentages["Sub-optimal"]}%</div>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="text-sm font-medium text-red-600 dark:text-red-400">Bad Quality</div>
                  <div className="text-lg font-bold text-red-900 dark:text-red-100">{supplierStats.quality_distribution.Bad} kg</div>
                  <div className="text-xs text-red-600 dark:text-red-400">{supplierStats.quality_percentages.Bad}%</div>
                </div>
              </div>
            </div>
            
            {/* Status Distribution */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3 text-white">Product Status Distribution</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="text-sm font-medium text-blue-600 dark:text-blue-400">In Stock</div>
                  <div className="text-lg font-bold text-blue-900 dark:text-blue-100">{supplierStats.status_distribution.InStock} kg</div>
                  <div className="text-xs text-blue-600 dark:text-blue-400">{supplierStats.status_percentages.InStock}%</div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="text-sm font-medium text-green-600 dark:text-green-400">Sold</div>
                  <div className="text-lg font-bold text-green-900 dark:text-green-100">{supplierStats.status_distribution.Sold} kg</div>
                  <div className="text-xs text-green-600 dark:text-green-400">{supplierStats.status_percentages.Sold}%</div>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="text-sm font-medium text-red-600 dark:text-red-400">Discarded</div>
                  <div className="text-lg font-bold text-red-900 dark:text-red-100">{supplierStats.status_distribution.Discarded} kg</div>
                  <div className="text-xs text-red-600 dark:text-red-400">{supplierStats.status_percentages.Discarded}%</div>
                </div>
              </div>
            </div>
            
            {/* Additional Metrics */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg border border-indigo-200 dark:border-indigo-800">
                <div className="text-sm font-medium text-indigo-600 dark:text-indigo-400">Average Quality Score</div>
                <div className="text-xl font-bold text-indigo-900 dark:text-indigo-100">{supplierStats.average_quality_score}/3.0</div>
                <div className="text-xs text-indigo-600 dark:text-indigo-400">Higher is better</div>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
                <div className="text-sm font-medium text-orange-600 dark:text-orange-400">Avg Days to Sell</div>
                <div className="text-xl font-bold text-orange-900 dark:text-orange-100">{supplierStats.average_days_to_sell}</div>
                <div className="text-xs text-orange-600 dark:text-orange-400">Days on average</div>
              </div>
            </div>
            
            {/* Products List */}
            {supplierStats.products_list.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 text-white">Products Supplied</h3>
                <div className="bg-gray-700 p-3 rounded-lg">
                  <div className="flex flex-wrap gap-2">
                    {supplierStats.products_list.map((product, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-600 text-gray-200"
                      >
                        {product}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Supplier Tier Display */}
        {userDetail.role === "Supplier" && !statsLoading && supplierStats && supplierStats.supplier_tier && (
          <div className="bg-gray-800 p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-2xl font-semibold mb-6 text-white">Supplier Tier Classification</h2>

            <div className="flex flex-col lg:flex-row items-center justify-center gap-8">
              {/* Tier Image and Name */}
              <div className="flex flex-col items-center">
                <div className={`${getTierInfo(supplierStats.supplier_tier).bgColor} ${getTierInfo(supplierStats.supplier_tier).borderColor} border-2 rounded-full p-8 mb-4 shadow-lg`}>
                  <img
                    src={getTierInfo(supplierStats.supplier_tier).image}
                    alt={`${supplierStats.supplier_tier} Tier`}
                    className="w-24 h-24 object-contain"
                  />
                </div>
                <h3 className={`text-3xl font-bold ${getTierInfo(supplierStats.supplier_tier).textColor} mb-2`}>
                  {supplierStats.supplier_tier.toUpperCase()} TIER
                </h3>
                <div className="text-center">
                  <div className="text-xl font-semibold text-white mb-1">
                    Score: {supplierStats.tier_score}/100
                  </div>
                  <div className="text-sm text-gray-400">
                    Based on weighted performance metrics
                  </div>
                </div>
              </div>

              {/* Tier Breakdown */}
              <div className="flex-1 max-w-md">
                <h4 className="text-lg font-semibold text-white mb-4">Score Breakdown</h4>
                <div className="space-y-3">
                  {/* Quality Component */}
                  <div className="bg-gray-700 p-3 rounded-lg">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-300">Product Quality (60%)</span>
                      <span className="text-sm font-semibold text-green-400">
                        {supplierStats.tier_breakdown.quality_component.toFixed(1)} pts
                      </span>
                    </div>
                    <div className="w-full bg-gray-600 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(supplierStats.tier_breakdown.quality_component / 60) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Quantity Component */}
                  <div className="bg-gray-700 p-3 rounded-lg">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-300">Quantity Delivered (30%)</span>
                      <span className="text-sm font-semibold text-blue-400">
                        {supplierStats.tier_breakdown.quantity_component.toFixed(1)} pts
                      </span>
                    </div>
                    <div className="w-full bg-gray-600 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(supplierStats.tier_breakdown.quantity_component / 30) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Success Rate Component */}
                  <div className="bg-gray-700 p-3 rounded-lg">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-300">Success Rate (10%)</span>
                      <span className="text-sm font-semibold text-purple-400">
                        {supplierStats.tier_breakdown.success_rate_component.toFixed(1)} pts
                      </span>
                    </div>
                    <div className="w-full bg-gray-600 rounded-full h-2">
                      <div
                        className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(supplierStats.tier_breakdown.success_rate_component / 10) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Tier Requirements */}
                <div className="mt-4 p-3 bg-gray-700 rounded-lg">
                  <h5 className="text-xs font-semibold text-gray-400 mb-2">TIER REQUIREMENTS</h5>
                  <div className="text-xs text-gray-500 space-y-1">
                    <div>Platinum: 90-100 pts</div>
                    <div>Gold: 80-89 pts</div>
                    <div>Silver: 70-79 pts</div>
                    <div>Bronze: 50-69 pts</div>
                    <div>Basic: &lt;50 pts</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Role-specific information or actions could be added here */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4 text-white">Role Information</h2>
          <div className="text-gray-300">
            {userDetail.role === "Administrator" && (
              <p>This user has administrative privileges and can manage the entire system.</p>
            )}
            {userDetail.role === "Supplier" && (
              <p>This user can supply products to the system and manage their inventory.</p>
            )}
            {userDetail.role === "Buyer" && (
              <p>This user can purchase products from suppliers through the system.</p>
            )}
            {userDetail.role === "TruckDriver" && (
              <p>This user is responsible for transporting goods between locations.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}