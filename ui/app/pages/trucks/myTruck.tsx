import { useEffect, useState } from "react";
import { useAuth } from "~/contexts/AuthContext";
import Button from "~/components/Button";

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

export function MyTruck() {
  const { user } = useAuth();
  const [truck, setTruck] = useState<Truck | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateTruckForm, setShowCreateTruckForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);

  const [truckForm, setTruckForm] = useState({
    type: "NORMAL",
    status: "AVAILABLE",
    load_capacity_kg: 1000,
    current_location: {
      latitude: 0,
      longitude: 0,
    },
  });

  useEffect(() => {
    if (user) {
      fetchTruckData();
    }
  }, [user]);

  const fetchTruckData = async () => {
    if (!user) return;

    try {
      const response = await fetch(`http://34.235.125.104:8000/trucks/driver/${user.user_id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.length > 0) {
          setTruck(data[0]);
          setTruckForm({
            type: data[0].type,
            status: data[0].status,
            load_capacity_kg: data[0].load_capacity_kg || 1000,
            current_location: data[0].current_location || { latitude: 0, longitude: 0 },
          });
        }
      }
    } catch (err) {
      console.error("Error fetching truck:", err);
      setError("Failed to load truck data");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTruck = async () => {
    if (!user) return;

    try {
      const response = await fetch("http://34.235.125.104:8000/trucks/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...truckForm,
          truck_driver_id: user.user_id,
        }),
      });

      if (response.ok) {
        setShowCreateTruckForm(false);
        await fetchTruckData();
        setError("");
      } else {
        const errorData = await response.json();
        setError(errorData.detail || "Failed to create truck");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create truck");
    }
  };

  const handleUpdateTruckStatus = async () => {
    if (!truck) return;

    try {
      const response = await fetch(`http://34.235.125.104:8000/trucks/${truck.truck_id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: truckForm.status,
          current_location: truckForm.current_location,
        }),
      });

      if (response.ok) {
        setShowEditForm(false);
        await fetchTruckData();
        setError("");
      } else {
        const errorData = await response.json();
        setError(errorData.detail || "Failed to update truck");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update truck");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "available":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "inservice":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-gray-600">Loading truck...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 px-4 py-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl shadow-lg mb-4">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
              <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
              <g id="SVGRepo_iconCarrier">
                {" "}
                <path
                  d="M18.5 18C18.5 19.1046 17.6046 20 16.5 20C15.3954 20 14.5 19.1046 14.5 18M18.5 18C18.5 16.8954 17.6046 16 16.5 16C15.3954 16 14.5 16.8954 14.5 18M18.5 18H21.5M14.5 18H13.5M8.5 18C8.5 19.1046 7.60457 20 6.5 20C5.39543 20 4.5 19.1046 4.5 18M8.5 18C8.5 16.8954 7.60457 16 6.5 16C5.39543 16 4.5 16.8954 4.5 18M8.5 18H13.5M4.5 18C3.39543 18 2.5 17.1046 2.5 16V7.2C2.5 6.0799 2.5 5.51984 2.71799 5.09202C2.90973 4.71569 3.21569 4.40973 3.59202 4.21799C4.01984 4 4.5799 4 5.7 4H10.3C11.4201 4 11.9802 4 12.408 4.21799C12.7843 4.40973 13.0903 4.71569 13.282 5.09202C13.5 5.51984 13.5 6.0799 13.5 7.2V18M13.5 18V8H17.5L20.5 12M20.5 12V18M20.5 12H13.5"
                  stroke="#ffffff"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                ></path>{" "}
              </g>
            </svg>
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight">
            Truck Management
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Overview and management of the truck.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 text-sm text-red-300 bg-red-900/20 border border-red-800 rounded-md">{error}</div>
        )}

        {/* Truck Information */}
        {!truck ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 text-center">
            <div className="mb-6">
              <svg
                className="w-16 h-16 text-gray-400 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">No Truck Registered</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                You need to create a truck to start receiving assignments
              </p>
            </div>

            {!showCreateTruckForm ? (
              <Button label="Create My Truck" onClick={() => setShowCreateTruckForm(true)} color="primary" />
            ) : (
              <div className="max-w-md mx-auto">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Truck Type
                    </label>
                    <select
                      value={truckForm.type}
                      onChange={(e) => setTruckForm({ ...truckForm, type: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="NORMAL">Normal</option>
                      <option value="REFRIGERATED">Refrigerated</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Load Capacity (kg)
                    </label>
                    <input
                      type="number"
                      value={truckForm.load_capacity_kg}
                      onChange={(e) => setTruckForm({ ...truckForm, load_capacity_kg: parseInt(e.target.value) })}
                      className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Latitude
                      </label>
                      <input
                        type="number"
                        step="0.000001"
                        value={truckForm.current_location.latitude}
                        onChange={(e) =>
                          setTruckForm({
                            ...truckForm,
                            current_location: {
                              ...truckForm.current_location,
                              latitude: parseFloat(e.target.value) || 0,
                            },
                          })
                        }
                        className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Longitude
                      </label>
                      <input
                        type="number"
                        step="0.000001"
                        value={truckForm.current_location.longitude}
                        onChange={(e) =>
                          setTruckForm({
                            ...truckForm,
                            current_location: {
                              ...truckForm.current_location,
                              longitude: parseFloat(e.target.value) || 0,
                            },
                          })
                        }
                        className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <Button label="Create Truck" onClick={handleCreateTruck} color="primary" />
                    <Button label="Cancel" onClick={() => setShowCreateTruckForm(false)} color="secondary" />
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
            {/* Truck Details */}
            <div className="mb-8">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Truck Details</h2>
                <Button
                  label={showEditForm ? "Cancel Edit" : "Update Status & Location"}
                  onClick={() => setShowEditForm(!showEditForm)}
                  color={showEditForm ? "secondary" : "primary-outline"}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">#{truck.truck_id}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Truck ID</div>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">{truck.type}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Type</div>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(truck.status)}`}
                  >
                    {truck.status}
                  </span>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Status</div>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {truck.load_capacity_kg ? `${truck.load_capacity_kg}kg` : "N/A"}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Capacity</div>
                </div>
              </div>

              {truck.current_location && (
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <h4 className="font-semibold text-gray-800 dark:text-white mb-2">Current Location</h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    Latitude: {truck.current_location.latitude.toFixed(6)}, Longitude:{" "}
                    {truck.current_location.longitude.toFixed(6)}
                  </p>
                </div>
              )}
            </div>

            {/* Edit Form */}
            {showEditForm && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">Update Status & Location</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                    <select
                      value={truckForm.status}
                      onChange={(e) => setTruckForm({ ...truckForm, status: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="AVAILABLE">Available</option>
                      <option value="IN_SERVICE">In Service</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Latitude</label>
                    <input
                      type="number"
                      step="0.000001"
                      value={truckForm.current_location.latitude}
                      onChange={(e) =>
                        setTruckForm({
                          ...truckForm,
                          current_location: {
                            ...truckForm.current_location,
                            latitude: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Longitude</label>
                    <input
                      type="number"
                      step="0.000001"
                      value={truckForm.current_location.longitude}
                      onChange={(e) =>
                        setTruckForm({
                          ...truckForm,
                          current_location: {
                            ...truckForm.current_location,
                            longitude: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>
                <div className="mt-6">
                  <Button label="Update Truck" onClick={handleUpdateTruckStatus} color="primary" />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
