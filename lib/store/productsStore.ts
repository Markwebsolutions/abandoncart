import { create } from "zustand"

// Use the full ShopifyProduct type for the store
interface ShopifyVariant {
  id: string;
  product_id: string;
  title: string;
  price: string;
  sku: string;
  position: number;
  inventory_policy: string;
  compare_at_price: string | null;
  fulfillment_service: string;
  inventory_management: string;
  option1: string;
  option2: string | null;
  option3: string | null;
  created_at: string;
  updated_at: string;
  taxable: boolean;
  barcode: string | null;
  grams: number;
  image_id: string | null;
  weight: number;
  weight_unit: string;
  inventory_item_id: string;
  inventory_quantity: number;
  old_inventory_quantity: number;
  requires_shipping: boolean;
  admin_graphql_api_id: string;
}

interface ShopifyOption {
  id: string;
  product_id: string;
  name: string;
  position: number;
  values: string[];
}

interface ShopifyImage {
  id: string;
  product_id: string;
  position: number;
  created_at: string;
  updated_at: string;
  alt: string | null;
  width: number;
  height: number;
  src: string;
  variant_ids: string[];
  admin_graphql_api_id: string;
}

export interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  description: string;
  vendor: string;
  product_type: string;
  created_at: string;
  updated_at: string;
  published_at: string;
  template_suffix: string | null;
  status: string;
  published_scope: string;
  tags: string;
  admin_graphql_api_id: string;
  variants: ShopifyVariant[];
  options: ShopifyOption[];
  images: ShopifyImage[];
  image: ShopifyImage | null;
}

interface ProductsState {
  products: ShopifyProduct[];
  isLoading: boolean;
  error: string | null;
  setProducts: (products: ShopifyProduct[]) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useProductsStore = create<ProductsState>((set) => ({
  products: [],
  isLoading: false,
  error: null,
  setProducts: (products) => set({ products }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}))
