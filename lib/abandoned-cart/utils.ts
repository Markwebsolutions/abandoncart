import { CheckCircle, Clock, XCircle, AlertTriangle } from "lucide-react"

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export const getStatusIcon = (status: string) => {
  switch (status) {
    case "completed":
      return CheckCircle
    case "in-progress":
      return Clock
    case "failed":
      return XCircle
    default:
      return AlertTriangle
  }
}

export const getUrgencyColor = (hours: number): string => {
  if (hours < 24) return "text-red-600"
  if (hours < 72) return "text-orange-600"
  return "text-gray-600"
}
