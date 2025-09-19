import { getUserFromStorage, isUserAuthenticated } from "~/contexts/AuthContext";

// Helper function to check if current user has specific role
export function hasRole(role: string): boolean {
  const user = getUserFromStorage();
  return user?.role === role;
}

// Helper functions for specific role checks
export function isAdmin(): boolean {
  return hasRole('Administrator');
}

export function isSupplier(): boolean {
  return hasRole('Supplier');
}

export function isBuyer(): boolean {
  return hasRole('Buyer');
}

export function isTruckDriver(): boolean {
  return hasRole('TruckDriver');
}

// Helper function to get current user ID
export function getCurrentUserId(): number | null {
  const user = getUserFromStorage();
  return user?.user_id || null;
}

// Helper function to get current user role
export function getCurrentUserRole(): string | null {
  const user = getUserFromStorage();
  return user?.role || null;
}

// Helper function to redirect to login if not authenticated
export function requireAuth(navigate: (path: string) => void): boolean {
  if (!isUserAuthenticated()) {
    navigate('/');
    return false;
  }
  return true;
}

// Helper function to format role display name
export function formatRoleDisplayName(role: string): string {
  switch (role) {
    case 'TruckDriver':
      return 'Truck Driver';
    case 'Administrator':
      return 'Administrator';
    case 'Supplier':
      return 'Supplier';
    case 'Buyer':
      return 'Buyer';
    default:
      return role;
  }
}

// Helper function to get role badge color classes
export function getRoleBadgeColor(role: string): string {
  switch (role) {
    case 'Administrator':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
    case 'Supplier':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'Buyer':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    case 'TruckDriver':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  }
}
