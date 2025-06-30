import type { NextApiRequest, NextApiResponse } from "next"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    // Save a new remark/response
    const { cart_id, type, message, response, agent, status } = req.body
    const { data, error } = await supabase
      .from("abandoned_cart_remarks")
      .insert([{ cart_id, type, message, response, agent, status }])
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ data })
  }

  if (req.method === "GET") {
    // Get all remarks for a cart
    const { cart_id } = req.query
    const { data, error } = await supabase
      .from("abandoned_cart_remarks")
      .select("*")
      .eq("cart_id", cart_id)
      .order("created_at", { ascending: true })
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ data })
  }

  if (req.method === "DELETE") {
    const { cart_id, remark_id } = req.query
    if (!cart_id || !remark_id) {
      return res.status(400).json({ error: "cart_id and remark_id required" })
    }
    const { error } = await supabase
      .from("abandoned_cart_remarks")
      .delete()
      .eq("cart_id", cart_id)
      .eq("id", remark_id)
    if (error) return res.status(500).json({ error: error.message })
    // Return updated remarks
    const { data, error: fetchError } = await supabase
      .from("abandoned_cart_remarks")
      .select("*")
      .eq("cart_id", cart_id)
      .order("created_at", { ascending: true })
    if (fetchError) return res.status(500).json({ error: fetchError.message })
    return res.status(200).json({ data })
  }

  res.status(405).json({ error: "Method not allowed" })
}
