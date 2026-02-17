import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useClients } from "@/hooks/useClients";
import { useMaterials } from "@/hooks/useMaterials";
import { useBudgetCount, useCreateBudget, useUpdateBudget, useBudgetById, type BudgetFormData } from "@/hooks/useBudgets";
import { BudgetItem } from "@/types";
import {
  Plus, Trash2, FileText, Package, ChevronRight, ChevronLeft,
  User, Calendar, Ruler, Pencil, Save, Send, Search,
  AlertCircle, CheckCircle2, X,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate, useParams } from "react-router-dom";
import { formatCurrency } from "@/lib/formatters";

interface ItemForm { materialId: string; unit: string; width: number; height: number; qty: number; unitPrice: number; notes: string; }
const emptyItemForm: ItemForm = { materialId: "", unit: "", width: 0, height: 0, qty: 1, unitPrice: 0, notes: "" };

function calcItemTotal(item: { width: number; height: number; qty: number; unitPrice: number; unit: string }): number {
  if (item.unit === "m²" && item.width > 0 && item.height > 0) return (item.width / 100) * (item.height / 100) * item.qty * item.unitPrice;
  return item.qty * item.unitPrice;
}

const STEPS = [
  { id: 1, label: "Cliente & Serviço", icon: User },
  { id: 2, label: "Itens", icon: Package },
  { id: 3, label: "Valores & Condições", icon: FileText },
];

export default function NewBudget() {
  const navigate = useNavigate();
  const { id: editId } = useParams<{ id: string }>();
  const isEditMode = !!editId;

  const { data: clients = [], isLoading: lc } = useClients();
  const { data: materials = [], isLoading: lm } = useMaterials();
  const { data: budgetCount = 0 } = useBudgetCount();
  const { data: existingBudget, isLoading: loadingBudget } = useBudgetById(editId);
  const createBudget = useCreateBudget();
  const updateBudget = useUpdateBudget();

  const budgetNumber = useMemo(() => {
    if (isEditMode && existingBudget) return existingBudget.number;
    return `ORC-${String(budgetCount + 1).padStart(3, "0")}`;
  }, [budgetCount, isEditMode, existingBudget]);

  const [clientId, setClientId] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [validityDate, setValidityDate] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [serviceDescription, setServiceDescription] = useState("");
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [itemForm, setItemForm] = useState<ItemForm>(emptyItemForm);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [discountType, setDiscountType] = useState<"value" | "percent">("value");
  const [discountValue, setDiscountValue] = useState(0);
  const [freight, setFreight] = useState(0);
  const [otherCosts, setOtherCosts] = useState(0);
  const [paymentTerms, setPaymentTerms] = useState("");
  const [generalNotes, setGeneralNotes] = useState("");
  const [step, setStep] = useState(1);
  const [initialized, setInitialized] = useState(false);

  // Populate form when editing
  useEffect(() => {
    if (isEditMode && existingBudget && !initialized) {
      setClientId(existingBudget.client_id || "");
      setValidityDate(existingBudget.validity_date || "");
      setDeliveryDate(existingBudget.delivery_date || "");
      setServiceDescription(existingBudget.service_description || "");
      setDiscountType(existingBudget.discount_type as "value" | "percent");
      setDiscountValue(Number(existingBudget.discount_value));
      setFreight(Number(existingBudget.freight));
      setOtherCosts(Number(existingBudget.other_costs));
      setPaymentTerms(existingBudget.payment_terms || "");
      setGeneralNotes(existingBudget.general_notes || "");
      setItems(
        (existingBudget.budget_items || []).map(bi => ({
          id: bi.id,
          materialId: bi.material_id || "",
          materialName: bi.material_name,
          unit: bi.unit,
          width: Number(bi.width),
          height: Number(bi.height),
          qty: bi.qty,
          unitPrice: Number(bi.unit_price),
          notes: bi.notes || undefined,
          total: Number(bi.total),
        }))
      );
      setInitialized(true);
    }
  }, [isEditMode, existingBudget, initialized]);

  const subtotal = items.reduce((s, i) => s + i.total, 0);
  const totalDiscount = discountType === "percent" ? subtotal * (discountValue / 100) : discountValue;
  const total = subtotal - totalDiscount + freight + otherCosts;

  const selectedClient = clients.find(c => c.id === clientId);
  const filteredClients = useMemo(() => {
    const q = clientSearch.toLowerCase();
    return clients.filter(c => c.status === "active").filter(c => !q || c.name.toLowerCase().includes(q) || c.document.includes(q) || (c.city?.toLowerCase().includes(q)));
  }, [clientSearch, clients]);

  const selectMaterial = (id: string) => {
    const m = materials.find(x => x.id === id);
    if (m) setItemForm(prev => ({ ...prev, materialId: id, unit: m.charge_unit, unitPrice: Number(m.base_price) }));
  };

  const openAddItem = () => { setEditingItemId(null); setItemForm(emptyItemForm); setItemDialogOpen(true); };
  const openEditItem = (item: BudgetItem) => { setEditingItemId(item.id); setItemForm({ materialId: item.materialId, unit: item.unit, width: item.width, height: item.height, qty: item.qty, unitPrice: item.unitPrice, notes: item.notes || "" }); setItemDialogOpen(true); };

  const saveItem = () => {
    const material = materials.find(m => m.id === itemForm.materialId);
    if (!material) { toast.error("Selecione um material"); return; }
    if (itemForm.qty <= 0 || itemForm.unitPrice <= 0) { toast.error("Quantidade e preço devem ser maiores que zero"); return; }
    const itemTotal = calcItemTotal(itemForm);
    if (editingItemId) {
      setItems(prev => prev.map(i => i.id === editingItemId ? { ...i, materialId: material.id, materialName: material.name, unit: itemForm.unit || material.charge_unit, width: itemForm.width, height: itemForm.height, qty: itemForm.qty, unitPrice: itemForm.unitPrice, notes: itemForm.notes, total: itemTotal } : i));
      toast.success("Item atualizado");
    } else {
      setItems(prev => [...prev, { id: Date.now().toString(), materialId: material.id, materialName: material.name, unit: itemForm.unit || material.charge_unit, width: itemForm.width, height: itemForm.height, qty: itemForm.qty, unitPrice: itemForm.unitPrice, notes: itemForm.notes, total: itemTotal }]);
      toast.success("Item adicionado");
    }
    setItemDialogOpen(false); setItemForm(emptyItemForm); setEditingItemId(null);
  };

  const removeItem = (id: string) => { setItems(prev => prev.filter(i => i.id !== id)); toast.success("Item removido"); };

  const isSaving = createBudget.isPending || updateBudget.isPending;

  const handleSave = (asDraft: boolean) => {
    if (!clientId) { toast.error("Selecione um cliente"); setStep(1); return; }
    if (items.length === 0) { toast.error("Adicione pelo menos um item"); setStep(2); return; }
    const formData: BudgetFormData = {
      clientId, clientName: selectedClient?.name || "", validityDate, deliveryDate, serviceDescription,
      items: items.map(i => ({ materialId: i.materialId, materialName: i.materialName, unit: i.unit, width: i.width, height: i.height, qty: i.qty, unitPrice: i.unitPrice, notes: i.notes || "", total: i.total })),
      discountType, discountValue, freight, otherCosts, paymentTerms, generalNotes, subtotal, totalDiscount, total, status: asDraft ? "draft" : "issued",
    };
    if (isEditMode && editId) {
      updateBudget.mutate({ id: editId, form: formData }, { onSuccess: () => navigate("/orcamentos") });
    } else {
      createBudget.mutate({ budgetNumber, form: formData }, { onSuccess: () => navigate("/orcamentos") });
    }
  };

  const canProceed = (s: number) => { if (s === 1) return !!clientId; if (s === 2) return items.length > 0; return true; };
  const previewTotal = useMemo(() => itemForm.qty > 0 && itemForm.unitPrice > 0 ? calcItemTotal(itemForm) : 0, [itemForm]);
  const previewArea = useMemo(() => itemForm.unit === "m²" && itemForm.width > 0 && itemForm.height > 0 ? (itemForm.width / 100) * (itemForm.height / 100) : 0, [itemForm]);

  if (lc || lm || (isEditMode && loadingBudget)) return <div className="space-y-6"><Skeleton className="h-8 w-48" /><Skeleton className="h-64" /></div>;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold">{isEditMode ? "Editar Orçamento" : "Novo Orçamento"}</h2>
          <p className="text-sm text-muted-foreground mt-0.5"><span className="font-mono font-semibold text-primary">{budgetNumber}</span> • {isEditMode ? "Atualize as informações do orçamento" : "Preencha as informações para gerar o orçamento"}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate("/orcamentos")}><X className="h-4 w-4 mr-1.5" />Cancelar</Button>
      </div>
      <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-2">
        {STEPS.map((s) => (
          <button key={s.id} onClick={() => setStep(s.id)} className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all flex-1 justify-center ${step === s.id ? "bg-background text-primary shadow-sm" : step > s.id ? "text-primary/70 hover:bg-background/50" : "text-muted-foreground hover:bg-background/50"}`}>
            <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${step > s.id ? "bg-primary text-primary-foreground" : step === s.id ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>{step > s.id ? <CheckCircle2 className="h-3.5 w-3.5" /> : s.id}</div>
            <span className="hidden sm:inline">{s.label}</span>
          </button>
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-4 animate-fade-in">
          <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><User className="h-4 w-4 text-primary" />Cliente</CardTitle></CardHeader><CardContent className="space-y-4">
            {!selectedClient ? (<><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Buscar cliente por nome, documento ou cidade…" value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} className="pl-9" /></div>
              <div className="grid gap-2 max-h-[280px] overflow-y-auto">{filteredClients.length === 0 ? <p className="text-sm text-muted-foreground text-center py-6">Nenhum cliente ativo encontrado</p> : filteredClients.map(c => (
                <button key={c.id} onClick={() => { setClientId(c.id); setClientSearch(""); }} className="flex items-center justify-between p-3 rounded-lg border hover:border-primary hover:bg-primary/5 transition-all text-left">
                  <div><p className="font-medium text-sm">{c.name}</p><p className="text-xs text-muted-foreground">{c.document} • {c.city || "Sem cidade"}</p></div>
                  <Badge variant="outline" className="text-[10px]">{c.person_type === "fisica" ? "PF" : "PJ"}</Badge>
                </button>
              ))}</div></>) : (
              <div className="flex items-center justify-between p-3 rounded-lg border border-primary/30 bg-primary/5">
                <div><p className="font-semibold">{selectedClient.name}</p><p className="text-xs text-muted-foreground">{selectedClient.document} • {selectedClient.phone} • {selectedClient.city || "Sem cidade"}</p></div>
                <Button variant="ghost" size="sm" onClick={() => setClientId("")}>Trocar</Button>
              </div>
            )}
          </CardContent></Card>
          <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" />Detalhes do Serviço</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2">
            <div><Label>Data de Validade</Label><Input type="date" value={validityDate} onChange={(e) => setValidityDate(e.target.value)} /></div>
            <div><Label>Previsão de Entrega</Label><Input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} /></div>
            <div className="sm:col-span-2"><Label>Descrição do Serviço</Label><Textarea value={serviceDescription} onChange={(e) => setServiceDescription(e.target.value)} placeholder="Descreva o serviço a ser realizado…" rows={3} /></div>
          </CardContent></Card>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4 animate-fade-in">
          <Card><CardHeader><div className="flex items-center justify-between"><CardTitle className="text-base flex items-center gap-2"><Package className="h-4 w-4 text-primary" />Itens do Orçamento{items.length > 0 && <Badge variant="secondary" className="ml-1">{items.length}</Badge>}</CardTitle><Button size="sm" onClick={openAddItem}><Plus className="h-4 w-4 mr-1.5" />Adicionar Item</Button></div></CardHeader><CardContent className="p-0">
            <Table><TableHeader><TableRow><TableHead>Material</TableHead><TableHead className="hidden sm:table-cell">Dimensões</TableHead><TableHead>Qtd</TableHead><TableHead className="hidden sm:table-cell">Preço Unit.</TableHead><TableHead className="text-right">Total</TableHead><TableHead className="w-[80px]"></TableHead></TableRow></TableHeader><TableBody>
              {items.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-16 text-muted-foreground"><Package className="h-12 w-12 mx-auto mb-3 opacity-20" /><p className="font-medium">Nenhum item adicionado</p><Button variant="outline" size="sm" className="mt-4" onClick={openAddItem}><Plus className="h-3.5 w-3.5 mr-1.5" />Adicionar primeiro item</Button></TableCell></TableRow> : items.map((item) => {
                const area = item.unit === "m²" && item.width > 0 && item.height > 0 ? (item.width / 100) * (item.height / 100) : 0;
                return <TableRow key={item.id} className="group"><TableCell><div><p className="font-medium text-sm">{item.materialName}</p>{item.notes && <p className="text-xs text-muted-foreground">{item.notes}</p>}</div></TableCell><TableCell className="hidden sm:table-cell">{item.width > 0 && item.height > 0 ? <div><span className="text-sm tabular-nums">{item.width} × {item.height} cm</span>{area > 0 && <p className="text-[10px] text-muted-foreground tabular-nums">= {area.toFixed(2)} m²</p>}</div> : <span className="text-muted-foreground">—</span>}</TableCell><TableCell className="tabular-nums text-sm">{item.qty} {item.unit}</TableCell><TableCell className="hidden sm:table-cell tabular-nums text-sm">{formatCurrency(item.unitPrice)}</TableCell><TableCell className="text-right tabular-nums font-semibold text-sm">{formatCurrency(item.total)}</TableCell><TableCell><div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditItem(item)}><Pencil className="h-3 w-3" /></Button><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeItem(item.id)}><Trash2 className="h-3 w-3" /></Button></div></TableCell></TableRow>;
              })}
            </TableBody></Table>
            {items.length > 0 && <div className="flex justify-end p-4 border-t"><div className="text-sm"><span className="text-muted-foreground">Subtotal: </span><span className="font-bold tabular-nums text-primary">{formatCurrency(subtotal)}</span></div></div>}
          </CardContent></Card>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4 animate-fade-in">
          <Card><CardHeader><CardTitle className="text-base">Descontos e Custos Adicionais</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2">
            <div><Label>Tipo de Desconto</Label><Select value={discountType} onValueChange={(v: "value" | "percent") => setDiscountType(v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="value">Valor fixo (R$)</SelectItem><SelectItem value="percent">Percentual (%)</SelectItem></SelectContent></Select></div>
            <div><Label>{discountType === "percent" ? "Desconto (%)" : "Desconto (R$)"}</Label><Input type="number" step="0.01" min="0" value={discountValue || ""} onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)} /></div>
            <div><Label>Frete (R$)</Label><Input type="number" step="0.01" min="0" value={freight || ""} onChange={(e) => setFreight(parseFloat(e.target.value) || 0)} /></div>
            <div><Label>Outros Custos (R$)</Label><Input type="number" step="0.01" min="0" value={otherCosts || ""} onChange={(e) => setOtherCosts(parseFloat(e.target.value) || 0)} /></div>
          </CardContent></Card>
          <Card><CardHeader><CardTitle className="text-base">Condições</CardTitle></CardHeader><CardContent className="grid gap-4">
            <div><Label>Formas de Pagamento</Label><Input value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} placeholder="ex: 50% entrada + 50% na entrega" /></div>
            <div><Label>Observações Gerais</Label><Textarea value={generalNotes} onChange={(e) => setGeneralNotes(e.target.value)} rows={3} placeholder="Informações adicionais do orçamento…" /></div>
          </CardContent></Card>
          <Card className="border-primary/30 bg-primary/5"><CardHeader><CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4" />Resumo — {budgetNumber}</CardTitle></CardHeader><CardContent className="space-y-2">
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Cliente</span><span className="font-medium">{selectedClient?.name || "—"}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal ({items.length} {items.length === 1 ? "item" : "itens"})</span><span className="tabular-nums">{formatCurrency(subtotal)}</span></div>
            {totalDiscount > 0 && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Desconto {discountType === "percent" ? `(${discountValue}%)` : ""}</span><span className="tabular-nums text-destructive">− {formatCurrency(totalDiscount)}</span></div>}
            {freight > 0 && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Frete</span><span className="tabular-nums">+ {formatCurrency(freight)}</span></div>}
            {otherCosts > 0 && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Outros custos</span><span className="tabular-nums">+ {formatCurrency(otherCosts)}</span></div>}
            <Separator /><div className="flex justify-between text-lg font-bold"><span>TOTAL</span><span className="text-primary tabular-nums">{formatCurrency(total)}</span></div>
          </CardContent></Card>
        </div>
      )}

      <div className="flex items-center justify-between pb-6">
        <Button variant="outline" onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1}><ChevronLeft className="h-4 w-4 mr-1.5" />Voltar</Button>
        <div className="flex gap-2">
          {step < 3 ? <Button onClick={() => setStep(s => Math.min(3, s + 1))} disabled={!canProceed(step)}>Próximo<ChevronRight className="h-4 w-4 ml-1.5" /></Button> : (<>
            <Button variant="outline" onClick={() => handleSave(true)} disabled={isSaving}><Save className="h-4 w-4 mr-1.5" />{isSaving ? "Salvando…" : "Salvar Rascunho"}</Button>
            <Button onClick={() => handleSave(false)} disabled={isSaving} className="shadow-md shadow-primary/20"><Send className="h-4 w-4 mr-1.5" />{isSaving ? (isEditMode ? "Atualizando…" : "Emitindo…") : (isEditMode ? "Atualizar Orçamento" : "Emitir Orçamento")}</Button>
          </>)}
        </div>
      </div>

      <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}><DialogContent className="max-w-lg"><DialogHeader><DialogTitle>{editingItemId ? "Editar Item" : "Adicionar Item"}</DialogTitle><DialogDescription>Selecione o material e preencha as dimensões.</DialogDescription></DialogHeader>
        <div className="grid gap-4">
          <div><Label>Material *</Label><Select value={itemForm.materialId} onValueChange={selectMaterial}><SelectTrigger><SelectValue placeholder="Selecione um material" /></SelectTrigger><SelectContent>{materials.map(m => <SelectItem key={m.id} value={m.id}>{m.name} — {formatCurrency(Number(m.base_price))}/{m.charge_unit}</SelectItem>)}</SelectContent></Select></div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label>Unidade</Label><Input value={itemForm.unit} onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })} /></div>
            <div><Label>Quantidade *</Label><Input type="number" min="1" value={itemForm.qty || ""} onChange={(e) => setItemForm({ ...itemForm, qty: parseInt(e.target.value) || 1 })} /></div>
            <div><Label>Preço Unit. *</Label><Input type="number" step="0.01" min="0" value={itemForm.unitPrice || ""} onChange={(e) => setItemForm({ ...itemForm, unitPrice: parseFloat(e.target.value) || 0 })} /></div>
          </div>
          <div className="rounded-lg border p-3 space-y-3">
            <div className="flex items-center gap-2"><Ruler className="h-4 w-4 text-primary" /><Label className="text-sm font-semibold">Dimensões (cm)</Label>{itemForm.unit === "m²" && <Badge variant="outline" className="text-[10px]">Cálculo por área</Badge>}</div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Largura (cm)</Label><Input type="number" step="1" min="0" value={itemForm.width || ""} onChange={(e) => setItemForm({ ...itemForm, width: parseFloat(e.target.value) || 0 })} /></div>
              <div><Label className="text-xs">Altura (cm)</Label><Input type="number" step="1" min="0" value={itemForm.height || ""} onChange={(e) => setItemForm({ ...itemForm, height: parseFloat(e.target.value) || 0 })} /></div>
            </div>
            {previewArea > 0 && <p className="text-xs text-muted-foreground">Área: <span className="font-semibold text-foreground tabular-nums">{previewArea.toFixed(4)} m²</span>{itemForm.qty > 1 && <> × {itemForm.qty} = <span className="font-semibold text-foreground tabular-nums">{(previewArea * itemForm.qty).toFixed(4)} m² total</span></>}</p>}
          </div>
          <div><Label>Observações do item</Label><Input value={itemForm.notes} onChange={(e) => setItemForm({ ...itemForm, notes: e.target.value })} placeholder="Detalhes adicionais…" /></div>
          {previewTotal > 0 && <div className="flex items-center justify-between rounded-lg bg-primary/5 border border-primary/20 p-3"><span className="text-sm font-medium">Subtotal do item</span><span className="text-lg font-bold text-primary tabular-nums">{formatCurrency(previewTotal)}</span></div>}
        </div>
        <DialogFooter><Button variant="outline" onClick={() => setItemDialogOpen(false)}>Cancelar</Button><Button onClick={saveItem}>{editingItemId ? "Atualizar" : "Adicionar"}</Button></DialogFooter>
      </DialogContent></Dialog>
    </div>
  );
}
