import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import Button from "~/components/Button";

interface UserFormData {
  name: string;
  contact_info: string | null;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  } | null;
  password_string: string;
  role: string;
}

const USER_ROLES = [
  { value: "Administrator", label: "Administrator" },
  { value: "Supplier", label: "Supplier" },
  { value: "Buyer", label: "Buyer" },
  { value: "TruckDriver", label: "Truck Driver" },
];

export function EditUser() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const [formData, setFormData] = useState<UserFormData>({
    name: "",
    contact_info: null,
    location: null,
    password_string: "",
    role: "Buyer",
  });
  const [includeLocation, setIncludeLocation] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [fetchLoading, setFetchLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await fetch(`http://localhost:8000/users/${id}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const user = await response.json();
        setFormData({
          name: user.name,
          contact_info: user.contact_info,
          location: user.location,
          password_string: "", // Don't pre-fill password for security
          role: user.role,
        });
        setIncludeLocation(!!user.location);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch user");
      } finally {
        setFetchLoading(false);
      }
    }

    if (id) {
      fetchUser();
    }
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === "latitude" || name === "longitude" || name === "address") {
      setFormData({
        ...formData,
        location: {
          ...formData.location!,
          [name]: name === "address" ? value : Number(value),
        },
      });
    } else if (name === "contact_info") {
      setFormData({
        ...formData,
        [name]: value === "" ? null : value,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleLocationToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setIncludeLocation(checked);
    if (checked) {
      setFormData({
        ...formData,
        location: formData.location || {
          latitude: 0,
          longitude: 0,
          address: "",
        },
      });
    } else {
      setFormData({
        ...formData,
        location: null,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch(`http://localhost:8000/users/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to update user");
      }

      // Success - navigate back to users list
      navigate("/users");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-gray-600">Loading user...</span>
      </div>
    );
  }

  return (
    <div className="px-28 pt-14">
      <h1 className="text-4xl font-bold mb-6">Edit User</h1>
      
      {error && (
        <div className="mb-4 p-3 text-sm text-red-300 bg-red-900/20 border border-red-800 rounded-md max-w-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-100">
            Name *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full p-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            placeholder="Enter user name"
          />
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium text-gray-100">
            Contact Info
          </label>
          <input
            type="text"
            name="contact_info"
            value={formData.contact_info || ""}
            onChange={handleChange}
            className="w-full p-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            placeholder="Email, phone, etc. (optional)"
          />
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium text-gray-100">
            New Password *
          </label>
          <input
            type="password"
            name="password_string"
            value={formData.password_string}
            onChange={handleChange}
            required
            className="w-full p-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            placeholder="Enter new password"
          />
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium text-gray-100">
            Role *
          </label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            required
            className="w-full p-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          >
            {USER_ROLES.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center">
          <input
            id="include_location"
            type="checkbox"
            checked={includeLocation}
            onChange={handleLocationToggle}
            className="w-4 h-4 text-indigo-600 bg-gray-700 border-gray-600 rounded focus:ring-indigo-500 focus:ring-2"
          />
          <label htmlFor="include_location" className="ml-2 text-sm font-medium text-gray-100">
            Include Location
          </label>
        </div>

        {includeLocation && formData.location && (
          <div className="space-y-4">
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-100">
                Address
              </label>
              <input
                type="text"
                name="address"
                value={formData.location.address || ""}
                onChange={handleChange}
                className="w-full p-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                placeholder="Enter full address (optional)"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-100">
                  Latitude
                </label>
                <input
                  type="number"
                  name="latitude"
                  value={formData.location.latitude}
                  onChange={handleChange}
                  step="any"
                  className="w-full p-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  placeholder="0.000000"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-100">
                  Longitude
                </label>
                <input
                  type="number"
                  name="longitude"
                  value={formData.location.longitude}
                  onChange={handleChange}
                  step="any"
                  className="w-full p-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  placeholder="0.000000"
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex space-x-4 pt-4">
          <Button 
            type="submit" 
            color="primary" 
            label={isLoading ? "Updating..." : "Update User"} 
            onClick={() => {}} 
            disabled={isLoading || fetchLoading}
          />
          <Button 
            type="button" 
            color="secondary" 
            label="Cancel" 
            onClick={() => navigate("/users")} 
            disabled={isLoading}
          />
        </div>
      </form>
    </div>
  );
}