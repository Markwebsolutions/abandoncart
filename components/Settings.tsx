import React, { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { 
  Plus, Edit3, Trash2, MessageSquare, Mail, Copy, Eye, Settings, 
  Smartphone, Search, Star, ChevronRight, ChevronDown,
  Clock, Users, BarChart3, ShoppingCart, Truck
} from "lucide-react"
import {
  fetchTemplates,
  addTemplate as apiAddTemplate,
  updateTemplate as apiUpdateTemplate,
  deleteTemplate as apiDeleteTemplate,
  Template as DBTemplate
} from "@/lib/templatesApi"

export default function TemplateManager() {
  const [templates, setTemplates] = useState<DBTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [editingTemplate, setEditingTemplate] = useState<DBTemplate | null>(null)
  const [templateForm, setTemplateForm] = useState<{ 
    id: number | null; 
    type: string; 
    name: string; 
    text: string;
    category: string;
  }>({ 
    id: null, 
    type: "whatsapp", 
    name: "", 
    text: "",
    category: "general"
  })
  const [dialogOpen, setDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [activeType, setActiveType] = useState("whatsapp")
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({})

  // Template categories with icons
  const categories = {
    general: { label: "General", icon: MessageSquare },
    abandoned_cart: { label: "Abandoned Cart", icon: ShoppingCart },
    shipping: { label: "Shipping", icon: Truck }
  }

  const messageTypes = {
    whatsapp: { label: "WhatsApp", icon: MessageSquare, color: "emerald" },
    email: { label: "Email", icon: Mail, color: "blue" },
    sms: { label: "SMS", icon: Smartphone, color: "purple" }
  }

  useEffect(() => {
    setLoading(true)
    fetchTemplates()
      .then(setTemplates)
      .finally(() => setLoading(false))
  }, [])

  const openAddTemplate = (type: string) => {
    setEditingTemplate(null)
    setTemplateForm({ id: null, type, name: "", text: "", category: "general" })
    setDialogOpen(true)
  }
  
  const openEditTemplate = (tpl: DBTemplate) => {
    setEditingTemplate(tpl)
    setTemplateForm({
      id: tpl.id,
      type: tpl.type, // Keep original type, don't allow changing
      name: tpl.name,
      text: tpl.text,
      category: tpl.category || "general"
    })
    setDialogOpen(true)
  }
  
  const saveTemplate = async () => {
    if (!templateForm.name.trim() || !templateForm.text.trim()) return
    setLoading(true)
    try {
      if (editingTemplate && templateForm.id !== null) {
        const { id, ...rest } = templateForm
        const updated = await apiUpdateTemplate(templateForm.id, {
          ...rest,
          lastUsed: editingTemplate.lastUsed,
          usageCount: editingTemplate.usageCount,
          isStarred: editingTemplate.isStarred || false
        })
        setTemplates(templates.map(t => t.id === updated.id ? updated : t))
      } else {
        const created = await apiAddTemplate({
          ...templateForm,
          isStarred: false,
          usageCount: 0,
          lastUsed: new Date().toISOString()
        })
        setTemplates([...templates, created])
      }
      setDialogOpen(false)
      resetForm()
    } finally {
      setLoading(false)
    }
  }
  
  const deleteTemplate = async (id: number) => {
    if (confirm("Are you sure you want to delete this template?")) {
      setLoading(true)
      try {
        await apiDeleteTemplate(id)
        setTemplates(templates.filter((t) => t.id !== id))
      } finally {
        setLoading(false)
      }
    }
  }

  const toggleStar = async (id: number) => {
    const tpl = templates.find(t => t.id === id)
    if (!tpl) return
    setLoading(true)
    try {
      const updated = await apiUpdateTemplate(id, { isStarred: !tpl.isStarred })
      setTemplates(templates.map(t => t.id === id ? updated : t))
    } finally {
      setLoading(false)
    }
  }

  const copyTemplate = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const resetForm = () => {
    setTemplateForm({ id: null, type: "whatsapp", name: "", text: "", category: "general" })
    setEditingTemplate(null)
  }

  const getPreviewText = (text: string) => {
    return text
      .replace(/\{name\}/g, "John Doe")
      .replace(/\{product\}/g, "iPhone 15")
      .replace(/\{company\}/g, "Your Store")
      .replace(/\{amount\}/g, "$299")
      .replace(/\{order_id\}/g, "#12345")
      .replace(/\{tracking_url\}/g, "track.yourstore.com/12345")
  }

  const toggleSection = (section: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  // Filter templates
  const getFilteredTemplates = (type: string) => {
    return templates
      .filter(t => t.type === type)
      .filter(t => selectedCategory === "all" || t.category === selectedCategory)
      .filter(t => 
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.text.toLowerCase().includes(searchQuery.toLowerCase())
      )
  }

  const getTemplatesByType = (type: string) => {
    return getFilteredTemplates(type)
  }

  // Update getTemplatesByCategory to use DBTemplate
  const getTemplatesByCategory = (templates: DBTemplate[]) => {
    const grouped = templates.reduce((acc, template) => {
      const category = template.category || 'general'
      if (!acc[category]) acc[category] = []
      acc[category].push(template)
      return acc
    }, {} as Record<string, DBTemplate[]>)
    
    return grouped
  }

  const getTypeStats = (type: string) => {
    const typeTemplates = templates.filter(t => t.type === type)
    return {
      total: typeTemplates.length,
      starred: typeTemplates.filter(t => t.isStarred).length
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="px-8 py-5 flex items-center justify-between max-w-full">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Settings className="h-7 w-7 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Template Manager</h1>
              <p className="text-base text-gray-500">Manage messaging templates across all channels</p>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <div className="w-72 bg-white border-r border-gray-200 flex flex-col flex-shrink-0" style={{height: 'auto'}}>
          <div className="p-6">
            {/* Sidebar content (search, types, categories) - not scrollable */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 text-sm"
              />
            </div>

            <div className="space-y-1 mb-6">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide px-2 mb-2">
                Message Types
              </div>
              {Object.entries(messageTypes).map(([key, type]) => {
                const Icon = type.icon
                const stats = {
                  total: getFilteredTemplates(key).length,
                  starred: templates.filter(t => t.type === key && t.isStarred).length
                }
                return (
                  <button
                    key={key}
                    onClick={() => setActiveType(key)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                      activeType === key 
                        ? `bg-${type.color}-50 text-${type.color}-700 border border-${type.color}-200` 
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <span className="font-medium">{type.label}</span>
                    </div>
                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                      {stats.total}
                    </span>
                  </button>
                )
              })}
            </div>

            <div className="space-y-1">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide px-2 mb-2">
                Categories
              </div>
              <button
                onClick={() => setSelectedCategory("all")}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedCategory === "all" 
                    ? 'bg-gray-100 text-gray-900' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span>All Categories</span>
                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                  {getFilteredTemplates(activeType).length}
                </span>
              </button>
              {Object.entries(categories).map(([key, category]) => {
                const Icon = category.icon
                const count = getFilteredTemplates(activeType).filter(t => t.category === key).length
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedCategory(key)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedCategory === key 
                        ? 'bg-gray-100 text-gray-900' 
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <span>{category.label}</span>
                    </div>
                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto p-8">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm h-full flex flex-col">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {messageTypes[activeType as keyof typeof messageTypes].icon && React.createElement(messageTypes[activeType as keyof typeof messageTypes].icon, {
                    className: "h-6 w-6 text-gray-600"
                  })}
                  <h2 className="text-xl font-semibold text-gray-900">
                    {messageTypes[activeType as keyof typeof messageTypes].label} Templates
                  </h2>
                  <div className="flex gap-6 text-base text-gray-500">
                    <span className="flex items-center gap-1">
                      <BarChart3 className="h-5 w-5" />
                      {getFilteredTemplates(activeType).length} total
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="h-5 w-5" />
                      {getFilteredTemplates(activeType).filter(t => t.isStarred).length} starred
                    </span>
                  </div>
                </div>
                <Button 
                  onClick={() => openAddTemplate(activeType)}
                  className={`bg-${messageTypes[activeType as keyof typeof messageTypes].color}-600 hover:bg-${messageTypes[activeType as keyof typeof messageTypes].color}-700 px-5 py-2 text-base`}
                >
                  <Plus className="h-5 w-5 mr-2" />
                  New Template
                </Button>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto p-8">
                <TemplateList 
                  templates={getFilteredTemplates(activeType)}
                  onEdit={openEditTemplate}
                  onDelete={deleteTemplate}
                  onCopy={copyTemplate}
                  onToggleStar={toggleStar}
                  getPreviewText={getPreviewText}
                  categories={categories}
                  collapsedSections={collapsedSections}
                  onToggleSection={toggleSection}
                  activeType={activeType}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Template Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open)
        if (!open) resetForm()
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogTitle className="flex items-center gap-2">
            {React.createElement(messageTypes[templateForm.type as keyof typeof messageTypes].icon, {
              className: "h-5 w-5 text-gray-600"
            })}
            {editingTemplate ? "Edit Template" : "Create New Template"}
          </DialogTitle>
          
          <div className="space-y-4 mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {!editingTemplate && (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Type</label>
                  <Select value={templateForm.type} onValueChange={(v) => setTemplateForm((f) => ({ ...f, type: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(messageTypes).map(([key, type]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <type.icon className="h-4 w-4" />
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Category</label>
                <Select value={templateForm.category} onValueChange={(v) => setTemplateForm((f) => ({ ...f, category: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(categories).map(([key, category]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <category.icon className="h-4 w-4" />
                          {category.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className={editingTemplate ? "col-span-2" : ""}>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Template Name</label>
                <Input 
                  value={templateForm.name} 
                  onChange={e => setTemplateForm(f => ({ ...f, name: e.target.value }))} 
                  placeholder="Enter template name"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Message Content</label>
              <Textarea
                placeholder="Enter your template message..."
                value={templateForm.text}
                onChange={e => setTemplateForm(f => ({ ...f, text: e.target.value }))}
                rows={6}
                className="resize-none"
              />
            </div>

            {templateForm.text && (
              <div className="bg-gray-50 rounded-lg p-4 border">
                <div className="flex items-center gap-2 mb-3">
                  <Eye className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Preview</span>
                </div>
                <div className="bg-white rounded-md p-3 border">
                  <p className="text-sm whitespace-pre-wrap text-gray-900">{getPreviewText(templateForm.text)}</p>
                </div>
              </div>
            )}

            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h4 className="text-sm font-medium text-blue-900 mb-3">Available Variables</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {[
                  ['{name}', 'Customer name'],
                  ['{product}', 'Product name'],
                  ['{company}', 'Company name'],
                  ['{amount}', 'Cart amount'],
                  ['{order_id}', 'Order ID'],
                  ['{tracking_url}', 'Tracking URL']
                ].map(([variable, description]) => (
                  <div key={variable} className="flex items-center gap-2">
                    <code className="bg-blue-100 text-blue-800 px-2 py-1 rounded font-mono">{variable}</code>
                    <span className="text-blue-700">{description}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6 pt-4 border-t">
            <Button 
              onClick={saveTemplate} 
              disabled={!templateForm.name.trim() || !templateForm.text.trim()}
              className="flex-1"
            >
              {editingTemplate ? "Update Template" : "Create Template"}
            </Button>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Template List Props
interface TemplateListProps {
  templates: DBTemplate[]
  onEdit: (tpl: DBTemplate) => void
  onDelete: (id: number) => void
  onCopy: (text: string) => void
  onToggleStar: (id: number) => void
  getPreviewText: (text: string) => string
  categories: Record<string, { label: string; icon: any }>
  collapsedSections: Record<string, boolean>
  onToggleSection: (section: string) => void
  activeType: string
}


// Template List Component
function TemplateList({ 
  templates, 
  onEdit, 
  onDelete, 
  onCopy, 
  onToggleStar, 
  getPreviewText, 
  categories,
  collapsedSections,
  onToggleSection,
  activeType
}: TemplateListProps) {
  if (templates.length === 0) {
    const messageTypes = {
      whatsapp: { icon: MessageSquare },
      email: { icon: Mail },
      sms: { icon: Smartphone }
    }
    const EmptyIcon = messageTypes[activeType as keyof typeof messageTypes].icon
    return (
      <div className="text-center py-16 text-gray-500">
        <EmptyIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
        <p className="text-lg font-medium text-gray-900 mb-2">No templates found</p>
        <p className="text-sm text-gray-500">Create your first template to get started</p>
      </div>
    )
  }

  const groupedTemplates = templates.reduce((acc, template) => {
    const category = template.category || 'general'
    if (!acc[category]) acc[category] = []
    acc[category].push(template)
    return acc
  }, {} as Record<string, DBTemplate[]>)

  return (
    <div className="space-y-6">
      {Object.entries(groupedTemplates).map(([categoryKey, categoryTemplates]) => {
        const category = categories[categoryKey]
        const isCollapsed = collapsedSections[categoryKey]
        const Icon = category.icon
        
        return (
          <div key={categoryKey} className="space-y-3">
            <button
              onClick={() => onToggleSection(categoryKey)}
              className="flex items-center gap-2 w-full text-left hover:bg-gray-50 p-2 rounded-lg transition-colors"
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              )}
              <Icon className="h-4 w-4 text-gray-600" />
              <span className="font-medium text-gray-900">{category.label}</span>
              <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-600">
                {categoryTemplates.length}
              </span>
            </button>
            
            {!isCollapsed && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 ml-6">
                {categoryTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onCopy={onCopy}
                    onToggleStar={onToggleStar}
                    getPreviewText={getPreviewText}
                  />
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// Template Card Props
interface TemplateCardProps {
  template: DBTemplate
  onEdit: (tpl: DBTemplate) => void
  onDelete: (id: number) => void
  onCopy: (text: string) => void
  onToggleStar: (id: number) => void
  getPreviewText: (text: string) => string
}

// Template Card Component
function TemplateCard({ 
  template, 
  onEdit, 
  onDelete, 
  onCopy, 
  onToggleStar, 
  getPreviewText 
}: TemplateCardProps) {
  const getTypeColor = (type: string) => {
    switch(type) {
      case "whatsapp": return "emerald"
      case "email": return "blue" 
      case "sms": return "purple"
      default: return "gray"
    }
  }

  return (
    <div className="group bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900 text-base truncate">{template.name}</h3>
              <button
                onClick={() => onToggleStar(template.id)}
                className={`shrink-0 p-1 rounded-full transition-colors ${
                  template.isStarred 
                    ? 'text-yellow-500 bg-yellow-50 hover:bg-yellow-100' 
                    : 'text-gray-300 hover:text-yellow-400 hover:bg-yellow-50'
                }`}
              >
                <Star className="h-4 w-4" fill={template.isStarred ? 'currentColor' : 'none'} />
              </button>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Users className="h-3 w-3" />
              <span>{template.usageCount || 0} uses</span>
              {template.lastUsed && (
                <>
                  <span>•</span>
                  <Clock className="h-3 w-3" />
                  <span>Last used today</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Template Content */}
      <div className="px-4 pb-3">
        <div className="bg-gray-50 rounded-lg p-3 mb-3">
          <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">
            {template.text}
          </p>
        </div>
      </div>

      {/* Preview Section */}
      <div className="px-4 pb-4">
        <div className={`bg-${getTypeColor(template.type)}-50 border border-${getTypeColor(template.type)}-100 rounded-lg p-3`}>
          <div className="flex items-center gap-1 mb-2">
            <Eye className="h-3 w-3 text-gray-500" />
            <span className="text-xs font-medium text-gray-600">Preview</span>
          </div>
          <div className="bg-white rounded-md p-3 border shadow-sm">
            <p className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap line-clamp-3">
              {getPreviewText(template.text)}
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
        <div className="flex items-center justify-end gap-1">
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => onCopy(template.text)}
            className="h-8 px-3 text-gray-600 hover:text-gray-900 hover:bg-white"
            title="Copy template"
          >
            <Copy className="h-3 w-3 mr-1" />
            Copy
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => onEdit(template)}
            className="h-8 px-3 text-gray-600 hover:text-gray-900 hover:bg-white"
            title="Edit template"
          >
            <Edit3 className="h-3 w-3 mr-1" />
            Edit
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => onDelete(template.id)} 
            className="h-8 px-3 text-red-600 hover:text-red-700 hover:bg-red-50"
            title="Delete template"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  )
}