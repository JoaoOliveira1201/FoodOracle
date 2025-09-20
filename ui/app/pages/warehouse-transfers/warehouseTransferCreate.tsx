import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import Button from "~/components/Button";

interface Warehouse {
  warehouse_id: number;
  name: string;
  location: any;
  normal_capacity_kg: number | null;
  refrigerated_capacity_kg: number | null;
}

interface ProductRecord {
  record_id: number;
  product_id: number;
  supplier_id: number | null;
  supplier_name: string | null;
  warehouse_id: number | null;
  warehouse_name: string | null;
  quantity_kg: number | null;
  quality_classification: string | null;
  status: string;
  image_path: string | null;
  registration_date: string | null;
  sale_date: string | null;
}

interface TransferFormData {
  record_id: number | null;
  origin_warehouse_id: number | null;
  destination_warehouse_id: number | null;
  reason: string;
  status: string;
  notes: string;
}

const TRANSFER_REASONS = [
  { value: "Restock", label: "Restock" },
  { value: "Redistribution", label: "Redistribution" },
  { value: "Emergency", label: "Emergency" },
  { value: "Optimization", label: "Optimization" },
];

export function CreateWarehouseTransfer() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<TransferFormData>({
    record_id: null,
    origin_warehouse_id: null,
    destination_warehouse_id: null,
    reason: "Restock",
    status: "Pending",
    notes: "",
  });
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [productRecords, setProductRecords] = useState<ProductRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoadingData(true);
        const [warehousesResponse, recordsResponse] = await Promise.all([
          fetch("http://localhost:8000/warehouses/"),
          fetch("http://localhost:8000/product-records/"),
        ]);

        if (!warehousesResponse.ok || !recordsResponse.ok) {
          throw new Error("Failed to fetch data");
        }

        const [warehousesData, recordsData] = await Promise.all([
          warehousesResponse.json(),
          recordsResponse.json(),
        ]);

        setWarehouses(warehousesData);
        // Only show product records that are in stock
        setProductRecords(recordsData.filter((record: ProductRecord) => record.status === "InStock"));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch data");
      } finally {
        setLoadingData(false);
      }
    }

    fetchData();
  }, []);

  // Filter product records based on selected origin warehouse
  const getAvailableRecords = () => {
    if (!formData.origin_warehouse_id) {
      return [];
    }
    return productRecords.filter(record => record.warehouse_id === formData.origin_warehouse_id);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    let processedValue: any = value;
    
    if (name.includes("_id")) {
      processedValue = value ? Number(value) : null;
    }

    // Reset product record selection when origin warehouse changes
    if (name === "origin_warehouse_id") {
      setFormData({
        ...formData,
        [name]: processedValue,
        record_id: null, // Reset product record selection
      });
    } else {
      setFormData({
        ...formData,
        [name]: processedValue,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!formData.origin_warehouse_id) {
      setError("Please select an origin warehouse");
      setIsLoading(false);
      return;
    }

    if (!formData.record_id) {
      setError("Please select a product record to transfer");
      setIsLoading(false);
      return;
    }

    if (!formData.destination_warehouse_id) {
      setError("Please select a destination warehouse");
      setIsLoading(false);
      return;
    }

    if (formData.origin_warehouse_id === formData.destination_warehouse_id) {
      setError("Origin and destination warehouses must be different");
      setIsLoading(false);
      return;
    }

    try {
      const transferData = {
        record_id: formData.record_id,
        origin_warehouse_id: formData.origin_warehouse_id,
        destination_warehouse_id: formData.destination_warehouse_id,
        reason: formData.reason,
        status: formData.status,
        notes: formData.notes || null,
      };

      const response = await fetch("http://localhost:8000/warehouse-transfers/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(transferData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to create warehouse transfer");
      }

      // Success - navigate back to transfers list
      navigate("/warehouse-transfers");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const getAvailableDestinations = () => {
    return warehouses.filter(w => w.warehouse_id !== formData.origin_warehouse_id);
  };

  const getSelectedRecord = () => {
    return productRecords.find(r => r.record_id === formData.record_id);
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
      <h1 className="text-4xl font-bold mb-6">Create Warehouse Transfer</h1>
      
      {error && (
        <div className="mb-4 p-3 text-sm text-red-300 bg-red-900/20 border border-red-800 rounded-md max-w-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
        {/* Origin Warehouse Selection */}
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-100">
            Origin Warehouse *
          </label>
          <select
            name="origin_warehouse_id"
            value={formData.origin_warehouse_id || ""}
            onChange={handleChange}
            required
            className="w-full p-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">Select origin warehouse...</option>
            {warehouses.map(warehouse => (
              <option key={warehouse.warehouse_id} value={warehouse.warehouse_id}>
                {warehouse.name}
              </option>
            ))}
          </select>
        </div>

        {/* Product Record Selection (filtered by origin warehouse) */}
        {formData.origin_warehouse_id && (
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-100">
              Product Record to Transfer *
            </label>
            <select
              name="record_id"
              value={formData.record_id || ""}
              onChange={handleChange}
              required
              className="w-full p-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">Select a product record...</option>
              {getAvailableRecords().map(record => (
                <option key={record.record_id} value={record.record_id}>
                  Record #{record.record_id} - {record.quantity_kg}kg - Quality: {record.quality_classification || 'N/A'}
                </option>
              ))}
            </select>
            {getAvailableRecords().length === 0 && (
              <p className="mt-1 text-sm text-yellow-400">
                No available records in this warehouse
              </p>
            )}
          </div>
        )}

        {/* Destination Warehouse */}
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-100">
            Destination Warehouse *
          </label>
          <select
            name="destination_warehouse_id"
            value={formData.destination_warehouse_id || ""}
            onChange={handleChange}
            required
            className="w-full p-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">Select destination warehouse...</option>
            {getAvailableDestinations().map(warehouse => (
              <option key={warehouse.warehouse_id} value={warehouse.warehouse_id}>
                {warehouse.name}
              </option>
            ))}
          </select>
        </div>

        {/* Transfer Reason */}
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-100">
            Transfer Reason *
          </label>
          <select
            name="reason"
            value={formData.reason}
            onChange={handleChange}
            required
            className="w-full p-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          >
            {TRANSFER_REASONS.map(reason => (
              <option key={reason.value} value={reason.value}>
                {reason.label}
              </option>
            ))}
          </select>
        </div>

        {/* Transfer Status */}
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-100">
            Initial Status
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full p-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          >
            <option value="Pending">Pending</option>
            <option value="InTransit">In Transit</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
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

        {/* Transfer Summary */}
        {formData.record_id && formData.destination_warehouse_id && (
          <div className="border border-gray-600 rounded-lg bg-gray-700 p-4">
            <h3 className="text-lg font-medium text-white mb-2">Transfer Summary</h3>
            <div className="space-y-1 text-sm text-gray-300">
              <div>
                <span className="font-medium">Product Record:</span> #{formData.record_id}
              </div>
              <div>
                <span className="font-medium">Quantity:</span> {getSelectedRecord()?.quantity_kg}kg
              </div>
              <div>
                <span className="font-medium">From:</span> {warehouses.find(w => w.warehouse_id === formData.origin_warehouse_id)?.name}
              </div>
              <div>
                <span className="font-medium">To:</span> {warehouses.find(w => w.warehouse_id === formData.destination_warehouse_id)?.name}
              </div>
              <div>
                <span className="font-medium">Reason:</span> {formData.reason}
              </div>
              <div>
                <span className="font-medium">Status:</span> {formData.status}
              </div>
              {formData.notes && (
                <div>
                  <span className="font-medium">Notes:</span> {formData.notes}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex space-x-4 pt-4">
          <Button 
            type="submit" 
            color="primary" 
            label={isLoading ? "Creating..." : "Create Transfer"} 
            onClick={() => {}} 
            disabled={isLoading}
          />
          <Button 
            type="button" 
            color="secondary" 
            label="Cancel" 
            onClick={() => navigate("/warehouse-transfers")} 
            disabled={isLoading}
          />
        </div>
      </form>
    </div>
  );
}
