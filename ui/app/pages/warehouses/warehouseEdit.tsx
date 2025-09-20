import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import Button from "~/components/Button";

interface WarehouseFormData {
  name: string;
  location: {
    latitude: number;
    longitude: number;
  };
  normal_capacity_kg: number | null;
  refrigerated_capacity_kg: number | null;
}

export function EditWarehouse() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const [formData, setFormData] = useState<WarehouseFormData>({
    name: "",
    location: {
      latitude: 0,
      longitude: 0,
    },
    normal_capacity_kg: null,
    refrigerated_capacity_kg: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [fetchLoading, setFetchLoading] = useState(true);

  useEffect(() => {
    async function fetchWarehouse() {
      try {
        const response = await fetch(`http://34.235.125.104:8000/warehouses/${id}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const warehouse = await response.json();
        setFormData({
          name: warehouse.name,
          location: warehouse.location,
          normal_capacity_kg: warehouse.normal_capacity_kg,
          refrigerated_capacity_kg: warehouse.refrigerated_capacity_kg,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch warehouse");
      } finally {
        setFetchLoading(false);
      }
    }

    if (id) {
      fetchWarehouse();
    }
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === "latitude" || name === "longitude") {
      setFormData({
        ...formData,
        location: {
          ...formData.location,
          [name]: Number(value),
        },
      });
    } else if (name === "normal_capacity_kg" || name === "refrigerated_capacity_kg") {
      setFormData({
        ...formData,
        [name]: value === "" ? null : Number(value),
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch(`http://34.235.125.104:8000/warehouses/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to update warehouse");
      }

      // Success - navigate back to warehouses list
      navigate("/warehouses");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-gray-600">Loading warehouse...</span>
      </div>
    );
  }

  return (
    <div className="px-28 pt-14">
      <h1 className="text-4xl font-bold mb-6">Edit Warehouse</h1>
      
      {error && (
        <div className="mb-4 p-3 text-sm text-red-300 bg-red-900/20 border border-red-800 rounded-md max-w-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-100">
            Warehouse Name *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full p-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            placeholder="Enter warehouse name"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-100">
              Latitude *
            </label>
            <input
              type="number"
              name="latitude"
              value={formData.location.latitude}
              onChange={handleChange}
              step="any"
              required
              className="w-full p-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              placeholder="0.000000"
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium text-gray-100">
              Longitude *
            </label>
            <input
              type="number"
              name="longitude"
              value={formData.location.longitude}
              onChange={handleChange}
              step="any"
              required
              className="w-full p-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              placeholder="0.000000"
            />
          </div>
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium text-gray-100">
            Normal Capacity (kg)
          </label>
          <input
            type="number"
            name="normal_capacity_kg"
            value={formData.normal_capacity_kg || ""}
            onChange={handleChange}
            min="0"
            step="1"
            className="w-full p-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            placeholder="Optional"
          />
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium text-gray-100">
            Refrigerated Capacity (kg)
          </label>
          <input
            type="number"
            name="refrigerated_capacity_kg"
            value={formData.refrigerated_capacity_kg || ""}
            onChange={handleChange}
            min="0"
            step="1"
            className="w-full p-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            placeholder="Optional"
          />
        </div>

        <div className="flex space-x-4 pt-4">
          <Button 
            type="submit" 
            color="primary" 
            label={isLoading ? "Updating..." : "Update Warehouse"} 
            onClick={() => {}} 
            disabled={isLoading || fetchLoading}
          />
          <Button 
            type="button" 
            color="secondary" 
            label="Cancel" 
            onClick={() => navigate("/warehouses")} 
            disabled={isLoading}
          />
        </div>
      </form>
    </div>
  );
}