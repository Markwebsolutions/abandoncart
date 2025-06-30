'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { Search, Filter, Grid, List, TrendingUp, Package, DollarSign, Eye, Heart, ShoppingCart, Star, ArrowUpDown, ChevronDown } from 'lucide-react';
import { useProductsStore } from '@/lib/store/productsStore';

// Types
interface ShopifyProduct {
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

interface ProductInsights {
  totalProducts: number;
  totalValue: number;
  averagePrice: number;
  lowStockCount: number;
  topVendors: { vendor: string; count: number }[];
  productsByType: { type: string; count: number }[];
  priceRanges: { range: string; count: number }[];
}

type ViewMode = 'grid' | 'list';
type SortOption = 'title' | 'price' | 'created_at' | 'inventory';

const ShopifyProductDisplay: React.FC = () => {
  // Zustand store for products, loading, error
  const {
    products,
    setProducts,
    isLoading,
    setIsLoading,
    error,
    setError
  } = useProductsStore();

  // UI state (not persisted)
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVendor, setSelectedVendor] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('title');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showFilters, setShowFilters] = useState(false);

  // Fetch products from your API (only if not already loaded)
  useEffect(() => {
    if (products.length > 0) return;
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch('/api/shopify-products');
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        const data = await response.json();
        setProducts(data.products || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, [products, setProducts, setIsLoading, setError]);

  // Calculate insights
  const insights = useMemo((): ProductInsights => {
    if (!products.length) {
      return {
        totalProducts: 0,
        totalValue: 0,
        averagePrice: 0,
        lowStockCount: 0,
        topVendors: [],
        productsByType: [],
        priceRanges: []
      };
    }

    const totalProducts = products.length;
    const prices = products.flatMap(p => p.variants.map(v => parseFloat(v.price)));
    const totalValue = prices.reduce((sum, price) => sum + price, 0);
    const averagePrice = totalValue / prices.length;
    
    const lowStockCount = products.filter(p => 
      p.variants.some(v => v.inventory_quantity < 10)
    ).length;

    // Top vendors
    const vendorCounts = products.reduce((acc, product) => {
      acc[product.vendor] = (acc[product.vendor] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const topVendors = Object.entries(vendorCounts)
      .map(([vendor, count]) => ({ vendor, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Products by type
    const typeCounts = products.reduce((acc, product) => {
      acc[product.product_type] = (acc[product.product_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const productsByType = Object.entries(typeCounts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);

    // Price ranges
    const priceRanges = [
      { range: '$0-$25', count: prices.filter(p => p <= 25).length },
      { range: '$26-$50', count: prices.filter(p => p > 25 && p <= 50).length },
      { range: '$51-$100', count: prices.filter(p => p > 50 && p <= 100).length },
      { range: '$101-$250', count: prices.filter(p => p > 100 && p <= 250).length },
      { range: '$250+', count: prices.filter(p => p > 250).length },
    ];

    return {
      totalProducts,
      totalValue,
      averagePrice,
      lowStockCount,
      topVendors,
      productsByType,
      priceRanges
    };
  }, [products]);

  // Filter and sort products
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = products.filter(product => {
      const matchesSearch = product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.tags.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesVendor = !selectedVendor || product.vendor === selectedVendor;
      const matchesType = !selectedType || product.product_type === selectedType;
      
      const minPrice = Math.min(...product.variants.map(v => parseFloat(v.price)));
      const matchesPrice = minPrice >= priceRange[0] && minPrice <= priceRange[1];
      
      return matchesSearch && matchesVendor && matchesType && matchesPrice;
    });

    // Sort products
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'price':
          const priceA = Math.min(...a.variants.map(v => parseFloat(v.price)));
          const priceB = Math.min(...b.variants.map(v => parseFloat(v.price)));
          comparison = priceA - priceB;
          break;
        case 'created_at':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'inventory':
          const invA = a.variants.reduce((sum, v) => sum + v.inventory_quantity, 0);
          const invB = b.variants.reduce((sum, v) => sum + v.inventory_quantity, 0);
          comparison = invA - invB;
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [products, searchTerm, selectedVendor, selectedType, priceRange, sortBy, sortOrder]);

  const uniqueVendors = useMemo(() => 
    [...new Set(products.map(p => p.vendor))].sort(), [products]
  );

  const uniqueTypes = useMemo(() => 
    [...new Set(products.map(p => p.product_type))].filter(Boolean).sort(), [products]
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <p className="font-bold">Error loading products</p>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Product Catalog</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage and view your Shopify products
              </p>
            </div>
            <div className="mt-4 lg:mt-0 flex items-center space-x-4">
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="p-2 text-gray-400 hover:text-gray-600 border rounded-lg hover:bg-gray-50"
              >
                {viewMode === 'grid' ? <List size={20} /> : <Grid size={20} />}
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Filter size={16} className="mr-2" />
                Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Insights Dashboard */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Products</p>
                <p className="text-2xl font-bold text-gray-900">{insights.totalProducts}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg. Price</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${insights.averagePrice.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${insights.totalValue.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <Eye className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold text-gray-900">{insights.lowStockCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex items-center space-x-4">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="title">Sort by Title</option>
                <option value="price">Sort by Price</option>
                <option value="created_at">Sort by Date</option>
                <option value="inventory">Sort by Stock</option>
              </select>
              
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <ArrowUpDown size={16} />
              </button>
            </div>
          </div>
          
          {showFilters && (
            <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Vendor</label>
                <select
                  value={selectedVendor}
                  onChange={(e) => setSelectedVendor(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Vendors</option>
                  {uniqueVendors.map(vendor => (
                    <option key={vendor} value={vendor}>{vendor}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product Type</label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Types</option>
                  {uniqueTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Range: ${priceRange[0]} - ${priceRange[1]}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1000"
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                  className="w-full"
                />
              </div>
            </div>
          )}
        </div>

        {/* Products Grid/List */}
        <div className={`grid gap-6 ${
          viewMode === 'grid' 
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
            : 'grid-cols-1'
        }`}>
          {filteredAndSortedProducts.map(product => (
            <ProductCard 
              key={product.id} 
              product={product} 
              viewMode={viewMode}
            />
          ))}
        </div>

        {filteredAndSortedProducts.length === 0 && (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your search or filter criteria.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Product Card Component
const ProductCard: React.FC<{ product: ShopifyProduct; viewMode: ViewMode }> = ({ 
  product, 
  viewMode 
}) => {
  const minPrice = Math.min(...product.variants.map(v => parseFloat(v.price)));
  const maxPrice = Math.max(...product.variants.map(v => parseFloat(v.price)));
  const totalInventory = product.variants.reduce((sum, v) => sum + v.inventory_quantity, 0);
  const isLowStock = totalInventory < 10;

  const priceDisplay = minPrice === maxPrice 
    ? `$${minPrice.toFixed(2)}` 
    : `$${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`;

  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
        <div className="flex items-start space-x-6">
          <div className="flex-shrink-0">
            {product.image ? (
              <Image
                src={product.image.src}
                alt={product.image.alt || product.title}
                width={120}
                height={120}
                className="rounded-lg object-cover"
              />
            ) : (
              <div className="w-30 h-30 bg-gray-200 rounded-lg flex items-center justify-center">
                <Package className="w-8 h-8 text-gray-400" />
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {product.title}
                </h3>
                <p className="text-sm text-gray-600 mt-1">{product.vendor}</p>
                <p className="text-sm text-gray-500 mt-1">{product.product_type}</p>
              </div>
              
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900">{priceDisplay}</p>
                <p className={`text-sm ${isLowStock ? 'text-red-600' : 'text-green-600'}`}>
                  {totalInventory} in stock
                </p>
              </div>
            </div>
            
            <p className="text-sm text-gray-600 mt-3 line-clamp-2">
              {product.description}
            </p>
            
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span>{product.variants.length} variant{product.variants.length !== 1 ? 's' : ''}</span>
                <span>{product.images.length} image{product.images.length !== 1 ? 's' : ''}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <button className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full">
                  <Heart size={16} />
                </button>
                <button className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-full">
                  <Eye size={16} />
                </button>
                <button className="p-2 text-gray-400 hover:text-green-500 hover:bg-green-50 rounded-full">
                  <ShoppingCart size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow group">
      <div className="aspect-square relative overflow-hidden">
        {product.image ? (
          <Image
            src={product.image.src}
            alt={product.image.alt || product.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <Package className="w-12 h-12 text-gray-400" />
          </div>
        )}
        
        {isLowStock && (
          <div className="absolute top-2 left-2">
            <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
              Low Stock
            </span>
          </div>
        )}
        
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex flex-col space-y-2">
            <button className="p-2 bg-white text-gray-600 hover:text-red-500 rounded-full shadow-md">
              <Heart size={16} />
            </button>
            <button className="p-2 bg-white text-gray-600 hover:text-blue-500 rounded-full shadow-md">
              <Eye size={16} />
            </button>
          </div>
        </div>
      </div>
      
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-gray-900 truncate flex-1 mr-2">
            {product.title}
          </h3>
        </div>
        
        <p className="text-sm text-gray-600 mb-2">{product.vendor}</p>
        <p className="text-sm text-gray-500 mb-3">{product.product_type}</p>
        
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold text-gray-900">{priceDisplay}</p>
            <p className={`text-xs ${isLowStock ? 'text-red-600' : 'text-green-600'}`}>
              {totalInventory} in stock
            </p>
          </div>
          
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            View
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShopifyProductDisplay;