"use client"

import { memo } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ChevronDown, ChevronUp, Mail, MessageSquare, Phone, Plus, User, Edit3, Send, Edit } from "lucide-react"
import { statusColors, priorityColors } from "@/lib/abandoned-cart/constants"
import { formatDate, getStatusIcon, getUrgencyColor } from "@/lib/abandoned-cart/utils"
import type { Cart } from "@/types/abandoned-cart"

interface CartCardProps {
  cart: Cart
  isExpanded: boolean
  onToggleExpansion: (cartId: string) => void
  onUpdateField: (cartId: string, field: string, value: string) => void
  onAddCustomerResponse: (cartId: string) => void
  onAddRemark: () => void
  onOpenWhatsApp: (phone: string, name: string) => void
  editingCart: string | null
  setEditingCart: (cartId: string | null) => void
  editingResponse: { cartId: string; remarkId: number } | null
  setEditingResponse: (response: { cartId: string; remarkId: number } | null) => void
  editResponseText: string
  setEditResponseText: (text: string) => void
  newRemark: { [key: string]: string }
  setNewRemark: (remarks: { [key: string]: string }) => void
  responseType: { [key: string]: string }
  setResponseType: (types: { [key: string]: string }) => void
  remarkForm: { type: string; message: string; cartId: string }
  setRemarkForm: (form: { type: string; message: string; cartId: string }) => void
  saveEditedResponse: () => void
}

const CartCard = memo(function CartCard({
  cart,
  isExpanded,
  onToggleExpansion,
  onUpdateField,
  onAddCustomerResponse,
  onAddRemark,
  onOpenWhatsApp,
  editingCart,
  setEditingCart,
  editingResponse,
  setEditingResponse,
  editResponseText,
  setEditResponseText,
  newRemark,
  setNewRemark,
  responseType,
  setResponseType,
  remarkForm,
  setRemarkForm,
  saveEditedResponse,
}: CartCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{cart.customer.name}</h3>
              <p className="text-sm text-gray-600">{cart.customer.email}</p>
              <div className="flex items-center space-x-3 mt-1">
                <p className="text-xs text-gray-500">Cart ID: {cart.id}</p>
                <span className={`text-xs font-medium ${getUrgencyColor(cart.hoursSinceAbandoned)}`}>
                  {cart.hoursSinceAbandoned}h ago
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {/* Priority Badge */}
            <div className="relative">
              <Badge
                className={`${priorityColors[cart.priority]} cursor-pointer`}
                onClick={() => setEditingCart(editingCart === cart.id ? null : cart.id)}
              >
                {cart.priority}
                <Edit3 className="w-3 h-3 ml-1" />
              </Badge>
              {editingCart === cart.id && (
                <div className="absolute top-8 right-0 bg-white border rounded-lg shadow-lg p-2 z-10">
                  <div className="space-y-1">
                    {["high", "medium", "low"].map((priority) => (
                      <button
                        key={priority}
                        className="block w-full text-left px-2 py-1 hover:bg-gray-100 rounded text-sm"
                        onClick={() => onUpdateField(cart.id, "priority", priority)}
                      >
                        {priority}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Latest Remark Display */}
            {cart.remarks.length > 0 && (
              <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 max-w-[200px]">
                <div className="flex items-center space-x-1 truncate">
                  {cart.remarks[cart.remarks.length - 1].type === "email" && <Mail className="w-3 h-3 flex-shrink-0" />}
                  {cart.remarks[cart.remarks.length - 1].type === "sms" && (
                    <MessageSquare className="w-3 h-3 flex-shrink-0" />
                  )}
                  {cart.remarks[cart.remarks.length - 1].type === "phone" && (
                    <Phone className="w-3 h-3 flex-shrink-0" />
                  )}
                  {cart.remarks[cart.remarks.length - 1].type === "whatsapp" && (
                    <MessageSquare className="w-3 h-3 text-green-600 flex-shrink-0" />
                  )}
                  <span className="text-xs truncate">
                    {cart.remarks[cart.remarks.length - 1].message.length > 30
                      ? `${cart.remarks[cart.remarks.length - 1].message.substring(0, 30)}...`
                      : cart.remarks[cart.remarks.length - 1].message}
                  </span>
                </div>
              </Badge>
            )}

            {/* Status Badge */}
            <div className="relative">
              <Badge
                className={`${statusColors[cart.status]} cursor-pointer`}
                onClick={() => setEditingCart(editingCart === `${cart.id}-status` ? null : `${cart.id}-status`)}
              >
                {(() => {
                  const Icon = getStatusIcon(cart.status);
                  return Icon ? <Icon className="w-4 h-4 inline" /> : null;
                })()}
                <span className="ml-1">
                  {cart.status === "completed" ? "converted" : cart.status === "failed" ? "lost" : cart.status}
                </span>
                <Edit3 className="w-3 h-3 ml-1" />
              </Badge>
              {editingCart === `${cart.id}-status` && (
                <div className="absolute top-8 right-0 bg-white border rounded-lg shadow-lg p-2 z-10">
                  <div className="space-y-1">
                    {[
                      { value: "pending", label: "pending" },
                      { value: "in-progress", label: "in-progress" },
                      { value: "completed", label: "converted" },
                      { value: "failed", label: "lost" },
                    ].map((status) => (
                      <button
                        key={status.value}
                        className="block w-full text-left px-2 py-1 hover:bg-gray-100 rounded text-sm"
                        onClick={() => onUpdateField(cart.id, "status", status.value)}
                      >
                        {status.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="text-right">
              <p className="font-bold text-lg">${cart.cartValue}</p>
              <p className="text-xs text-gray-500">{formatDate(cart.abandonedAt)}</p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-4">
          <div className="flex items-center space-x-6">
            <span className="text-sm">{cart.items.length} items</span>
            <span className="text-sm">{cart.remarks.length} remarks</span>
            <span className="text-sm">Last contacted: {formatDate(cart.lastContacted)}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Dialog
              open={remarkForm.cartId === cart.id}
              onOpenChange={(open) => {
                if (!open) {
                  setRemarkForm({ type: "", message: "", cartId: "" })
                }
              }}
            >
              <DialogTrigger asChild>
                <Button size="sm" onClick={() => setRemarkForm({ ...remarkForm, cartId: cart.id })}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Remark
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add Remark for {cart.customer.name}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Type</Label>
                    <Select
                      value={remarkForm.type}
                      onValueChange={(value) => setRemarkForm({ ...remarkForm, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="sms">SMS</SelectItem>
                        <SelectItem value="phone">Phone Call</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Message</Label>
                    <Textarea
                      placeholder="Enter your message..."
                      value={remarkForm.message}
                      onChange={(e) => setRemarkForm({ ...remarkForm, message: e.target.value })}
                    />
                  </div>
                  <Button
                    className="w-full"
                    onClick={async () => {
                      await onAddRemark()
                      setRemarkForm({ type: "", message: "", cartId: "" })
                    }}
                    disabled={!remarkForm.type || !remarkForm.message}
                  >
                    Add Remark
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button size="sm" variant="outline" onClick={() => onToggleExpansion(cart.id)}>
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {isExpanded && (
          <Tabs defaultValue="remarks" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="remarks">Remarks</TabsTrigger>
              <TabsTrigger value="items">Items</TabsTrigger>
              <TabsTrigger value="customer">Customer</TabsTrigger>
            </TabsList>

            <TabsContent value="remarks" className="mt-4">
              <div className="space-y-4">
                {cart.remarks.map((remark) => (
                  <div key={remark.id} className="border-l-4 border-blue-500 pl-4 py-3 bg-white rounded-r-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {remark.type === "email" && <Mail className="w-4 h-4" />}
                        {remark.type === "sms" && <MessageSquare className="w-4 h-4" />}
                        {remark.type === "phone" && <Phone className="w-4 h-4" />}
                        {remark.type === "whatsapp" && <MessageSquare className="w-4 h-4 text-green-600" />}
                        {remark.type === "response" && <User className="w-4 h-4" />}
                        <span className="font-medium capitalize">{remark.type}</span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {formatDate(remark.date)} - {remark.agent}
                      </span>
                    </div>
                    <p className="text-sm mb-2">{remark.message}</p>
                    {remark.response && (
                      <div className="bg-emerald-50 p-3 rounded border-l-4 border-emerald-500">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium text-emerald-800">Customer Response:</p>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingResponse({ cartId: cart.id, remarkId: remark.id })}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                        </div>
                        {editingResponse?.cartId === cart.id && editingResponse?.remarkId === remark.id ? (
                          <div className="space-y-2">
                            <Textarea
                              value={editResponseText}
                              onChange={(e) => setEditResponseText(e.target.value)}
                              className="text-sm border-emerald-300 focus:border-emerald-500"
                            />
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                onClick={saveEditedResponse}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                              >
                                Save
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setEditingResponse(null)}>
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-emerald-700 font-medium">{remark.response}</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {/* Customer Response Form */}
                <div className="mt-4 p-4 bg-sky-50 rounded-lg border-2 border-sky-200">
                  <Label className="text-sm font-medium text-sky-800 mb-3 block">Add Customer Response</Label>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-gray-600">Response Medium</Label>
                      <Select
                        value={responseType[cart.id] || "email"}
                        onValueChange={(value) => setResponseType({ ...responseType, [cart.id]: value })}
                      >
                        <SelectTrigger className="border-sky-300 focus:border-sky-500">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="sms">SMS</SelectItem>
                          <SelectItem value="phone">Phone Call</SelectItem>
                          <SelectItem value="whatsapp">WhatsApp</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Textarea
                      placeholder="Enter customer response or notes..."
                      value={newRemark[cart.id] || ""}
                      onChange={(e) => setNewRemark({ ...newRemark, [cart.id]: e.target.value })}
                      className="border-sky-300 focus:border-sky-500"
                    />
                    <Button
                      size="sm"
                      className="bg-sky-600 hover:bg-sky-700 text-white"
                      onClick={() => onAddCustomerResponse(cart.id)}
                      disabled={!newRemark[cart.id]?.trim()}
                    >
                      <Send className="w-4 h-4 mr-1" />
                      Add Response
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="items" className="mt-4">
              <div className="space-y-3">
                {cart.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-3 border rounded-lg bg-white">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-semibold">${item.price}</p>
                  </div>
                ))}
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg font-bold border-2 border-blue-200">
                  <span>Total:</span>
                  <span className="text-blue-600">${cart.cartValue}</span>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="customer" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-lg border">
                    <h4 className="font-medium text-gray-800 mb-3">Contact Information</h4>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span>{cart.customer.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-gray-500" />
                        <span>{cart.customer.email}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-gray-500" />
                        <span>{cart.customer.phone}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-800">Quick Actions</h4>
                  <Button size="sm" className="w-full justify-start">
                    <Mail className="w-4 h-4 mr-2" />
                    Send Email
                  </Button>
                  <Button size="sm" variant="outline" className="w-full justify-start">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Send SMS
                  </Button>
                  <Button size="sm" variant="outline" className="w-full justify-start">
                    <Phone className="w-4 h-4 mr-2" />
                    Call Customer
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full justify-start bg-green-50 hover:bg-green-100 border-green-200"
                    onClick={() => onOpenWhatsApp(cart.customer.phone, cart.customer.name)}
                  >
                    <MessageSquare className="w-4 h-4 mr-2 text-green-600" />
                    WhatsApp Customer
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  )
})

export default CartCard
