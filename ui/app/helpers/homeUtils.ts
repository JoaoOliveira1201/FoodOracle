export const getStatusColor = (status: string) => {
  const statusColors: { [key: string]: string } = {
    'Waiting': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    'Collecting': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    'Loaded': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    'Paused': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    'Delivering': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    'Pending': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    'InTransit': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  };
  return statusColors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
};

export const formatDate = (dateString: string | null) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString();
};

export const formatDuration = (durationString: string | null | any) => {
  if (!durationString || typeof durationString !== 'string') return "N/A";
  
  // Handle ISO 8601 duration format (PT14400S, PT1H30M, etc.)
  if (durationString.startsWith('PT')) {
    let totalSeconds = 0;
    
    // Extract hours (H), minutes (M), and seconds (S)
    const hoursMatch = durationString.match(/(\d+)H/);
    const minutesMatch = durationString.match(/(\d+)M/);
    const secondsMatch = durationString.match(/(\d+)S/);
    
    if (hoursMatch) totalSeconds += parseInt(hoursMatch[1]) * 3600;
    if (minutesMatch) totalSeconds += parseInt(minutesMatch[1]) * 60;
    if (secondsMatch) totalSeconds += parseInt(secondsMatch[1]);
    
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }
  
  // Handle HH:MM:SS format
  const match = durationString.match(/(\d+):(\d+):(\d+)/);
  if (match) {
    const [, hours, minutes] = match;
    return `${parseInt(hours)}h ${parseInt(minutes)}m`;
  }
  
  return durationString;
};

export const getUserRoleTitle = (isAdmin: () => boolean, isBuyer: () => boolean, isSupplier: () => boolean, isTruckDriver: () => boolean) => {
  if (isAdmin()) return "Administrator Dashboard";
  if (isBuyer()) return "Buyer Portal";
  if (isSupplier()) return "Supplier Hub";
  if (isTruckDriver()) return "Driver Dashboard";
  return "Welcome";
};

export const getUserRoleDescription = (isAdmin: () => boolean, isBuyer: () => boolean, isSupplier: () => boolean, isTruckDriver: () => boolean) => {
  if (isAdmin()) return "Manage your entire supply chain operation from one central location";
  if (isBuyer()) return "Browse products, place orders, and track your purchases";
  if (isSupplier()) return "Register products and manage your inventory submissions";
  if (isTruckDriver()) return "Manage your truck, view assignments, and track deliveries";
  return "Access your supply chain management tools";
};

