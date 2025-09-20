import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import Button from "~/components/Button";

interface OrderedProduct {
  product_name: string;
  quantity: number | null;
  quality_classification: string | null;
  price_at_purchase: number | null;
}

interface Order {
  order_id: number;
  buyer_id: number | null;
  order_date: string | null;
  status: string;
  total_amount: number | null;
  ordered_products: OrderedProduct[];
}

interface User {
  user_id: number;
  name: string;
  contact_info: string | null;
  role: string;
}

export function OrderInfo() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [buyer, setBuyer] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchOrder() {
      if (!id) {
        setError("Order ID is required");
        setLoading(false);
        return;
      }

      try {
        const orderResponse = await fetch(`http://34.235.125.104:8000/orders/${id}`);
        
        if (!orderResponse.ok) {
          throw new Error(`Failed to fetch order: ${orderResponse.status}`);
        }
        
        const orderData = await orderResponse.json();
        setOrder(orderData);

        // Fetch buyer information if buyer_id exists
        if (orderData.buyer_id) {
          try {
            const buyerResponse = await fetch(`http://34.235.125.104:8000/users/${orderData.buyer_id}`);
            if (buyerResponse.ok) {
              const buyerData = await buyerResponse.json();
              setBuyer(buyerData);
            }
          } catch (buyerErr) {
            console.warn("Could not fetch buyer information:", buyerErr);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch order");
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();
  }, [id]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    const colors = {
      "Pending": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      "Confirmed": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      "InTransit": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
      "Completed": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      "Cancelled": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-gray-600">Loading order...</span>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="px-28 pt-14">
        <div className="p-4 text-sm text-red-300 bg-red-900/20 border border-red-800 rounded-md">
          Error: {error || "Order not found"}
        </div>
        <div className="mt-4">
          <Button 
            color="secondary" 
            label="Back to Orders" 
            onClick={() => navigate("/orders")} 
          />
        </div>
      </div>
    );
  }

  return (
    <div className="px-28 pt-14">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-4xl font-bold">Order #{order.order_id}</h1>
        <Button 
          color="secondary" 
          label="Back to Orders" 
          onClick={() => navigate("/orders")} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Information */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-600">
          <h2 className="text-xl font-semibold mb-4 text-white">Order Information</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Order ID:</span>
              <span className="text-white">#{order.order_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Order Date:</span>
              <span className="text-white">{formatDate(order.order_date)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Status:</span>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}
              >
                {order.status}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Total Amount:</span>
              <span className="text-white font-semibold">
                {order.total_amount ? `$${order.total_amount}` : "N/A"}
              </span>
            </div>
          </div>
        </div>

        {/* Buyer Information */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-600">
          <h2 className="text-xl font-semibold mb-4 text-white">Buyer Information</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Buyer ID:</span>
              <span className="text-white">{order.buyer_id || "N/A"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Name:</span>
              <span className="text-white">{buyer?.name || "N/A"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Contact:</span>
              <span className="text-white">{buyer?.contact_info || "N/A"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Role:</span>
              <span className="text-white">{buyer?.role || "N/A"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Ordered Products */}
      <div className="mt-6">
        <div className="bg-gray-800 rounded-lg border border-gray-600">
          <div className="p-6 border-b border-gray-600">
            <h2 className="text-xl font-semibold text-white">Ordered Products</h2>
          </div>
          <div className="p-6">
            {order.ordered_products.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                No products found in this order
              </div>
            ) : (
              <div className="relative overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-400">
                  <thead className="text-xs text-gray-400 uppercase bg-gray-700">
                    <tr>
                      <th scope="col" className="px-6 py-3">
                        Product Name
                      </th>
                      <th scope="col" className="px-6 py-3">
                        Quantity
                      </th>
                      <th scope="col" className="px-6 py-3">
                        Quality
                      </th>
                      <th scope="col" className="px-6 py-3">
                        Price at Purchase
                      </th>
                      <th scope="col" className="px-6 py-3">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.ordered_products.map((product, idx) => (
                      <tr
                        key={idx}
                        className={`${
                          idx % 2 === 0 ? "bg-gray-800" : "bg-gray-700"
                        } border-b border-gray-600`}
                      >
                        <td className="px-6 py-4 font-medium text-white whitespace-nowrap">
                          {product.product_name}
                        </td>
                        <td className="px-6 py-4">
                          {product.quantity ? `${product.quantity} kg` : "N/A"}
                        </td>
                        <td className="px-6 py-4">
                          {product.quality_classification || "N/A"}
                        </td>
                        <td className="px-6 py-4">
                          {product.price_at_purchase ? `$${product.price_at_purchase}` : "N/A"}
                        </td>
                        <td className="px-6 py-4">
                          {product.price_at_purchase && product.quantity 
                            ? `$${product.price_at_purchase * product.quantity}` 
                            : "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
