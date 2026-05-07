"use client"

import { useState } from "react"
import useSWR from "swr"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Briefcase,
  Plus,
  Edit2,
  Trash2,
  X,
  ChevronDown,
  ChevronUp,
  Calendar,
  Phone,
  Mail,
  Building2,
  ArrowUpCircle,
  CheckCircle2,
  Clock,
  XCircle,
  DollarSign,
  FileText,
} from "lucide-react"
import { toast } from "sonner"
import { getAuthHeaders } from "@/lib/auth"

const API_URL = process.env.NEXT_PUBLIC_API_URL
const fetcher = (url: string) => fetch(url, { headers: getAuthHeaders() }).then((r) => r.json())

// ─── Types ───────────────────────────────────────────────────────────────────

interface ClientSummary {
  id: number
  name: string
  email?: string
  phone?: string
  company?: string
  status: "pending" | "rejected" | "approved"
  rejectionReason?: string
  notes?: string
  dealCount: number
  totalPaid: number
  createdAt: string
}

interface Payment {
  id: number
  dealId: number
  clientId: number
  amount: number
  paidAt: string
  description?: string
  financeEntryId?: number
  createdAt: string
}

interface Deal {
  id: number
  clientId: number
  title: string
  description?: string
  totalAmount: number
  status: "active" | "completed" | "cancelled"
  payments: Payment[]
  createdAt: string
}

interface ClientDetail extends ClientSummary {
  deals: Deal[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat("en-RW", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)

const fmtDate = (d: string) =>
  new Date(d + (d.includes("T") ? "" : "T00:00:00")).toLocaleDateString("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })

const statusColors: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-500 border-amber-500/30",
  approved: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
  rejected: "bg-rose-500/10 text-rose-500 border-rose-500/30",
}

const dealStatusColors: Record<string, string> = {
  active: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  completed: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
  cancelled: "bg-zinc-500/10 text-zinc-400 border-zinc-500/30",
}

const StatusIcon = ({ status }: { status: string }) => {
  if (status === "approved") return <CheckCircle2 className="w-3.5 h-3.5" />
  if (status === "rejected") return <XCircle className="w-3.5 h-3.5" />
  return <Clock className="w-3.5 h-3.5" />
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function ClientsPage() {
  const { data, mutate, isLoading } = useSWR<{ success: boolean; data: ClientSummary[] }>(
    `${API_URL}/content/clients`,
    fetcher
  )

  const clients = data?.data || []

  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all")
  const [detailId, setDetailId] = useState<number | null>(null)

  // Client form modal
  const [clientModal, setClientModal] = useState(false)
  const [editingClient, setEditingClient] = useState<ClientSummary | null>(null)
  const [clientForm, setClientForm] = useState({ name: "", email: "", phone: "", company: "", notes: "" })
  const [savingClient, setSavingClient] = useState(false)

  // Status modal
  const [statusModal, setStatusModal] = useState<ClientSummary | null>(null)
  const [statusForm, setStatusForm] = useState({ status: "pending" as ClientSummary["status"], rejectionReason: "" })
  const [savingStatus, setSavingStatus] = useState(false)

  // Delete confirmation modal
  const [deleteConfirm, setDeleteConfirm] = useState<{ title: string; message: string; onConfirm: () => Promise<void> } | null>(null)

  const filtered = filter === "all" ? clients : clients.filter((c) => c.status === filter)

  const totalRevenue = clients
    .filter((c) => c.status === "approved")
    .reduce((sum, c) => sum + c.totalPaid, 0)

  // ── Client CRUD ──────────────────────────────────────────────────────────

  const openAddClient = () => {
    setEditingClient(null)
    setClientForm({ name: "", email: "", phone: "", company: "", notes: "" })
    setClientModal(true)
  }

  const openEditClient = (c: ClientSummary) => {
    setEditingClient(c)
    setClientForm({ name: c.name, email: c.email || "", phone: c.phone || "", company: c.company || "", notes: c.notes || "" })
    setClientModal(true)
  }

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clientForm.name.trim()) { toast.error("Name is required"); return }
    setSavingClient(true)
    try {
      const method = editingClient ? "PUT" : "POST"
      const url = editingClient
        ? `${API_URL}/content/clients/${editingClient.id}`
        : `${API_URL}/content/clients`
      const res = await fetch(url, { method, headers: getAuthHeaders(), body: JSON.stringify(clientForm) })
      const json = await res.json()
      if (res.ok) {
        toast.success(editingClient ? "Client updated" : "Client added")
        mutate()
        setClientModal(false)
      } else {
        toast.error(json.message || "Failed to save")
      }
    } catch {
      toast.error("Failed to save")
    } finally {
      setSavingClient(false)
    }
  }

  const handleDeleteClient = (id: number, name: string) => {
    setDeleteConfirm({
      title: "Delete Client",
      message: `Delete "${name}"? This will also remove all their deals, payments, and linked finance entries. This cannot be undone.`,
      onConfirm: async () => {
        const res = await fetch(`${API_URL}/content/clients/${id}`, { method: "DELETE", headers: getAuthHeaders() })
        const json = await res.json()
        if (res.ok) {
          toast.success("Client deleted")
          mutate()
          if (detailId === id) setDetailId(null)
        } else {
          toast.error(json.message || "Failed to delete")
        }
      },
    })
  }

  // ── Status update ────────────────────────────────────────────────────────

  const openStatusModal = (c: ClientSummary) => {
    setStatusModal(c)
    setStatusForm({ status: c.status, rejectionReason: c.rejectionReason || "" })
  }

  const handleSaveStatus = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!statusModal) return
    if (statusForm.status === "rejected" && !statusForm.rejectionReason.trim()) {
      toast.error("Rejection reason is required")
      return
    }
    setSavingStatus(true)
    try {
      const res = await fetch(`${API_URL}/content/clients/${statusModal.id}/status`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify(statusForm),
      })
      const json = await res.json()
      if (res.ok) {
        toast.success("Status updated")
        mutate()
        setStatusModal(null)
      } else {
        toast.error(json.message || "Failed to update status")
      }
    } catch {
      toast.error("Failed to update status")
    } finally {
      setSavingStatus(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clients</h1>
          <p className="text-muted-foreground mt-1">Track prospects, deals, and payments</p>
        </div>
        <Button onClick={openAddClient} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Client
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Total Clients", value: clients.length, color: "text-foreground", icon: <Briefcase className="w-5 h-5 text-primary" /> },
          { label: "Pending", value: clients.filter((c) => c.status === "pending").length, color: "text-amber-500", icon: <Clock className="w-5 h-5 text-amber-500" /> },
          { label: "Approved", value: clients.filter((c) => c.status === "approved").length, color: "text-emerald-500", icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" /> },
          { label: "Rejected", value: clients.filter((c) => c.status === "rejected").length, color: "text-rose-500", icon: <XCircle className="w-5 h-5 text-rose-500" /> },
          { label: "Total Revenue", value: `RWF ${fmt(totalRevenue)}`, color: "text-emerald-500", icon: <DollarSign className="w-5 h-5 text-emerald-500" /> },
        ].map((card) => (
          <Card key={card.label} className="p-4">
            <div className="flex items-center justify-between mb-2">{card.icon}<span className="text-xs text-muted-foreground">{card.label}</span></div>
            <div className={`text-xl font-bold ${card.color}`}>{card.value}</div>
          </Card>
        ))}
      </div>

      {/* Filter tabs */}
      <Card className="overflow-hidden">
        <div className="flex items-center gap-1 p-4 border-b border-border">
          {(["all", "pending", "approved", "rejected"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all capitalize ${
                filter === f
                  ? f === "approved" ? "bg-emerald-500/15 text-emerald-500"
                    : f === "rejected" ? "bg-rose-500/15 text-rose-500"
                    : f === "pending" ? "bg-amber-500/15 text-amber-500"
                    : "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
              {f !== "all" && (
                <span className="ml-1.5 text-xs opacity-70">
                  ({clients.filter((c) => c.status === f).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-muted-foreground">Loading clients...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Briefcase className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-30" />
            <p className="text-muted-foreground">No clients yet. Add your first prospect!</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((client) => (
              <div key={client.id}>
                <div className="flex items-center gap-4 px-5 py-4 hover:bg-muted/30 transition-colors">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                    {client.name.charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold truncate">{client.name}</span>
                      {client.company && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Building2 className="w-3 h-3" />{client.company}
                        </span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium flex items-center gap-1 ${statusColors[client.status]}`}>
                        <StatusIcon status={client.status} />
                        {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 flex-wrap">
                      {client.email && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Mail className="w-3 h-3" />{client.email}
                        </span>
                      )}
                      {client.phone && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Phone className="w-3 h-3" />{client.phone}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {client.dealCount} deal{client.dealCount !== 1 ? "s" : ""}
                        {client.totalPaid > 0 && ` · RWF ${fmt(client.totalPaid)} paid`}
                      </span>
                    </div>
                    {client.status === "rejected" && client.rejectionReason && (
                      <p className="text-xs text-rose-400 mt-1 truncate">
                        Reason: {client.rejectionReason}
                      </p>
                    )}
                  </div>

                  {/* Date */}
                  <div className="text-xs text-muted-foreground shrink-0 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {fmtDate(client.createdAt)}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs gap-1"
                      onClick={() => setDetailId(detailId === client.id ? null : client.id)}
                    >
                      {detailId === client.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openStatusModal(client)}>
                      <CheckCircle2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openEditClient(client)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDeleteClient(client.id, client.name)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Expanded detail panel */}
                {detailId === client.id && (
                  <ClientDetailPanel
                    clientId={client.id}
                    clientStatus={client.status}
                    onUpdated={mutate}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Add / Edit Client Modal */}
      {clientModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-lg font-semibold">{editingClient ? "Edit Client" : "Add Client"}</h2>
              <Button variant="ghost" size="icon" onClick={() => setClientModal(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <form onSubmit={handleSaveClient} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Full Name *</label>
                <Input
                  placeholder="e.g. John Doe"
                  value={clientForm.name}
                  onChange={(e) => setClientForm((p) => ({ ...p, name: e.target.value }))}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Company / Individual</label>
                  <Input
                    placeholder="Acme Corp or John Doe"
                    value={clientForm.company}
                    onChange={(e) => setClientForm((p) => ({ ...p, company: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Phone</label>
                  <Input
                    placeholder="+250 7xx xxx xxx"
                    value={clientForm.phone}
                    onChange={(e) => setClientForm((p) => ({ ...p, phone: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  placeholder="client@example.com"
                  value={clientForm.email}
                  onChange={(e) => setClientForm((p) => ({ ...p, email: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Notes</label>
                <Textarea
                  placeholder="Any relevant notes about this prospect..."
                  rows={2}
                  value={clientForm.notes}
                  onChange={(e) => setClientForm((p) => ({ ...p, notes: e.target.value }))}
                />
              </div>
              <div className="flex gap-3 pt-1">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setClientModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={savingClient} className="flex-1">
                  {savingClient ? "Saving..." : editingClient ? "Update" : "Add Client"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <DeleteModal
          title={deleteConfirm.title}
          message={deleteConfirm.message}
          onConfirm={deleteConfirm.onConfirm}
          onClose={() => setDeleteConfirm(null)}
        />
      )}

      {/* Status Update Modal */}
      {statusModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-lg font-semibold">Update Status — {statusModal.name}</h2>
              <Button variant="ghost" size="icon" onClick={() => setStatusModal(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <form onSubmit={handleSaveStatus} className="p-5 space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {(["pending", "approved", "rejected"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatusForm((p) => ({ ...p, status: s }))}
                    className={`py-2.5 rounded-lg text-sm font-semibold border-2 transition-all capitalize ${
                      statusForm.status === s
                        ? s === "approved" ? "border-emerald-500 bg-emerald-500/10 text-emerald-500"
                          : s === "rejected" ? "border-rose-500 bg-rose-500/10 text-rose-500"
                          : "border-amber-500 bg-amber-500/10 text-amber-500"
                        : "border-border text-muted-foreground hover:border-muted-foreground"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              {statusForm.status === "rejected" && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Reason for Rejection *</label>
                  <Textarea
                    placeholder="Why was this client rejected? (e.g. budget mismatch, no response after 3 follow-ups)"
                    rows={3}
                    value={statusForm.rejectionReason}
                    onChange={(e) => setStatusForm((p) => ({ ...p, rejectionReason: e.target.value }))}
                    required
                  />
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setStatusModal(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={savingStatus} className="flex-1">
                  {savingStatus ? "Saving..." : "Update Status"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Delete Confirmation Modal ────────────────────────────────────────────────

function DeleteModal({
  title,
  message,
  onConfirm,
  onClose,
}: {
  title: string
  message: string
  onConfirm: () => Promise<void>
  onClose: () => void
}) {
  const [deleting, setDeleting] = useState(false)

  const handle = async () => {
    setDeleting(true)
    try {
      await onConfirm()
    } finally {
      setDeleting(false)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-60">
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center gap-3 p-5 border-b border-border">
          <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
            <Trash2 className="w-5 h-5 text-destructive" />
          </div>
          <h2 className="text-lg font-semibold">{title}</h2>
        </div>
        <div className="p-5 space-y-5">
          <p className="text-sm text-muted-foreground leading-relaxed">{message}</p>
          <div className="flex gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={deleting}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={deleting}
              className="flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              onClick={handle}
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Client Detail Panel ──────────────────────────────────────────────────────

function ClientDetailPanel({
  clientId,
  clientStatus,
  onUpdated,
}: {
  clientId: number
  clientStatus: "pending" | "rejected" | "approved"
  onUpdated: () => void
}) {
  const { data, mutate, isLoading } = useSWR<{ success: boolean; data: ClientDetail }>(
    `${API_URL}/content/clients/${clientId}`,
    fetcher
  )

  const client = data?.data

  // Deal modal
  const [dealModal, setDealModal] = useState(false)
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null)
  const [dealForm, setDealForm] = useState({ title: "", description: "", totalAmount: "", status: "active" as Deal["status"] })
  const [savingDeal, setSavingDeal] = useState(false)

  // Payment modal
  const [paymentModal, setPaymentModal] = useState<number | null>(null) // dealId
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null)
  const [paymentForm, setPaymentForm] = useState({ amount: "", paidAt: new Date().toISOString().split("T")[0], description: "" })
  const [savingPayment, setSavingPayment] = useState(false)

  // Delete confirmation modal
  const [deleteConfirm, setDeleteConfirm] = useState<{ title: string; message: string; onConfirm: () => Promise<void> } | null>(null)

  const refreshAll = () => { mutate(); onUpdated() }

  // ── Deals ─────────────────────────────────────────────────────────────────

  const openAddDeal = () => {
    setEditingDeal(null)
    setDealForm({ title: "", description: "", totalAmount: "", status: "active" })
    setDealModal(true)
  }

  const openEditDeal = (deal: Deal) => {
    setEditingDeal(deal)
    setDealForm({ title: deal.title, description: deal.description || "", totalAmount: deal.totalAmount.toString(), status: deal.status })
    setDealModal(true)
  }

  const handleSaveDeal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!dealForm.title.trim() || !dealForm.totalAmount) { toast.error("Title and amount are required"); return }
    setSavingDeal(true)
    try {
      const method = editingDeal ? "PUT" : "POST"
      const url = editingDeal
        ? `${API_URL}/content/deals/${editingDeal.id}`
        : `${API_URL}/content/clients/${clientId}/deals`
      const res = await fetch(url, { method, headers: getAuthHeaders(), body: JSON.stringify(dealForm) })
      const json = await res.json()
      if (res.ok) {
        toast.success(editingDeal ? "Deal updated" : "Deal added")
        refreshAll()
        setDealModal(false)
      } else {
        toast.error(json.message || "Failed to save deal")
      }
    } catch {
      toast.error("Failed to save deal")
    } finally {
      setSavingDeal(false)
    }
  }

  const handleDeleteDeal = (id: number, title: string) => {
    setDeleteConfirm({
      title: "Delete Deal",
      message: `Delete deal "${title}"? All payments for this deal and their linked finance entries will also be removed. This cannot be undone.`,
      onConfirm: async () => {
        const res = await fetch(`${API_URL}/content/deals/${id}`, { method: "DELETE", headers: getAuthHeaders() })
        const json = await res.json()
        if (res.ok) {
          toast.success("Deal deleted")
          refreshAll()
        } else {
          toast.error(json.message || "Failed to delete deal")
        }
      },
    })
  }

  // ── Payments ──────────────────────────────────────────────────────────────

  const openAddPayment = (dealId: number) => {
    setEditingPayment(null)
    setPaymentForm({ amount: "", paidAt: new Date().toISOString().split("T")[0], description: "" })
    setPaymentModal(dealId)
  }

  const openEditPayment = (payment: Payment) => {
    setEditingPayment(payment)
    setPaymentForm({ amount: payment.amount.toString(), paidAt: payment.paidAt, description: payment.description || "" })
    setPaymentModal(payment.dealId)
  }

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!paymentForm.amount || Number(paymentForm.amount) <= 0) { toast.error("Amount must be greater than 0"); return }
    if (!paymentForm.paidAt) { toast.error("Date is required"); return }
    setSavingPayment(true)
    try {
      const method = editingPayment ? "PUT" : "POST"
      const url = editingPayment
        ? `${API_URL}/content/payments/${editingPayment.id}`
        : `${API_URL}/content/deals/${paymentModal}/payments`
      const res = await fetch(url, { method, headers: getAuthHeaders(), body: JSON.stringify(paymentForm) })
      const json = await res.json()
      if (res.ok) {
        toast.success(editingPayment ? "Payment updated" : "Payment recorded")
        refreshAll()
        setPaymentModal(null)
        setEditingPayment(null)
      } else {
        toast.error(json.message || "Failed to save payment")
      }
    } catch {
      toast.error("Failed to save payment")
    } finally {
      setSavingPayment(false)
    }
  }

  const handleDeletePayment = (id: number, amount: number) => {
    setDeleteConfirm({
      title: "Delete Payment",
      message: `Delete this payment of RWF ${fmt(amount)}? The linked finance entry will also be removed. This cannot be undone.`,
      onConfirm: async () => {
        const res = await fetch(`${API_URL}/content/payments/${id}`, { method: "DELETE", headers: getAuthHeaders() })
        const json = await res.json()
        if (res.ok) {
          toast.success("Payment deleted")
          refreshAll()
        } else {
          toast.error(json.message || "Failed to delete payment")
        }
      },
    })
  }

  if (isLoading) {
    return <div className="px-5 py-6 text-sm text-muted-foreground bg-muted/20">Loading details...</div>
  }

  if (!client) return null

  const totalPaid = client.deals.reduce(
    (sum, d) => sum + d.payments.reduce((s, p) => s + p.amount, 0),
    0
  )

  return (
    <div className="bg-muted/10 border-t border-border px-5 py-5 space-y-5">
      {/* Client meta */}
      {(client.email || client.phone || client.company || client.notes || client.rejectionReason) && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          {client.email && (
            <div>
              <span className="text-muted-foreground text-xs">Email</span>
              <p className="font-medium truncate">{client.email}</p>
            </div>
          )}
          {client.phone && (
            <div>
              <span className="text-muted-foreground text-xs">Phone</span>
              <p className="font-medium">{client.phone}</p>
            </div>
          )}
          {client.company && (
            <div>
              <span className="text-muted-foreground text-xs">Company</span>
              <p className="font-medium">{client.company}</p>
            </div>
          )}
          {client.status === "rejected" && client.rejectionReason && (
            <div className="col-span-2 md:col-span-4">
              <span className="text-rose-400 text-xs font-medium">Rejection reason</span>
              <p className="text-rose-300/80 text-sm mt-0.5">{client.rejectionReason}</p>
            </div>
          )}
          {client.notes && (
            <div className="col-span-2 md:col-span-4">
              <span className="text-muted-foreground text-xs">Notes</span>
              <p className="text-sm mt-0.5">{client.notes}</p>
            </div>
          )}
        </div>
      )}

      {/* Deals section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <span className="font-semibold text-sm">Deals</span>
            {totalPaid > 0 && (
              <span className="text-xs text-emerald-500 font-medium">· RWF {fmt(totalPaid)} received total</span>
            )}
          </div>
          {clientStatus === "approved" && (
            <Button size="sm" variant="outline" className="gap-1 h-7 text-xs" onClick={openAddDeal}>
              <Plus className="w-3.5 h-3.5" />
              New Deal
            </Button>
          )}
        </div>

        {clientStatus !== "approved" && client.deals.length === 0 && (
          <p className="text-xs text-muted-foreground py-2">
            {clientStatus === "pending"
              ? "Approve this client first to start adding deals."
              : "No deals were recorded for this client."}
          </p>
        )}

        {client.deals.length === 0 && clientStatus === "approved" && (
          <p className="text-xs text-muted-foreground py-2">No deals yet. Click &quot;New Deal&quot; to add one.</p>
        )}

        <div className="space-y-3">
          {client.deals.map((deal) => {
            const dealPaid = deal.payments.reduce((s, p) => s + p.amount, 0)
            const remaining = deal.totalAmount - dealPaid
            const pct = deal.totalAmount > 0 ? Math.min(100, Math.round((dealPaid / deal.totalAmount) * 100)) : 0

            return (
              <div key={deal.id} className="border border-border rounded-lg overflow-hidden">
                {/* Deal header */}
                <div className="flex items-start gap-3 p-3 bg-card">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{deal.title}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${dealStatusColors[deal.status]}`}>
                        {deal.status}
                      </span>
                    </div>
                    {deal.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">{deal.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                      <span>Total: <strong className="text-foreground">RWF {fmt(deal.totalAmount)}</strong></span>
                      <span>Paid: <strong className="text-emerald-500">RWF {fmt(dealPaid)}</strong></span>
                      {remaining > 0 && (
                        <span>Remaining: <strong className="text-amber-500">RWF {fmt(remaining)}</strong></span>
                      )}
                      {remaining <= 0 && deal.totalAmount > 0 && (
                        <span className="text-emerald-500 font-semibold">Fully paid ✓</span>
                      )}
                    </div>
                    {deal.totalAmount > 0 && (
                      <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden w-48">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => openAddPayment(deal.id)}>
                      <Plus className="w-3.5 h-3.5" />
                      Payment
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEditDeal(deal)}>
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                      onClick={() => handleDeleteDeal(deal.id, deal.title)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Payments */}
                {deal.payments.length > 0 && (
                  <div className="divide-y divide-border border-t border-border">
                    {deal.payments.map((payment) => (
                      <div key={payment.id} className="flex items-center gap-3 px-3 py-2.5 bg-muted/20 hover:bg-muted/40 transition-colors">
                        <ArrowUpCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-emerald-500">+RWF {fmt(payment.amount)}</span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="w-3 h-3" />{fmtDate(payment.paidAt)}
                            </span>
                          </div>
                          {payment.description && (
                            <p className="text-xs text-muted-foreground truncate">{payment.description}</p>
                          )}
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => openEditPayment(payment)}>
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                            onClick={() => handleDeletePayment(payment.id, payment.amount)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {deal.payments.length === 0 && (
                  <div className="px-3 py-2 bg-muted/10 border-t border-border text-xs text-muted-foreground">
                    No payments recorded yet.
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Deal Modal */}
      {dealModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-lg font-semibold">{editingDeal ? "Edit Deal" : "New Deal"}</h2>
              <Button variant="ghost" size="icon" onClick={() => setDealModal(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <form onSubmit={handleSaveDeal} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Deal Title *</label>
                <Input
                  placeholder="e.g. Website Redesign Project"
                  value={dealForm.title}
                  onChange={(e) => setDealForm((p) => ({ ...p, title: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  placeholder="What does this deal involve? Scope, deliverables..."
                  rows={2}
                  value={dealForm.description}
                  onChange={(e) => setDealForm((p) => ({ ...p, description: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Total Amount (RWF) *</label>
                  <Input
                    type="number"
                    step="1"
                    min="0"
                    placeholder="0"
                    value={dealForm.totalAmount}
                    onChange={(e) => setDealForm((p) => ({ ...p, totalAmount: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Status</label>
                  <select
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={dealForm.status}
                    onChange={(e) => setDealForm((p) => ({ ...p, status: e.target.value as Deal["status"] }))}
                  >
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setDealModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={savingDeal} className="flex-1">
                  {savingDeal ? "Saving..." : editingDeal ? "Update Deal" : "Add Deal"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <DeleteModal
          title={deleteConfirm.title}
          message={deleteConfirm.message}
          onConfirm={deleteConfirm.onConfirm}
          onClose={() => setDeleteConfirm(null)}
        />
      )}

      {/* Payment Modal */}
      {paymentModal !== null && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-60">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-lg font-semibold">{editingPayment ? "Edit Payment" : "Record Payment"}</h2>
              <Button variant="ghost" size="icon" onClick={() => { setPaymentModal(null); setEditingPayment(null) }}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <form onSubmit={handleSavePayment} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Amount (RWF) *</label>
                  <Input
                    type="number"
                    step="1"
                    min="1"
                    placeholder="0"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm((p) => ({ ...p, amount: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Date *</label>
                  <Input
                    type="date"
                    value={paymentForm.paidAt}
                    onChange={(e) => setPaymentForm((p) => ({ ...p, paidAt: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Description / Reason</label>
                <Textarea
                  placeholder="e.g. First installment, 50% upfront..."
                  rows={2}
                  value={paymentForm.description}
                  onChange={(e) => setPaymentForm((p) => ({ ...p, description: e.target.value }))}
                />
              </div>
              <p className="text-xs text-muted-foreground bg-emerald-500/5 border border-emerald-500/20 rounded-lg px-3 py-2">
                This payment will automatically appear in the Finance tab as income.
              </p>
              <div className="flex gap-3 pt-1">
                <Button type="button" variant="outline" className="flex-1" onClick={() => { setPaymentModal(null); setEditingPayment(null) }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={savingPayment} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white">
                  {savingPayment ? "Saving..." : editingPayment ? "Update" : "Record Payment"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
