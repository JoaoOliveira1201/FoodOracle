import { useEffect, useState } from "react";
import { useAuth } from "~/contexts/AuthContext";
import { formatDuration } from "~/helpers/homeUtils";

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

interface Trip {
  trip_id: number;
  truck_id: number | null;
  order_id: number | null;
  origin: {
    latitude: number;
    longitude: number;
  } | null;
  destination: {
    latitude: number;
    longitude: number;
  } | null;
  status: string;
  estimated_time: string | null;
  actual_time: string | null;
  start_date: string | null;
  end_date: string | null;
  origin_warehouse_name: string | null;
  destination_user_name: string | null;
}

export function MyTrips() {
  const { user } = useAuth();
  const [truck, setTruck] = useState<Truck | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
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
      fetchTrips();
    }
  }, [truck]);

  const fetchTruckData = async () => {
    if (!user) return;

    try {
      const response = await fetch(`http://34.235.125.104:8000/trucks/driver/${user.user_id}`);
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

  const fetchTrips = async () => {
    if (!truck) return;

    try {
      const response = await fetch(`http://34.235.125.104:8000/trips/truck/${truck.truck_id}/with-names`);
      if (response.ok) {
        const data = await response.json();
        setTrips(data);
      }
    } catch (err) {
      console.error("Error fetching trips:", err);
      setError("Failed to load trips");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "waiting":
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
      case "collecting":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "loaded":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "paused":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      case "delivering":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      case "delivered":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "waiting":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case "collecting":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
            />
          </svg>
        );
      case "loaded":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
        );
      case "delivering":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      case "delivered":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
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

  const formatCoordinates = (coords: { latitude: number; longitude: number } | null) => {
    if (!coords) return "N/A";
    return `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`;
  };

  const toggleCard = (tripId: number) => {
    setExpandedCards((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(tripId)) {
        newSet.delete(tripId);
      } else {
        newSet.add(tripId);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-gray-600">Loading trips...</span>
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
              You need to create a truck first to view delivery trips.
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
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl shadow-lg mb-4">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
              <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
              <g id="SVGRepo_iconCarrier">
                {" "}
                <path
                  d="M9.09557 20.7929L11.9274 14.6574C11.9505 14.6073 11.962 14.5822 11.978 14.5744C11.9919 14.5676 12.0081 14.5676 12.022 14.5744C12.038 14.5822 12.0495 14.6073 12.0726 14.6574L14.9044 20.7929C14.9337 20.8564 14.9484 20.8882 14.9425 20.9067C14.9374 20.9227 14.9247 20.9351 14.9085 20.9396C14.8899 20.9449 14.8586 20.9293 14.796 20.898L12.0358 19.5179L12.0358 19.5179C12.0227 19.5113 12.0161 19.508 12.0092 19.5068C12.0031 19.5056 11.9969 19.5056 11.9908 19.5068C11.9839 19.508 11.9773 19.5113 11.9642 19.5179L11.9642 19.5179L9.20399 20.898C9.14142 20.9293 9.11014 20.9449 9.09149 20.9396C9.07533 20.9351 9.06256 20.9227 9.05748 20.9067C9.0516 20.8882 9.06626 20.8564 9.09557 20.7929Z"
                  stroke="#ffffff"
                  stroke-width="2"
                  stroke-linecap="round"
                ></path>{" "}
                <path d="M4 18L7 4" stroke="#ffffff" stroke-width="2" stroke-linecap="round"></path>{" "}
                <path d="M20 18L17 4" stroke="#ffffff" stroke-width="2" stroke-linecap="round"></path>{" "}
                <path d="M12 11L12 9" stroke="#ffffff" stroke-width="2" stroke-linecap="round"></path>{" "}
                <path d="M12 6L12 4" stroke="#ffffff" stroke-width="2" stroke-linecap="round"></path>{" "}
              </g>
            </svg>
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight">
            Delivery History
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-4">
            Monitor and tracking of deliveries across the supply chain network.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Truck #{truck.truck_id} • {truck.type} • {truck.status}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 text-sm text-red-300 bg-red-900/20 border border-red-800 rounded-md">{error}</div>
        )}

        {/* Trips List */}
        {trips.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">No Delivery Trips</h3>
            <p className="text-gray-600 dark:text-gray-300">
              You don't have any delivery trips assigned to your truck yet.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {trips.map((trip) => {
              const isExpanded = expandedCards.has(trip.trip_id);
              return (
                <div key={trip.trip_id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
                  {/* Header */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => toggleCard(trip.trip_id)}
                        className="flex-shrink-0 p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        aria-label={isExpanded ? "Collapse trip details" : "Expand trip details"}
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
                        <h3 className="text-2xl font-semibold text-gray-800 dark:text-white">Trip #{trip.trip_id}</h3>
                        {trip.order_id && (
                          <p className="text-gray-600 dark:text-gray-400 mt-1">Order ID: #{trip.order_id}</p>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 md:mt-0">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(trip.status)}`}
                      >
                        <span className="mr-2">{getStatusIcon(trip.status)}</span>
                        {trip.status}
                      </span>
                    </div>
                  </div>

                  {/* Collapsible Content */}
                  {isExpanded && (
                    <div className="space-y-6">
                      {/* Trip Route */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <div className="flex items-center mb-2">
                            <svg
                              className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                              />
                            </svg>
                            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                              Origin Warehouse
                            </span>
                          </div>
                          <div className="font-semibold text-gray-800 dark:text-white">
                            {trip.origin_warehouse_name || "Unknown Warehouse"}
                          </div>
                          {trip.origin && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {formatCoordinates(trip.origin)}
                            </div>
                          )}
                        </div>

                        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <div className="flex items-center mb-2">
                            <svg
                              className="w-5 h-5 text-green-600 dark:text-green-400 mr-2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                              />
                            </svg>
                            <span className="text-sm font-medium text-green-600 dark:text-green-400">
                              Destination Customer
                            </span>
                          </div>
                          <div className="font-semibold text-gray-800 dark:text-white">
                            {trip.destination_user_name || "Unknown Customer"}
                          </div>
                          {trip.destination && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {formatCoordinates(trip.destination)}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Timing Information */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        {trip.start_date && (
                          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Start Date</div>
                            <div className="font-semibold text-gray-800 dark:text-white text-sm">
                              {formatDate(trip.start_date)}
                            </div>
                          </div>
                        )}

                        {trip.end_date && (
                          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">End Date</div>
                            <div className="font-semibold text-gray-800 dark:text-white text-sm">
                              {formatDate(trip.end_date)}
                            </div>
                          </div>
                        )}

                        {trip.estimated_time && (
                          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                            <div className="text-sm text-yellow-600 dark:text-yellow-400 mb-1">Estimated Time</div>
                            <div className="font-semibold text-gray-800 dark:text-white text-sm">
                              {formatDuration(trip.estimated_time)}
                            </div>
                          </div>
                        )}

                        {trip.actual_time && (
                          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <div className="text-sm text-green-600 dark:text-green-400 mb-1">Actual Time</div>
                            <div className="font-semibold text-gray-800 dark:text-white text-sm">
                              {formatDuration(trip.actual_time)}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Progress Indicator */}
                      <div className="mt-6">
                        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                          <span>Progress</span>
                          <span>{trip.status}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                              trip.status.toLowerCase() === "delivered"
                                ? "bg-green-600 w-full"
                                : trip.status.toLowerCase() === "delivering"
                                  ? "bg-purple-600 w-4/5"
                                  : trip.status.toLowerCase() === "loaded"
                                    ? "bg-blue-600 w-3/5"
                                    : trip.status.toLowerCase() === "collecting"
                                      ? "bg-yellow-600 w-2/5"
                                      : "bg-gray-400 w-1/5"
                            }`}
                          ></div>
                        </div>
                      </div>
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
