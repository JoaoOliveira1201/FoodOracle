import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import Button from "~/components/Button";

interface Location {
  longitude: number;
  latitude: number;
}

interface Trip {
  trip_id: number;
  truck_id: number | null;
  order_id: number | null;
  origin: Location | null;
  destination: Location | null;
  status: string;
  estimated_time: string | null;
  actual_time: string | null;
  start_date: string | null;
  end_date: string | null;
}

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

interface UpdateFormData {
  truck_id: number | null;
  order_id: number | null;
  status: string;
  estimated_time_days: number;
  estimated_time_hours: number;
  actual_time_days: number;
  actual_time_hours: number;
  start_date: string;
  end_date: string;
}

const TRIP_STATUSES = [
  { value: "Waiting", label: "Waiting" },
  { value: "Collecting", label: "Collecting" },
  { value: "Loaded", label: "Loaded" },
  { value: "Paused", label: "Paused" },
  { value: "Delivering", label: "Delivering" },
  { value: "Delivered", label: "Delivered" },
];

export function EditTrip() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [formData, setFormData] = useState<UpdateFormData>({
    truck_id: null,
    order_id: null,
    status: "Waiting",
    estimated_time_days: 0,
    estimated_time_hours: 0,
    actual_time_days: 0,
    actual_time_hours: 0,
    start_date: "",
    end_date: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!id) {
        setError("Trip ID is required");
        setLoadingData(false);
        return;
      }

      try {
        const [tripResponse, trucksResponse, ordersResponse] = await Promise.all([
          fetch(`http://34.235.125.104:8000/trips/${id}`),
          fetch("http://34.235.125.104:8000/trucks/"),
          fetch("http://34.235.125.104:8000/orders/"),
        ]);

        if (!tripResponse.ok) {
          throw new Error("Failed to fetch trip");
        }

        const [tripData, trucksData, ordersData] = await Promise.all([
          tripResponse.json(),
          trucksResponse.ok ? trucksResponse.json() : [],
          ordersResponse.ok ? ordersResponse.json() : [],
        ]);

        setTrip(tripData);
        setTrucks(trucksData);
        setOrders(ordersData);

        // Parse estimated and actual time if they exist
        let estimatedDays = 0, estimatedHours = 0, actualDays = 0, actualHours = 0;
        
        if (tripData.estimated_time) {
          const durationString = tripData.estimated_time;
          
          // Handle ISO 8601 duration format (PT14400S, PT1H30M, etc.)
          if (durationString.startsWith('PT')) {
            let totalSeconds = 0;
            
            // Extract hours (H), minutes (M), and seconds (S)
            const hoursMatch = durationString.match(/(\d+)H/);
            const minutesMatch = durationString.match(/(\d+)M/);
            const secondsMatch = durationString.match(/(\d+)S/);
            
            if (hoursMatch) totalSeconds += parseInt(hoursMatch[1]) * 3600;
            if (minutesMatch) totalSeconds += parseInt(minutesMatch[1]) * 60;
            if (secondsMatch) totalSeconds += parseInt(secondsMatch[1]);
            
            const hours = Math.floor(totalSeconds / 3600);
            estimatedDays = Math.floor(hours / 24);
            estimatedHours = hours % 24;
          } else {
            // Handle PostgreSQL interval format (e.g., "2 days 03:30:00")
            const match = durationString.match(/(\d+) days? (\d{2}):(\d{2}):(\d{2})/);
            if (match) {
              estimatedDays = parseInt(match[1]);
              estimatedHours = parseInt(match[2]);
            }
          }
        }

        if (tripData.actual_time) {
          const durationString = tripData.actual_time;
          
          // Handle ISO 8601 duration format (PT14400S, PT1H30M, etc.)
          if (durationString.startsWith('PT')) {
            let totalSeconds = 0;
            
            // Extract hours (H), minutes (M), and seconds (S)
            const hoursMatch = durationString.match(/(\d+)H/);
            const minutesMatch = durationString.match(/(\d+)M/);
            const secondsMatch = durationString.match(/(\d+)S/);
            
            if (hoursMatch) totalSeconds += parseInt(hoursMatch[1]) * 3600;
            if (minutesMatch) totalSeconds += parseInt(minutesMatch[1]) * 60;
            if (secondsMatch) totalSeconds += parseInt(secondsMatch[1]);
            
            const hours = Math.floor(totalSeconds / 3600);
            actualDays = Math.floor(hours / 24);
            actualHours = hours % 24;
          } else {
            // Handle PostgreSQL interval format (e.g., "2 days 03:30:00")
            const match = durationString.match(/(\d+) days? (\d{2}):(\d{2}):(\d{2})/);
            if (match) {
              actualDays = parseInt(match[1]);
              actualHours = parseInt(match[2]);
            }
          }
        }

        // Initialize form with current trip data
        setFormData({
          truck_id: tripData.truck_id,
          order_id: tripData.order_id,
          status: tripData.status,
          estimated_time_days: estimatedDays,
          estimated_time_hours: estimatedHours,
          actual_time_days: actualDays,
          actual_time_hours: actualHours,
          start_date: tripData.start_date ? new Date(tripData.start_date).toISOString().slice(0, 16) : "",
          end_date: tripData.end_date ? new Date(tripData.end_date).toISOString().slice(0, 16) : "",
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch data");
      } finally {
        setLoadingData(false);
      }
    }

    fetchData();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === "truck_id" || name === "order_id" ? (value ? Number(value) : null) : 
              name.includes("time_") ? Number(value) : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Format estimated time as PostgreSQL interval
      let estimated_time = null;
      if (formData.estimated_time_days > 0 || formData.estimated_time_hours > 0) {
        estimated_time = `${formData.estimated_time_days} days ${formData.estimated_time_hours.toString().padStart(2, '0')}:00:00`;
      }

      // Format actual time as PostgreSQL interval
      let actual_time = null;
      if (formData.actual_time_days > 0 || formData.actual_time_hours > 0) {
        actual_time = `${formData.actual_time_days} days ${formData.actual_time_hours.toString().padStart(2, '0')}:00:00`;
      }

      const updateData: any = {
        truck_id: formData.truck_id,
        order_id: formData.order_id,
        status: formData.status,
      };

      if (estimated_time) {
        updateData.estimated_time = estimated_time;
      }

      if (actual_time) {
        updateData.actual_time = actual_time;
      }

      if (formData.start_date) {
        updateData.start_date = new Date(formData.start_date).toISOString();
      }

      if (formData.end_date) {
        updateData.end_date = new Date(formData.end_date).toISOString();
      }

      const response = await fetch(`http://34.235.125.104:8000/trips/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to update trip");
      }

      // Success - navigate back to trip info
      navigate(`/trips/info/${id}`);
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
        <span className="ml-3 text-gray-600">Loading trip...</span>
      </div>
    );
  }

  if (error && !trip) {
    return (
      <div className="px-28 pt-14">
        <div className="p-4 text-sm text-red-300 bg-red-900/20 border border-red-800 rounded-md">
          Error: {error}
        </div>
        <div className="mt-4">
          <Button 
            color="secondary" 
            label="Back to Trips" 
            onClick={() => navigate("/trips")} 
          />
        </div>
      </div>
    );
  }

  return (
    <div className="px-28 pt-14">
      <h1 className="text-4xl font-bold mb-6">Edit Trip #{trip?.trip_id}</h1>
      
      {error && (
        <div className="mb-4 p-3 text-sm text-red-300 bg-red-900/20 border border-red-800 rounded-md max-w-2xl">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        {/* Truck Assignment */}
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-100">
            Assigned Truck
          </label>
          <select
            name="truck_id"
            value={formData.truck_id || ""}
            onChange={handleChange}
            className="w-full p-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">No truck assigned</option>
            {trucks
              .filter(truck => truck.status === "Available" || truck.truck_id === formData.truck_id)
              .map(truck => (
                <option key={truck.truck_id} value={truck.truck_id}>
                  Truck {truck.truck_id} ({truck.type}) - {truck.load_capacity_kg}kg capacity
                </option>
              ))}
          </select>
        </div>

        {/* Order Assignment */}
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

        {/* Trip Status */}
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-100">
            Trip Status *
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

        {/* Actual Time */}
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-100">
            Actual Time
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 text-xs text-gray-400">Days</label>
              <input
                type="number"
                name="actual_time_days"
                value={formData.actual_time_days}
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
                name="actual_time_hours"
                value={formData.actual_time_hours}
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

        {/* End Date */}
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-100">
            End Date
          </label>
          <input
            type="datetime-local"
            name="end_date"
            value={formData.end_date}
            onChange={handleChange}
            className="w-full p-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex space-x-4 pt-4">
          <Button 
            type="submit" 
            color="primary" 
            label={isLoading ? "Updating..." : "Update Trip"} 
            onClick={() => {}} 
            disabled={isLoading}
          />
          <Button 
            type="button" 
            color="secondary" 
            label="Cancel" 
            onClick={() => navigate(`/trips/info/${id}`)} 
            disabled={isLoading}
          />
        </div>
      </form>
    </div>
  );
}
