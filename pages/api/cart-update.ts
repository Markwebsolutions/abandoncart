import type { NextApiRequest, NextApiResponse } from "next"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Helper to update status/priority in abandoned_checkouts
async function updateCartStatusOrPriority(cart_id: string, field: string, value: string) {
  const { data, error } = await supabase
    .from("abandoned_checkouts")
    .update({ [field]: value })
    .eq("id", cart_id)
    .select()
  return { data, error }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    const { cart_id, remark_id, field, value } = req.body
    console.log("cart-update POST:", { cart_id, remark_id, field, value })
    if (!field) {
      return res.status(400).json({ error: "field is required" })
    }
    // If cart-level status/priority change, create a new remark AND update abandoned_checkouts
    if (cart_id && !remark_id && (field === 'status' || field === 'priority')) {
      // Insert a new remark logging the status/priority change
      const { data: remarkData, error: remarkError } = await supabase
        .from("abandoned_cart_remarks")
        .insert([
          {
            cart_id: cart_id,
            [field]: value,
            type: 'system',
            message: `Cart ${field} changed to ${value}`,
            agent: 'System',
          },
        ])
        .select()
      if (remarkError) {
        console.error('Supabase insert error (cart-level status/priority):', remarkError)
        return res.status(500).json({ error: remarkError.message })
      }
      // Also update the main abandoned_checkouts table
      const { data: cartData, error: cartError } = await updateCartStatusOrPriority(cart_id, field, value)
      if (cartError) {
        console.error('Supabase update error (cart-level status/priority):', cartError)
        return res.status(500).json({ error: cartError.message })
      }
      return res.status(200).json({ remark: remarkData, cart: cartData })
    }
    // Update abandoned_checkouts for other cart-level fields
    if (cart_id && !remark_id) {
      const cartIdStr = String(cart_id)
      const { data, error } = await supabase
        .from("abandoned_checkouts")
        .update({ [field]: value })
        .eq("id", cartIdStr)
        .select()
      console.log('Supabase update result (cart):', data)
      if (error) {
        console.error('Supabase update error (cart):', error)
        return res.status(500).json({ error: error.message })
      }
      if (!data || data.length === 0) {
        console.warn('No cart updated for id:', cartIdStr)
        return res.status(404).json({ error: "Cart not found or not updated" })
      }
      return res.status(200).json({ data })
    }
    // Update abandoned_cart_remarks if remark_id is present
    if (remark_id) {
      // Only allow updating status or priority for remarks
      if (field !== 'status' && field !== 'priority') {
        return res.status(400).json({ error: "Only status or priority can be updated for remarks" })
      }
      const { data, error } = await supabase
        .from("abandoned_cart_remarks")
        .update({ [field]: value })
        .eq("id", remark_id)
        .select()
      if (error) {
        console.error('Supabase update error (remark):', error)
        return res.status(500).json({ error: error.message })
      }
      if (!data || data.length === 0) {
        console.warn('No remark updated for id:', remark_id)
        return res.status(404).json({ error: "Remark not found or not updated" })
      }
      return res.status(200).json({ data })
    }
    // If neither cart_id nor remark_id is present
    return res.status(400).json({ error: "cart_id or remark_id is required" })
  }
  res.status(405).json({ error: "Method not allowed" })
}
