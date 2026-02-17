import { useState, useMemo } from "react";
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
import { mockClients, mockMaterials, mockBudgets } from "@/data/mock";
import { BudgetItem } from "@/types";
import {
  Plus, Trash2, FileText, Package, ChevronRight, ChevronLeft,
  User, Calendar, Ruler, Pencil, Save, Send, Search,
  AlertCircle, CheckCircle2, X,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { formatCurrency } from "@/lib/formatters";

interface ItemForm {
  materialId: string;
  unit: string;
  width: number;
  height: number;
  qty: number;
  unitPrice: number;
  notes: string;
}

const emptyItemForm: ItemForm = { materialId: "", unit: "", width: 0, height: 0, qty: 1, unitPrice: 0, notes: "" };

/** Calculate item total considering area for m² materials */
function calcItemTotal(item: { width: number; height: number; qty: number; unitPrice: number; unit: string }): number {
  if (item.unit === "m²" && item.width > 0 && item.height > 0) {
    // width/height in cm → convert to m²
    const areaM2 = (item.width / 100) * (item.height / 100);
    return areaM2 * item.qty * item.unitPrice;
  }
  return item.qty * item.unitPrice;
}

function generateBudgetNumber(): string {
  const next = mockBudgets.length + 1;
  return `ORC-${String(next).padStart(3, "0")}`;
}

const STEPS = [
  { id: 1, label: "Cliente & Serviço", icon: User },
  { id: 2, label: "Itens", icon: Package },
  { id: 3, label: "Valores & Condições", icon: FileText },
];

export default function NewBudget() {
  const navigate = useNavigate();
  const budgetNumber = useMemo(() => generateBudgetNumber(), []);

  // Step 1 - Client & Service
  const [clientId, setClientId] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [validityDate, setValidityDate] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [serviceDescription, setServiceDescription] = useState("");

  // Step 2 - Items
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [itemForm, setItemForm] = useState<ItemForm>(emptyItemForm);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);

  // Step 3 - Discounts
  const [discountType, setDiscountType] = useState<"value" | "percent">("value");
  const [discountValue, setDiscountValue] = useState(0);
  const [freight, setFreight] = useState(0);
  const [otherCosts, setOtherCosts] = useState(0);
  const [paymentTerms, setPaymentTerms] = useState("");
  const [generalNotes, setGeneralNotes] = useState("");

  // Navigation
  const [step, setStep] = useState(1);

  const subtotal = items.reduce((s, i) => s + i.total, 0);
  const totalDiscount = discountType === "percent" ? subtotal * (discountValue / 100) : discountValue;
  const total = subtotal - totalDiscount + freight + otherCosts;

  const selectedClient = mockClients.find(c => c.id === clientId);

  const filteredClients = useMemo(() => {
    const q = clientSearch.toLowerCase();
    return mockClients
      .filter(c => c.status === "active")
      .filter(c => !q || c.name.toLowerCase().includes(q) || c.document.includes(q) || (c.city?.toLowerCase().includes(q)));
  }, [clientSearch]);

  const selectMaterial = (id: string) => {
    const m = mockMaterials.find(x => x.id === id);
    if (m) {
      setItemForm(prev => ({ ...prev, materialId: id, unit: m.chargeUnit, unitPrice: m.basePrice }));
    }
  };

  const openAddItem = () => {
    setEditingItemId(null);
    setItemForm(emptyItemForm);
    setItemDialogOpen(true);
  };

  const openEditItem = (item: BudgetItem) => {
    setEditingItemId(item.id);
    setItemForm({
      materialId: item.materialId,
      unit: item.unit,
      width: item.width,
      height: item.height,
      qty: item.qty,
      unitPrice: item.unitPrice,
      notes: item.notes || "",
    });
    setItemDialogOpen(true);
  };

  const saveItem = () => {
    const material = mockMaterials.find(m => m.id === itemForm.materialId);
    if (!material) { toast.error("Selecione um material"); return; }
    if (itemForm.qty <= 0 || itemForm.unitPrice <= 0) { toast.error("Quantidade e preço devem ser maiores que zero"); return; }

    const itemTotal = calcItemTotal(itemForm);

    if (editingItemId) {
      setItems(prev => prev.map(i => i.id === editingItemId ? {
        ...i,
        materialId: material.id,
        materialName: material.name,
        unit: itemForm.unit || material.chargeUnit,
        width: itemForm.width,
        height: itemForm.height,
        qty: itemForm.qty,
        unitPrice: itemForm.unitPrice,
        notes: itemForm.notes,
        total: itemTotal,
      } : i));
      toast.success("Item atualizado");
    } else {
      const newItem: BudgetItem = {
        id: Date.now().toString(),
        materialId: material.id,
        materialName: material.name,
        unit: itemForm.unit || material.chargeUnit,
        width: itemForm.width,
        height: itemForm.height,
        qty: itemForm.qty,
        unitPrice: itemForm.unitPrice,
        notes: itemForm.notes,
        total: itemTotal,
      };
      setItems(prev => [...prev, newItem]);
      toast.success("Item adicionado");
    }
    setItemDialogOpen(false);
    setItemForm(emptyItemForm);
    setEditingItemId(null);
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
    toast.success("Item removido");
  };

  const handleSave = (asDraft: boolean) => {
    if (!clientId) { toast.error("Selecione um cliente"); setStep(1); return; }
    if (items.length === 0) { toast.error("Adicione pelo menos um item"); setStep(2); return; }
    toast.success(asDraft ? "Rascunho salvo!" : "Orçamento emitido!");
    navigate("/orcamentos");
  };

  const canProceed = (s: number) => {
    if (s === 1) return !!clientId;
    if (s === 2) return items.length > 0;
    return true;
  };

  // Preview calc for item form
  const previewTotal = useMemo(() => {
    if (itemForm.qty > 0 && itemForm.unitPrice > 0) {
      return calcItemTotal(itemForm);
    }
    return 0;
  }, [itemForm]);

  const previewArea = useMemo(() => {
    if (itemForm.unit === "m²" && itemForm.width > 0 && itemForm.height > 0) {
      return (itemForm.width / 100) * (itemForm.height / 100);
    }
    return 0;
  }, [itemForm]);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold">Novo Orçamento</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            <span className="font-mono font-semibold text-primary">{budgetNumber}</span> • Preencha as informações para gerar o orçamento
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate("/orcamentos")}>
            <X className="h-4 w-4 mr-1.5" />Cancelar
          </Button>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-2">
        {STEPS.map((s, i) => (
          <button
            key={s.id}
            onClick={() => setStep(s.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all flex-1 justify-center ${
              step === s.id
                ? "bg-background text-primary shadow-sm"
                : step > s.id
                  ? "text-primary/70 hover:bg-background/50"
                  : "text-muted-foreground hover:bg-background/50"
            }`}
          >
            <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${
              step > s.id ? "bg-primary text-primary-foreground" : step === s.id ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
            }`}>
              {step > s.id ? <CheckCircle2 className="h-3.5 w-3.5" /> : s.id}
            </div>
            <span className="hidden sm:inline">{s.label}</span>
          </button>
        ))}
      </div>

      {/* Step 1 - Client & Service */}
      {step === 1 && (
        <div className="space-y-4 animate-fade-in">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!selectedClient ? (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar cliente por nome, documento ou cidade…"
                      value={clientSearch}
                      onChange={(e) => setClientSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <div className="grid gap-2 max-h-[280px] overflow-y-auto">
                    {filteredClients.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-6">Nenhum cliente ativo encontrado</p>
                    ) : filteredClients.map(c => (
                      <button
                        key={c.id}
                        onClick={() => { setClientId(c.id); setClientSearch(""); }}
                        className="flex items-center justify-between p-3 rounded-lg border hover:border-primary hover:bg-primary/5 transition-all text-left"
                      >
                        <div>
                          <p className="font-medium text-sm">{c.name}</p>
                          <p className="text-xs text-muted-foreground">{c.document} • {c.city || "Sem cidade"}</p>
                        </div>
                        <Badge variant="outline" className="text-[10px]">{c.personType === "fisica" ? "PF" : "PJ"}</Badge>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-between p-3 rounded-lg border border-primary/30 bg-primary/5">
                  <div>
                    <p className="font-semibold">{selectedClient.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedClient.document} • {selectedClient.phone} • {selectedClient.city || "Sem cidade"}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setClientId("")}>
                    Trocar
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />Detalhes do Serviço
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Data de Validade</Label>
                <Input type="date" value={validityDate} onChange={(e) => setValidityDate(e.target.value)} />
              </div>
              <div>
                <Label>Previsão de Entrega</Label>
                <Input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <Label>Descrição do Serviço</Label>
                <Textarea
                  value={serviceDescription}
                  onChange={(e) => setServiceDescription(e.target.value)}
                  placeholder="Descreva o serviço a ser realizado…"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 2 - Items */}
      {step === 2 && (
        <div className="space-y-4 animate-fade-in">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="h-4 w-4 text-primary" />
                  Itens do Orçamento
                  {items.length > 0 && (
                    <Badge variant="secondary" className="ml-1">{items.length}</Badge>
                  )}
                </CardTitle>
                <Button size="sm" onClick={openAddItem}>
                  <Plus className="h-4 w-4 mr-1.5" />Adicionar Item
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Material</TableHead>
                    <TableHead className="hidden sm:table-cell">Dimensões</TableHead>
                    <TableHead>Qtd</TableHead>
                    <TableHead className="hidden sm:table-cell">Preço Unit.</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-16 text-muted-foreground">
                        <Package className="h-12 w-12 mx-auto mb-3 opacity-20" />
                        <p className="font-medium">Nenhum item adicionado</p>
                        <p className="text-xs mt-1">Clique em "Adicionar Item" para começar</p>
                        <Button variant="outline" size="sm" className="mt-4" onClick={openAddItem}>
                          <Plus className="h-3.5 w-3.5 mr-1.5" />Adicionar primeiro item
                        </Button>
                      </TableCell>
                    </TableRow>
                  ) : items.map((item) => {
                    const area = item.unit === "m²" && item.width > 0 && item.height > 0
                      ? (item.width / 100) * (item.height / 100) : 0;
                    return (
                      <TableRow key={item.id} className="group">
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{item.materialName}</p>
                            {item.notes && <p className="text-xs text-muted-foreground">{item.notes}</p>}
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {item.width > 0 && item.height > 0 ? (
                            <div>
                              <span className="text-sm tabular-nums">{item.width} × {item.height} cm</span>
                              {area > 0 && (
                                <p className="text-[10px] text-muted-foreground tabular-nums">= {area.toFixed(2)} m²</p>
                              )}
                            </div>
                          ) : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="tabular-nums text-sm">{item.qty} {item.unit}</TableCell>
                        <TableCell className="hidden sm:table-cell tabular-nums text-sm">{formatCurrency(item.unitPrice)}</TableCell>
                        <TableCell className="text-right tabular-nums font-semibold text-sm">{formatCurrency(item.total)}</TableCell>
                        <TableCell>
                          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditItem(item)}>
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeItem(item.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {items.length > 0 && (
                <div className="flex justify-end p-4 border-t">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Subtotal: </span>
                    <span className="font-bold tabular-nums text-primary">{formatCurrency(subtotal)}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 3 - Values & Conditions */}
      {step === 3 && (
        <div className="space-y-4 animate-fade-in">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Descontos e Custos Adicionais</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Tipo de Desconto</Label>
                <Select value={discountType} onValueChange={(v: "value" | "percent") => setDiscountType(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="value">Valor fixo (R$)</SelectItem>
                    <SelectItem value="percent">Percentual (%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{discountType === "percent" ? "Desconto (%)" : "Desconto (R$)"}</Label>
                <Input type="number" step="0.01" min="0" value={discountValue || ""} onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)} />
              </div>
              <div>
                <Label>Frete (R$)</Label>
                <Input type="number" step="0.01" min="0" value={freight || ""} onChange={(e) => setFreight(parseFloat(e.target.value) || 0)} />
              </div>
              <div>
                <Label>Outros Custos (R$)</Label>
                <Input type="number" step="0.01" min="0" value={otherCosts || ""} onChange={(e) => setOtherCosts(parseFloat(e.target.value) || 0)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Condições</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div>
                <Label>Formas de Pagamento</Label>
                <Input value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} placeholder="ex: 50% entrada + 50% na entrega" />
              </div>
              <div>
                <Label>Observações Gerais</Label>
                <Textarea value={generalNotes} onChange={(e) => setGeneralNotes(e.target.value)} rows={3} placeholder="Informações adicionais do orçamento…" />
              </div>
            </CardContent>
          </Card>

          {/* Summary Card */}
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />Resumo — {budgetNumber}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Cliente</span>
                <span className="font-medium">{selectedClient?.name || "—"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal ({items.length} {items.length === 1 ? "item" : "itens"})</span>
                <span className="tabular-nums">{formatCurrency(subtotal)}</span>
              </div>
              {totalDiscount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Desconto {discountType === "percent" ? `(${discountValue}%)` : ""}</span>
                  <span className="tabular-nums text-destructive">− {formatCurrency(totalDiscount)}</span>
                </div>
              )}
              {freight > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Frete</span>
                  <span className="tabular-nums">+ {formatCurrency(freight)}</span>
                </div>
              )}
              {otherCosts > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Outros custos</span>
                  <span className="tabular-nums">+ {formatCurrency(otherCosts)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>TOTAL</span>
                <span className="text-primary tabular-nums">{formatCurrency(total)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Navigation & Actions */}
      <div className="flex items-center justify-between pb-6">
        <Button
          variant="outline"
          onClick={() => setStep(s => Math.max(1, s - 1))}
          disabled={step === 1}
        >
          <ChevronLeft className="h-4 w-4 mr-1.5" />Voltar
        </Button>

        <div className="flex gap-2">
          {step < 3 ? (
            <Button
              onClick={() => setStep(s => Math.min(3, s + 1))}
              disabled={!canProceed(step)}
            >
              Próximo<ChevronRight className="h-4 w-4 ml-1.5" />
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => handleSave(true)}>
                <Save className="h-4 w-4 mr-1.5" />Salvar Rascunho
              </Button>
              <Button onClick={() => handleSave(false)} className="shadow-md shadow-primary/20">
                <Send className="h-4 w-4 mr-1.5" />Emitir Orçamento
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Item Add/Edit Dialog */}
      <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingItemId ? "Editar Item" : "Adicionar Item"}</DialogTitle>
            <DialogDescription>Selecione o material e preencha as dimensões.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div>
              <Label>Material *</Label>
              <Select value={itemForm.materialId} onValueChange={selectMaterial}>
                <SelectTrigger><SelectValue placeholder="Selecione um material" /></SelectTrigger>
                <SelectContent>
                  {mockMaterials.map(m => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name} — {formatCurrency(m.basePrice)}/{m.chargeUnit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Unidade</Label>
                <Input value={itemForm.unit} onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })} />
              </div>
              <div>
                <Label>Quantidade *</Label>
                <Input type="number" min="1" value={itemForm.qty || ""} onChange={(e) => setItemForm({ ...itemForm, qty: parseInt(e.target.value) || 1 })} />
              </div>
              <div>
                <Label>Preço Unit. *</Label>
                <Input type="number" step="0.01" min="0" value={itemForm.unitPrice || ""} onChange={(e) => setItemForm({ ...itemForm, unitPrice: parseFloat(e.target.value) || 0 })} />
              </div>
            </div>

            {/* Dimensions - relevant for m² materials */}
            <div className="rounded-lg border p-3 space-y-3">
              <div className="flex items-center gap-2">
                <Ruler className="h-4 w-4 text-primary" />
                <Label className="text-sm font-semibold">Dimensões (cm)</Label>
                {itemForm.unit === "m²" && (
                  <Badge variant="outline" className="text-[10px]">Cálculo por área</Badge>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Largura (cm)</Label>
                  <Input type="number" step="1" min="0" value={itemForm.width || ""} onChange={(e) => setItemForm({ ...itemForm, width: parseFloat(e.target.value) || 0 })} />
                </div>
                <div>
                  <Label className="text-xs">Altura (cm)</Label>
                  <Input type="number" step="1" min="0" value={itemForm.height || ""} onChange={(e) => setItemForm({ ...itemForm, height: parseFloat(e.target.value) || 0 })} />
                </div>
              </div>
              {previewArea > 0 && (
                <p className="text-xs text-muted-foreground">
                  Área: <span className="font-semibold text-foreground tabular-nums">{previewArea.toFixed(4)} m²</span>
                  {itemForm.qty > 1 && <> × {itemForm.qty} = <span className="font-semibold text-foreground tabular-nums">{(previewArea * itemForm.qty).toFixed(4)} m² total</span></>}
                </p>
              )}
            </div>

            <div>
              <Label>Observações do item</Label>
              <Input value={itemForm.notes} onChange={(e) => setItemForm({ ...itemForm, notes: e.target.value })} placeholder="Detalhes adicionais…" />
            </div>

            {/* Preview total */}
            {previewTotal > 0 && (
              <div className="flex items-center justify-between rounded-lg bg-primary/5 border border-primary/20 p-3">
                <span className="text-sm font-medium">Subtotal do item</span>
                <span className="text-lg font-bold text-primary tabular-nums">{formatCurrency(previewTotal)}</span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setItemDialogOpen(false)}>Cancelar</Button>
            <Button onClick={saveItem}>{editingItemId ? "Atualizar" : "Adicionar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
