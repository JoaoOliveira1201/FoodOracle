import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import Button from "~/components/Button";
import { formatDuration } from "~/helpers/homeUtils";

interface Location {
  longitude: number;
  latitude: number;
  address?: string;
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

interface User {
  user_id: number;
  name: string;
  contact_info: string | null;
  role: string;
}

export function TripInfo() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [truck, setTruck] = useState<Truck | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [driver, setDriver] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchTrip() {
      if (!id) {
        setError("Trip ID is required");
        setLoading(false);
        return;
      }

      try {
        const tripResponse = await fetch(`http://34.235.125.104:8000/trips/${id}`);
        
        if (!tripResponse.ok) {
          throw new Error(`Failed to fetch trip: ${tripResponse.status}`);
        }
        
        const tripData = await tripResponse.json();
        setTrip(tripData);

        // Fetch related data
        const [trucksResponse, ordersResponse, usersResponse] = await Promise.all([
          fetch("http://34.235.125.104:8000/trucks/"),
          fetch("http://34.235.125.104:8000/orders/"),
          fetch("http://34.235.125.104:8000/users/"),
        ]);

        if (trucksResponse.ok && ordersResponse.ok && usersResponse.ok) {
          const [trucksData, ordersData, usersData] = await Promise.all([
            trucksResponse.json(),
            ordersResponse.json(),
            usersResponse.json(),
          ]);

          // Find truck and driver
          if (tripData.truck_id) {
            const assignedTruck = trucksData.find((t: Truck) => t.truck_id === tripData.truck_id);
            setTruck(assignedTruck || null);

            if (assignedTruck?.truck_driver_id) {
              const assignedDriver = usersData.find((u: User) => u.user_id === assignedTruck.truck_driver_id);
              setDriver(assignedDriver || null);
            }
          }

          // Find order
          if (tripData.order_id) {
            const relatedOrder = ordersData.find((o: Order) => o.order_id === tripData.order_id);
            setOrder(relatedOrder || null);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch trip");
      } finally {
        setLoading(false);
      }
    }

    fetchTrip();
  }, [id]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };


  const formatLocation = (location: Location | null) => {
    if (!location) return "N/A";
    if (location.address) {
      return location.address;
    }
    return `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
  };

  const calculateDistance = (origin: Location | null, destination: Location | null) => {
    if (!origin || !destination) return "N/A";
    
    const R = 6371; // Earth's radius in kilometers
    const dLat = (destination.latitude - origin.latitude) * Math.PI / 180;
    const dLon = (destination.longitude - origin.longitude) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(origin.latitude * Math.PI / 180) * Math.cos(destination.latitude * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return `${distance.toFixed(2)} km`;
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-gray-600">Loading trip...</span>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="px-28 pt-14">
        <div className="p-4 text-sm text-red-300 bg-red-900/20 border border-red-800 rounded-md">
          Error: {error || "Trip not found"}
        </div>
        <div className="mt-4">
          <Button 
            color="secondary" 
            label="Back to Trips" 
            onClick={() => navigate("/trips")} 
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="px-28 pt-14">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-5xl font-bold text-gray-900 mb-2">Trip #{trip.trip_id}</h1>
            <div className="flex items-center space-x-4">
              <span
                className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(trip.status)}`}
              >
                {trip.status}
              </span>
              <span className="text-gray-600 text-lg">
                {calculateDistance(trip.origin, trip.destination)}
              </span>
            </div>
          </div>
          <div className="flex space-x-3">
            <Button 
              color="primary" 
              label="Edit Trip" 
              onClick={() => navigate(`/trips/edit/${trip.trip_id}`)} 
            />
            <Button 
              color="secondary" 
              label="Back to Trips" 
              onClick={() => navigate("/trips")} 
            />
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* Trip Overview */}
          <div className="xl:col-span-2 space-y-6">
            
            {/* Trip Details Card */}
            <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-xl">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Trip Details</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-gray-200">
                    <span className="text-gray-600 font-medium">Trip ID</span>
                    <span className="text-gray-900 font-semibold text-lg">#{trip.trip_id}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-200">
                    <span className="text-gray-600 font-medium">Start Date</span>
                    <span className="text-gray-900">{formatDate(trip.start_date)}</span>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <span className="text-gray-600 font-medium">End Date</span>
                    <span className="text-gray-900">{formatDate(trip.end_date)}</span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-gray-200">
                    <span className="text-gray-600 font-medium">Estimated Time</span>
                    <span className="text-gray-900 font-semibold">{formatDuration(trip.estimated_time)}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-200">
                    <span className="text-gray-600 font-medium">Actual Time</span>
                    <span className="text-gray-900 font-semibold">{formatDuration(trip.actual_time)}</span>
                  </div>
                  {trip.start_date && trip.end_date && (
                    <div className="flex justify-between items-center py-3">
                      <span className="text-gray-600 font-medium">Duration</span>
                      <span className="text-gray-900 font-semibold">
                        {Math.round((new Date(trip.end_date).getTime() - new Date(trip.start_date).getTime()) / (1000 * 60 * 60 * 24))} days
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Route Information */}
            <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-xl">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Route Information</h2>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Origin */}
                <div className="space-y-4">
                  <div className="flex items-center mb-4">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Origin</h3>
                  </div>
                  
                  <div className="bg-gray-50 rounded-xl p-6 space-y-3">
                    <div>
                      <span className="text-gray-600 text-sm font-medium">Location</span>
                      <div className="text-gray-900 font-semibold mt-1">
                        {trip.origin?.address || "Address not available"}
                      </div>
                    </div>
                    {trip.origin && (
                      <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-300">
                        <div>
                          <span className="text-gray-600 text-xs">Latitude</span>
                          <div className="text-gray-700 text-sm font-mono">
                            {trip.origin.latitude.toFixed(6)}°
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-600 text-xs">Longitude</span>
                          <div className="text-gray-700 text-sm font-mono">
                            {trip.origin.longitude.toFixed(6)}°
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Destination */}
                <div className="space-y-4">
                  <div className="flex items-center mb-4">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Destination</h3>
                  </div>
                  
                  <div className="bg-gray-50 rounded-xl p-6 space-y-3">
                    <div>
                      <span className="text-gray-600 text-sm font-medium">Location</span>
                      <div className="text-gray-900 font-semibold mt-1">
                        {trip.destination?.address || "Address not available"}
                      </div>
                    </div>
                    {trip.destination && (
                      <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-300">
                        <div>
                          <span className="text-gray-600 text-xs">Latitude</span>
                          <div className="text-gray-700 text-sm font-mono">
                            {trip.destination.latitude.toFixed(6)}°
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-600 text-xs">Longitude</span>
                          <div className="text-gray-700 text-sm font-mono">
                            {trip.destination.longitude.toFixed(6)}°
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Truck Information */}
            {truck && (
              <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xl">
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Truck Details</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600">Truck ID</span>
                    <span className="text-gray-900 font-semibold">#{truck.truck_id}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600">Type</span>
                    <span className="text-gray-900">{truck.type}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600">Status</span>
                    <span className="text-gray-900">{truck.status}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600">Capacity</span>
                    <span className="text-gray-900">
                      {truck.load_capacity_kg ? `${truck.load_capacity_kg} kg` : "N/A"}
                    </span>
                  </div>
                </div>
                
                {driver && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-600 mb-3">Driver Information</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 text-sm">Name</span>
                        <span className="text-gray-900 text-sm">{driver.name}</span>
                      </div>
                      {driver.contact_info && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 text-sm">Contact</span>
                          <span className="text-gray-900 text-sm">{driver.contact_info}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Order Information */}
            {order && (
              <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xl">
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Order Details</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600">Order ID</span>
                    <span className="text-gray-900 font-semibold">#{order.order_id}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600">Order Date</span>
                    <span className="text-gray-900 text-sm">{formatDate(order.order_date)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600">Status</span>
                    <span className="text-gray-900">{order.status}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600">Total Amount</span>
                    <span className="text-gray-900 font-semibold text-lg">${order.total_amount || 0}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
