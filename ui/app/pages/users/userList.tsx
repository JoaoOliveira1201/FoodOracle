import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router";
import Button from "~/components/Button";

interface User {
  user_id: number;
  name: string;
  contact_info: string | null;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  } | null;
  role: string;
}

type SortField = 'user_id' | 'name' | 'contact_info' | 'role' | 'has_location';
type SortDirection = 'asc' | 'desc';

export function UserList() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  
  // Filter states
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [nameFilter, setNameFilter] = useState<string>("");
  const [contactFilter, setContactFilter] = useState<string>("");
  const [locationFilter, setLocationFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  
  // Sort states
  const [sortField, setSortField] = useState<SortField>('user_id');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  useEffect(() => {
    async function fetchUsers() {
      try {
        const response = await fetch("http://localhost:8000/users/");
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setUsers(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch users");
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, []);

  const handleDelete = async (userId: number) => {
    setDeletingId(userId);
    try {
      const response = await fetch(`http://localhost:8000/users/${userId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to delete user");
      }

      // Remove the user from the list
      setUsers(users.filter(user => user.user_id !== userId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred while deleting");
    } finally {
      setDeletingId(null);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "Administrator":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      case "Supplier":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "Buyer":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "TruckDriver":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  // Filter and sort users
  const filteredAndSortedUsers = useMemo(() => {
    let filtered = users.filter(user => {
      // Role filter
      if (roleFilter && user.role !== roleFilter) return false;
      
      // Name filter
      if (nameFilter && !user.name.toLowerCase().includes(nameFilter.toLowerCase())) return false;
      
      // Contact filter
      if (contactFilter && user.contact_info && !user.contact_info.toLowerCase().includes(contactFilter.toLowerCase())) return false;
      
      // Location filter
      if (locationFilter && user.location) {
        const locationText = user.location.address?.toLowerCase() || 
                           `${user.location.latitude}, ${user.location.longitude}`;
        if (!locationText.includes(locationFilter.toLowerCase())) return false;
      }
      
      // Search term filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const name = user.name.toLowerCase();
        const contact = user.contact_info?.toLowerCase() || "";
        const role = user.role.toLowerCase();
        const userId = user.user_id.toString();
        
        if (!name.includes(searchLower) && 
            !contact.includes(searchLower) && 
            !role.includes(searchLower) &&
            !userId.includes(searchLower)) {
          return false;
        }
      }
      
      return true;
    });

    // Sort users
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'user_id':
          aValue = a.user_id;
          bValue = b.user_id;
          break;
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'contact_info':
          aValue = a.contact_info || "";
          bValue = b.contact_info || "";
          break;
        case 'role':
          aValue = a.role.toLowerCase();
          bValue = b.role.toLowerCase();
          break;
        case 'has_location':
          aValue = a.location ? 1 : 0;
          bValue = b.location ? 1 : 0;
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [users, roleFilter, nameFilter, contactFilter, locationFilter, searchTerm, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const clearFilters = () => {
    setRoleFilter("");
    setNameFilter("");
    setContactFilter("");
    setLocationFilter("");
    setSearchTerm("");
  };

  // Get unique roles for filter dropdown
  const uniqueRoles = useMemo(() => {
    const roles = [...new Set(users.map(user => user.role))];
    return roles.sort();
  }, [users]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-gray-600">Loading users...</span>
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
        <h1 className="text-4xl font-bold">Users:</h1>
        <Button color="primary" label="Create" onClick={() => navigate("create")} />
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
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Role Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Role
              </label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">All Roles</option>
                {uniqueRoles.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>

            {/* Name Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Name
              </label>
              <input
                type="text"
                placeholder="Filter by name..."
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Contact Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Contact
              </label>
              <input
                type="text"
                placeholder="Filter by contact..."
                value={contactFilter}
                onChange={(e) => setContactFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Location Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Location
              </label>
              <input
                type="text"
                placeholder="Search by location..."
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
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
            Showing {filteredAndSortedUsers.length} of {users.length} users
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
                    onClick={() => handleSort('user_id')}
                    className="flex items-center space-x-1 hover:text-gray-900 dark:hover:text-white"
                  >
                    <span>User ID</span>
                    {sortField === 'user_id' && (
                      <span className="text-indigo-600">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </button>
                </th>
                <th scope="col" className="px-6 py-3">
                  <button
                    onClick={() => handleSort('name')}
                    className="flex items-center space-x-1 hover:text-gray-900 dark:hover:text-white"
                  >
                    <span>Name</span>
                    {sortField === 'name' && (
                      <span className="text-indigo-600">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </button>
                </th>
                <th scope="col" className="px-6 py-3">
                  <button
                    onClick={() => handleSort('contact_info')}
                    className="flex items-center space-x-1 hover:text-gray-900 dark:hover:text-white"
                  >
                    <span>Contact Info</span>
                    {sortField === 'contact_info' && (
                      <span className="text-indigo-600">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </button>
                </th>
                <th scope="col" className="px-6 py-3">
                  <button
                    onClick={() => handleSort('has_location')}
                    className="flex items-center space-x-1 hover:text-gray-900 dark:hover:text-white"
                  >
                    <span>Location</span>
                    {sortField === 'has_location' && (
                      <span className="text-indigo-600">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </button>
                </th>
                <th scope="col" className="px-6 py-3">
                  <button
                    onClick={() => handleSort('role')}
                    className="flex items-center space-x-1 hover:text-gray-900 dark:hover:text-white"
                  >
                    <span>Role</span>
                    {sortField === 'role' && (
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
              {filteredAndSortedUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    {users.length === 0 ? "No users found" : "No users match the current filters"}
                  </td>
                </tr>
              ) : (
                filteredAndSortedUsers.map((user, idx) => (
                  <tr
                    key={user.user_id}
                    className={`${
                      idx % 2 === 0
                        ? "bg-white dark:bg-gray-900"
                        : "bg-gray-50 dark:bg-gray-800"
                    } border-b border-gray-200 dark:border-gray-700`}
                  >
                    <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                      {user.user_id}
                    </th>
                    <td className="px-6 py-4">{user.name}</td>
                    <td className="px-6 py-4">{user.contact_info || "N/A"}</td>
                    <td className="px-6 py-4">
                      {user.location ? (
                        <div className="text-sm">
                          {user.location.address ? (
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">
                                {user.location.address}
                              </div>
                              <div className="text-gray-500 dark:text-gray-400">
                                {user.location.latitude.toFixed(6)}, {user.location.longitude.toFixed(6)}
                              </div>
                            </div>
                          ) : (
                            <div className="text-gray-500 dark:text-gray-400">
                              {user.location.latitude.toFixed(6)}, {user.location.longitude.toFixed(6)}
                            </div>
                          )}
                        </div>
                      ) : (
                        "N/A"
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => navigate(`info/${user.user_id}`)}
                          className="cursor-pointer font-medium text-blue-600 dark:text-blue-500 hover:underline"
                        >
                          Info
                        </button>
                        <button
                          onClick={() => navigate(`edit/${user.user_id}`)}
                          className="cursor-pointer font-medium text-indigo-600 dark:text-indigo-500 hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(user.user_id)}
                          disabled={deletingId === user.user_id}
                          className="cursor-pointer font-medium text-red-600 dark:text-red-500 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {deletingId === user.user_id ? "Deleting..." : "Delete"}
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