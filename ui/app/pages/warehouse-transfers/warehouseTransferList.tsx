import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import Button from "~/components/Button";
import { formatDuration } from "~/helpers/homeUtils";

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

export function WarehouseTransferList() {
  const navigate = useNavigate();
  const [transfers, setTransfers] = useState<WarehouseTransfer[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const [transfersResponse, warehousesResponse, trucksResponse] = await Promise.all([
          fetch("http://34.235.125.104:8000/warehouse-transfers/"),
          fetch("http://34.235.125.104:8000/warehouses/"),
          fetch("http://34.235.125.104:8000/trucks/"),
        ]);
        
        if (!transfersResponse.ok || !warehousesResponse.ok || !trucksResponse.ok) {
          throw new Error("Failed to fetch data");
        }
        
        const [transfersData, warehousesData, trucksData] = await Promise.all([
          transfersResponse.json(),
          warehousesResponse.json(),
          trucksResponse.json(),
        ]);

        setTransfers(transfersData);
        setWarehouses(warehousesData);
        setTrucks(trucksData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch warehouse transfers");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const getWarehouseName = (warehouseId: number | null) => {
    if (!warehouseId) return "N/A";
    const warehouse = warehouses.find(w => w.warehouse_id === warehouseId);
    return warehouse?.name || `Warehouse ${warehouseId}`;
  };

  const getTruckInfo = (truckId: number | null) => {
    if (!truckId) return "Not assigned";
    const truck = trucks.find(t => t.truck_id === truckId);
    return truck ? `Truck ${truckId} (${truck.type})` : `Truck ${truckId}`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };


  const getStatusColor = (status: string) => {
    const colors = {
      "Pending": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      "InTransit": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
      "Completed": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      "Cancelled": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
  };

  const getReasonColor = (reason: string | null) => {
    if (!reason) return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
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
        <span className="ml-3 text-gray-600">Loading warehouse transfers...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-28 pt-14">
        <div className="p-4 text-sm text-red-300 bg-red-900/20 border border-red-800 rounded-md">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between px-28 pt-14">
        <h1 className="text-4xl font-bold">Warehouse Transfers:</h1>
        <Button color="primary" label="Create Transfer" onClick={() => navigate("create")} />
      </div>
      <div className="px-28 pt-2">
        <div className="relative overflow-x-auto shadow-md sm:rounded-lg border border-gray-600">
          <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th scope="col" className="px-6 py-3">
                  Transfer ID
                </th>
                <th scope="col" className="px-6 py-3">
                  Product Record
                </th>
                <th scope="col" className="px-6 py-3">
                  From → To
                </th>
                <th scope="col" className="px-6 py-3">
                  Truck
                </th>
                <th scope="col" className="px-6 py-3">
                  Reason
                </th>
                <th scope="col" className="px-6 py-3">
                  Status
                </th>
                <th scope="col" className="px-6 py-3">
                  Requested Date
                </th>
                <th scope="col" className="px-6 py-3">
                  Estimated Time
                </th>
                <th scope="col" className="px-6 py-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {transfers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                    No warehouse transfers found
                  </td>
                </tr>
              ) : (
                transfers.map((transfer, idx) => (
                  <tr
                    key={transfer.transfer_id}
                    className={`${
                      idx % 2 === 0
                        ? "bg-white dark:bg-gray-900"
                        : "bg-gray-50 dark:bg-gray-800"
                    } border-b border-gray-200 dark:border-gray-700`}
                  >
                    <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                      #{transfer.transfer_id}
                    </th>
                    <td className="px-6 py-4">
                      {transfer.record_id ? `Record #${transfer.record_id}` : "N/A"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="font-medium">{getWarehouseName(transfer.origin_warehouse_id)}</div>
                        <div className="text-gray-500">↓</div>
                        <div className="font-medium">{getWarehouseName(transfer.destination_warehouse_id)}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">{getTruckInfo(transfer.truck_id)}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getReasonColor(transfer.reason)}`}
                      >
                        {transfer.reason || "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(transfer.status)}`}
                      >
                        {transfer.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">{formatDate(transfer.requested_date)}</td>
                    <td className="px-6 py-4">{formatDuration(transfer.estimated_time)}</td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => navigate(`info/${transfer.transfer_id}`)}
                          className="cursor-pointer font-medium text-blue-600 dark:text-blue-500 hover:underline"
                        >
                          Info
                        </button>
                        <button
                          onClick={() => navigate(`edit/${transfer.transfer_id}`)}
                          className="cursor-pointer font-medium text-indigo-600 dark:text-indigo-500 hover:underline"
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
