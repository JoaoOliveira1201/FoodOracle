import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "~/contexts/AuthContext";
import { requireAuth } from "~/helpers/auth";
import Button from "~/components/Button";

interface OrderedProduct {
  product_id: number;
  product_name: string;
  quantity_kg: number;
  price_per_kg: number;
}

interface Order {
  order_id: number;
  buyer_id: number;
  order_date: string | null;
  status: string;
  total_amount: number;
  ordered_products: OrderedProduct[];
}

export function MyOrders() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!requireAuth(navigate)) {
      return;
    }

    async function fetchMyOrders() {
      if (!user?.user_id) {
        setError("User not authenticated");
        setLoading(false);
        return;
      }

      try {
        // Fetch orders for the current user
        const response = await fetch(`http://localhost:8000/orders/?buyer_id=${user.user_id}`);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        // Filter orders to ensure they belong to the current user
        const userOrders = data.filter((order: Order) => order.buyer_id === user.user_id);
        setOrders(userOrders);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch your orders");
      } finally {
        setLoading(false);
      }
    }

    fetchMyOrders();
  }, [navigate, user]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    const colors = {
      Pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      Confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      InTransit: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
      Completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      Cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-gray-600">Loading your orders...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-28 pt-14">
        <div className="p-4 text-sm text-red-300 bg-red-900/20 border border-red-800 rounded-md">Error: {error}</div>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between px-28 pt-14">
        <h1 className="text-4xl font-bold">Orders History</h1>
        <Button color="primary" label="Place New Order" onClick={() => navigate("/available-items")} />
      </div>
      <div className="px-28 pt-2">
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-4">You haven't placed any orders yet</div>
            <Button color="primary" label="Place Your First Order" onClick={() => navigate("/available-items")} />
          </div>
        ) : (
          <div className="relative overflow-x-auto shadow-md sm:rounded-lg border border-gray-600">
            <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                <tr>
                  <th scope="col" className="px-6 py-3">
                    Order ID
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Order Date
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Total Amount
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Products Count
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr
                    key={order.order_id}
                    className="odd:bg-white odd:dark:bg-gray-900 even:bg-gray-50 even:dark:bg-gray-800 border-b dark:border-gray-700"
                  >
                    <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                      #{order.order_id}
                    </th>
                    <td className="px-6 py-4">{formatDate(order.order_date)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">${order.total_amount}</td>
                    <td className="px-6 py-4">{order.ordered_products?.length || 0} items</td>
                    <td className="px-6 py-4">
                      <Button
                        color="secondary"
                        label="View Details"
                        onClick={() => navigate(`/orders/info/${order.order_id}`)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
