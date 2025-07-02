import { create } from "zustand"
import type { Cart } from "@/types/abandoned-cart"

interface AbandonedCartState {
  carts: Cart[]
  isLoading: boolean
  error: string | null
  setCarts: (carts: Cart[] | null | undefined) => void
  setIsLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useAbandonedCartStore = create<AbandonedCartState>((set) => ({
  carts: [],
  isLoading: false,
  error: null,
  setCarts: (carts) => set({ carts: Array.isArray(carts) ? carts : [] }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}))
