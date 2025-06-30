// Utility to extract Indian phone number from Shopify checkout object
export function extractIndianPhone(checkout: any): string {
  // Try customer.phone, billing_address.phone, shipping_address.phone
  const phoneCandidates = [
    checkout.phone,
    checkout.customer?.phone,
    checkout.billing_address?.phone,
    checkout.shipping_address?.phone,
  ]
  for (const phone of phoneCandidates) {
    if (typeof phone === "string" && phone.match(/^\+91\d{10}$/)) {
      return phone
    }
    // Try to format if it's a 10-digit number
    if (typeof phone === "string" && phone.match(/^\d{10}$/)) {
      return "+91" + phone
    }
  }
  return ""
}
