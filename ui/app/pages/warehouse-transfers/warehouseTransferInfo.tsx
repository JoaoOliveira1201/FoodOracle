import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import Button from "~/components/Button";
import { formatDuration } from "~/helpers/homeUtils";

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

interface Warehouse {
  warehouse_id: number;
  name: string;
  location: any;
  normal_capacity_kg: number | null;
  refrigerated_capacity_kg: number | null;
}

interface Truck {
  truck_id: number;
  truck_driver_id: number | null;
  current_location: any;
  status: string;
  type: string;
  load_capacity_kg: number | null;
}

export function WarehouseTransferInfo() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [transfer, setTransfer] = useState<WarehouseTransfer | null>(null);
  const [originWarehouse, setOriginWarehouse] = useState<Warehouse | null>(null);
  const [destinationWarehouse, setDestinationWarehouse] = useState<Warehouse | null>(null);
  const [truck, setTruck] = useState<Truck | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchTransfer() {
      if (!id) {
        setError("Transfer ID is required");
        setLoading(false);
        return;
      }

      try {
        const transferResponse = await fetch(`http://34.235.125.104:8000/warehouse-transfers/${id}`);
        
        if (!transferResponse.ok) {
          throw new Error(`Failed to fetch transfer: ${transferResponse.status}`);
        }
        
        const transferData = await transferResponse.json();
        setTransfer(transferData);

        // Fetch related data
        const [warehousesResponse, trucksResponse] = await Promise.all([
          fetch("http://34.235.125.104:8000/warehouses/"),
          fetch("http://34.235.125.104:8000/trucks/"),
        ]);

        if (warehousesResponse.ok && trucksResponse.ok) {
          const [warehousesData, trucksData] = await Promise.all([
            warehousesResponse.json(),
            trucksResponse.json(),
          ]);

          // Find origin and destination warehouses
          const origin = warehousesData.find((w: Warehouse) => w.warehouse_id === transferData.origin_warehouse_id);
          const destination = warehousesData.find((w: Warehouse) => w.warehouse_id === transferData.destination_warehouse_id);
          setOriginWarehouse(origin || null);
          setDestinationWarehouse(destination || null);

          // Find assigned truck
          if (transferData.truck_id) {
            const assignedTruck = trucksData.find((t: Truck) => t.truck_id === transferData.truck_id);
            setTruck(assignedTruck || null);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch transfer");
      } finally {
        setLoading(false);
      }
    }

    fetchTransfer();
  }, [id]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };


  const getStatusColor = (status: string) => {
    const colors = {
      "Pending": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      "Assigned": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      "InTransit": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
      "Delivered": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      "Cancelled": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
  };

  const getReasonColor = (reason: string) => {
    const colors = {
      "Restock": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      "Redistribution": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
      "Emergency": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      "Optimization": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    };
    return colors[reason as keyof typeof colors] || "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-gray-600">Loading transfer...</span>
      </div>
    );
  }

  if (error || !transfer) {
    return (
      <div className="px-28 pt-14">
        <div className="p-4 text-sm text-red-300 bg-red-900/20 border border-red-800 rounded-md">
          Error: {error || "Transfer not found"}
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-4xl font-bold">Transfer #{transfer.transfer_id}</h1>
        <div className="flex space-x-2">
          <Button 
            color="primary" 
            label="Edit" 
            onClick={() => navigate(`/warehouse-transfers/edit/${transfer.transfer_id}`)} 
          />
          <Button 
            color="secondary" 
            label="Back to Transfers" 
            onClick={() => navigate("/warehouse-transfers")} 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transfer Information */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-600">
          <h2 className="text-xl font-semibold mb-4 text-white">Transfer Information</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Transfer ID:</span>
              <span className="text-white">#{transfer.transfer_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Reason:</span>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getReasonColor(transfer.reason)}`}
              >
                {transfer.reason}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Status:</span>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(transfer.status)}`}
              >
                {transfer.status}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Created Date:</span>
              <span className="text-white">{formatDate(transfer.created_date)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Start Date:</span>
              <span className="text-white">{formatDate(transfer.start_date)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">End Date:</span>
              <span className="text-white">{formatDate(transfer.end_date)}</span>
            </div>
          </div>
        </div>

        {/* Timing Information */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-600">
          <h2 className="text-xl font-semibold mb-4 text-white">Timing Information</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Estimated Time:</span>
              <span className="text-white">{formatDuration(transfer.estimated_time)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Actual Time:</span>
              <span className="text-white">{formatDuration(transfer.actual_time)}</span>
            </div>
            {transfer.start_date && transfer.end_date && (
              <div className="flex justify-between">
                <span className="text-gray-400">Duration:</span>
                <span className="text-white">
                  {Math.round((new Date(transfer.end_date).getTime() - new Date(transfer.start_date).getTime()) / (1000 * 60 * 60 * 24))} days
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Warehouse Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Origin Warehouse */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-600">
          <h2 className="text-xl font-semibold mb-4 text-white">Origin Warehouse</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Warehouse ID:</span>
              <span className="text-white">{transfer.origin_warehouse_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Name:</span>
              <span className="text-white">{originWarehouse?.name || "N/A"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Normal Capacity:</span>
              <span className="text-white">
                {originWarehouse?.normal_capacity_kg ? `${originWarehouse.normal_capacity_kg} kg` : "N/A"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Refrigerated Capacity:</span>
              <span className="text-white">
                {originWarehouse?.refrigerated_capacity_kg ? `${originWarehouse.refrigerated_capacity_kg} kg` : "N/A"}
              </span>
            </div>
          </div>
        </div>

        {/* Destination Warehouse */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-600">
          <h2 className="text-xl font-semibold mb-4 text-white">Destination Warehouse</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Warehouse ID:</span>
              <span className="text-white">{transfer.destination_warehouse_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Name:</span>
              <span className="text-white">{destinationWarehouse?.name || "N/A"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Normal Capacity:</span>
              <span className="text-white">
                {destinationWarehouse?.normal_capacity_kg ? `${destinationWarehouse.normal_capacity_kg} kg` : "N/A"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Refrigerated Capacity:</span>
              <span className="text-white">
                {destinationWarehouse?.refrigerated_capacity_kg ? `${destinationWarehouse.refrigerated_capacity_kg} kg` : "N/A"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Truck Information */}
      {transfer.truck_id && (
        <div className="mt-6">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-600">
            <h2 className="text-xl font-semibold mb-4 text-white">Assigned Truck</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Truck ID:</span>
                  <span className="text-white">{transfer.truck_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Type:</span>
                  <span className="text-white">{truck?.type || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Status:</span>
                  <span className="text-white">{truck?.status || "N/A"}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Driver ID:</span>
                  <span className="text-white">{truck?.truck_driver_id || "Not assigned"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Load Capacity:</span>
                  <span className="text-white">
                    {truck?.load_capacity_kg ? `${truck.load_capacity_kg} kg` : "N/A"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notes */}
      {transfer.notes && (
        <div className="mt-6">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-600">
            <h2 className="text-xl font-semibold mb-4 text-white">Notes</h2>
            <p className="text-gray-300">{transfer.notes}</p>
          </div>
        </div>
      )}
    </div>
  );
}
