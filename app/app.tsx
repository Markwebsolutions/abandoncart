"use client"

import { useState } from "react"
import AbandonedCartManager from "@/components/abandoned-cart/AbandonedCartManager"
import ProductsManager from "@/components/products/ProductsManager"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ShoppingCart, ShoppingBag } from "lucide-react"

const NAV = [
  { key: "abandoned", label: "Abandoned Carts", icon: <ShoppingCart className="w-5 h-5 mr-2" /> },
  { key: "products", label: "Products", icon: <ShoppingBag className="w-5 h-5 mr-2" /> },
]

export default function App() {
  const [tab, setTab] = useState("abandoned")

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r flex flex-col">
        <div className="p-6 font-bold text-xl text-blue-700">Shopify Dashboard</div>
        <nav className="flex-1">
          {NAV.map((item) => (
            <Button
              key={item.key}
              variant={tab === item.key ? "default" : "ghost"}
              className={`w-full justify-start px-6 py-4 text-lg rounded-none ${tab === item.key ? "font-bold" : ""}`}
              onClick={() => setTab(item.key)}
            >
              {item.icon}
              {item.label}
            </Button>
          ))}
        </nav>
      </aside>
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {tab === "abandoned" && <AbandonedCartManager />}
        {tab === "products" && <ProductsManager />}
      </main>
    </div>
  )
}
