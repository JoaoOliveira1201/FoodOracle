import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import Button from "~/components/Button";

interface Truck {
  truck_id: number;
  truck_driver_id: number | null;
  current_location: any;
  status: string;
  type: string;
  load_capacity_kg: number | null;
}

interface Order {
  order_id: number;
  buyer_id: number | null;
  order_date: string | null;
  status: string;
  total_amount: number | null;
}

interface Client {
  user_id: number;
  name: string;
  contact_info: string | null;
  location: {
    latitude: number;
    longitude: number;
  } | null;
  role: string;
}

interface TripFormData {
  truck_id: number | null;
  order_id: number | null;
  origin_latitude: string;
  origin_longitude: string;
  client_id: number | null;
  status: string;
  estimated_time_days: number;
  estimated_time_hours: number;
  start_date: string;
}

const TRIP_STATUSES = [
  { value: "Waiting", label: "Waiting" },
  { value: "Collecting", label: "Collecting" },
  { value: "Loaded", label: "Loaded" },
  { value: "Paused", label: "Paused" },
  { value: "Delivering", label: "Delivering" },
  { value: "Delivered", label: "Delivered" },
];

export function CreateTrip() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<TripFormData>({
    truck_id: null,
    order_id: null,
    origin_latitude: "",
    origin_longitude: "",
    client_id: null,
    status: "Waiting",
    estimated_time_days: 0,
    estimated_time_hours: 0,
    start_date: "",
  });
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoadingData(true);
        const [trucksResponse, ordersResponse, clientsResponse] = await Promise.all([
          fetch("http://localhost:8000/trucks/"),
          fetch("http://localhost:8000/orders/"),
          fetch("http://localhost:8000/users/role/Buyer"),
        ]);

        if (!trucksResponse.ok || !ordersResponse.ok || !clientsResponse.ok) {
          throw new Error("Failed to fetch data");
        }

        const [trucksData, ordersData, clientsData] = await Promise.all([
          trucksResponse.json(),
          ordersResponse.json(),
          clientsResponse.json(),
        ]);

        setTrucks(trucksData);
        setOrders(ordersData);
        setClients(clientsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch data");
      } finally {
        setLoadingData(false);
      }
    }

    fetchData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let processedValue: any = value;
    
    if (name.includes("_id")) {
      processedValue = value ? Number(value) : null;
    } else if (name.includes("time_")) {
      processedValue = Number(value);
    }

    setFormData({
      ...formData,
      [name]: processedValue,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Validate origin coordinates
    const originLat = parseFloat(formData.origin_latitude);
    const originLng = parseFloat(formData.origin_longitude);

    if (isNaN(originLat) || isNaN(originLng)) {
      setError("Please enter valid coordinates for origin");
      setIsLoading(false);
      return;
    }

    if (originLat < -90 || originLat > 90) {
      setError("Origin latitude must be between -90 and 90 degrees");
      setIsLoading(false);
      return;
    }

    if (originLng < -180 || originLng > 180) {
      setError("Origin longitude must be between -180 and 180 degrees");
      setIsLoading(false);
      return;
    }

    // Get destination coordinates from selected client
    const selectedClient = clients.find(client => client.user_id === formData.client_id);
    if (!selectedClient || !selectedClient.location) {
      setError("Please select a client with a valid location");
      setIsLoading(false);
      return;
    }

    const destLat = selectedClient.location.latitude;
    const destLng = selectedClient.location.longitude;

    try {
      // Format estimated time as PostgreSQL interval
      let estimated_time = null;
      if (formData.estimated_time_days > 0 || formData.estimated_time_hours > 0) {
        estimated_time = `${formData.estimated_time_days} days ${formData.estimated_time_hours.toString().padStart(2, '0')}:00:00`;
      }

      const tripData: any = {
        truck_id: formData.truck_id,
        order_id: formData.order_id,
        origin: {
          latitude: originLat,
          longitude: originLng,
        },
        destination: {
          latitude: destLat,
          longitude: destLng,
        },
        status: formData.status,
      };

      if (estimated_time) {
        tripData.estimated_time = estimated_time;
      }

      if (formData.start_date) {
        tripData.start_date = new Date(formData.start_date).toISOString();
      }

      const response = await fetch("http://localhost:8000/trips/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(tripData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to create trip");
      }

      // Success - navigate back to trips list
      navigate("/trips");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-gray-600">Loading data...</span>
      </div>
    );
  }

  return (
    <div className="px-28 pt-14">
      <h1 className="text-4xl font-bold mb-6">Create Trip</h1>
      
      {error && (
        <div className="mb-4 p-3 text-sm text-red-300 bg-red-900/20 border border-red-800 rounded-md max-w-2xl">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        {/* Truck Selection */}
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-100">
            Assign Truck
          </label>
          <select
            name="truck_id"
            value={formData.truck_id || ""}
            onChange={handleChange}
            className="w-full p-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">No truck assigned</option>
            {trucks
              .filter(truck => truck.status === "Available")
              .map(truck => (
                <option key={truck.truck_id} value={truck.truck_id}>
                  Truck {truck.truck_id} ({truck.type}) - {truck.load_capacity_kg}kg capacity
                </option>
              ))}
          </select>
        </div>

        {/* Order Selection */}
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-100">
            Related Order
          </label>
          <select
            name="order_id"
            value={formData.order_id || ""}
            onChange={handleChange}
            className="w-full p-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">No order assigned</option>
            {orders.map(order => (
              <option key={order.order_id} value={order.order_id}>
                Order #{order.order_id} - {order.status} - ${order.total_amount || 0}
              </option>
            ))}
          </select>
        </div>

        {/* Origin Coordinates */}
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-100">
            Origin Location *
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 text-xs text-gray-400">Latitude</label>
              <input
                type="number"
                name="origin_latitude"
                value={formData.origin_latitude}
                onChange={handleChange}
                step="any"
                required
                className="w-full p-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                placeholder="40.7128"
              />
            </div>
            <div>
              <label className="block mb-1 text-xs text-gray-400">Longitude</label>
              <input
                type="number"
                name="origin_longitude"
                value={formData.origin_longitude}
                onChange={handleChange}
                step="any"
                required
                className="w-full p-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                placeholder="-74.0060"
              />
            </div>
          </div>
        </div>

        {/* Client Selection */}
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-100">
            Destination Client *
          </label>
          <select
            name="client_id"
            value={formData.client_id || ""}
            onChange={handleChange}
            required
            className="w-full p-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">Select a client...</option>
            {clients
              .filter(client => client.location !== null)
              .map(client => (
                <option key={client.user_id} value={client.user_id}>
                  {client.name} - {client.location ? `(${client.location.latitude.toFixed(4)}, ${client.location.longitude.toFixed(4)})` : 'No location'}
                </option>
              ))}
          </select>
          {formData.client_id && (
            <div className="mt-2 text-sm text-gray-400">
              {(() => {
                const selectedClient = clients.find(c => c.user_id === formData.client_id);
                return selectedClient?.location 
                  ? `Destination: ${selectedClient.location.latitude.toFixed(6)}, ${selectedClient.location.longitude.toFixed(6)}`
                  : 'Client location not available';
              })()}
            </div>
          )}
        </div>

        {/* Trip Status */}
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-100">
            Initial Status *
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            required
            className="w-full p-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          >
            {TRIP_STATUSES.map(status => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>

        {/* Estimated Time */}
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-100">
            Estimated Time
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 text-xs text-gray-400">Days</label>
              <input
                type="number"
                name="estimated_time_days"
                value={formData.estimated_time_days}
                onChange={handleChange}
                min="0"
                className="w-full p-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block mb-1 text-xs text-gray-400">Hours</label>
              <input
                type="number"
                name="estimated_time_hours"
                value={formData.estimated_time_hours}
                onChange={handleChange}
                min="0"
                max="23"
                className="w-full p-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {/* Start Date */}
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-100">
            Start Date
          </label>
          <input
            type="datetime-local"
            name="start_date"
            value={formData.start_date}
            onChange={handleChange}
            className="w-full p-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex space-x-4 pt-4">
          <Button 
            type="submit" 
            color="primary" 
            label={isLoading ? "Creating..." : "Create Trip"} 
            onClick={() => {}} 
            disabled={isLoading}
          />
          <Button 
            type="button" 
            color="secondary" 
            label="Cancel" 
            onClick={() => navigate("/trips")} 
            disabled={isLoading}
          />
        </div>
      </form>
    </div>
  );
}
