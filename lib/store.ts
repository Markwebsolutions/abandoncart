import { create } from 'zustand'

// Abandoned carts store
type Cart = any // Replace with your Cart type if available
interface AbandonedCartState {
  carts: Cart[]
  isLoading: boolean
  error: string | null
  setCarts: (carts: Cart[]) => void
  setIsLoading: (loading: boolean) => void
  setError: (err: string | null) => void
}

export const useAbandonedCartStore = create<AbandonedCartState>((set) => ({
  carts: [],
  isLoading: false,
  error: null,
  setCarts: (carts) => set({ carts }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}))

// Products store
type Product = any // Replace with your Product type if available
interface ProductsState {
  products: Product[]
  isLoading: boolean
  error: string | null
  setProducts: (products: Product[]) => void
  setIsLoading: (loading: boolean) => void
  setError: (err: string | null) => void
}

export const useProductsStore = create<ProductsState>((set) => ({
  products: [],
  isLoading: false,
  error: null,
  setProducts: (products) => set({ products }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}))
