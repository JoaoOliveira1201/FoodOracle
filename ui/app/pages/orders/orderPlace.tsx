import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "~/contexts/AuthContext";
import { useCart } from "~/contexts/CartContext";
import { requireAuth } from "~/helpers/auth";
import Button from "~/components/Button";

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


interface Product {
  product_id: number;
  name: string;
  base_price: number;
  discount_percentage: number;
  requires_refrigeration: boolean;
  shelf_life_days: number;
  deadline_to_discount: number;
}

interface OrderFormData {
  record_ids: number[];
  status: string;
}

export function PlaceOrder() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items: cartItems, clear: clearCart } = useCart();
  const [formData, setFormData] = useState<OrderFormData>({
    record_ids: [],
    status: "Pending",
  });
  const [productRecords, setProductRecords] = useState<ProductRecord[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedRecords, setSelectedRecords] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!requireAuth(navigate)) {
      return;
    }

    async function fetchData() {
      try {
        setLoadingData(true);
        
        // Fetch product records and products data
        const [recordsResponse, productsResponse] = await Promise.all([
          fetch("http://localhost:8000/product-records/"),
          fetch("http://localhost:8000/products/"),
        ]);

        if (!recordsResponse.ok || !productsResponse.ok) {
          throw new Error("Failed to fetch required data");
        }

        const [recordsData, productsData] = await Promise.all([
          recordsResponse.json(),
          productsResponse.json(),
        ]);

        // Filter only available product records (InStock status)
        const availableRecords = recordsData.filter((record: ProductRecord) => record.status === "InStock");
        
        setProductRecords(availableRecords);
        setProducts(productsData);

        // Pre-select items from the cart if present
        if (cartItems.length > 0) {
          const cartIds = new Set(cartItems.map((c) => c.recordId));
          const existing = availableRecords.filter((r: ProductRecord) => cartIds.has(r.record_id));
          if (existing.length > 0) {
            const ids = new Set<number>(existing.map((r: ProductRecord) => r.record_id));
            setSelectedRecords(ids);
            setFormData({
              ...formData,
              record_ids: Array.from(ids),
            });
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch data");
      } finally {
        setLoadingData(false);
      }
    }

    fetchData();
  }, [navigate]);

  const getProductName = (productId: number) => {
    const product = products.find(p => p.product_id === productId);
    return product?.name || "Unknown Product";
  };

  const getProductPrice = (productId: number) => {
    const product = products.find(p => p.product_id === productId);
    if (!product) return 0;
    return Math.round(product.base_price * (1 - product.discount_percentage / 100));
  };

  // Build a simple cart-like view from selected records
  const selectedItems = Array.from(selectedRecords).map((recordId) => {
    const record = productRecords.find(r => r.record_id === recordId)!;
    const productName = getProductName(record.product_id);
    const pricePerKg = getProductPrice(record.product_id);
    const quantity = record.quantity_kg || 1;
    const lineTotal = pricePerKg * quantity;
    return {
      recordId,
      productId: record.product_id,
      productName,
      pricePerKg,
      quantity,
      lineTotal,
    };
  });

  const handleRecordSelection = (recordId: number) => {
    const newSelected = new Set(selectedRecords);
    if (newSelected.has(recordId)) {
      newSelected.delete(recordId);
    } else {
      newSelected.add(recordId);
    }
    setSelectedRecords(newSelected);
    setFormData({
      ...formData,
      record_ids: Array.from(newSelected),
    });
  };

  const calculateTotal = () => {
    return Array.from(selectedRecords).reduce((total, recordId) => {
      const record = productRecords.find(r => r.record_id === recordId);
      if (!record) return total;
      const price = getProductPrice(record.product_id);
      const quantity = record.quantity_kg || 1;
      return total + (price * quantity);
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!user?.user_id) {
      setError("User not authenticated");
      setIsLoading(false);
      return;
    }

    if (formData.record_ids.length === 0) {
      setError("Please select at least one product");
      setIsLoading(false);
      return;
    }

    try {
      const orderData = {
        buyer_id: user.user_id,
        record_ids: formData.record_ids,
        status: "Pending",
        total_amount: calculateTotal(),
      };

      const response = await fetch("http://localhost:8000/orders/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to place order");
      }

      // Success - navigate to my orders page
      // Clear cart after successful order
      try { clearCart(); } catch {}
      navigate("/my-orders");
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
      <h1 className="text-4xl font-bold mb-6">Place Order</h1>
      
      {error && (
        <div className="mb-4 p-3 text-sm text-red-300 bg-red-900/20 border border-red-800 rounded-md max-w-4xl">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
        {/* Product Selection */}
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-100">
            Select Products *
          </label>
          <div className="border border-gray-600 rounded-lg bg-gray-700 max-h-96 overflow-y-auto">
            {productRecords.length === 0 ? (
              <div className="p-4 text-center text-gray-400">
                No available products in stock
              </div>
            ) : (
              <div className="divide-y divide-gray-600">
                {productRecords.map((record) => (
                  <div key={record.record_id} className="p-4 hover:bg-gray-600">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id={`record-${record.record_id}`}
                          checked={selectedRecords.has(record.record_id)}
                          onChange={() => handleRecordSelection(record.record_id)}
                          className="w-4 h-4 text-indigo-600 bg-gray-700 border-gray-600 rounded focus:ring-indigo-500 focus:ring-2"
                        />
                        <div>
                          <div className="font-medium text-white">
                            {getProductName(record.product_id)}
                          </div>
                          <div className="text-sm text-gray-400">
                            Record ID: {record.record_id} | 
                            Quantity: {record.quantity_kg || "N/A"} kg | 
                            Quality: {record.quality_classification || "N/A"} |
                            Warehouse: {record.warehouse_name || "N/A"}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-white">
                          ${getProductPrice(record.product_id)}
                        </div>
                        <div className="text-sm text-gray-400">
                          per kg
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Order Summary */}
        {selectedRecords.size > 0 && (
          <div className="border border-gray-600 rounded-lg bg-gray-700 p-4">
            <h3 className="text-lg font-medium text-white mb-2">Order Summary</h3>
            <div className="space-y-1 text-sm text-gray-300">
              <div>Selected Items: {selectedRecords.size}</div>
              <div>Total Amount: ${calculateTotal()}</div>
            </div>
          </div>
        )}

        {/* Shopping Cart */}
        <div className="border border-gray-600 rounded-lg bg-gray-700">
          <div className="p-4">
            <h3 className="text-lg font-medium text-white">Shopping Cart</h3>
            <p className="text-sm text-gray-300">Items you are about to order</p>
          </div>
          <div className="border-t border-gray-600">
            {selectedItems.length === 0 ? (
              <div className="p-4 text-gray-400">Your cart is empty. Select items above to add them.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-left text-gray-300">
                  <thead className="bg-gray-800 text-gray-200">
                    <tr>
                      <th className="px-4 py-3">Product</th>
                      <th className="px-4 py-3">Record</th>
                      <th className="px-4 py-3">Qty (kg)</th>
                      <th className="px-4 py-3">Price/kg</th>
                      <th className="px-4 py-3">Line Total</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedItems.map((item, idx) => (
                      <tr key={item.recordId} className={idx % 2 === 0 ? "bg-gray-900" : "bg-gray-800"}>
                        <td className="px-4 py-3 text-white">{item.productName}</td>
                        <td className="px-4 py-3">#{item.recordId}</td>
                        <td className="px-4 py-3">{item.quantity}</td>
                        <td className="px-4 py-3">${item.pricePerKg}</td>
                        <td className="px-4 py-3">${item.lineTotal}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleRecordSelection(item.recordId)}
                            className="text-red-400 hover:text-red-300 underline"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-800">
                      <td className="px-4 py-3 font-medium text-white" colSpan={4}>Total</td>
                      <td className="px-4 py-3 font-medium text-white">${calculateTotal()}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Order Status hidden; always Pending */}

        <div className="flex space-x-4 pt-4">
          <Button 
            type="submit" 
            color="primary" 
            label={isLoading ? "Placing..." : "Place Order"} 
            onClick={() => {}} 
            disabled={isLoading}
          />
          <Button 
            type="button" 
            color="secondary" 
            label="Cancel" 
            onClick={() => navigate("/my-orders")} 
            disabled={isLoading}
          />
        </div>
      </form>
    </div>
  );
}
