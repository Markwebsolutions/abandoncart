"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  ChevronDown,
  ChevronUp,
  Clock,
  DollarSign,
  Mail,
  MessageSquare,
  Phone,
  Plus,
  Search,
  User,
  Edit3,
  Send,
  Timer,
  Target,
  Edit,
  TrendingUp,
  Database,
  AlertCircle,
  CheckCircle,
  XCircle,
  Settings,
} from "lucide-react"
import { MessageCircle, FileText, Edit2, Trash2, Info } from 'lucide-react';
import { statusColors, priorityColors } from "@/lib/abandoned-cart/constants"
import { formatDate, getStatusIcon, getUrgencyColor } from "@/lib/abandoned-cart/utils"
import { extractIndianPhone } from "@/lib/abandoned-cart/shopify-utils"
import type { Cart, Remark } from "@/types/abandoned-cart"
import { useAbandonedCartStore } from "@/lib/store/abandonedCartStore"
import { useTemplateStore } from "@/components/TemplateStore"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export default function AbandonedCartManager() {
  const {
    carts,
    setCarts,
    isLoading,
    setIsLoading,
    error: fetchError,
    setError: setFetchError,
  } = useAbandonedCartStore()
  const { templates, setTemplates } = useTemplateStore()
  const [expandedCards, setExpandedCards] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [newRemark, setNewRemark] = useState<{ [key: string]: string }>({})
  const [responseType, setResponseType] = useState<{ [key: string]: string }>({})
  const [editingCart, setEditingCart] = useState<string | null>(null)
  const [editingResponse, setEditingResponse] = useState<{ cartId: string; remarkId: number } | null>(null)
  const [editResponseText, setEditResponseText] = useState("")
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
  const [isSyncing, setIsSyncing] = useState(false)
  const [totalCarts, setTotalCarts] = useState(0)
  const [waPopoverOpen, setWaPopoverOpen] = useState<string | null>(null)
  const [selectedTemplateId, setSelectedTemplateId] = useState<{ [cartId: string]: number | null }>({})
const [showMetrics, setShowMetrics] = useState(true)

  // Remarks form state
  const [remarkForm, setRemarkForm] = useState({
    type: "",
    message: "",
    cartId: "",
  })

  // Date filter state
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>(() => {
    // Default to last 3 days
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - 3)
    return {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0],
    }
  })

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  // Fetch remarks for a cart from Supabase
  const fetchRemarksForCart = useCallback(async (cartId: string) => {
    try {
      const res = await fetch(`/api/cart-remarks?cart_id=${encodeURIComponent(cartId)}`)
      if (!res.ok) throw new Error("Failed to fetch remarks")
      const { data } = await res.json()
      return data || []
    } catch (e) {
      console.error("Error fetching remarks for cart", cartId, e)
      return []
    }
  }, [])

  // Fetch carts from Shopify API (live, not from Supabase)
  const fetchCartsFromShopify = useCallback(async () => {
    setIsLoading(true)
    try {
      // Always use last 3 days from now
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(endDate.getDate() - 3)
      const startStr = startDate.toISOString()
      const endStr = endDate.toISOString()
      // Fetch all entries for the date range (no pagination params)
      const res = await fetch(`/api/shopify-abandoned-checkouts?shopify=1&start_date=${encodeURIComponent(startStr)}&end_date=${encodeURIComponent(endStr)}`)
      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(`Failed to fetch from Shopify API: ${res.status} ${res.statusText} - ${errorText}`)
      }
      const raw = await res.json()
      let checkouts = []
      let total = 0
      if (Array.isArray(raw)) {
        checkouts = raw
        total = raw.length
      } else if (Array.isArray(raw.data)) {
        checkouts = raw.data
        total = raw.total || raw.data.length
      } else if (Array.isArray(raw.checkouts)) {
        checkouts = raw.checkouts
        total = raw.total || raw.checkouts.length
      } else if (raw.data && Array.isArray(raw.data.checkouts)) {
        checkouts = raw.data.checkouts
        total = raw.data.total || raw.data.checkouts.length
      }
      if (!Array.isArray(checkouts)) checkouts = []
      // Remove duplicate carts by id
      const uniqueCartsMap = new Map()
      for (const checkout of checkouts) {
        if (!uniqueCartsMap.has(checkout.id)) {
          uniqueCartsMap.set(checkout.id, checkout)
        }
      }
      const uniqueCheckouts = Array.from(uniqueCartsMap.values())
      // Fetch remarks for all carts and build the array
      const allCarts = []
      for (const checkout of uniqueCheckouts) {
        const cart = mapShopifyCheckoutToCart(checkout)
        cart.remarks = await fetchRemarksForCart(cart.id)
        allCarts.push(cart)
      }
      setCarts(allCarts)
      setTotalCarts(uniqueCheckouts.length)
      setFetchError(null)
    } catch (error) {
      console.error("Error fetching from Shopify API:", error)
      setCarts([])
      setFetchError(error instanceof Error ? error.message : String(error))
      alert(error instanceof Error ? error.message : String(error))
    } finally {
      setIsLoading(false)
    }
  }, [fetchRemarksForCart, setCarts, setIsLoading, setFetchError])

  // Fetch new carts from Shopify API and update state (sync)
  const fetchNewCartsFromShopify = useCallback(async () => {
    setIsSyncing(true)
    const currentCarts = [...carts]
    try {
      const res = await fetch('/api/shopify-abandoned-checkouts?sync=1', { 
        method: 'POST' 
      })
      if (!res.ok) throw new Error('Sync failed')
      await fetchCartsFromShopify()
      setFetchError(null)
    } catch (error) {
      console.error('Sync error:', error)
      setCarts(currentCarts)
      setFetchError(error instanceof Error ? error.message : 'Failed to sync with Shopify - showing cached data')
      alert('Failed to sync with Shopify - showing cached data')
    } finally {
      setIsSyncing(false)
    }
  }, [fetchCartsFromShopify, carts])

  // Add a flag to track if data has been loaded
  const [hasLoaded, setHasLoaded] = useState(false)

  // Fetch carts only when user clicks 'Fetch' or changes date filter
  const handleFetchCarts = useCallback(async () => {
    await fetchCartsFromShopify()
    setHasLoaded(true)
  }, [fetchCartsFromShopify])

  // Helper to map Shopify checkout or DB row to Cart type
  function mapShopifyCheckoutToCart(checkout: any): Cart {
    const isFromDatabase = checkout.hasOwnProperty('raw') || checkout.hasOwnProperty('cart_value')
    let items: any[] = []
    let cartValue = 0
    
    if (isFromDatabase) {
      try {
        items = Array.isArray(checkout.items)
          ? checkout.items
          : typeof checkout.items === 'string'
            ? JSON.parse(checkout.items)
            : []
        items = items.map((item: any) => ({
          ...item,
          name: item.name || item.title || 'Unnamed Item',
        }))
        cartValue = Number(checkout.cart_value || 0)
      } catch (e) {
        console.error('Error parsing items from database', e)
        items = []
      }
    } else {
      items = Array.isArray(checkout.line_items)
        ? checkout.line_items.map((item: any) => ({
            id: item.id,
            name: item.title,
            quantity: item.quantity,
            price: Number(item.price),
          }))
        : []
      cartValue = Number(checkout.subtotal_price || 0)
    }

    // Handle customer data
    let customer = { id: '', name: '', email: '', phone: '' }
    if (isFromDatabase) {
      if (checkout.customer && typeof checkout.customer === 'object') {
        let name = checkout.customer.name
        if (!name && checkout.customer.first_name) {
          name = checkout.customer.first_name
          if (checkout.customer.last_name) name += ' ' + checkout.customer.last_name
        }
        if (!name) name = checkout.customer.email || checkout.customer.phone || 'Unknown'
        customer = {
          id: checkout.customer.id || checkout.id,
          name,
          email: checkout.customer.email || checkout.email || '',
          phone: checkout.customer.phone || checkout.phone || '',
        }
      } else {
        customer = {
          id: checkout.id,
          name: checkout.email || checkout.phone || 'Unknown',
          email: checkout.email || '',
          phone: checkout.phone || '',
        }
      }
    } else {
      customer = {
        id: checkout.customer?.id || checkout.email || checkout.phone || checkout.id,
        name: checkout.customer?.name ||
             (checkout.customer?.first_name && checkout.customer?.last_name
              ? `${checkout.customer.first_name} ${checkout.customer.last_name}`
              : checkout.email || checkout.phone || 'Unknown'),
        email: checkout.customer?.email || checkout.email || '',
        phone: checkout.customer?.phone || checkout.phone || '',
      }
    }

    return {
      id: checkout.id,
      customer,
      items,
      cartValue,
      abandonedAt: checkout.created_at || checkout.abandoned_at || new Date().toISOString(),
      lastContacted: checkout.updated_at || checkout.last_contacted || new Date().toISOString(),
      status: checkout.status || 'pending',
      priority: checkout.priority || 'medium',
      remarks: [],
      hoursSinceAbandoned: Math.floor(
        (Date.now() - new Date(checkout.created_at || checkout.abandoned_at).getTime()) / 3600000
      ),
    }
  }

  // Helper to get latest status from remarks or fallback to cart.status
  function getLatestStatus(cart: Cart): string {
    if (Array.isArray(cart.remarks) && cart.remarks.length > 0) {
      // Find the most recent remark with a status field set
      const statusRemark = [...cart.remarks]
        .reverse()
        .find(r => r && typeof (r as any).status === 'string' && (r as any).status)
      if (statusRemark && (statusRemark as any).status) {
        return (statusRemark as any).status
      }
    }
    return cart.status || 'pending'
  }

  const sortedCarts = useMemo(() => {
    return [...carts].sort((a, b) => {
      return new Date(b.abandonedAt).getTime() - new Date(a.abandonedAt).getTime()
    })
  }, [carts])

  // Filtered carts (search, status, date)
  const filteredCarts = useMemo(() => {
    return sortedCarts.filter((cart) => {
      const matchesSearch =
        debouncedSearchTerm.trim() === "" ||
        cart.customer.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        cart.customer.email.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        cart.customer.phone.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        cart.id.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      const matchesStatus = statusFilter === "all" || getLatestStatus(cart) === statusFilter
      const abandonedDate = new Date(cart.abandonedAt)
      const matchesDate =
        (!dateRange.start || abandonedDate >= new Date(dateRange.start)) &&
        (!dateRange.end || abandonedDate <= new Date(dateRange.end + 'T23:59:59'))
      return matchesSearch && matchesStatus && matchesDate
    })
  }, [sortedCarts, debouncedSearchTerm, statusFilter, dateRange])

  // Metrics
  const metrics = useMemo(() => {
    const pendingCarts = filteredCarts.filter((cart) => cart.status === "pending").length
    const inProgressCarts = filteredCarts.filter((cart) => cart.status === "in-progress").length
    const lostCarts = filteredCarts.filter((cart) => cart.status === "failed").length
    const convertedCarts = filteredCarts.filter((cart) => cart.status === "completed").length
    const totalCarts = filteredCarts.length
    const conversionRate = totalCarts > 0 ? ((convertedCarts / totalCarts) * 100).toFixed(1) : "0"
    const totalValue = filteredCarts.reduce((sum, cart) => sum + cart.cartValue, 0)
    const recoveredValue = filteredCarts
      .filter((cart) => cart.status === "completed")
      .reduce((sum, cart) => sum + cart.cartValue, 0)
    const urgentCarts = filteredCarts.filter((cart) => cart.hoursSinceAbandoned < 24 && cart.status !== "completed").length
    const potentialRecoveryValue =
      filteredCarts
        .filter((cart) => cart.status === "pending" || cart.status === "in-progress")
        .reduce((sum, cart) => sum + cart.cartValue, 0) * 0.3
    // Defensive: filter out null/undefined remarks
    const pendingRemarks =
      filteredCarts.filter((cart) => cart.status === "pending" && (Array.isArray(cart.remarks) ? cart.remarks.length === 0 : true)).length +
      filteredCarts.filter(
        (cart) =>
          cart.status === "in-progress" &&
          Array.isArray(cart.remarks) &&
          cart.remarks.length > 0 &&
          cart.remarks[cart.remarks.length - 1] &&
          !cart.remarks[cart.remarks.length - 1].response,
      ).length
    const totalRemarksWithResponses = filteredCarts.reduce(
      (sum, cart) =>
        sum + (Array.isArray(cart.remarks)
          ? cart.remarks.filter((r) => r && r.response).length
          : 0),
      0
    )
    const totalRemarks = filteredCarts.reduce((sum, cart) => sum + (Array.isArray(cart.remarks) ? cart.remarks.length : 0), 0)
    const responseRate = totalRemarks > 0 ? ((totalRemarksWithResponses / totalRemarks) * 100).toFixed(1) : "0"

    return {
      pendingCarts,
      inProgressCarts,
      lostCarts,
      convertedCarts,
      totalCarts,
      conversionRate,
      totalValue,
      recoveredValue,
      urgentCarts,
      potentialRecoveryValue,
      pendingRemarks,
      responseRate,
    }
  }, [filteredCarts])

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10
  const totalPages = Math.ceil(filteredCarts.length / pageSize)

  // Paginated carts for current page
  const paginatedCarts = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredCarts.slice(start, start + pageSize)
  }, [filteredCarts, currentPage])

  // Reset to first page if filters/search change and current page is out of range
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1)
  }, [filteredCarts, totalPages])

  // Optimized callbacks
  const toggleCardExpansion = useCallback((cartId: string) => {
    setExpandedCards((prev) => (prev.includes(cartId) ? prev.filter((id) => id !== cartId) : [...prev, cartId]))
  }, [])

  const updateCartField = useCallback(
    async (cartId: string, field: string, value: string) => {
      // Update the cart in the array and set it using setCarts
      const updatedCarts = carts.map((cart: Cart) => (cart.id === cartId ? { ...cart, [field]: value } : cart))
      setCarts(updatedCarts)
      setEditingCart(null)
      try {
        // Always update the main cart record for status/priority/other fields
        const res = await fetch("/api/cart-update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cart_id: cartId, field, value }),
        })
        if (!res.ok) throw new Error("Failed to update cart field")
      } catch (e) {
        alert("Failed to update cart field in Supabase")
      }
    },
    [carts, setCarts],
  )

  // Add Remark (persist to Supabase)
  const addRemark = useCallback(async () => {
    if (!remarkForm.type || !remarkForm.message || !remarkForm.cartId) return
    const remarkData = {
      cart_id: remarkForm.cartId,
      type: remarkForm.type,
      message: remarkForm.message,
      response: null,
      agent: "Current User",
      status: null,
    }
    try {
      const res = await fetch("/api/cart-remarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(remarkData),
      })
      if (!res.ok) throw new Error("Failed to save remark")
      const { data } = await res.json()
      setCarts(carts.map((cart) => {
        if (cart.id === remarkForm.cartId) {
          // If API returns full remarks array, replace; else append
          if (Array.isArray(data) && data.length > 0 && data.every(r => r && typeof r === 'object' && 'type' in r)) {
            return {
              ...cart,
              remarks: data,
              lastContacted: new Date().toISOString(),
            }
          } else {
            const prevRemarks = Array.isArray(cart.remarks) ? cart.remarks : []
            const newRemarks = Array.isArray(data) ? data : [data]
            return {
              ...cart,
              remarks: [...prevRemarks, ...newRemarks],
              lastContacted: new Date().toISOString(),
            }
          }
        }
        return cart
      }))
      setRemarkForm({ type: "", message: "", cartId: "" })
    } catch (e) {
      alert("Failed to save remark")
    }
  }, [remarkForm, carts, setCarts])

  // Delete Remark
  const deleteRemark = useCallback(async (cartId: string, remarkId: number) => {
    if (!window.confirm("Delete this remark?")) return
    try {
      const res = await fetch(`/api/cart-remarks?cart_id=${encodeURIComponent(cartId)}&remark_id=${remarkId}`, {
        method: "DELETE"
      })
      if (!res.ok) throw new Error("Failed to delete remark")
      // Option 1: If API returns updated remarks array
      const { data } = await res.json()
      setCarts(carts.map((cart) => {
        if (cart.id === cartId) {
          if (Array.isArray(data)) {
            return { ...cart, remarks: data }
          } else {
            // Option 2: Remove from local state
            return { ...cart, remarks: (cart.remarks || []).filter((r) => r && r.id !== remarkId) }
          }
        }
        return cart
      }))
    } catch (e) {
      alert("Failed to delete remark")
    }
  }, [carts, setCarts])

  // Add Customer Response (persist to Supabase)
  const addCustomerResponse = useCallback(
    async (cartId: string) => {
      const response = newRemark[cartId]
      const medium = responseType[cartId] || "email"
      if (!response?.trim()) return
      const responseData = {
        cart_id: cartId,
        type: medium,
        message: `Customer responded via ${medium}`,
        response: response,
        agent: "System",
        status: null,
      }
    try {
      const res = await fetch("/api/cart-remarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(responseData),
      })
      if (!res.ok) throw new Error("Failed to save response")
      const { data } = await res.json()
      setCarts(carts.map((cart) => {
        if (cart.id === cartId) {
          return {
            ...cart,
            remarks: [...cart.remarks, ...(Array.isArray(data) ? data : [data])],
            lastContacted: new Date().toISOString(),
          }
        }
        return cart
      }))
      setNewRemark((prev) => ({ ...prev, [cartId]: "" }))
      setResponseType((prev) => ({ ...prev, [cartId]: "email" }))
    } catch (e) {
      alert("Failed to save response")
    }
  },
  [newRemark, responseType, carts, setCarts])

  // Save edited response (persist to Supabase)
  const saveEditedResponse = useCallback(async () => {
    if (!editingResponse) return
    const { cartId, remarkId } = editingResponse
    const response = editResponseText.trim()
    if (!response) return
    // Find the remark to update
    const cart = carts.find((c: Cart) => c.id === cartId)
    if (!cart) return
    const remark = cart.remarks.find((r: Remark) => r.id === remarkId)
    if (!remark) return
    const updatedRemark = { ...remark, response, date: new Date().toISOString() }
    // Save as a new remark (or update if you have an update API)
    try {
      const res = await fetch("/api/cart-remarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...updatedRemark, cart_id: cartId }),
      })
      if (!res.ok) throw new Error("Failed to save response edit")
      const { data } = await res.json()
      setCarts(carts.map((cart: Cart) => {
        if (cart.id === cartId) {
          return {
            ...cart,
            remarks: cart.remarks.map((r: Remark) =>
              r.id === remarkId ? { ...r, response, date: updatedRemark.date } : r
            ),
          }
        }
        return cart
      }))
      setEditingResponse(null)
      setEditResponseText("")
    } catch (e) {
      alert("Failed to save response edit")
    }
  }, [editingResponse, editResponseText, carts, setCarts])

  // Helper to open WhatsApp chat
  function openWhatsApp(phone: string, name: string) {
    const url = `https://wa.me/${phone.replace(/[^\d]/g, "")}?text=Hi%20${encodeURIComponent(name)},%20regarding%20your%20abandoned%20cart...`
    window.open(url, '_blank')
  }

  // Helper to substitute template variables
  function fillTemplate(text: string, cart: any) {
    const productNames = cart.items.map((i: any) => i.name).join(", ")
    return text.replace(/\{name\}/g, cart.customer.name)
      .replace(/\{product\}/g, productNames)
  }

  // Date window navigation (move these up for use in filter row)
  const handlePrev3Days = useCallback(() => {
    let start = dateRange.start
    let end = dateRange.end
    if (!start || !end) {
      const today = new Date()
      const prevStart = new Date(today)
      prevStart.setDate(today.getDate() - 6)
      const prevEnd = new Date(today)
      prevEnd.setDate(today.getDate() - 4)
      setDateRange({
        start: prevStart.toISOString().split('T')[0],
        end: prevEnd.toISOString().split('T')[0],
      })
    } else {
      const prevEnd = new Date(start)
      prevEnd.setDate(prevEnd.getDate() - 1)
      const prevStart = new Date(prevEnd)
      prevStart.setDate(prevEnd.getDate() - 2)
      setDateRange({
        start: prevStart.toISOString().split('T')[0],
        end: prevEnd.toISOString().split('T')[0],
      })
    }
    setCurrentPage(1)
  }, [dateRange])

  const handleNext3Days = useCallback(() => {
    let start = dateRange.start
    let end = dateRange.end
    if (!start || !end) {
      const today = new Date()
      const nextStart = new Date(today)
      nextStart.setDate(today.getDate() + 1)
      const nextEnd = new Date(today)
      nextEnd.setDate(today.getDate() + 3)
      setDateRange({
        start: nextStart.toISOString().split('T')[0],
        end: nextEnd.toISOString().split('T')[0],
      })
    } else {
      const nextStart = new Date(end)
      nextStart.setDate(nextStart.getDate() + 1)
      const nextEnd = new Date(nextStart)
      nextEnd.setDate(nextStart.getDate() + 2)
      setDateRange({
        start: nextStart.toISOString().split('T')[0],
        end: nextEnd.toISOString().split('T')[0],
      })
    }
    setCurrentPage(1)
  }, [dateRange])

  const handleQuickRange = useCallback(() => {
    setDateRange({ start: '2025-02-01', end: '2025-06-23' })
    setCurrentPage(1)
  }, [])

  const [showInsights, setShowInsights] = useState(true)

  return (
    <div className="min-h-screen bg-gray-50 p-3">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Abandoned checkout Manager</h1>
            <p className="text-gray-600">Manage customer remarks for abandoned shopping carts</p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              onClick={fetchNewCartsFromShopify} 
              disabled={isLoading || isSyncing}
              className="bg-green-600 hover:bg-green-700"
            >
              <Database className="w-4 h-4 mr-2" />
              {isSyncing ? "Syncing..." : "Sync Shopify"}
            </Button>
          </div>
        </div>

        {/* Error message */}
        {fetchError && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            <p>Error: {fetchError}</p>
          </div>
        )}

        {/* Key Metrics */}
<Card className="mb-6 bg-white">
  <CardHeader
    className="pb-3 flex flex-row items-center justify-between cursor-pointer"
    onClick={() => setShowMetrics((v) => !v)}
  >
    <div className="flex items-center text-lg">
      <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
      Metrics Overview
    </div>
    <Button size="icon" variant="ghost" aria-label="Toggle Metrics">
      {showMetrics ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
    </Button>
  </CardHeader>

  {showMetrics && (
    <CardContent>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Conversion Rate */}
        <Card className="bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm text-gray-600">Conversion Rate</p>
                <p className="text-2xl font-bold text-green-600">{metrics.conversionRate}%</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <Target className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-gray-600">
                <span>Abandoned: {metrics.totalCarts}</span>
                <span>Converted: {metrics.convertedCarts}</span>
              </div>
              <Progress value={Number.parseFloat(metrics.conversionRate)} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Pending Remarks */}
        <Card className="bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm text-gray-600">Pending Remarks</p>
                <p className="text-2xl font-bold text-orange-600">{metrics.pendingRemarks}</p>
              </div>
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <div className="text-xs text-gray-600">
              <span>Require immediate attention</span>
            </div>
          </CardContent>
        </Card>

        {/* Urgent Carts */}
        <Card className="bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm text-gray-600">Urgent Carts</p>
                <p className="text-2xl font-bold text-red-600">{metrics.urgentCarts}</p>
              </div>
              <div className="p-2 bg-red-100 rounded-lg">
                <Timer className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <div className="text-xs text-gray-600">
              <span>{"< 24 hours since abandoned"}</span>
            </div>
          </CardContent>
        </Card>

        {/* Recovery Value */}
        <Card className="bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm text-gray-600">Recovery Value</p>
                <div className="mt-1">
                  <p className="text-2xl font-bold text-purple-600">
                    ₹{metrics.recoveredValue.toFixed(0)}
                  </p>
                  <p className="text-sm text-purple-400">
                    +₹{metrics.potentialRecoveryValue.toFixed(0)} potential
                  </p>
                </div>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-gray-600">
                <span>Recovered</span>
                <span>Potential</span>
              </div>
              <div className="flex space-x-1">
                <Progress
                  value={
                    metrics.totalValue > 0
                      ? (metrics.recoveredValue / metrics.totalValue) * 100
                      : 0
                  }
                  className="h-2 flex-1"
                />
                <Progress
                  value={
                    metrics.totalValue > 0
                      ? (metrics.potentialRecoveryValue / metrics.totalValue) * 100
                      : 0
                  }
                  className="h-2 flex-1 opacity-60"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </CardContent>
  )}
</Card>


        {/* Insights Section */}
        <Card className="mb-6 bg-white">
          <CardHeader className="pb-3 flex flex-row items-center justify-between cursor-pointer" onClick={() => setShowInsights((v) => !v)}>
            <div className="flex items-center text-lg">
              <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
              Cart Status Insights
            </div>
            <Button size="icon" variant="ghost" aria-label="Toggle Insights">
              {showInsights ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </Button>
          </CardHeader>
          {showInsights && (
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
                  <div className="flex items-center justify-center mb-2">
                    <AlertCircle className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="text-2xl font-bold text-yellow-600">{metrics.pendingCarts}</div>
                  <div className="text-sm text-gray-600">Pending Carts</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                  <div className="flex items-center justify-center mb-2">
                    <Clock className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-blue-600">{metrics.inProgressCarts}</div>
                  <div className="text-sm text-gray-600">In Progress</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg border-l-4 border-red-500">
                  <div className="flex items-center justify-center mb-2">
                    <XCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="text-2xl font-bold text-red-600">{metrics.lostCarts}</div>
                  <div className="text-sm text-gray-600">Lost Carts</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                  <div className="flex items-center justify-center mb-2">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="text-2xl font-bold text-green-600">{metrics.convertedCarts}</div>
                  <div className="text-sm text-gray-600">Converted</div>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by customer name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              {/* Date range pickers for filter */}
              <div className="flex gap-2 items-center">
                <Label className="text-xs text-gray-600">From</Label>
                <Input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value }))}
                  className="w-[140px]"
                />
                <Label className="text-xs text-gray-600">To</Label>
                <Input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange((prev) => ({ ...prev, end: e.target.value }))}
                  className="w-[140px]"
                />
              </div>
              <div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Converted</SelectItem>
                    <SelectItem value="failed">Lost</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* Filter button */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="default"
                  onClick={async () => {
                    // Fetch for selected date range
                    setIsLoading(true)
                    try {
                      const startStr = dateRange.start ? new Date(dateRange.start).toISOString() : ''
                      const endStr = dateRange.end ? new Date(dateRange.end + 'T23:59:59').toISOString() : ''
                      const res = await fetch(`/api/shopify-abandoned-checkouts?shopify=1&start_date=${encodeURIComponent(startStr)}&end_date=${encodeURIComponent(endStr)}`)
                      if (!res.ok) {
                        const errorText = await res.text()
                        throw new Error(`Failed to fetch from Shopify API: ${res.status} ${res.statusText} - ${errorText}`)
                      }
                      const raw = await res.json()
                      let checkouts = []
                      if (Array.isArray(raw)) {
                        checkouts = raw
                      } else if (Array.isArray(raw.data)) {
                        checkouts = raw.data
                      } else if (Array.isArray(raw.checkouts)) {
                        checkouts = raw.checkouts
                      } else if (raw.data && Array.isArray(raw.data.checkouts)) {
                        checkouts = raw.data.checkouts
                      }
                      if (!Array.isArray(checkouts)) checkouts = []
                      // Remove duplicate carts by id
                      const uniqueCartsMap = new Map()
                      for (const checkout of checkouts) {
                        if (!uniqueCartsMap.has(checkout.id)) {
                          uniqueCartsMap.set(checkout.id, checkout)
                        }
                      }
                      const uniqueCheckouts = Array.from(uniqueCartsMap.values())
                      // Fetch remarks for all carts and build the array
                      const allCarts = []
                      for (const checkout of uniqueCheckouts) {
                        const cart = mapShopifyCheckoutToCart(checkout)
                        cart.remarks = await fetchRemarksForCart(cart.id)
                        allCarts.push(cart)
                      }
                      setCarts(allCarts)
                      setTotalCarts(uniqueCheckouts.length)
                      setFetchError(null)
                    } catch (error) {
                      setCarts([])
                      setFetchError(error instanceof Error ? error.message : String(error))
                      alert(error instanceof Error ? error.message : String(error))
                    } finally {
                      setIsLoading(false)
                    }
                  }}
                  disabled={isLoading}
                >
                  Filter
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading state */}
        {isLoading && carts.length === 0 && (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}

        {/* Show spinner above cart list if still loading but some carts are loaded */}
        {isLoading && carts.length > 0 && (
          <div className="flex justify-center items-center p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-400"></div>
            <span className="ml-2 text-blue-500"></span>
          </div>
        )}

        {/* Cart List */}
        <div className="space-y-4">
          {paginatedCarts.length > 0 ? (
            paginatedCarts.map((cart) => {
              const isExpanded = expandedCards.includes(cart.id)
              return (
                <Card key={cart.id} className="hover:shadow-lg transition-shadow">
                  {/* CardHeader: Customer Name + Status Badge beside name, Cart Total beside Priority */}
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2 relative">
                            <h3 className="font-semibold text-lg">{cart.customer.name}</h3>
                            {/* Status badge beside name */}
                            <Badge
                              className={`${statusColors[getLatestStatus(cart) as keyof typeof statusColors]} cursor-pointer`}
                              onClick={() => setEditingCart(editingCart === `${cart.id}-status` ? null : `${cart.id}-status`)}
                            >
                              {getStatusIcon(getLatestStatus(cart))}
                              <span className="ml-1">
                                {getLatestStatus(cart) === "completed"
                                  ? "converted"
                                  : getLatestStatus(cart) === "failed"
                                    ? "lost"
                                    : getLatestStatus(cart)}
                              </span>
                              <Edit3 className="w-3 h-3 ml-1" />
                            </Badge>
                            {editingCart === `${cart.id}-status` && (
                              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 bg-white border rounded-lg shadow-lg p-2 z-50 min-w-[120px]">
                                <div className="space-y-1">
                                  {[
                                    { value: "pending", label: "pending" },
                                    { value: "in-progress", label: "in-progress" },
                                    { value: "completed", label: "converted" },
                                    { value: "failed", label: "lost" },
                                  ].map((status) => (
                                    <button
                                      key={status.value}
                                      className="block w-full text-left px-2 py-1 hover:bg-gray-100 rounded text-sm"
                                      onClick={async () => {
                                        await updateCartField(cart.id, "status", status.value)
                                        // Fetch the latest cart from the backend and update local state
                                        try {
                                          const res = await fetch(`/api/shopify-abandoned-checkouts?cart_id=${encodeURIComponent(cart.id)}`)
                                          if (res.ok) {
                                            const data = await res.json()
                                            if (data && data.id) {
                                              setCarts(carts.map((c) => c.id === cart.id ? { ...c, ...data } : c))
                                            }
                                          }
                                        } catch (e) {
                                          // Optionally show error
                                        }
                                        setEditingCart(null)
                                      }}
                                    >
                                      {status.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{cart.customer.email}</p>
                          <div className="flex items-center space-x-3 mt-1">
                            <p className="text-xs text-gray-500">Cart ID: {cart.id}</p>
                            <span className={`text-xs font-medium ${getUrgencyColor(cart.hoursSinceAbandoned)}`}>{cart.hoursSinceAbandoned}h ago</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        {/* Editable Priority */}
                        <div className="relative">
                          <Badge
                            className={`${priorityColors[cart.priority]} cursor-pointer`}
                            onClick={() => setEditingCart(editingCart === cart.id ? null : cart.id)}
                          >
                            {cart.priority}
                            <Edit3 className="w-3 h-3 ml-1" />
                          </Badge>
                          {editingCart === cart.id && (
                            <div className="absolute top-8 right-0 bg-white border rounded-lg shadow-lg p-2 z-10">
                              <div className="space-y-1">
                                {["high", "medium", "low"].map((priority) => (
                                  <button
                                    key={priority}
                                    className="block w-full text-left px-2 py-1 hover:bg-gray-100 rounded text-sm"
                                    onClick={() => updateCartField(cart.id, "priority", priority)}
                                  >
                                    {priority}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        {/* Cart total beside priority badge */}
                        <div className="text-right min-w-[80px]">
                          <p className="font-bold text-lg">₹{cart.cartValue}</p>
                          
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-4">
                      <div className="flex items-center space-x-6">
                        <span className="text-sm">{cart.items.length} items</span>
                        <span className="text-sm">{cart.remarks.length} remarks</span>
                        <p className="text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-1 rounded inline-block mt-1 shadow-sm border border-blue-200">
                            {formatDate(cart.abandonedAt)}
                          </p>
                        <span className="text-sm">Last contacted: {formatDate(cart.lastContacted)}</span>

                      </div>
                      <div className="flex items-center space-x-2">
                        {/* WhatsApp Quick Action with Template Picker */}
                        <Popover open={waPopoverOpen === cart.id} onOpenChange={async open => {
  if (open) {
    // Try to refresh templates from backend if available
    if (typeof window !== "undefined") {
      try {
        const res = await fetch('/api/templates')
        if (res.ok) {
          const freshTemplates = await res.json()
          setTemplates(freshTemplates)
        }
      } catch {}
    }
  }
  setWaPopoverOpen(open ? cart.id : null)
}}>
                          <PopoverTrigger asChild>
                            <Button size="sm" variant="outline">
                              <MessageSquare className="w-4 h-4 mr-1 text-green-600" /> WhatsApp
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-72">
                            <div className="mb-2 font-medium text-sm">Select WhatsApp Template</div>
                            <div className="space-y-2">
                              {templates.filter(t => t.type === "whatsapp").length === 0 && (
                                <div className="text-xs text-gray-500">No WhatsApp templates found. Add one in Settings.</div>
                              )}
                              {templates.filter(t => t.type === "whatsapp").map(tpl => (
                                <div key={tpl.id} className="flex items-center gap-2">
                                  <input
                                    type="radio"
                                    id={`wa-tpl-${tpl.id}-${cart.id}`}
                                    name={`wa-tpl-${cart.id}`}
                                    checked={selectedTemplateId[cart.id] === tpl.id}
                                    onChange={() => setSelectedTemplateId(prev => ({ ...prev, [cart.id]: tpl.id }))}
                                  />
                                  <label htmlFor={`wa-tpl-${tpl.id}-${cart.id}`} className="text-xs cursor-pointer">{tpl.name}</label>
                                </div>
                              ))}
                            </div>
                            <div className="mt-3">
                              <Button
                                className="w-full bg-green-600 text-white"
                                disabled={!selectedTemplateId[cart.id]}
                                onClick={() => {
                                  const tpl = templates.find(t => t.id === selectedTemplateId[cart.id])
                                  if (!tpl) return
                                  const msg = fillTemplate(tpl.text, cart)
                                  const url = `https://wa.me/${cart.customer.phone.replace(/[^\d]/g, "")}?text=${encodeURIComponent(msg)}`
                                  window.open(url, '_blank')
                                  setWaPopoverOpen(null)
                                }}
                              >
                                Send WhatsApp
                              </Button>
                            </div>
                          </PopoverContent>
                        </Popover>
                        {/* ...other quick actions... */}
                        <Button size="sm" variant="outline" onClick={() => window.open(`sms:${cart.customer.phone}`)}>
                          <MessageSquare className="w-4 h-4 mr-1" /> SMS
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => window.open(`tel:${cart.customer.phone}`)}>
                          <Phone className="w-4 h-4 mr-1" /> Call
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => window.open(`mailto:${cart.customer.email}`)}>
                          <Mail className="w-4 h-4 mr-1" /> Email
                        </Button>
                        <Dialog
                          open={remarkForm.cartId === cart.id}
                          onOpenChange={(open) => {
                            if (!open) {
                              setRemarkForm({ type: "", message: "", cartId: "" })
                            }
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button size="sm" onClick={() => setRemarkForm({ ...remarkForm, cartId: cart.id })}>
                              <Plus className="w-4 h-4 mr-1" />
                              Add Remark
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>Add Remark for {cart.customer.name}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label>Type</Label>
                                <Select
                                  value={remarkForm.type}
                                  onValueChange={(value) => setRemarkForm({ ...remarkForm, type: value })}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="email">Email</SelectItem>
                                    <SelectItem value="sms">SMS</SelectItem>
                                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label>Message</Label>
                                <Textarea
                                  placeholder="Enter your message..."
                                  value={remarkForm.message}
                                  onChange={(e) => setRemarkForm({ ...remarkForm, message: e.target.value })}
                                />
                              </div>
                              <Button
                                onClick={async () => {
                                  await addRemark()
                                  setRemarkForm({ type: "", message: "", cartId: "" })
                                }}
                                disabled={!remarkForm.type || !remarkForm.message}
                              >
                                Add Remark
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button size="sm" variant="outline" onClick={() => toggleCardExpansion(cart.id)}>
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>

                    {isExpanded && (
                      <Tabs defaultValue="remarks" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                          <TabsTrigger value="remarks">Remarks</TabsTrigger>
                          <TabsTrigger value="items">Items</TabsTrigger>
                          <TabsTrigger value="customer">Customer</TabsTrigger>
                        </TabsList>

                        <TabsContent value="remarks" className="mt-4">
                          <div className="space-y-4">
                            {/* Defensive: Only render remarks that are not null/undefined */}
                            {Array.isArray(cart.remarks) ?
                              cart.remarks
                                .filter(
                                  (remark) =>
                                    remark &&
                                    typeof remark === 'object' &&
                                    'type' in remark &&
                                    typeof remark.type === 'string'
                                )
                                .map((remark) => (
                                  <div key={remark.id} className="border-l-4 border-blue-500 pl-4 py-3 bg-white rounded-r-lg">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center space-x-2">
                                        {/* ...existing icons... */}
                                        {remark.type === "email" && <Mail className="w-4 h-4" />}
                                        {remark.type === "sms" && <MessageSquare className="w-4 h-4" />}
                                        {remark.type === "phone" && <Phone className="w-4 h-4" />}
                                        {remark.type === "whatsapp" && <MessageSquare className="w-4 h-4 text-green-600" />}
                                        {remark.type === "response" && <User className="w-4 h-4" />}
                                        <span className="font-medium capitalize">{remark.type}</span>
                                      </div>
                                      <span className="text-sm text-gray-500">
                                        {remark.date && !isNaN(new Date(remark.date).getTime())
    ? formatDate(remark.date)
    : "N/A"}
                                        {remark.agent ? ` - ${remark.agent}` : ""}
                                      </span>
                                    </div>
                                    <p className="text-sm mb-2">{remark.message}</p>
                                    {remark.response && (
                                      <div className="bg-emerald-50 p-3 rounded border-l-4 border-emerald-500">
                                        <div className="flex items-center justify-between mb-1">
                                          <p className="text-sm font-medium text-emerald-800">Customer Response:</p>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => setEditingResponse({ cartId: cart.id, remarkId: remark.id })}
                                          >
                                            <Edit className="w-3 h-3" />
                                          </Button>
                                        </div>
                                        {editingResponse?.cartId === cart.id && editingResponse?.remarkId === remark.id ? (
                                          <div className="space-y-2">
                                            <Textarea
                                              value={editResponseText}
                                              onChange={(e) => setEditResponseText(e.target.value)}
                                              className="text-sm border-emerald-300 focus:border-emerald-500"
                                            />
                                            <div className="flex space-x-2">
                                              <Button
                                                size="sm"
                                                onClick={saveEditedResponse}
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                              >
                                                Save
                                              </Button>
                                              <Button size="sm" variant="outline" onClick={() => setEditingResponse(null)}>
                                                Cancel
                                              </Button>
                                            </div>
                                          </div>
                                        ) : (
                                          <p className="text-sm text-emerald-700 font-medium">{remark.response}</p>
                                        )}
                                      </div>
                                    )}
                                    {/* Delete button for each remark */}
                                    <button
                                      className="text-xs text-red-500 hover:underline ml-2"
                                      title="Delete remark"
                                      onClick={() => deleteRemark(cart.id, remark.id)}
                                    >
                                      Delete
                                    </button>
                                  </div>
                                ))
                              : null}
                          </div>
                        </TabsContent>

                        <TabsContent value="items" className="mt-4">
                          <div className="space-y-3">
                            {cart.items.map((item, index) => (
                              <div
                                key={index}
                                className="flex justify-between items-center p-3 border rounded-lg bg-white"
                              >
                                <div>
                                  <p className="font-medium">{item.name}</p>
                                  <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                                </div>
                                <p className="font-semibold">₹{item.price}</p>
                              </div>
                            ))}
                            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg font-bold border-2 border-blue-200">
                              <span>Total:</span>
                              <span className="text-blue-600">₹{cart.cartValue}</span>
                            </div>
                          </div>
                        </TabsContent>

                        <TabsContent value="customer" className="mt-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                              <div className="bg-white p-4 rounded-lg border">
                                <h4 className="font-medium text-gray-800 mb-3">Contact Information</h4>
                                <div className="space-y-3">
                                  <div className="flex items-center space-x-2">
                                    <span>{cart.customer.name}</span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Mail className="w-4 h-4 text-gray-500" />
                                    <span>{cart.customer.email}</span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Phone className="w-4 h-4 text-gray-500" />
                                    <span>{cart.customer.phone}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </TabsContent>
                      </Tabs>
                    )}
                  </CardContent>
                </Card>
              )
            })
          ) : (
            <Card className="text-center p-8">
              <p className="text-gray-500">No carts found</p>
              {filteredCarts.length === 0 && carts.length > 0 && (
                <p className="text-sm text-gray-400 mt-2">Try adjusting your filters</p>
              )}
            </Card>
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="w-full flex flex-wrap justify-center items-center gap-2 mt-8 overflow-x-auto pb-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <div className="flex flex-wrap gap-1 max-w-full overflow-x-auto">
              {(() => {
                const pageButtons = []
                let start = Math.max(1, currentPage - 2)
                let end = Math.min(totalPages, currentPage + 2)
                if (currentPage <= 3) {
                  start = 1
                  end = Math.min(5, totalPages)
                } else if (currentPage >= totalPages - 2) {
                  start = Math.max(1, totalPages - 4)
                  end = totalPages
                }
                for (let page = start; page <= end; page++) {
                  pageButtons.push(
                    <Button
                      key={page}
                      size="sm"
                      variant={page === currentPage ? "default" : "outline"}
                      onClick={() => setCurrentPage(page)}
                      className={page === currentPage ? "font-bold" : ""}
                      style={{ minWidth: 36 }}
                    >
                      {page}
                    </Button>
                  )
                }
                return pageButtons
              })()}
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}