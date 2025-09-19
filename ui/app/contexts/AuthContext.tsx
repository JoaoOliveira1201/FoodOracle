import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

interface User {
  user_id: number;
  role: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (userData: User) => void;
  logout: () => void;
  isAdmin: () => boolean;
  isSupplier: () => boolean;
  isBuyer: () => boolean;
  isTruckDriver: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check if user data exists in localStorage on app load
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        console.log("Loaded user data from localStorage:", userData);
        
        // If the stored user doesn't have a name field, clear it to force re-login
        if (!userData.name) {
          console.warn("Stored user data missing name field, clearing localStorage");
          localStorage.removeItem("user");
          return;
        }
        
        setUser(userData);
      } catch (error) {
        console.error("Error parsing stored user data:", error);
        localStorage.removeItem("user");
      }
    }
  }, []);

  const login = (userData: User) => {
    console.log("Login called with user data:", userData);
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  const isAuthenticated = !!user;

  const isAdmin = () => user?.role === "Administrator";
  const isSupplier = () => user?.role === "Supplier";
  const isBuyer = () => user?.role === "Buyer";
  const isTruckDriver = () => user?.role === "TruckDriver";

  const value: AuthContextType = {
    user,
    isAuthenticated,
    login,
    logout,
    isAdmin,
    isSupplier,
    isBuyer,
    isTruckDriver,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Helper function to get user data from localStorage (for use outside of React components)
export function getUserFromStorage(): User | null {
  try {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  } catch (error) {
    console.error("Error parsing stored user data:", error);
    return null;
  }
}

// Helper function to check if user is authenticated (for use outside of React components)
export function isUserAuthenticated(): boolean {
  return getUserFromStorage() !== null;
}
