"use client";

import {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
} from "react";

/** Savatga qo'shilganda mahsulotning kerakli maydonlari saqlanadi —
 *  shunda savat sahifasi qayta so'rovsiz to'liq ko'rsata oladi. */
export type CartProduct = {
  id: number;
  name: string;
  price: string;
  unit: string;
  image_url: string;
  manufacturer: number;
  manufacturer_name: string;
  stock: string;
};

export type CartItem = CartProduct & { quantity: number };

const STORAGE_KEY = "savdomarket_cart";

type CartCtx = {
  items: CartItem[];
  count: number; // savatdagi turli mahsulotlar soni
  add: (product: CartProduct, quantity?: number) => void;
  setQuantity: (id: number, quantity: number) => void;
  remove: (id: number) => void;
  clear: () => void;
  has: (id: number) => boolean;
};

const CartContext = createContext<CartCtx | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setItems(JSON.parse(raw) as CartItem[]);
    } catch {
      /* buzilgan saqlangan savat — e'tiborsiz qoldiramiz */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* localStorage band — jim qolamiz */
    }
  }, [items, hydrated]);

  const add = useCallback((product: CartProduct, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((x) => x.id === product.id);
      if (existing) {
        return prev.map((x) =>
          x.id === product.id ? { ...x, ...product, quantity: x.quantity + quantity } : x,
        );
      }
      return [...prev, { ...product, quantity }];
    });
  }, []);

  const setQuantity = useCallback((id: number, quantity: number) => {
    setItems((prev) =>
      prev.flatMap((x) => {
        if (x.id !== id) return [x];
        if (quantity <= 0) return [];
        return [{ ...x, quantity }];
      }),
    );
  }, []);

  const remove = useCallback((id: number) => {
    setItems((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartCtx>(
    () => ({
      items,
      count: items.length,
      add,
      setQuantity,
      remove,
      clear,
      has: (id: number) => items.some((x) => x.id === id),
    }),
    [items, add, setQuantity, remove, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
