import { createContext, useContext, useState, useEffect, ReactNode } from "react"

export type Template = { 
  id: number; 
  type: string; 
  name: string; 
  text: string;
  category?: string;
  isStarred?: boolean;
}

const TemplateContext = createContext<{
  templates: Template[]
  setTemplates: (t: Template[]) => void
} | null>(null)

export function useTemplateStore() {
  const ctx = useContext(TemplateContext)
  if (!ctx) throw new Error("useTemplateStore must be used within TemplateProvider")
  return ctx
}

const LS_KEY = "shopify-templates"

const DEFAULT_TEMPLATES: Template[] = [
  { id: 1, type: "whatsapp", name: "Default WhatsApp", text: "Hi {name}, you left {product} in your cart!", category: "general", isStarred: false },
  { id: 2, type: "email", name: "Default Email", text: "Dear {name}, your cart with {product} is waiting for you.", category: "general", isStarred: false },
]

export function TemplateProvider({ children }: { children: ReactNode }) {
  const [templates, setTemplates] = useState<Template[]>(DEFAULT_TEMPLATES)

  // On mount, load templates from localStorage if available
  useEffect(() => {
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem(LS_KEY)
      if (raw) {
        try {
          // Ensure all templates have category and isStarred
          const loaded = JSON.parse(raw).map((t: any) => ({
            ...t,
            category: t.category || "general",
            isStarred: typeof t.isStarred === "boolean" ? t.isStarred : false
          }))
          setTemplates(loaded)
        } catch {}
      }
    }
  }, [])

  // Save templates to localStorage when they change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(LS_KEY, JSON.stringify(templates))
    }
  }, [templates])

  return (
    <TemplateContext.Provider value={{ templates, setTemplates }}>
      {children}
    </TemplateContext.Provider>
  )
}
