import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import Button from "~/components/Button";

interface WarehouseTransfer {
  transfer_id: number;
  origin_warehouse_id: number;
  destination_warehouse_id: number;
  truck_id: number | null;
  reason: string;
  status: string;
  estimated_time: string | null;
  actual_time: string | null;
  start_date: string | null;
  end_date: string | null;
  created_date: string;
  notes: string | null;
}

interface Truck {
  truck_id: number;
  truck_driver_id: number | null;
  current_location: any;
  status: string;
  type: string;
  load_capacity_kg: number | null;
}

interface UpdateFormData {
  truck_id: number | null;
  status: string;
  estimated_time_days: number;
  estimated_time_hours: number;
  notes: string;
}

const TRANSFER_STATUSES = [
  { value: "Pending", label: "Pending" },
  { value: "Assigned", label: "Assigned" },
  { value: "InTransit", label: "In Transit" },
  { value: "Delivered", label: "Delivered" },
  { value: "Cancelled", label: "Cancelled" },
];

export function EditWarehouseTransfer() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [transfer, setTransfer] = useState<WarehouseTransfer | null>(null);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [formData, setFormData] = useState<UpdateFormData>({
    truck_id: null,
    status: "Pending",
    estimated_time_days: 0,
    estimated_time_hours: 0,
    notes: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!id) {
        setError("Transfer ID is required");
        setLoadingData(false);
        return;
      }

      try {
        const [transferResponse, trucksResponse] = await Promise.all([
          fetch(`http://34.235.125.104:8000/warehouse-transfers/${id}`),
          fetch("http://34.235.125.104:8000/trucks/"),
        ]);

        if (!transferResponse.ok) {
          throw new Error("Failed to fetch transfer");
        }

        const [transferData, trucksData] = await Promise.all([
          transferResponse.json(),
          trucksResponse.ok ? trucksResponse.json() : [],
        ]);

        setTransfer(transferData);
        setTrucks(trucksData);

        // Parse estimated time if exists
        let days = 0, hours = 0;
        if (transferData.estimated_time) {
          const durationString = transferData.estimated_time;
          
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
            
            hours = Math.floor(totalSeconds / 3600);
            days = Math.floor(hours / 24);
            hours = hours % 24;
          } else {
            // Handle PostgreSQL interval format (e.g., "2 days 03:30:00")
            const match = durationString.match(/(\d+) days? (\d{2}):(\d{2}):(\d{2})/);
            if (match) {
              days = parseInt(match[1]);
              hours = parseInt(match[2]);
            }
          }
        }

        // Initialize form with current transfer data
        setFormData({
          truck_id: transferData.truck_id,
          status: transferData.status,
          estimated_time_days: days,
          estimated_time_hours: hours,
          notes: transferData.notes || "",
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch data");
      } finally {
        setLoadingData(false);
      }
    }

    fetchData();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === "truck_id" ? (value ? Number(value) : null) : 
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

      const updateData: any = {
        truck_id: formData.truck_id,
        status: formData.status,
        notes: formData.notes || null,
      };

      if (estimated_time) {
        updateData.estimated_time = estimated_time;
      }

      const response = await fetch(`http://34.235.125.104:8000/warehouse-transfers/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to update warehouse transfer");
      }

      // Success - navigate back to transfer info
      navigate(`/warehouse-transfers/info/${id}`);
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
        <span className="ml-3 text-gray-600">Loading transfer...</span>
      </div>
    );
  }

  if (error && !transfer) {
    return (
      <div className="px-28 pt-14">
        <div className="p-4 text-sm text-red-300 bg-red-900/20 border border-red-800 rounded-md">
          Error: {error}
        </div>
        <div className="mt-4">
          <Button 
            color="secondary" 
            label="Back to Transfers" 
            onClick={() => navigate("/warehouse-transfers")} 
          />
        </div>
      </div>
    );
  }

  return (
    <div className="px-28 pt-14">
      <h1 className="text-4xl font-bold mb-6">Edit Transfer #{transfer?.transfer_id}</h1>
      
      {error && (
        <div className="mb-4 p-3 text-sm text-red-300 bg-red-900/20 border border-red-800 rounded-md max-w-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
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
              .filter(truck => truck.status === "Available")
              .map(truck => (
                <option key={truck.truck_id} value={truck.truck_id}>
                  Truck {truck.truck_id} ({truck.type}) - {truck.load_capacity_kg}kg capacity
                </option>
              ))}
          </select>
        </div>

        {/* Status */}
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-100">
            Transfer Status *
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            required
            className="w-full p-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          >
            {TRANSFER_STATUSES.map(status => (
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

        {/* Notes */}
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-100">
            Notes
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={4}
            className="w-full p-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            placeholder="Optional notes about this transfer..."
          />
        </div>

        <div className="flex space-x-4 pt-4">
          <Button 
            type="submit" 
            color="primary" 
            label={isLoading ? "Updating..." : "Update Transfer"} 
            onClick={() => {}} 
            disabled={isLoading}
          />
          <Button 
            type="button" 
            color="secondary" 
            label="Cancel" 
            onClick={() => navigate(`/warehouse-transfers/info/${id}`)} 
            disabled={isLoading}
          />
        </div>
      </form>
    </div>
  );
}
