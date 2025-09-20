import { useNavigate } from "react-router";
import type { Truck, Trip, WarehouseTransfer } from "~/types/home";
import { getStatusColor, formatDate, formatDuration } from "~/helpers/homeUtils";
import Tile from "~/components/Tile";

interface TruckDriverSectionProps {
  truck: Truck | null;
  currentTrip: Trip | null;
  currentTransfer: WarehouseTransfer | null;
  loading: boolean;
  updating: boolean;
  updateSuccess: string | null;
  updateError: string | null;
  onUpdateTripStatus: (tripId: number, status: string) => Promise<void>;
  onUpdateTransferStatus: (transferId: number, status: string) => Promise<void>;
  onUpdateTruckStatus: (status: string) => Promise<void>;
  onShowLocationModal: () => void;
}

export function TruckDriverSection({
  truck,
  currentTrip,
  currentTransfer,
  loading,
  updating,
  updateSuccess,
  updateError,
  onUpdateTripStatus,
  onUpdateTransferStatus,
  onUpdateTruckStatus,
  onShowLocationModal,
}: TruckDriverSectionProps) {
  const navigate = useNavigate();

  return (
    <div className="mb-12">
      {/* Feedback Messages */}
      {(updateSuccess || updateError) && (
        <div className="mb-6">
          {updateSuccess && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg dark:bg-green-800 dark:border-green-600 dark:text-green-200">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {updateSuccess}
              </div>
            </div>
          )}
          {updateError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg dark:bg-red-800 dark:border-red-600 dark:text-red-200">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {updateError}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Truck Location Section */}
      {truck && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center">
            <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg mr-3 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            My Truck Status
          </h2>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="max-w-md mx-auto">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Current Location
              </h3>
              <div className="space-y-3">
                {truck.current_location ? (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">Latitude:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{truck.current_location.latitude.toFixed(6)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">Longitude:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{truck.current_location.longitude.toFixed(6)}</span>
                    </div>
                  </>
                ) : (
                  <div className="text-gray-500 dark:text-gray-400 italic">No location set</div>
                )}
                
                <div className="pt-2">
                  <button
                    onClick={onShowLocationModal}
                    className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Update Location
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Current Activity Section */}
      {(currentTrip || currentTransfer) && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center">
            <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg mr-3 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            Current Activity
          </h2>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            {currentTrip && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    Active Delivery Trip
                  </h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(currentTrip.status)}`}>
                    {currentTrip.status}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Trip ID:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">#{currentTrip.trip_id}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Estimated Time:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">{formatDuration(currentTrip.estimated_time)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Start Date:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">{formatDate(currentTrip.start_date)}</span>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    onClick={() => navigate("/myTrips")}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    View Trip Details
                  </button>
                  
                  {/* Status Update Buttons */}
                  <div className="flex space-x-2">
                    {currentTrip.status === 'Waiting' && (
                      <button
                        onClick={() => onUpdateTripStatus(currentTrip.trip_id, 'Collecting')}
                        disabled={updating}
                        className="px-3 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        {updating ? 'Updating...' : 'Start Collecting'}
                      </button>
                    )}
                    {currentTrip.status === 'Collecting' && (
                      <button
                        onClick={() => onUpdateTripStatus(currentTrip.trip_id, 'Loaded')}
                        disabled={updating}
                        className="px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        {updating ? 'Updating...' : 'Mark as Loaded'}
                      </button>
                    )}
                    {currentTrip.status === 'Loaded' && (
                      <button
                        onClick={() => onUpdateTripStatus(currentTrip.trip_id, 'Delivering')}
                        disabled={updating}
                        className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        {updating ? 'Updating...' : 'Start Delivering'}
                      </button>
                    )}
                    {currentTrip.status === 'Delivering' && (
                      <button
                        onClick={() => onUpdateTripStatus(currentTrip.trip_id, 'Delivered')}
                        disabled={updating}
                        className="px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        {updating ? 'Updating...' : 'Complete Delivery'}
                      </button>
                    )}
                    {['Collecting', 'Loaded', 'Delivering'].includes(currentTrip.status) && (
                      <button
                        onClick={() => onUpdateTripStatus(currentTrip.trip_id, 'Paused')}
                        disabled={updating}
                        className="px-3 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        {updating ? 'Updating...' : 'Pause'}
                      </button>
                    )}
                    {currentTrip.status === 'Paused' && (
                      <>
                        <button
                          onClick={() => onUpdateTripStatus(currentTrip.trip_id, 'Collecting')}
                          disabled={updating}
                          className="px-3 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                          {updating ? 'Updating...' : 'Resume Collecting'}
                        </button>
                        <button
                          onClick={() => onUpdateTripStatus(currentTrip.trip_id, 'Delivering')}
                          disabled={updating}
                          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                          {updating ? 'Updating...' : 'Resume Delivering'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {currentTransfer && (
              <div className={currentTrip ? "border-t pt-4" : ""}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                    <svg className="w-5 h-5 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    Active Warehouse Transfer
                  </h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(currentTransfer.status)}`}>
                    {currentTransfer.status}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Transfer ID:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">#{currentTransfer.transfer_id}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Reason:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">{currentTransfer.reason || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Requested:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">{formatDate(currentTransfer.requested_date)}</span>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    onClick={() => navigate("/myTransfers")}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    View Transfer Details
                  </button>
                  
                  {/* Status Update Buttons */}
                  <div className="flex space-x-2">
                    {currentTransfer.status === 'Pending' && (
                      <button
                        onClick={() => onUpdateTransferStatus(currentTransfer.transfer_id, 'InTransit')}
                        disabled={updating}
                        className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        {updating ? 'Updating...' : 'Start Transfer'}
                      </button>
                    )}
                    {currentTransfer.status === 'InTransit' && (
                      <button
                        onClick={() => onUpdateTransferStatus(currentTransfer.transfer_id, 'Completed')}
                        disabled={updating}
                        className="px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        {updating ? 'Updating...' : 'Complete Transfer'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* No active activity message */}
      {!loading && !currentTrip && !currentTransfer && truck && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center">
            <div className="w-8 h-8 bg-gradient-to-r from-gray-400 to-gray-500 rounded-lg mr-3 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            Current Status
          </h2>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="text-center py-8">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Active Tasks</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">You're currently available for new trips and transfers.</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tiles Section */}
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center">
        <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg mr-3 flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        Driver Operations
      </h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Tile
          iconURL="https://www.svgrepo.com/show/530438/ddos-protection.svg"
          onClick={() => navigate("/myTruck")}
          title="My Truck"
          subtitle="Create and manage your truck, update status and location information"
        />
        <Tile
          iconURL="https://www.svgrepo.com/show/530438/ddos-protection.svg"
          onClick={() => navigate("/myTransfers")}
          title="Warehouse Transfers"
          subtitle="View all warehouse transfers assigned to your truck with detailed status tracking"
        />
        <Tile
          iconURL="https://www.svgrepo.com/show/530438/ddos-protection.svg"
          onClick={() => navigate("/myTrips")}
          title="Delivery Trips"
          subtitle="Track your delivery trips, routes, and completion status in real-time"
        />
      </div>
    </div>
  );
}
