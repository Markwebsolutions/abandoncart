import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Use the correct env variable names for your credentials
  const shopUrl = process.env.SHOPIFY_SHOP_P || '';
  const accessToken = process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN || '';
  const apiSecret = process.env.API_SECRET || '';

  // Debug log (remove in production)
  console.log('shopUrl:', shopUrl);
  console.log('accessToken:', accessToken ? '[HIDDEN]' : '[MISSING]');
  console.log('apiSecret:', apiSecret ? '[HIDDEN]' : '[MISSING]');

  if (!shopUrl || !accessToken) {
    return res.status(500).json({ error: 'Shopify credentials not set in environment', shopUrl, accessToken, apiSecret });
  }

  try {
    // Shopify REST Admin API endpoint for products
    const apiUrl = `${shopUrl}/admin/api/2025-04/products.json?limit=250`;
    const shopifyRes = await fetch(apiUrl, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
    if (!shopifyRes.ok) {
      const text = await shopifyRes.text();
      return res.status(shopifyRes.status).json({ error: text, apiUrl });
    }
    const data = await shopifyRes.json();
    // Return as { products: [...] }
    return res.status(200).json({ products: data.products || [], apiUrl });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch products from Shopify', stack: error.stack });
  }
}
