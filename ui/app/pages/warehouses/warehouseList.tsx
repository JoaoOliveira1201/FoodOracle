import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import Button from "~/components/Button";

interface Warehouse {
  warehouse_id: number;
  name: string;
  location: {
    latitude: number;
    longitude: number;
  };
  normal_capacity_kg: number | null;
  refrigerated_capacity_kg: number | null;
}

export function WarehouseList() {
  const navigate = useNavigate();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    async function fetchWarehouses() {
      try {
        const response = await fetch("http://34.235.125.104:8000/warehouses/");
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setWarehouses(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch warehouses");
      } finally {
        setLoading(false);
      }
    }

    fetchWarehouses();
  }, []);

  const handleDelete = async (warehouseId: number) => {
    setDeletingId(warehouseId);
    try {
      const response = await fetch(`http://34.235.125.104:8000/warehouses/${warehouseId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to delete warehouse");
      }

      // Remove the warehouse from the list
      setWarehouses(warehouses.filter(warehouse => warehouse.warehouse_id !== warehouseId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred while deleting");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-gray-600">Loading warehouses...</span>
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
        <h1 className="text-4xl font-bold">Warehouses:</h1>
        <Button color="primary" label="Create" onClick={() => navigate("create")} />
      </div>
      <div className="px-28 pt-2">
        <div className="relative overflow-x-auto shadow-md sm:rounded-lg border border-gray-600">
          <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th scope="col" className="px-6 py-3">
                  Warehouse ID
                </th>
                <th scope="col" className="px-6 py-3">
                  Name
                </th>
                <th scope="col" className="px-6 py-3">
                  Location
                </th>
                <th scope="col" className="px-6 py-3">
                  Normal Capacity (kg)
                </th>
                <th scope="col" className="px-6 py-3">
                  Refrigerated Capacity (kg)
                </th>
                <th scope="col" className="px-6 py-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {warehouses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No warehouses found
                  </td>
                </tr>
              ) : (
                warehouses.map((warehouse, idx) => (
                  <tr
                    key={warehouse.warehouse_id}
                    className={`${
                      idx % 2 === 0
                        ? "bg-white dark:bg-gray-900"
                        : "bg-gray-50 dark:bg-gray-800"
                    } border-b border-gray-200 dark:border-gray-700`}
                  >
                    <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                      {warehouse.warehouse_id}
                    </th>
                    <td className="px-6 py-4">{warehouse.name}</td>
                    <td className="px-6 py-4">
                      {warehouse.location.latitude.toFixed(6)}, {warehouse.location.longitude.toFixed(6)}
                    </td>
                    <td className="px-6 py-4">
                      {warehouse.normal_capacity_kg !== null ? warehouse.normal_capacity_kg : "N/A"}
                    </td>
                    <td className="px-6 py-4">
                      {warehouse.refrigerated_capacity_kg !== null ? warehouse.refrigerated_capacity_kg : "N/A"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => navigate(`info/${warehouse.warehouse_id}`)}
                          className="cursor-pointer font-medium text-blue-600 dark:text-blue-500 hover:underline"
                        >
                          Info
                        </button>
                        <button
                          onClick={() => navigate(`edit/${warehouse.warehouse_id}`)}
                          className="cursor-pointer font-medium text-indigo-600 dark:text-indigo-500 hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(warehouse.warehouse_id)}
                          disabled={deletingId === warehouse.warehouse_id}
                          className="cursor-pointer font-medium text-red-600 dark:text-red-500 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {deletingId === warehouse.warehouse_id ? "Deleting..." : "Delete"}
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