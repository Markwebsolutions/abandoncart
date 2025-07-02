import type { NextApiRequest, NextApiResponse } from "next"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" })
  }
  try {
    // Fetch last 15 carts from abandoned_checkouts table, most recent first, only needed columns
    const { data, error } = await supabase
      .from("abandoned_checkouts")
      .select("id,customer,items,cart_value,created_at,updated_at,status,priority")
      .order("created_at", { ascending: false })
      .limit(15)
    if (error) {
      return res.status(500).json({ error: error.message })
    }
    return res.status(200).json({ data })
  } catch (e: any) {
    return res.status(500).json({ error: e.message || "Unknown error" })
  }
}
