"use client"

import { useState } from "react"
import useSWR from "swr"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  TrendingUp,
  TrendingDown,
  Plus,
  Edit2,
  Trash2,
  ArrowUpCircle,
  ArrowDownCircle,
  X,
  Calendar,
  Briefcase,
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { getAuthHeaders } from "@/lib/auth"

const API_URL = process.env.NEXT_PUBLIC_API_URL
const fetcher = (url: string) => fetch(url, { headers: getAuthHeaders() }).then((r) => r.json())

interface FinanceEntry {
  id: number
  type: "income" | "expense"
  amount: number
  label: string
  description?: string
  date: string
  source?: "manual" | "client_payment"
  clientId?: number
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-RW", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)

const blank = (): Partial<FinanceEntry> => ({
  type: "income",
  amount: undefined,
  label: "",
  description: "",
  date: new Date().toISOString().split("T")[0],
})

export default function FinancePage() {
  const { data, mutate, isLoading } = useSWR<{ success: boolean; data: FinanceEntry[] }>(
    `${API_URL}/content/finance`,
    fetcher
  )

  const [filter, setFilter] = useState<"all" | "income" | "expense">("all")
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<FinanceEntry | null>(null)
  const [form, setForm] = useState<Partial<FinanceEntry>>(blank())
  const [saving, setSaving] = useState(false)

  const entries = data?.data || []
  const filtered = filter === "all" ? entries : entries.filter((e) => e.type === filter)

  const totalIncome = entries.filter((e) => e.type === "income").reduce((s, e) => s + e.amount, 0)
  const totalExpenses = entries.filter((e) => e.type === "expense").reduce((s, e) => s + e.amount, 0)
  const net = totalIncome - totalExpenses
  const isProfit = net >= 0

  const openAdd = () => {
    setEditing(null)
    setForm(blank())
    setModalOpen(true)
  }

  const openEdit = (entry: FinanceEntry) => {
    setEditing(entry)
    setForm({ ...entry })
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditing(null)
    setForm(blank())
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.amount || form.amount <= 0) {
      toast.error("Amount must be greater than 0")
      return
    }
    setSaving(true)
    try {
      const method = editing ? "PUT" : "POST"
      const url = editing
        ? `${API_URL}/content/finance/${editing.id}`
        : `${API_URL}/content/finance`
      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (res.ok) {
        toast.success(editing ? "Entry updated" : "Entry added")
        mutate()
        closeModal()
      } else {
        toast.error(json.message || "Failed to save")
      }
    } catch {
      toast.error("Failed to save")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this entry?")) return
    try {
      await fetch(`${API_URL}/content/finance/${id}`, { method: "DELETE", headers: getAuthHeaders() })
      toast.success("Entry deleted")
      mutate()
    } catch {
      toast.error("Failed to delete")
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Finance Tracker</h1>
          <p className="text-muted-foreground mt-1">Track income and expenses to monitor profitability</p>
        </div>
        <Button onClick={openAdd} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Entry
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card
          className={`p-5 col-span-2 lg:col-span-1 border-2 ${
            isProfit ? "border-emerald-500/30 bg-emerald-500/5" : "border-rose-500/30 bg-rose-500/5"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-muted-foreground">Net P&amp;L</span>
            {isProfit ? (
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            ) : (
              <TrendingDown className="w-5 h-5 text-rose-500" />
            )}
          </div>
          <div className={`text-2xl font-bold ${isProfit ? "text-emerald-500" : "text-rose-500"}`}>
            {isProfit ? "+" : "-"}RWF {fmt(Math.abs(net))}
          </div>
          <div className={`text-xs font-semibold mt-1 ${isProfit ? "text-emerald-500" : "text-rose-500"}`}>
            {isProfit ? "▲ In Profit" : "▼ At Loss"}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-muted-foreground">Total Income</span>
            <ArrowUpCircle className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-500">RWF {fmt(totalIncome)}</div>
          <div className="text-xs text-muted-foreground mt-1">
            {entries.filter((e) => e.type === "income").length} entries
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-muted-foreground">Total Expenses</span>
            <ArrowDownCircle className="w-5 h-5 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-rose-500">RWF {fmt(totalExpenses)}</div>
          <div className="text-xs text-muted-foreground mt-1">
            {entries.filter((e) => e.type === "expense").length} entries
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-muted-foreground">Total Entries</span>
            <ArrowUpCircle className="w-5 h-5 text-primary opacity-0" />
          </div>
          <div className="text-2xl font-bold">{entries.length}</div>
          <div className="text-xs text-muted-foreground mt-1">all transactions</div>
        </Card>
      </div>

      {/* Filter Tabs + Table */}
      <Card className="overflow-hidden">
        <div className="flex items-center gap-1 p-4 border-b border-border">
          {(["all", "income", "expense"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                filter === f
                  ? f === "income"
                    ? "bg-emerald-500/15 text-emerald-500"
                    : f === "expense"
                    ? "bg-rose-500/15 text-rose-500"
                    : "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f !== "all" && (
                <span className="ml-1.5 text-xs opacity-70">
                  ({entries.filter((e) => e.type === f).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-muted-foreground">Loading entries...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <ArrowUpCircle className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-30" />
            <p className="text-muted-foreground">No entries yet. Add your first one!</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((entry) => (
              <div key={entry.id} className="flex items-center gap-4 px-5 py-4 hover:bg-muted/30 transition-colors">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    entry.type === "income"
                      ? "bg-emerald-500/10 text-emerald-500"
                      : "bg-rose-500/10 text-rose-500"
                  }`}
                >
                  {entry.type === "income" ? (
                    <ArrowUpCircle className="w-5 h-5" />
                  ) : (
                    <ArrowDownCircle className="w-5 h-5" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium truncate">{entry.label}</span>
                    {entry.source === "client_payment" && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center gap-1 shrink-0">
                        <Briefcase className="w-3 h-3" />
                        Client
                      </span>
                    )}
                  </div>
                  {entry.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{entry.description}</p>
                  )}
                </div>

                <div className="text-sm text-muted-foreground shrink-0 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(entry.date + "T00:00:00").toLocaleDateString("en", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>

                <div
                  className={`text-base font-bold shrink-0 w-36 text-right ${
                    entry.type === "income" ? "text-emerald-500" : "text-rose-500"
                  }`}
                >
                  {entry.type === "income" ? "+" : "-"}RWF {fmt(entry.amount)}
                </div>

                <div className="flex gap-1 shrink-0">
                  {entry.source === "client_payment" ? (
                    <Link href="/admin/clients">
                      <Button variant="ghost" size="sm" className="text-xs gap-1 text-primary">
                        <Briefcase className="w-3.5 h-3.5" />
                        Manage
                      </Button>
                    </Link>
                  ) : (
                    <>
                      <Button variant="ghost" size="sm" onClick={() => openEdit(entry)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(entry.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-lg font-semibold">{editing ? "Edit Entry" : "Add Entry"}</h2>
              <Button variant="ghost" size="icon" onClick={closeModal}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4">
              {/* Type selector */}
              <div className="grid grid-cols-2 gap-2">
                {(["income", "expense"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, type: t }))}
                    className={`py-2.5 rounded-lg text-sm font-semibold border-2 transition-all ${
                      form.type === t
                        ? t === "income"
                          ? "border-emerald-500 bg-emerald-500/10 text-emerald-500"
                          : "border-rose-500 bg-rose-500/10 text-rose-500"
                        : "border-border text-muted-foreground hover:border-muted-foreground"
                    }`}
                  >
                    {t === "income" ? "▲ Income" : "▼ Expense"}
                  </button>
                ))}
              </div>

              {/* Label */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Label *</label>
                <Input
                  placeholder="e.g. Website project payment"
                  value={form.label ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, label: e.target.value }))}
                  required
                />
              </div>

              {/* Amount + Date */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Amount (RWF) *</label>
                  <Input
                    type="number"
                    step="1"
                    min="1"
                    placeholder="0"
                    value={form.amount ?? ""}
                    onChange={(e) => setForm((p) => ({ ...p, amount: parseFloat(e.target.value) }))}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Date *</label>
                  <Input
                    type="date"
                    value={form.date ?? ""}
                    onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                    required
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Notes</label>
                <Textarea
                  placeholder="Optional notes..."
                  rows={2}
                  value={form.description ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                />
              </div>

              <div className="flex gap-3 pt-1">
                <Button type="button" variant="outline" className="flex-1" onClick={closeModal}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className={`flex-1 ${
                    form.type === "expense"
                      ? "bg-rose-500 hover:bg-rose-600"
                      : "bg-emerald-500 hover:bg-emerald-600"
                  } text-white`}
                >
                  {saving ? "Saving..." : editing ? "Update" : "Add Entry"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
