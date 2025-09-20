import { useState } from "react";
import type { Truck, Trip, WarehouseTransfer, Location } from "~/types/home";

interface LocationUpdateModalProps {
  truck: Truck;
  currentTrip: Trip | null;
  currentTransfer: WarehouseTransfer | null;
  showModal: boolean;
  setShowModal: (show: boolean) => void;
  updating: boolean;
  onUpdateLocation: (location: Location) => Promise<void>;
  onLocationError: (error: string) => void;
}

export function LocationUpdateModal({
  truck,
  currentTrip,
  currentTransfer,
  showModal,
  setShowModal,
  updating,
  onUpdateLocation,
  onLocationError,
}: LocationUpdateModalProps) {
  const [newLocation, setNewLocation] = useState<Location>({
    latitude: truck.current_location?.latitude || 0,
    longitude: truck.current_location?.longitude || 0,
  });

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setNewLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          onLocationError("Failed to get current location");
        }
      );
    } else {
      onLocationError("Geolocation is not supported by this browser");
    }
  };

  const handleUpdateLocation = async () => {
    await onUpdateLocation(newLocation);
    if (!updating) {
      setShowModal(false);
    }
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg mr-3 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Update Truck Location</h3>
        </div>

        {/* Current Location Display */}
        {truck.current_location && (
          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Current Location:</div>
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              📍 {truck.current_location.latitude.toFixed(6)}, {truck.current_location.longitude.toFixed(6)}
            </div>
          </div>
        )}

        {/* Current Activity Context */}
        {(currentTrip || currentTransfer) && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-sm text-blue-600 dark:text-blue-400 mb-1">
              {currentTrip ? '🚛 Active Trip:' : '↔️ Active Transfer:'}
            </div>
            <div className="text-sm font-medium text-blue-900 dark:text-blue-200">
              {currentTrip ? `Trip #${currentTrip.trip_id} - ${currentTrip.status}` : 
               `Transfer #${currentTransfer?.transfer_id} - ${currentTransfer?.status}`}
            </div>
          </div>
        )}
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Latitude
            </label>
            <input
              type="number"
              step="any"
              value={newLocation.latitude}
              onChange={(e) => setNewLocation(prev => ({ ...prev, latitude: parseFloat(e.target.value) || 0 }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Enter latitude"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Longitude
            </label>
            <input
              type="number"
              step="any"
              value={newLocation.longitude}
              onChange={(e) => setNewLocation(prev => ({ ...prev, longitude: parseFloat(e.target.value) || 0 }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Enter longitude"
            />
          </div>
          
          <button
            onClick={getCurrentLocation}
            className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Use GPS Location
          </button>
        </div>
        
        <div className="flex space-x-3 mt-6">
          <button
            onClick={() => setShowModal(false)}
            className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleUpdateLocation}
            disabled={updating}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {updating ? 'Updating...' : 'Update Location'}
          </button>
        </div>
      </div>
    </div>
  );
}
