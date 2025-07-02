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
    // Fetch all products using pagination (Shopify REST API: limit 250 per page)
    let products: any[] = [];
    let pageInfo: string | null = null;
    let page = 1;
    let hasNextPage = true;
    let lastApiUrl = '';
    while (hasNextPage) {
      let apiUrl = `${shopUrl}/admin/api/2025-04/products.json?limit=250`;
      if (pageInfo) {
        apiUrl += `&page_info=${encodeURIComponent(pageInfo)}`;
      }
      lastApiUrl = apiUrl;
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
      if (Array.isArray(data.products)) {
        products = products.concat(data.products);
      }
      // Check for pagination using the Link header
      const linkHeader = shopifyRes.headers.get('link') || shopifyRes.headers.get('Link');
      if (linkHeader && linkHeader.includes('rel="next"')) {
        // Extract page_info from the next link
        const match = linkHeader.match(/<[^>]+page_info=([^&>]+)[^>]*>; rel="next"/);
        if (match && match[1]) {
          pageInfo = match[1];
          hasNextPage = true;
        } else {
          hasNextPage = false;
        }
      } else {
        hasNextPage = false;
      }
      page++;
    }
    return res.status(200).json({ products, apiUrl: lastApiUrl });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch products from Shopify', stack: error.stack });
  }
}
