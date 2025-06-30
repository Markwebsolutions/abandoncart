export type Template = {
  id: number
  type: string
  name: string
  text: string
  category: string
  isStarred?: boolean
  lastUsed?: string
  usageCount?: number
}

export async function fetchTemplates(): Promise<Template[]> {
  const res = await fetch('/api/templates')
  if (!res.ok) throw new Error('Failed to fetch templates')
  return await res.json()
}

export async function addTemplate(template: Omit<Template, 'id'>) {
  const res = await fetch('/api/templates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(template),
  })
  if (!res.ok) throw new Error('Failed to add template')
  return await res.json()
}

export async function updateTemplate(id: number, updates: Partial<Template>) {
  const res = await fetch('/api/templates', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, ...updates }),
  })
  if (!res.ok) throw new Error('Failed to update template')
  return await res.json()
}

export async function deleteTemplate(id: number) {
  const res = await fetch('/api/templates', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  })
  if (!res.ok) throw new Error('Failed to delete template')
}
