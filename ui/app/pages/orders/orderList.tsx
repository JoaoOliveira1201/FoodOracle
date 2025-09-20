import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router";
import Button from "~/components/Button";

interface OrderedProduct {
  product_name: string;
  quantity: number | null;
  quality_classification: string | null;
  price_at_purchase: number | null;
}

interface User {
  user_id: number;
  name: string;
  contact_info: string | null;
  role: string;
}

interface Order {
  order_id: number;
  buyer_id: number | null;
  order_date: string | null;
  status: string;
  total_amount: number | null;
  ordered_products: OrderedProduct[];
}

type SortField = 'order_id' | 'buyer_id' | 'order_date' | 'status' | 'total_amount' | 'products_count';
type SortDirection = 'asc' | 'desc';

export function OrderList() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [buyerFilter, setBuyerFilter] = useState<string>("");
  const [dateFromFilter, setDateFromFilter] = useState<string>("");
  const [dateToFilter, setDateToFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  
  // Sort states
  const [sortField, setSortField] = useState<SortField>('order_id');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  useEffect(() => {
    async function fetchData() {
      try {
        const [ordersResponse, usersResponse] = await Promise.all([
          fetch("http://localhost:8000/orders/"),
          fetch("http://localhost:8000/users/"),
        ]);
        
        if (!ordersResponse.ok || !usersResponse.ok) {
          throw new Error("Failed to fetch data");
        }
        
        const [ordersData, usersData] = await Promise.all([
          ordersResponse.json(),
          usersResponse.json(),
        ]);

        setOrders(ordersData);
        setUsers(usersData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch orders");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  const getBuyerName = (buyerId: number | null) => {
    if (!buyerId) return "N/A";
    const user = users.find(u => u.user_id === buyerId);
    return user?.name || "Unknown User";
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

  // Filter and sort orders
  const filteredAndSortedOrders = useMemo(() => {
    let filtered = orders.filter(order => {
      // Status filter
      if (statusFilter && order.status !== statusFilter) return false;
      
      // Buyer filter
      if (buyerFilter) {
        const buyerName = getBuyerName(order.buyer_id).toLowerCase();
        if (!buyerName.includes(buyerFilter.toLowerCase())) return false;
      }
      
      // Date range filter
      if (dateFromFilter && order.order_date) {
        const orderDate = new Date(order.order_date);
        const fromDate = new Date(dateFromFilter);
        if (orderDate < fromDate) return false;
      }
      
      if (dateToFilter && order.order_date) {
        const orderDate = new Date(order.order_date);
        const toDate = new Date(dateToFilter);
        toDate.setHours(23, 59, 59, 999); // End of day
        if (orderDate > toDate) return false;
      }
      
      // Search term filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const buyerName = getBuyerName(order.buyer_id).toLowerCase();
        const orderId = order.order_id.toString();
        const status = order.status.toLowerCase();
        
        if (!buyerName.includes(searchLower) && 
            !orderId.includes(searchLower) && 
            !status.includes(searchLower)) {
          return false;
        }
      }
      
      return true;
    });

    // Sort orders
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'order_id':
          aValue = a.order_id;
          bValue = b.order_id;
          break;
        case 'buyer_id':
          aValue = a.buyer_id || 0;
          bValue = b.buyer_id || 0;
          break;
        case 'order_date':
          aValue = a.order_date ? new Date(a.order_date).getTime() : 0;
          bValue = b.order_date ? new Date(b.order_date).getTime() : 0;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'total_amount':
          aValue = a.total_amount || 0;
          bValue = b.total_amount || 0;
          break;
        case 'products_count':
          aValue = a.ordered_products.length;
          bValue = b.ordered_products.length;
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [orders, users, statusFilter, buyerFilter, dateFromFilter, dateToFilter, searchTerm, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const clearFilters = () => {
    setStatusFilter("");
    setBuyerFilter("");
    setDateFromFilter("");
    setDateToFilter("");
    setSearchTerm("");
  };

  // Get unique statuses for filter dropdown
  const uniqueStatuses = useMemo(() => {
    const statuses = [...new Set(orders.map(order => order.status))];
    return statuses.sort();
  }, [orders]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-gray-600">Loading orders...</span>
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
        <h1 className="text-4xl font-bold">Orders:</h1>
      </div>
      
      {/* Filters Section */}
      <div className="px-28 pt-4">
        <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search
              </label>
              <input
                type="text"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">All Statuses</option>
                {uniqueStatuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            {/* Buyer Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Buyer
              </label>
              <input
                type="text"
                placeholder="Filter by buyer..."
                value={buyerFilter}
                onChange={(e) => setBuyerFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Date From */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                From Date
              </label>
              <input
                type="date"
                value={dateFromFilter}
                onChange={(e) => setDateFromFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Date To */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                To Date
              </label>
              <input
                type="date"
                value={dateToFilter}
                onChange={(e) => setDateToFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="w-full px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md transition-colors duration-200"
              >
                Clear Filters
              </button>
            </div>
          </div>
          
          {/* Results count */}
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing {filteredAndSortedOrders.length} of {orders.length} orders
          </div>
        </div>
      </div>

      <div className="px-28 pt-4">
        <div className="relative overflow-x-auto shadow-md sm:rounded-lg border border-gray-600">
          <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th scope="col" className="px-6 py-3">
                  <button
                    onClick={() => handleSort('order_id')}
                    className="flex items-center space-x-1 hover:text-gray-900 dark:hover:text-white"
                  >
                    <span>Order ID</span>
                    {sortField === 'order_id' && (
                      <span className="text-indigo-600">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </button>
                </th>
                <th scope="col" className="px-6 py-3">
                  <button
                    onClick={() => handleSort('buyer_id')}
                    className="flex items-center space-x-1 hover:text-gray-900 dark:hover:text-white"
                  >
                    <span>Buyer</span>
                    {sortField === 'buyer_id' && (
                      <span className="text-indigo-600">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </button>
                </th>
                <th scope="col" className="px-6 py-3">
                  <button
                    onClick={() => handleSort('order_date')}
                    className="flex items-center space-x-1 hover:text-gray-900 dark:hover:text-white"
                  >
                    <span>Order Date</span>
                    {sortField === 'order_date' && (
                      <span className="text-indigo-600">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </button>
                </th>
                <th scope="col" className="px-6 py-3">
                  <button
                    onClick={() => handleSort('status')}
                    className="flex items-center space-x-1 hover:text-gray-900 dark:hover:text-white"
                  >
                    <span>Status</span>
                    {sortField === 'status' && (
                      <span className="text-indigo-600">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </button>
                </th>
                <th scope="col" className="px-6 py-3">
                  <button
                    onClick={() => handleSort('total_amount')}
                    className="flex items-center space-x-1 hover:text-gray-900 dark:hover:text-white"
                  >
                    <span>Total Amount</span>
                    {sortField === 'total_amount' && (
                      <span className="text-indigo-600">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </button>
                </th>
                <th scope="col" className="px-6 py-3">
                  <button
                    onClick={() => handleSort('products_count')}
                    className="flex items-center space-x-1 hover:text-gray-900 dark:hover:text-white"
                  >
                    <span>Products Count</span>
                    {sortField === 'products_count' && (
                      <span className="text-indigo-600">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </button>
                </th>
                <th scope="col" className="px-6 py-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    {orders.length === 0 ? "No orders found" : "No orders match the current filters"}
                  </td>
                </tr>
              ) : (
                filteredAndSortedOrders.map((order, idx) => (
                  <tr
                    key={order.order_id}
                    className={`${
                      idx % 2 === 0
                        ? "bg-white dark:bg-gray-900"
                        : "bg-gray-50 dark:bg-gray-800"
                    } border-b border-gray-200 dark:border-gray-700`}
                  >
                    <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                      #{order.order_id}
                    </th>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900 dark:text-white">{getBuyerName(order.buyer_id)}</div>
                        <div className="text-gray-500 dark:text-gray-400">ID: {order.buyer_id || "N/A"}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">{formatDate(order.order_date)}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {order.total_amount ? `$${order.total_amount}` : "N/A"}
                    </td>
                    <td className="px-6 py-4">{order.ordered_products.length}</td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => navigate(`info/${order.order_id}`)}
                          className="cursor-pointer font-medium text-blue-600 dark:text-blue-500 hover:underline"
                        >
                          Info
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
