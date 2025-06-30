// Mock database functions (replace with actual API calls)
export const mockDatabase = {
  async saveCarts(carts: any[]) {
    // Simulate API call to save carts
    console.log("Saving carts to database:", carts)
    return new Promise((resolve) => setTimeout(resolve, 500))
  },

  async saveRemark(cartId: string, remark: any) {
    // Simulate API call to save remark
    console.log("Saving remark to database:", { cartId, remark })
    return new Promise((resolve) => setTimeout(resolve, 300))
  },

  async saveCustomerResponse(cartId: string, response: any) {
    // Simulate API call to save customer response
    console.log("Saving customer response to database:", { cartId, response })
    return new Promise((resolve) => setTimeout(resolve, 300))
  },

  async fetchFromShopify() {
    // Simulate fetching new abandoned carts from Shopify
    const newCart = {
      id: `AC${String(Date.now()).slice(-3)}`,
      customer: {
        name: "New Customer",
        email: "new.customer@email.com",
        phone: "+1 (555) 000-0000",
      },
      cartValue: Math.floor(Math.random() * 300) + 50,
      items: [{ name: "New Product", price: Math.floor(Math.random() * 100) + 20, quantity: 1 }],
      abandonedAt: new Date().toISOString(),
      status: "pending" as const,
      priority: "medium" as const,
      remarks: [],
      lastContacted: new Date().toISOString(),
      hoursSinceAbandoned: 1,
    }
    console.log("Fetched new cart from Shopify:", newCart)
    return newCart
  },
}
