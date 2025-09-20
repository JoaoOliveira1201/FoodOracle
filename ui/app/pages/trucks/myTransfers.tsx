import { useEffect, useState } from "react";
import { useAuth } from "~/contexts/AuthContext";

interface Truck {
  truck_id: number;
  truck_driver_id: number | null;
  current_location: {
    latitude: number;
    longitude: number;
  } | null;
  status: string;
  type: string;
  load_capacity_kg: number | null;
}

interface Warehouse {
  warehouse_id: number;
  name: string;
  location: any;
  normal_capacity_kg: number | null;
  refrigerated_capacity_kg: number | null;
}

interface WarehouseTransfer {
  transfer_id: number;
  record_id: number | null;
  origin_warehouse_id: number | null;
  destination_warehouse_id: number | null;
  truck_id: number | null;
  status: string;
  reason: string | null;
  estimated_time: string | null;
  actual_time: string | null;
  requested_date: string | null;
  start_date: string | null;
  completed_date: string | null;
  notes: string | null;
}

export function MyTransfers() {
  const { user } = useAuth();
  const [truck, setTruck] = useState<Truck | null>(null);
  const [transfers, setTransfers] = useState<WarehouseTransfer[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (user) {
      fetchTruckData();
    }
  }, [user]);

  useEffect(() => {
    if (truck) {
      fetchTransfers();
    }
  }, [truck]);

  const fetchTruckData = async () => {
    if (!user) return;

    try {
      const response = await fetch(`http://localhost:8000/trucks/driver/${user.user_id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.length > 0) {
          setTruck(data[0]);
        } else {
          setLoading(false);
        }
      }
    } catch (err) {
      console.error("Error fetching truck:", err);
      setError("Failed to load truck data");
      setLoading(false);
    }
  };

  const fetchTransfers = async () => {
    if (!truck) return;

    try {
      const [transfersResponse, warehousesResponse] = await Promise.all([
        fetch(`http://localhost:8000/warehouse-transfers/truck/${truck.truck_id}`),
        fetch("http://localhost:8000/warehouses/"),
      ]);

      if (transfersResponse.ok && warehousesResponse.ok) {
        const [transfersData, warehousesData] = await Promise.all([
          transfersResponse.json(),
          warehousesResponse.json(),
        ]);

        setTransfers(transfersData);
        setWarehouses(warehousesData);
      } else {
        setError("Failed to load data");
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load transfers");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "intransit":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const getReasonColor = (reason: string) => {
    switch (reason.toLowerCase()) {
      case "restock":
        return "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400";
      case "redistribution":
        return "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400";
      case "emergency":
        return "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400";
      case "optimization":
        return "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400";
      default:
        return "bg-gray-50 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return (
      new Date(dateString).toLocaleDateString() +
      " " +
      new Date(dateString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  const getWarehouseName = (warehouseId: number | null) => {
    if (!warehouseId) return "N/A";
    const warehouse = warehouses.find((w) => w.warehouse_id === warehouseId);
    return warehouse?.name || `Warehouse #${warehouseId}`;
  };

  const toggleCard = (transferId: number) => {
    setExpandedCards((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(transferId)) {
        newSet.delete(transferId);
      } else {
        newSet.add(transferId);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-gray-600">Loading transfers...</span>
      </div>
    );
  }

  if (!truck) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">No Truck Registered</h3>
            <p className="text-gray-600 dark:text-gray-300">
              You need to create a truck first to view warehouse transfers.
              <a href="/myTruck" className="text-blue-600 dark:text-blue-400 hover:underline ml-1">
                Create your truck here
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 px-4 py-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-teal-500 rounded-2xl shadow-lg mb-4">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
              <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
              <g id="SVGRepo_iconCarrier">
                {" "}
                <path
                  d="M18 4L21 7M21 7L18 10M21 7H7C4.79086 7 3 8.79086 3 11M6 20L3 17M3 17L6 14M3 17H17C19.2091 17 21 15.2091 21 13"
                  stroke="#ffffff"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                ></path>{" "}
              </g>
            </svg>
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight">
            Transfer History
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-4">
            Overview and history of movements across warehouse facilities.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Truck #{truck.truck_id} • {truck.type} • {truck.status}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 text-sm text-red-300 bg-red-900/20 border border-red-800 rounded-md">{error}</div>
        )}

        {/* Transfers List */}
        {transfers.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">No Warehouse Transfers</h3>
            <p className="text-gray-600 dark:text-gray-300">
              You don't have any warehouse transfers assigned to your truck yet.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {transfers.map((transfer) => {
              const isExpanded = expandedCards.has(transfer.transfer_id);
              return (
                <div key={transfer.transfer_id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
                  {/* Header */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => toggleCard(transfer.transfer_id)}
                        className="flex-shrink-0 p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        aria-label={isExpanded ? "Collapse transfer details" : "Expand transfer details"}
                      >
                        <svg
                          className={`w-5 h-5 text-gray-600 dark:text-gray-300 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                      <div>
                        <h3 className="text-2xl font-semibold text-gray-800 dark:text-white">
                          Transfer #{transfer.transfer_id}
                        </h3>
                        {transfer.record_id && (
                          <p className="text-gray-600 dark:text-gray-400 mt-1">Record ID: #{transfer.record_id}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col md:flex-row gap-2 mt-4 md:mt-0">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(transfer.status)}`}
                      >
                        {transfer.status}
                      </span>
                      {transfer.reason && (
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getReasonColor(transfer.reason)}`}
                        >
                          {transfer.reason}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Collapsible Content */}
                  {isExpanded && (
                    <div className="space-y-6">
                      {/* Transfer Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Origin Warehouse</div>
                          <div className="font-semibold text-gray-800 dark:text-white">
                            {getWarehouseName(transfer.origin_warehouse_id)}
                          </div>
                          {transfer.origin_warehouse_id && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              ID: #{transfer.origin_warehouse_id}
                            </div>
                          )}
                        </div>

                        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Destination Warehouse</div>
                          <div className="font-semibold text-gray-800 dark:text-white">
                            {getWarehouseName(transfer.destination_warehouse_id)}
                          </div>
                          {transfer.destination_warehouse_id && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              ID: #{transfer.destination_warehouse_id}
                            </div>
                          )}
                        </div>

                        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Requested Date</div>
                          <div className="font-semibold text-gray-800 dark:text-white">
                            {formatDate(transfer.requested_date)}
                          </div>
                        </div>
                      </div>

                      {/* Timing Information */}
                      {(transfer.start_date || transfer.completed_date || transfer.estimated_time) && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                          {transfer.start_date && (
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                              <div className="text-sm text-blue-600 dark:text-blue-400 mb-1">Start Date</div>
                              <div className="font-semibold text-gray-800 dark:text-white">
                                {formatDate(transfer.start_date)}
                              </div>
                            </div>
                          )}

                          {transfer.completed_date && (
                            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                              <div className="text-sm text-green-600 dark:text-green-400 mb-1">Completed Date</div>
                              <div className="font-semibold text-gray-800 dark:text-white">
                                {formatDate(transfer.completed_date)}
                              </div>
                            </div>
                          )}

                          {transfer.estimated_time && (
                            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                              <div className="text-sm text-yellow-600 dark:text-yellow-400 mb-1">Estimated Time</div>
                              <div className="font-semibold text-gray-800 dark:text-white">
                                {transfer.estimated_time}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Notes */}
                      {transfer.notes && (
                        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Notes</div>
                          <p className="text-gray-800 dark:text-white">{transfer.notes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
