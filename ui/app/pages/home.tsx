import { useAuth } from "~/contexts/AuthContext";
import { useEffect, useState } from "react";
import type { Trip, WarehouseTransfer, Truck, Location } from "~/types/home";
import { getUserRoleTitle, getUserRoleDescription } from "~/helpers/homeUtils";
import { AdminSection } from "~/components/AdminSection";
import { BuyerSection } from "~/components/BuyerSection";
import { SupplierSection } from "~/components/SupplierSection";
import { TruckDriverSection } from "~/components/TruckDriverSection";
import { LocationUpdateModal } from "~/components/LocationUpdateModal";

export function Home() {
  const { user, isAdmin, isBuyer, isSupplier, isTruckDriver } = useAuth();
  const [currentTrip, setCurrentTrip] = useState<Trip | null>(null);
  const [currentTransfer, setCurrentTransfer] = useState<WarehouseTransfer | null>(null);
  const [truck, setTruck] = useState<Truck | null>(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);

  // Fetch truck and current activity data for truck drivers
  useEffect(() => {
    if (user && isTruckDriver()) {
      fetchDriverData();
    }
  }, [user, isTruckDriver]);

  const fetchDriverData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // First get the truck for this driver
      const truckResponse = await fetch(`http://34.235.125.104:8000/trucks/driver/${user.user_id}`);
      if (truckResponse.ok) {
        const truckData = await truckResponse.json();
        if (truckData.length > 0) {
          setTruck(truckData[0]);
          
          // Then get current active trip and transfer
          await Promise.all([
            fetchCurrentTrip(truckData[0].truck_id),
            fetchCurrentTransfer(truckData[0].truck_id)
          ]);
        }
      }
    } catch (err) {
      console.error("Error fetching driver data:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentTrip = async (truckId: number) => {
    try {
      const response = await fetch(`http://34.235.125.104:8000/trips/truck/${truckId}`);
      if (response.ok) {
        const trips = await response.json();
        // Find active trip (not delivered)
        const activeTrip = trips.find((trip: Trip) => 
          ['Waiting', 'Collecting', 'Loaded', 'Paused', 'Delivering'].includes(trip.status)
        );
        setCurrentTrip(activeTrip || null);
      }
    } catch (err) {
      console.error("Error fetching current trip:", err);
    }
  };

  const fetchCurrentTransfer = async (truckId: number) => {
    try {
      const response = await fetch(`http://34.235.125.104:8000/warehouse-transfers/truck/${truckId}`);
      if (response.ok) {
        const transfers = await response.json();
        // Find active transfer (pending or in transit)
        const activeTransfer = transfers.find((transfer: WarehouseTransfer) => 
          ['Pending', 'InTransit'].includes(transfer.status)
        );
        setCurrentTransfer(activeTransfer || null);
      }
    } catch (err) {
      console.error("Error fetching current transfer:", err);
    }
  };

  // Clear feedback messages after a delay
  useEffect(() => {
    if (updateSuccess || updateError) {
      const timer = setTimeout(() => {
        setUpdateSuccess(null);
        setUpdateError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [updateSuccess, updateError]);

  // Update functions
  const updateTripStatus = async (tripId: number, newStatus: string) => {
    setUpdating(true);
    setUpdateError(null);
    
    try {
      const response = await fetch(`http://34.235.125.104:8000/trips/${tripId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      if (response.ok) {
        setUpdateSuccess(`Trip status updated to ${newStatus}`);
        // Refresh the current trip data
        if (truck) {
          await fetchCurrentTrip(truck.truck_id);
        }
      } else {
        const errorData = await response.json();
        setUpdateError(errorData.detail || "Failed to update trip status");
      }
    } catch (err) {
      setUpdateError("Failed to update trip status");
      console.error("Error updating trip status:", err);
    } finally {
      setUpdating(false);
    }
  };

  const updateTransferStatus = async (transferId: number, newStatus: string) => {
    setUpdating(true);
    setUpdateError(null);
    
    try {
      const response = await fetch(`http://34.235.125.104:8000/warehouse-transfers/${transferId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      if (response.ok) {
        setUpdateSuccess(`Transfer status updated to ${newStatus}`);
        // Refresh the current transfer data
        if (truck) {
          await fetchCurrentTransfer(truck.truck_id);
        }
      } else {
        const errorData = await response.json();
        setUpdateError(errorData.detail || "Failed to update transfer status");
      }
    } catch (err) {
      setUpdateError("Failed to update transfer status");
      console.error("Error updating transfer status:", err);
    } finally {
      setUpdating(false);
    }
  };

  const updateTruckLocation = async (location: Location) => {
    if (!truck) return;
    
    setUpdating(true);
    setUpdateError(null);
    
    try {
      const response = await fetch(`http://34.235.125.104:8000/trucks/${truck.truck_id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: truck.status,
          current_location: location,
        }),
      });

      if (response.ok) {
        setUpdateSuccess("Location updated successfully");
        // Refresh truck data
        await fetchDriverData();
      } else {
        const errorData = await response.json();
        setUpdateError(errorData.detail || "Failed to update location");
      }
    } catch (err) {
      setUpdateError("Failed to update location");
      console.error("Error updating location:", err);
    } finally {
      setUpdating(false);
    }
  };

  const updateTruckStatus = async (newStatus: string) => {
    if (!truck) return;
    
    setUpdating(true);
    setUpdateError(null);
    
    try {
      const response = await fetch(`http://34.235.125.104:8000/trucks/${truck.truck_id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
          current_location: truck.current_location,
        }),
      });

      if (response.ok) {
        setUpdateSuccess(`Truck status updated to ${newStatus}`);
        // Refresh truck data
        await fetchDriverData();
      } else {
        const errorData = await response.json();
        setUpdateError(errorData.detail || "Failed to update truck status");
      }
    } catch (err) {
      setUpdateError("Failed to update truck status");
      console.error("Error updating truck status:", err);
    } finally {
      setUpdating(false);
    }
  };

  // Helper functions for component callbacks
  const handleShowLocationModal = () => {
    setShowLocationModal(true);
  };

  const handleLocationError = (error: string) => {
    setUpdateError(error);
  };





  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 px-4 py-8">
      {/* Hero Section */}
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-lg mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
          <div className="mb-4">
            <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
              Food Oracle
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 font-medium">
              AI-Powered Supply Chain Management
            </p>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-800 dark:text-gray-200 mb-4 tracking-tight">
            {getUserRoleTitle(isAdmin, isBuyer, isSupplier, isTruckDriver)}
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-2">
            {getUserRoleDescription(isAdmin, isBuyer, isSupplier, isTruckDriver)}
          </p>
          {user && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Welcome back, <span className="font-semibold text-blue-600 dark:text-blue-400">{user.name || `User #${user.user_id}`}</span>
            </p>
          )}
        </div>

        {/* Main Content Area */}
        <div className="mx-auto max-w-7xl">
          {isAdmin() && <AdminSection />}
          {isBuyer() && <BuyerSection />}
          {isSupplier() && <SupplierSection />}
          {isTruckDriver() && (
            <TruckDriverSection
              truck={truck}
              currentTrip={currentTrip}
              currentTransfer={currentTransfer}
              loading={loading}
              updating={updating}
              updateSuccess={updateSuccess}
              updateError={updateError}
              onUpdateTripStatus={updateTripStatus}
              onUpdateTransferStatus={updateTransferStatus}
              onUpdateTruckStatus={updateTruckStatus}
              onShowLocationModal={handleShowLocationModal}
            />
          )}
        </div>
      </div>

      {/* Location Update Modal */}
      {truck && (
        <LocationUpdateModal
          truck={truck}
          currentTrip={currentTrip}
          currentTransfer={currentTransfer}
          showModal={showLocationModal}
          setShowModal={setShowLocationModal}
          updating={updating}
          onUpdateLocation={updateTruckLocation}
          onLocationError={handleLocationError}
        />
      )}
    </div>
  );
}
