import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import Button from "~/components/Button";

interface ProductFormData {
  name: string;
  base_price: number;
  discount_percentage: number;
  requires_refrigeration: boolean;
  shelf_life_days: number;
  deadline_to_discount: number;
}

export function EditProduct() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    base_price: 0,
    discount_percentage: 0,
    requires_refrigeration: false,
    shelf_life_days: 0,
    deadline_to_discount: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [fetchLoading, setFetchLoading] = useState(true);

  useEffect(() => {
    async function fetchProduct() {
      try {
        const response = await fetch(`http://localhost:8000/products/${id}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const product = await response.json();
        setFormData({
          name: product.name,
          base_price: product.base_price,
          discount_percentage: product.discount_percentage,
          requires_refrigeration: product.requires_refrigeration,
          shelf_life_days: product.shelf_life_days,
          deadline_to_discount: product.deadline_to_discount,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch product");
      } finally {
        setFetchLoading(false);
      }
    }

    if (id) {
      fetchProduct();
    }
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : type === "number" ? Number(value) : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch(`http://localhost:8000/products/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to update product");
      }

      // Success - navigate back to products list
      navigate("/products");
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
        <span className="ml-3 text-gray-600">Loading product...</span>
      </div>
    );
  }

  return (
    <div className="px-28 pt-14">
      <h1 className="text-4xl font-bold mb-6">Edit Product</h1>
      
      {error && (
        <div className="mb-4 p-3 text-sm text-red-300 bg-red-900/20 border border-red-800 rounded-md max-w-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-100">
            Product Name *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full p-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            placeholder="Enter product name"
          />
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium text-gray-100">
            Base Price ($) *
          </label>
          <input
            type="number"
            name="base_price"
            value={formData.base_price}
            onChange={handleChange}
            min="0"
            step="1"
            required
            className="w-full p-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            placeholder="0"
          />
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium text-gray-100">
            Discount Percentage (%)
          </label>
          <input
            type="number"
            name="discount_percentage"
            value={formData.discount_percentage}
            onChange={handleChange}
            min="0"
            max="100"
            step="1"
            className="w-full p-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            placeholder="0"
          />
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium text-gray-100">
            Shelf Life (Days)
          </label>
          <input
            type="number"
            name="shelf_life_days"
            value={formData.shelf_life_days}
            onChange={handleChange}
            min="0"
            step="1"
            className="w-full p-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            placeholder="0"
          />
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium text-gray-100">
            Deadline to Discount (Days)
          </label>
          <input
            type="number"
            name="deadline_to_discount"
            value={formData.deadline_to_discount}
            onChange={handleChange}
            min="0"
            step="1"
            className="w-full p-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            placeholder="0"
          />
        </div>

        <div className="flex items-center">
          <input
            id="requires_refrigeration"
            type="checkbox"
            name="requires_refrigeration"
            checked={formData.requires_refrigeration}
            onChange={handleChange}
            className="w-4 h-4 text-indigo-600 bg-gray-700 border-gray-600 rounded focus:ring-indigo-500 focus:ring-2"
          />
          <label htmlFor="requires_refrigeration" className="ml-2 text-sm font-medium text-gray-100">
            Requires Refrigeration
          </label>
        </div>

        <div className="flex space-x-4 pt-4">
          <Button 
            type="submit" 
            color="primary" 
            label={isLoading ? "Updating..." : "Update Product"} 
            onClick={() => {}} 
            disabled={isLoading || fetchLoading}
          />
          <Button 
            type="button" 
            color="secondary" 
            label="Cancel" 
            onClick={() => navigate("/products")} 
            disabled={isLoading}
          />
        </div>
      </form>
    </div>
  );
}
