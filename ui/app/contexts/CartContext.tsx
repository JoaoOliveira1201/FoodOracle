import React, { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export interface CartItem {
  recordId: number;
  productId: number;
  productName: string;
  quantityKg: number;
  pricePerKg: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (recordId: number) => void;
  clear: () => void;
  totalAmount: number;
  totalItems: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = (item: CartItem) => {
    setItems((prev) => {
      // dedupe by recordId
      const exists = prev.some((i) => i.recordId === item.recordId);
      if (exists) return prev;
      return [...prev, item];
    });
  };

  const removeItem = (recordId: number) => {
    setItems((prev) => prev.filter((i) => i.recordId !== recordId));
  };

  const clear = () => setItems([]);

  const totalAmount = useMemo(() => {
    return items.reduce((sum, i) => sum + i.quantityKg * i.pricePerKg, 0);
  }, [items]);

  const totalItems = items.length;

  const value: CartContextType = {
    items,
    addItem,
    removeItem,
    clear,
    totalAmount,
    totalItems,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextType {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}


