import type { NextApiRequest, NextApiResponse } from "next"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const shop = process.env.SHOPIFY_SHOP
  const accessToken = process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN

  if (!shop || !accessToken) {
    return res.status(500).json({ error: "Shopify credentials are not set in environment variables." })
  }

  // SYNC: Only fetch new entries from Shopify and store in Supabase
  if (req.method === "POST" || req.query.sync === "1") {
    // Get latest created_at from Supabase
    const { data: latest, error: latestErr } = await supabase
      .from("abandoned_checkouts")
      .select("created_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    if (latestErr) {
      console.error("Supabase latest fetch error:", latestErr)
      return res.status(500).json({ error: latestErr.message })
    }
    const now = new Date();
    const threeDaysAgo = new Date(now);
    threeDaysAgo.setDate(now.getDate() - 3);
    let createdAtMin = threeDaysAgo.toISOString();
    if (latest?.created_at && new Date(latest.created_at) > threeDaysAgo) {
      createdAtMin = new Date(latest.created_at).toISOString();
    }

    let newCheckouts: any[] = [];
    let nextPageUrl: string | null = `https://${shop}/admin/api/2025-04/checkouts.json?status=abandoned&limit=250&created_at_min=${encodeURIComponent(createdAtMin)}`;
    try {
      while (nextPageUrl) {
        const response: Response = await fetch(nextPageUrl, {
          headers: {
            "X-Shopify-Access-Token": accessToken,
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) {
          const error = await response.text();
          console.error("Shopify API error:", response.status, error)
          return res.status(response.status).json({ error });
        }
        const data = await response.json();
        newCheckouts = newCheckouts.concat(data.checkouts || []);
        const linkHeader: string | null = response.headers.get("link");
        if (linkHeader && linkHeader.includes('rel="next"')) {
          const match: RegExpMatchArray | null = linkHeader.match(/<([^>]+)>; rel="next"/);
          nextPageUrl = match ? match[1] : null;
        } else {
          nextPageUrl = null;
        }
      }
      // Insert new checkouts into Supabase (ignore duplicates)
      for (const checkout of newCheckouts) {
        try {
          await supabase.from("abandoned_checkouts").upsert({
            id: checkout.id,
            created_at: checkout.created_at,
            updated_at: checkout.updated_at,
            customer: checkout.customer,
            email: checkout.email,
            phone: checkout.phone,
            cart_value: checkout.subtotal_price,
            items: checkout.line_items,
            raw: checkout,
          }, { onConflict: "id" });
        } catch (upsertErr) {
          console.error("Supabase upsert error for checkout", checkout.id, upsertErr)
        }
      }
      // Return count of all entries after sync
      const { count, error: countErr } = await supabase
        .from("abandoned_checkouts")
        .select("id", { count: "exact", head: true });
      if (countErr) {
        console.error("Supabase count error:", countErr)
        return res.status(500).json({ error: countErr.message })
      }
      return res.status(200).json({ inserted: newCheckouts.length, totalCount: count });
    } catch (error) {
      console.error("Sync catch error:", error)
      return res.status(500).json({ error: (error as Error).message });
    }
  }

  // PATCH: Update status or priority for a cart
  if (req.method === "PATCH") {
    const { cartId, field, value } = req.body;
    if (!cartId || !field) {
      return res.status(400).json({ error: "cartId and field are required" });
    }
    const { error } = await supabase
      .from("abandoned_checkouts")
      .update({ [field]: value })
      .eq("id", cartId);
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    return res.status(200).json({ success: true });
  }

  // GET: If shopify=1, fetch directly from Shopify API (live data, not Supabase)
  if (req.method === "GET" && req.query.shopify === "1") {
    try {
      let startDate = req.query.start_date as string | undefined;
      let endDate = req.query.end_date as string | undefined;
      const now = new Date();
      const threeDaysAgo = new Date(now);
      threeDaysAgo.setDate(now.getDate() - 3);
      if (!startDate) startDate = threeDaysAgo.toISOString();
      if (!endDate) endDate = now.toISOString();
      startDate = startDate || '';
      endDate = endDate || '';
      let url = `https://${shop}/admin/api/2025-04/checkouts.json?status=abandoned&limit=250&created_at_min=${encodeURIComponent(startDate)}`;
      if (endDate) url += `&created_at_max=${encodeURIComponent(endDate)}`;
      let allCheckouts: any[] = [];
      let nextPageUrl: string = url;
      while (nextPageUrl) {
        const response = await fetch(nextPageUrl, {
          headers: {
            "X-Shopify-Access-Token": String(accessToken),
            "Content-Type": "application/json",
          } as Record<string, string>,
        });
        if (!response.ok) {
          const error = await response.text();
          return res.status(response.status).json({ error });
        }
        const data = await response.json();
        const checkouts = data.checkouts || [];
        allCheckouts = allCheckouts.concat(checkouts);
        const linkHeader = response.headers.get("link");
        if (linkHeader && typeof linkHeader === 'string' && linkHeader.includes('rel="next"')) {
          const match = linkHeader.match(/<([^>]+)>; rel="next"/);
          if (match && Array.isArray(match) && match[1]) {
            nextPageUrl = match[1];
          } else {
            nextPageUrl = '';
          }
        } else {
          nextPageUrl = '';
        }
      }
      return res.status(200).json({ checkouts: allCheckouts, total: allCheckouts.length });
    } catch (error) {
      return res.status(500).json({ error: (error as Error).message });
    }
  }

  // GET: Serve all date-filtered data from Supabase, ordered from latest to oldest (no limit/offset)
  if (req.method === "GET") {
    try {
      let startDate = req.query.start_date as string | undefined;
      let endDate = req.query.end_date as string | undefined;
      const now = new Date();
      const threeDaysAgo = new Date(now);
      threeDaysAgo.setDate(now.getDate() - 3);
      if (!startDate) startDate = threeDaysAgo.toISOString();
      if (!endDate) endDate = now.toISOString();
      let query = supabase
        .from("abandoned_checkouts")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false });
      if (startDate) query = query.gte("created_at", startDate);
      if (endDate) query = query.lte("created_at", endDate);
      const { data: checkouts, error, count: total } = await query;
      if (error) throw error;
      return res.status(200).json({ checkouts, total });
    } catch (error) {
      return res.status(500).json({ error: (error as Error).message });
    }
  }
}
