import { useState, useEffect } from "react";

interface LocationInfo {
  location_name: string;
  phone: string;
  schedule: string;
  address: string;
  website: string;
  additional_info: string;
  error?: boolean;
}

interface LocationInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  locationName: string;
  locationAddress?: string;
}

export function LocationInfoModal({
  isOpen,
  onClose,
  locationName,
  locationAddress,
}: LocationInfoModalProps) {
  const [locationInfo, setLocationInfo] = useState<LocationInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const fetchLocationInfo = async () => {
    setLoading(true);
    setError("");
    setLocationInfo(null);

    try {
      const response = await fetch("http://34.235.125.104:8000/donation-suggestions/location-info", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          location_name: locationName,
          location_address: locationAddress || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}`);
      }

      const data = await response.json();
      setLocationInfo(data);
    } catch (err: any) {
      setError(err?.message || "Failed to fetch location information");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Could add a toast notification here
    } catch (err) {
      console.error(`Failed to copy ${type}:`, err);
    }
  };

  const isNotAvailable = (value: string) => {
    return value === "Not available" || !value || value.trim() === "";
  };

  // Auto-fetch when modal opens
  useEffect(() => {
    if (isOpen && !locationInfo && !loading) {
      fetchLocationInfo();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg mr-3 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Location Information</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Organization Name */}
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Organization</h4>
          <p className="text-gray-900 dark:text-white font-semibold">{locationName}</p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-400">
              Searching for location information...
            </span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
            <button
              onClick={fetchLocationInfo}
              className="mt-3 px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Location Information */}
        {locationInfo && (
          <div className="space-y-4">
            {/* Phone */}
            <div className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Phone</span>
                </div>
                {!isNotAvailable(locationInfo.phone) && (
                  <button
                    onClick={() => copyToClipboard(locationInfo.phone, "phone")}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                  >
                    Copy
                  </button>
                )}
              </div>
              <p className="text-gray-900 dark:text-white mt-1">
                {isNotAvailable(locationInfo.phone) ? (
                  <span className="text-gray-500 dark:text-gray-400 italic">Not available</span>
                ) : (
                  locationInfo.phone
                )}
              </p>
            </div>

            {/* Schedule */}
            <div className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Schedule</span>
              </div>
              <p className="text-gray-900 dark:text-white mt-1">
                {isNotAvailable(locationInfo.schedule) ? (
                  <span className="text-gray-500 dark:text-gray-400 italic">Not available</span>
                ) : (
                  locationInfo.schedule
                )}
              </p>
            </div>

            {/* Address */}
            <div className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-purple-600 dark:text-purple-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Address</span>
                </div>
                {!isNotAvailable(locationInfo.address) && (
                  <button
                    onClick={() => copyToClipboard(locationInfo.address, "address")}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                  >
                    Copy
                  </button>
                )}
              </div>
              <p className="text-gray-900 dark:text-white mt-1">
                {isNotAvailable(locationInfo.address) ? (
                  <span className="text-gray-500 dark:text-gray-400 italic">Not available</span>
                ) : (
                  locationInfo.address
                )}
              </p>
            </div>

            {/* Website */}
            {!isNotAvailable(locationInfo.website) && (
              <div className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9m0 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Website</span>
                </div>
                <a
                  href={locationInfo.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mt-1 block text-sm underline"
                >
                  {locationInfo.website}
                </a>
              </div>
            )}

            {/* Additional Info */}
            {!isNotAvailable(locationInfo.additional_info) && (
              <div className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Additional Information</span>
                </div>
                <p className="text-gray-900 dark:text-white mt-1 text-sm">
                  {locationInfo.additional_info}
                </p>
              </div>
            )}

            {/* AI Disclaimer */}
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <p className="text-xs text-yellow-800 dark:text-yellow-200">
                  <strong>Note:</strong> This information was gathered automatically via AI web search.
                  Please verify details before making contact, as information may not be current or accurate.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 flex justify-end space-x-3">
          {!loading && !locationInfo && !error && (
            <button
              onClick={fetchLocationInfo}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Get Information
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}