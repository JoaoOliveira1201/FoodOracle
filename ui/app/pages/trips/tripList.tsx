import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router";
import Button from "~/components/Button";
import { formatDuration } from "~/helpers/homeUtils";

interface Location {
  longitude: number;
  latitude: number;
}

interface Trip {
  trip_id: number;
  truck_id: number | null;
  order_id: number | null;
  origin: Location | null;
  destination: Location | null;
  status: string;
  estimated_time: string | null;
  actual_time: string | null;
  start_date: string | null;
  end_date: string | null;
}

interface Truck {
  truck_id: number;
  truck_driver_id: number | null;
  current_location: any;
  status: string;
  type: string;
  load_capacity_kg: number | null;
}

interface Order {
  order_id: number;
  buyer_id: number | null;
  order_date: string | null;
  status: string;
  total_amount: number | null;
}

type SortField = 'trip_id' | 'truck_id' | 'order_id' | 'status' | 'start_date' | 'estimated_time';
type SortDirection = 'asc' | 'desc';

export function TripList() {
  const navigate = useNavigate();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [truckFilter, setTruckFilter] = useState<string>("");
  const [orderFilter, setOrderFilter] = useState<string>("");
  const [dateFromFilter, setDateFromFilter] = useState<string>("");
  const [dateToFilter, setDateToFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  
  // Sort states
  const [sortField, setSortField] = useState<SortField>('trip_id');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  useEffect(() => {
    async function fetchData() {
      try {
        const [tripsResponse, trucksResponse, ordersResponse] = await Promise.all([
          fetch("http://34.235.125.104:8000/trips/"),
          fetch("http://34.235.125.104:8000/trucks/"),
          fetch("http://34.235.125.104:8000/orders/"),
        ]);
        
        if (!tripsResponse.ok || !trucksResponse.ok || !ordersResponse.ok) {
          throw new Error("Failed to fetch data");
        }
        
        const [tripsData, trucksData, ordersData] = await Promise.all([
          tripsResponse.json(),
          trucksResponse.json(),
          ordersResponse.json(),
        ]);

        setTrips(tripsData);
        setTrucks(trucksData);
        setOrders(ordersData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch trips");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const getTruckInfo = (truckId: number | null) => {
    if (!truckId) return "Not assigned";
    const truck = trucks.find(t => t.truck_id === truckId);
    return truck ? `Truck ${truckId} (${truck.type})` : `Truck ${truckId}`;
  };

  const getOrderInfo = (orderId: number | null) => {
    if (!orderId) return "No order";
    const order = orders.find(o => o.order_id === orderId);
    return order ? `Order #${orderId}` : `Order #${orderId}`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };


  const formatLocation = (location: Location | null) => {
    if (!location) return "N/A";
    return `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      "Waiting": "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
      "Collecting": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      "Loaded": "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
      "Paused": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      "Delivering": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
      "Delivered": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
  };

  // Filter and sort trips
  const filteredAndSortedTrips = useMemo(() => {
    let filtered = trips.filter(trip => {
      // Status filter
      if (statusFilter && trip.status !== statusFilter) return false;
      
      // Truck filter
      if (truckFilter) {
        const truckInfo = getTruckInfo(trip.truck_id).toLowerCase();
        if (!truckInfo.includes(truckFilter.toLowerCase())) return false;
      }
      
      // Order filter
      if (orderFilter) {
        const orderInfo = getOrderInfo(trip.order_id).toLowerCase();
        if (!orderInfo.includes(orderFilter.toLowerCase())) return false;
      }
      
      // Date range filter
      if (dateFromFilter && trip.start_date) {
        const tripDate = new Date(trip.start_date);
        const fromDate = new Date(dateFromFilter);
        if (tripDate < fromDate) return false;
      }
      
      if (dateToFilter && trip.start_date) {
        const tripDate = new Date(trip.start_date);
        const toDate = new Date(dateToFilter);
        toDate.setHours(23, 59, 59, 999); // End of day
        if (tripDate > toDate) return false;
      }
      
      // Search term filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const tripId = trip.trip_id.toString();
        const truckInfo = getTruckInfo(trip.truck_id).toLowerCase();
        const orderInfo = getOrderInfo(trip.order_id).toLowerCase();
        const status = trip.status.toLowerCase();
        
        if (!tripId.includes(searchLower) && 
            !truckInfo.includes(searchLower) && 
            !orderInfo.includes(searchLower) &&
            !status.includes(searchLower)) {
          return false;
        }
      }
      
      return true;
    });

    // Sort trips
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'trip_id':
          aValue = a.trip_id;
          bValue = b.trip_id;
          break;
        case 'truck_id':
          aValue = a.truck_id || 0;
          bValue = b.truck_id || 0;
          break;
        case 'order_id':
          aValue = a.order_id || 0;
          bValue = b.order_id || 0;
          break;
        case 'status':
          aValue = a.status.toLowerCase();
          bValue = b.status.toLowerCase();
          break;
        case 'start_date':
          aValue = a.start_date ? new Date(a.start_date).getTime() : 0;
          bValue = b.start_date ? new Date(b.start_date).getTime() : 0;
          break;
        case 'estimated_time':
          aValue = a.estimated_time || "";
          bValue = b.estimated_time || "";
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [trips, trucks, orders, statusFilter, truckFilter, orderFilter, dateFromFilter, dateToFilter, searchTerm, sortField, sortDirection]);

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
    setTruckFilter("");
    setOrderFilter("");
    setDateFromFilter("");
    setDateToFilter("");
    setSearchTerm("");
  };

  // Get unique statuses for filter dropdown
  const uniqueStatuses = useMemo(() => {
    const statuses = [...new Set(trips.map(trip => trip.status))];
    return statuses.sort();
  }, [trips]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-gray-600">Loading trips...</span>
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
        <h1 className="text-4xl font-bold">Trips:</h1>
        <Button color="primary" label="Create Trip" onClick={() => navigate("create")} />
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
                placeholder="Search trips..."
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

            {/* Truck Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Truck
              </label>
              <input
                type="text"
                placeholder="Filter by truck..."
                value={truckFilter}
                onChange={(e) => setTruckFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Order Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Order
              </label>
              <input
                type="text"
                placeholder="Filter by order..."
                value={orderFilter}
                onChange={(e) => setOrderFilter(e.target.value)}
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
          </div>
          
          {/* Clear Filters and Results count */}
          <div className="flex items-center justify-between">
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md transition-colors duration-200"
            >
              Clear Filters
            </button>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing {filteredAndSortedTrips.length} of {trips.length} trips
            </div>
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
                    onClick={() => handleSort('trip_id')}
                    className="flex items-center space-x-1 hover:text-gray-900 dark:hover:text-white"
                  >
                    <span>Trip ID</span>
                    {sortField === 'trip_id' && (
                      <span className="text-indigo-600">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </button>
                </th>
                <th scope="col" className="px-6 py-3">
                  <button
                    onClick={() => handleSort('truck_id')}
                    className="flex items-center space-x-1 hover:text-gray-900 dark:hover:text-white"
                  >
                    <span>Truck</span>
                    {sortField === 'truck_id' && (
                      <span className="text-indigo-600">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </button>
                </th>
                <th scope="col" className="px-6 py-3">
                  <button
                    onClick={() => handleSort('order_id')}
                    className="flex items-center space-x-1 hover:text-gray-900 dark:hover:text-white"
                  >
                    <span>Order</span>
                    {sortField === 'order_id' && (
                      <span className="text-indigo-600">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </button>
                </th>
                <th scope="col" className="px-6 py-3">
                  Route
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
                    onClick={() => handleSort('start_date')}
                    className="flex items-center space-x-1 hover:text-gray-900 dark:hover:text-white"
                  >
                    <span>Start Date</span>
                    {sortField === 'start_date' && (
                      <span className="text-indigo-600">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </button>
                </th>
                <th scope="col" className="px-6 py-3">
                  <button
                    onClick={() => handleSort('estimated_time')}
                    className="flex items-center space-x-1 hover:text-gray-900 dark:hover:text-white"
                  >
                    <span>Estimated Time</span>
                    {sortField === 'estimated_time' && (
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
              {filteredAndSortedTrips.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                    {trips.length === 0 ? "No trips found" : "No trips match the current filters"}
                  </td>
                </tr>
              ) : (
                filteredAndSortedTrips.map((trip, idx) => (
                  <tr
                    key={trip.trip_id}
                    className={`${
                      idx % 2 === 0
                        ? "bg-white dark:bg-gray-900"
                        : "bg-gray-50 dark:bg-gray-800"
                    } border-b border-gray-200 dark:border-gray-700`}
                  >
                    <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                      #{trip.trip_id}
                    </th>
                    <td className="px-6 py-4">{getTruckInfo(trip.truck_id)}</td>
                    <td className="px-6 py-4">{getOrderInfo(trip.order_id)}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="font-medium text-gray-400">From:</div>
                        <div className="text-xs">{formatLocation(trip.origin)}</div>
                        <div className="font-medium text-gray-400 mt-1">To:</div>
                        <div className="text-xs">{formatLocation(trip.destination)}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(trip.status)}`}
                      >
                        {trip.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">{formatDate(trip.start_date)}</td>
                    <td className="px-6 py-4">{formatDuration(trip.estimated_time)}</td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => navigate(`info/${trip.trip_id}`)}
                          className="cursor-pointer font-medium text-blue-600 dark:text-blue-500 hover:underline"
                        >
                          Info
                        </button>
                        <button
                          onClick={() => navigate(`edit/${trip.trip_id}`)}
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
