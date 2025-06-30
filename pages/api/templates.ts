import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}
const supabase = createClient(supabaseUrl, supabaseKey)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // Fetch all templates
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .order('id', { ascending: true })
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }
  if (req.method === 'POST') {
    // Add a new template
    const { type, name, text, category, isStarred, usageCount } = req.body
    // Validate required fields
    if (!type || !name || !text || !category) {
      return res.status(400).json({ error: 'Missing required fields' })
    }
    const { data, error } = await supabase
      .from('templates')
      .insert([{ type, name, text, category, isStarred, usageCount }])
      .select()
    if (error) {
      console.error('Supabase insert error:', error)
      return res.status(500).json({ error: error.message })
    }
    return res.status(201).json(data?.[0])
  }
  if (req.method === 'PUT') {
    // Update a template
    const { id, ...updates } = req.body
    if (!id) return res.status(400).json({ error: 'Missing id' })
    const { data, error } = await supabase
      .from('templates')
      .update(updates)
      .eq('id', id)
      .select()
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data?.[0])
  }
  if (req.method === 'DELETE') {
    // Delete a template
    const { id } = req.body
    if (!id) return res.status(400).json({ error: 'Missing id' })
    const { error } = await supabase
      .from('templates')
      .delete()
      .eq('id', id)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(204).end()
  }
  res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE'])
  res.status(405).end(`Method ${req.method} Not Allowed`)
}
