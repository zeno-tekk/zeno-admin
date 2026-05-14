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
  PiggyBank,
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

interface Saving {
  id: number
  amount: number
  label: string
  source?: string
  description?: string
  date: string
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-RW", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)

const blankFinance = (): Partial<FinanceEntry> => ({
  type: "income",
  amount: undefined,
  label: "",
  description: "",
  date: new Date().toISOString().split("T")[0],
})

const blankSaving = (): Partial<Saving> => ({
  amount: undefined,
  label: "",
  source: "",
  description: "",
  date: new Date().toISOString().split("T")[0],
})

type Tab = "finance" | "savings"
type FinanceFilter = "all" | "income" | "expense"

export default function FinancePage() {
  const [tab, setTab] = useState<Tab>("finance")

  // Finance state
  const { data, mutate, isLoading } = useSWR<{ success: boolean; data: FinanceEntry[] }>(
    `${API_URL}/content/finance`,
    fetcher
  )
  const [filter, setFilter] = useState<FinanceFilter>("all")
  const [financeModal, setFinanceModal] = useState(false)
  const [editingFinance, setEditingFinance] = useState<FinanceEntry | null>(null)
  const [financeForm, setFinanceForm] = useState<Partial<FinanceEntry>>(blankFinance())
  const [financeSaving, setFinanceSaving] = useState(false)

  // Savings state
  const { data: savingsData, mutate: mutateSavings, isLoading: savingsLoading } = useSWR<{ success: boolean; data: Saving[] }>(
    `${API_URL}/content/savings`,
    fetcher
  )
  const [savingsModal, setSavingsModal] = useState(false)
  const [editingSaving, setEditingSaving] = useState<Saving | null>(null)
  const [savingForm, setSavingForm] = useState<Partial<Saving>>(blankSaving())
  const [savingSubmitting, setSavingSubmitting] = useState(false)

  // Finance derived
  const entries = data?.data || []
  const filtered = filter === "all" ? entries : entries.filter((e) => e.type === filter)
  const totalIncome = entries.filter((e) => e.type === "income").reduce((s, e) => s + e.amount, 0)
  const totalExpenses = entries.filter((e) => e.type === "expense").reduce((s, e) => s + e.amount, 0)
  const net = totalIncome - totalExpenses
  const isProfit = net >= 0

  // Savings derived
  const savings = savingsData?.data || []
  const totalSavings = savings.reduce((s, e) => s + e.amount, 0)

  // Finance handlers
  const openAddFinance = () => { setEditingFinance(null); setFinanceForm(blankFinance()); setFinanceModal(true) }
  const openEditFinance = (e: FinanceEntry) => { setEditingFinance(e); setFinanceForm({ ...e }); setFinanceModal(true) }
  const closeFinanceModal = () => { setFinanceModal(false); setEditingFinance(null); setFinanceForm(blankFinance()) }

  const handleFinanceSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!financeForm.amount || financeForm.amount <= 0) { toast.error("Amount must be greater than 0"); return }
    setFinanceSaving(true)
    try {
      const method = editingFinance ? "PUT" : "POST"
      const url = editingFinance ? `${API_URL}/content/finance/${editingFinance.id}` : `${API_URL}/content/finance`
      const res = await fetch(url, { method, headers: getAuthHeaders(), body: JSON.stringify(financeForm) })
      const json = await res.json()
      if (res.ok) { toast.success(editingFinance ? "Entry updated" : "Entry added"); mutate(); closeFinanceModal() }
      else toast.error(json.message || "Failed to save")
    } catch { toast.error("Failed to save") }
    finally { setFinanceSaving(false) }
  }

  const handleFinanceDelete = async (id: number) => {
    if (!confirm("Delete this entry?")) return
    try {
      await fetch(`${API_URL}/content/finance/${id}`, { method: "DELETE", headers: getAuthHeaders() })
      toast.success("Entry deleted"); mutate()
    } catch { toast.error("Failed to delete") }
  }

  // Savings handlers
  const openAddSaving = () => { setEditingSaving(null); setSavingForm(blankSaving()); setSavingsModal(true) }
  const openEditSaving = (s: Saving) => { setEditingSaving(s); setSavingForm({ ...s }); setSavingsModal(true) }
  const closeSavingsModal = () => { setSavingsModal(false); setEditingSaving(null); setSavingForm(blankSaving()) }

  const handleSavingSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!savingForm.amount || savingForm.amount <= 0) { toast.error("Amount must be greater than 0"); return }
    setSavingSubmitting(true)
    try {
      const method = editingSaving ? "PUT" : "POST"
      const url = editingSaving ? `${API_URL}/content/savings/${editingSaving.id}` : `${API_URL}/content/savings`
      const res = await fetch(url, { method, headers: getAuthHeaders(), body: JSON.stringify(savingForm) })
      const json = await res.json()
      if (res.ok) { toast.success(editingSaving ? "Saving updated" : "Saving added"); mutateSavings(); closeSavingsModal() }
      else toast.error(json.message || "Failed to save")
    } catch { toast.error("Failed to save") }
    finally { setSavingSubmitting(false) }
  }

  const handleSavingDelete = async (id: number) => {
    if (!confirm("Delete this saving?")) return
    try {
      await fetch(`${API_URL}/content/savings/${id}`, { method: "DELETE", headers: getAuthHeaders() })
      toast.success("Saving deleted"); mutateSavings()
    } catch { toast.error("Failed to delete") }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Finance</h1>
          <p className="text-muted-foreground mt-1">Track income, expenses and savings</p>
        </div>
        {tab === "finance" ? (
          <Button onClick={openAddFinance} className="gap-2">
            <Plus className="w-4 h-4" /> Add Entry
          </Button>
        ) : (
          <Button onClick={openAddSaving} className="gap-2">
            <Plus className="w-4 h-4" /> Add Saving
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        <button
          onClick={() => setTab("finance")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === "finance" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <span className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Finance
          </span>
        </button>
        <button
          onClick={() => setTab("savings")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === "savings" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <span className="flex items-center gap-2">
            <PiggyBank className="w-4 h-4" />
            Savings
          </span>
        </button>
      </div>

      {/* Finance Tab */}
      {tab === "finance" && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className={`p-5 col-span-2 lg:col-span-1 border-2 ${isProfit ? "border-emerald-500/30 bg-emerald-500/5" : "border-rose-500/30 bg-rose-500/5"}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-muted-foreground">Net P&amp;L</span>
                {isProfit ? <TrendingUp className="w-5 h-5 text-emerald-500" /> : <TrendingDown className="w-5 h-5 text-rose-500" />}
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
              <div className="text-xs text-muted-foreground mt-1">{entries.filter((e) => e.type === "income").length} entries</div>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-muted-foreground">Total Expenses</span>
                <ArrowDownCircle className="w-5 h-5 text-rose-500" />
              </div>
              <div className="text-2xl font-bold text-rose-500">RWF {fmt(totalExpenses)}</div>
              <div className="text-xs text-muted-foreground mt-1">{entries.filter((e) => e.type === "expense").length} entries</div>
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
                      ? f === "income" ? "bg-emerald-500/15 text-emerald-500"
                        : f === "expense" ? "bg-rose-500/15 text-rose-500"
                        : "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                  {f !== "all" && <span className="ml-1.5 text-xs opacity-70">({entries.filter((e) => e.type === f).length})</span>}
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
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${entry.type === "income" ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"}`}>
                      {entry.type === "income" ? <ArrowUpCircle className="w-5 h-5" /> : <ArrowDownCircle className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium truncate">{entry.label}</span>
                        {entry.source === "client_payment" && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center gap-1 shrink-0">
                            <Briefcase className="w-3 h-3" /> Client
                          </span>
                        )}
                      </div>
                      {entry.description && <p className="text-xs text-muted-foreground mt-0.5 truncate">{entry.description}</p>}
                    </div>
                    <div className="text-sm text-muted-foreground shrink-0 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(entry.date + "T00:00:00").toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}
                    </div>
                    <div className={`text-base font-bold shrink-0 w-36 text-right ${entry.type === "income" ? "text-emerald-500" : "text-rose-500"}`}>
                      {entry.type === "income" ? "+" : "-"}RWF {fmt(entry.amount)}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {entry.source === "client_payment" ? (
                        <Link href="/admin/clients">
                          <Button variant="ghost" size="sm" className="text-xs gap-1 text-primary">
                            <Briefcase className="w-3.5 h-3.5" /> Manage
                          </Button>
                        </Link>
                      ) : (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => openEditFinance(entry)}><Edit2 className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleFinanceDelete(entry.id)}><Trash2 className="w-4 h-4" /></Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}

      {/* Savings Tab */}
      {tab === "savings" && (
        <>
          {/* Summary Card */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-5 border-2 border-blue-500/30 bg-blue-500/5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-muted-foreground">Total Savings</span>
                <PiggyBank className="w-5 h-5 text-blue-500" />
              </div>
              <div className="text-2xl font-bold text-blue-500">RWF {fmt(totalSavings)}</div>
              <div className="text-xs text-muted-foreground mt-1">{savings.length} records</div>
            </Card>
          </div>

          <Card className="overflow-hidden">
            {savingsLoading ? (
              <div className="p-12 text-center text-muted-foreground">Loading savings...</div>
            ) : savings.length === 0 ? (
              <div className="p-12 text-center">
                <PiggyBank className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-30" />
                <p className="text-muted-foreground">No savings recorded yet. Add your first one!</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {savings.map((s) => (
                  <div key={s.id} className="flex items-center gap-4 px-5 py-4 hover:bg-muted/30 transition-colors">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-blue-500/10 text-blue-500">
                      <PiggyBank className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-medium truncate block">{s.label}</span>
                      <div className="flex items-center gap-3 mt-0.5">
                        {s.source && <span className="text-xs text-muted-foreground">From: {s.source}</span>}
                        {s.description && <span className="text-xs text-muted-foreground truncate">{s.description}</span>}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground shrink-0 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(s.date + "T00:00:00").toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}
                    </div>
                    <div className="text-base font-bold shrink-0 w-36 text-right text-blue-500">
                      RWF {fmt(s.amount)}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="sm" onClick={() => openEditSaving(s)}><Edit2 className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleSavingDelete(s.id)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}

      {/* Finance Modal */}
      {financeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-lg font-semibold">{editingFinance ? "Edit Entry" : "Add Entry"}</h2>
              <Button variant="ghost" size="icon" onClick={closeFinanceModal}><X className="w-4 h-4" /></Button>
            </div>
            <form onSubmit={handleFinanceSave} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {(["income", "expense"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setFinanceForm((p) => ({ ...p, type: t }))}
                    className={`py-2.5 rounded-lg text-sm font-semibold border-2 transition-all ${
                      financeForm.type === t
                        ? t === "income" ? "border-emerald-500 bg-emerald-500/10 text-emerald-500" : "border-rose-500 bg-rose-500/10 text-rose-500"
                        : "border-border text-muted-foreground hover:border-muted-foreground"
                    }`}
                  >
                    {t === "income" ? "▲ Income" : "▼ Expense"}
                  </button>
                ))}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Label *</label>
                <Input placeholder="e.g. Website project payment" value={financeForm.label ?? ""} onChange={(e) => setFinanceForm((p) => ({ ...p, label: e.target.value }))} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Amount (RWF) *</label>
                  <Input type="number" step="1" min="1" placeholder="0" value={financeForm.amount ?? ""} onChange={(e) => setFinanceForm((p) => ({ ...p, amount: parseFloat(e.target.value) }))} required />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Date *</label>
                  <Input type="date" value={financeForm.date ?? ""} onChange={(e) => setFinanceForm((p) => ({ ...p, date: e.target.value }))} required />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Notes</label>
                <Textarea placeholder="Optional notes..." rows={2} value={financeForm.description ?? ""} onChange={(e) => setFinanceForm((p) => ({ ...p, description: e.target.value }))} />
              </div>
              <div className="flex gap-3 pt-1">
                <Button type="button" variant="outline" className="flex-1" onClick={closeFinanceModal}>Cancel</Button>
                <Button type="submit" disabled={financeSaving} className={`flex-1 ${financeForm.type === "expense" ? "bg-rose-500 hover:bg-rose-600" : "bg-emerald-500 hover:bg-emerald-600"} text-white`}>
                  {financeSaving ? "Saving..." : editingFinance ? "Update" : "Add Entry"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Savings Modal */}
      {savingsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-lg font-semibold">{editingSaving ? "Edit Saving" : "Add Saving"}</h2>
              <Button variant="ghost" size="icon" onClick={closeSavingsModal}><X className="w-4 h-4" /></Button>
            </div>
            <form onSubmit={handleSavingSave} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Label *</label>
                <Input placeholder="e.g. Emergency fund deposit" value={savingForm.label ?? ""} onChange={(e) => setSavingForm((p) => ({ ...p, label: e.target.value }))} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Amount (RWF) *</label>
                  <Input type="number" step="1" min="1" placeholder="0" value={savingForm.amount ?? ""} onChange={(e) => setSavingForm((p) => ({ ...p, amount: parseFloat(e.target.value) }))} required />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Date *</label>
                  <Input type="date" value={savingForm.date ?? ""} onChange={(e) => setSavingForm((p) => ({ ...p, date: e.target.value }))} required />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Source (optional)</label>
                <Input placeholder="e.g. Monthly salary, Project bonus" value={savingForm.source ?? ""} onChange={(e) => setSavingForm((p) => ({ ...p, source: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Notes (optional)</label>
                <Textarea placeholder="Optional notes..." rows={2} value={savingForm.description ?? ""} onChange={(e) => setSavingForm((p) => ({ ...p, description: e.target.value }))} />
              </div>
              <div className="flex gap-3 pt-1">
                <Button type="button" variant="outline" className="flex-1" onClick={closeSavingsModal}>Cancel</Button>
                <Button type="submit" disabled={savingSubmitting} className="flex-1 bg-blue-500 hover:bg-blue-600 text-white">
                  {savingSubmitting ? "Saving..." : editingSaving ? "Update" : "Add Saving"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
