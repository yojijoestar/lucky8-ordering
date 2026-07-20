"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type CartItem = {
  productId: number;
  sku: string;
  nameEn: string;
  nameZh: string;
  packSize: string;
  priceCents: number | null;
  imagePath: string | null;
  qty: number;
};

type CartApi = {
  items: CartItem[];
  add: (item: Omit<CartItem, "qty">, qty: number) => void;
  setQty: (productId: number, qty: number) => void;
  changeQty: (productId: number, delta: number) => void;
  remove: (productId: number) => void;
  clear: () => void;
  totalCases: number;
  subtotalCents: number;
  unpricedCount: number;
  loaded: boolean;
};

const CartContext = createContext<CartApi | null>(null);
const STORAGE_KEY = "l8_cart_v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, loaded]);

  const api = useMemo<CartApi>(() => {
    const add: CartApi["add"] = (item, qty) =>
      setItems((prev) => {
        const found = prev.find((i) => i.productId === item.productId);
        if (found)
          return prev.map((i) =>
            i.productId === item.productId ? { ...i, qty: i.qty + qty } : i
          );
        return [...prev, { ...item, qty }];
      });
    const setQty: CartApi["setQty"] = (productId, qty) =>
      setItems((prev) =>
        qty <= 0
          ? prev.filter((i) => i.productId !== productId)
          : prev.map((i) => (i.productId === productId ? { ...i, qty } : i))
      );
    // Delta-based so rapid +/- clicks that React batches together each
    // apply against current state rather than a stale render's value.
    const changeQty: CartApi["changeQty"] = (productId, delta) =>
      setItems((prev) =>
        prev
          .map((i) =>
            i.productId === productId ? { ...i, qty: i.qty + delta } : i
          )
          .filter((i) => i.qty > 0)
      );
    return {
      items,
      add,
      setQty,
      changeQty,
      remove: (productId) =>
        setItems((prev) => prev.filter((i) => i.productId !== productId)),
      clear: () => setItems([]),
      totalCases: items.reduce((s, i) => s + i.qty, 0),
      subtotalCents: items.reduce(
        (s, i) => s + (i.priceCents != null ? i.priceCents * i.qty : 0),
        0
      ),
      unpricedCount: items.filter((i) => i.priceCents == null).length,
      loaded,
    };
  }, [items, loaded]);

  return <CartContext.Provider value={api}>{children}</CartContext.Provider>;
}

export function useCart(): CartApi {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart outside CartProvider");
  return ctx;
}
