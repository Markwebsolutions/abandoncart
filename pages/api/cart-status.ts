import type { NextApiRequest, NextApiResponse } from "next"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    const { cart_id, status, agent = "System" } = req.body
    if (!cart_id || !status) {
      return res.status(400).json({ error: "cart_id and status are required" })
    }
    // Insert a new remark with status change
    const { data, error } = await supabase
      .from("abandoned_cart_remarks")
      .insert([
        {
          cart_id,
          type: "status-change",
          message: `Status changed to ${status}`,
          status,
          agent,
        },
      ])
      .select()
    if (error) {
      return res.status(500).json({ error: error.message })
    }
    return res.status(200).json({ data })
  }
  if (req.method === "GET") {
    const { cart_id } = req.query
    if (!cart_id) {
      return res.status(400).json({ error: "cart_id is required" })
    }
    // Get the latest status for the cart
    const { data, error } = await supabase
      .from("abandoned_cart_remarks")
      .select("status")
      .eq("cart_id", cart_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()
    if (error && error.code !== "PGRST116") {
      // PGRST116: No rows found
      return res.status(500).json({ error: error.message })
    }
    return res.status(200).json({ status: data?.status || null })
  }
  res.status(405).json({ error: "Method not allowed" })
}
