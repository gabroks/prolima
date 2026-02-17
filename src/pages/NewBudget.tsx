import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mockClients, mockMaterials } from "@/data/mock";
import { BudgetItem } from "@/types";
import { Plus, Trash2, FileText, Package } from "lucide-react";
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

export default function NewBudget() {
  const navigate = useNavigate();
  const [clientId, setClientId] = useState("");
  const [validityDate, setValidityDate] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [serviceDescription, setServiceDescription] = useState("");
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [discountType, setDiscountType] = useState<"value" | "percent">("value");
  const [discountValue, setDiscountValue] = useState(0);
  const [freight, setFreight] = useState(0);
  const [otherCosts, setOtherCosts] = useState(0);
  const [paymentTerms, setPaymentTerms] = useState("");
  const [generalNotes, setGeneralNotes] = useState("");
  const [itemForm, setItemForm] = useState<ItemForm>(emptyItemForm);

  const subtotal = items.reduce((s, i) => s + i.total, 0);
  const totalDiscount = discountType === "percent" ? subtotal * (discountValue / 100) : discountValue;
  const total = subtotal - totalDiscount + freight + otherCosts;

  const selectedClient = mockClients.find(c => c.id === clientId);

  const selectMaterial = (id: string) => {
    const m = mockMaterials.find(x => x.id === id);
    if (m) {
      setItemForm(prev => ({ ...prev, materialId: id, unit: m.chargeUnit, unitPrice: m.basePrice }));
    }
  };

  const addItem = () => {
    const material = mockMaterials.find((m) => m.id === itemForm.materialId);
    if (!material) { toast.error("Selecione um material"); return; }
    if (itemForm.qty <= 0 || itemForm.unitPrice <= 0) { toast.error("Quantidade e preço devem ser maiores que zero"); return; }
    const itemTotal = itemForm.qty * itemForm.unitPrice;
    const newItem: BudgetItem = {
      id: Date.now().toString(), materialId: material.id, materialName: material.name,
      unit: itemForm.unit || material.chargeUnit, width: itemForm.width, height: itemForm.height,
      qty: itemForm.qty, unitPrice: itemForm.unitPrice, notes: itemForm.notes, total: itemTotal,
    };
    setItems(prev => [...prev, newItem]);
    setItemForm(emptyItemForm);
    toast.success("Item adicionado");
  };

  const removeItem = (id: string) => setItems(prev => prev.filter((i) => i.id !== id));

  const handleSave = (asDraft: boolean) => {
    if (!clientId) { toast.error("Selecione um cliente"); return; }
    if (items.length === 0) { toast.error("Adicione pelo menos um item"); return; }
    toast.success(asDraft ? "Rascunho salvo!" : "Orçamento emitido!");
    navigate("/orcamentos");
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-2xl font-bold">Novo Orçamento</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleSave(true)}>Salvar Rascunho</Button>
          <Button onClick={() => handleSave(false)}>Emitir Orçamento</Button>
        </div>
      </div>

      {/* General Info */}
      <Card>
        <CardHeader><CardTitle className="text-base">Informações Gerais</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label>Cliente *</Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger><SelectValue placeholder="Selecione um cliente" /></SelectTrigger>
              <SelectContent>{mockClients.filter(c => c.status === "active").map((c) => <SelectItem key={c.id} value={c.id}>{c.name} — {c.document}</SelectItem>)}</SelectContent>
            </Select>
            {selectedClient && (
              <p className="text-xs text-muted-foreground mt-1">{selectedClient.phone} • {selectedClient.city || "Sem cidade"}</p>
            )}
          </div>
          <div><Label>Data de Validade</Label><Input type="date" value={validityDate} onChange={(e) => setValidityDate(e.target.value)} /></div>
          <div><Label>Previsão de Entrega</Label><Input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} /></div>
          <div className="sm:col-span-2"><Label>Descrição do Serviço</Label><Textarea value={serviceDescription} onChange={(e) => setServiceDescription(e.target.value)} placeholder="Descreva o serviço a ser realizado…" /></div>
        </CardContent>
      </Card>

      {/* Add Item */}
      <Card>
        <CardHeader><CardTitle className="text-base">Adicionar Item</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3 mb-4">
            <div className="sm:col-span-3">
              <Label>Material *</Label>
              <Select value={itemForm.materialId} onValueChange={selectMaterial}>
                <SelectTrigger><SelectValue placeholder="Selecione um material" /></SelectTrigger>
                <SelectContent>{mockMaterials.map((m) => <SelectItem key={m.id} value={m.id}>{m.name} — {formatCurrency(m.basePrice)}/{m.chargeUnit}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Unidade</Label><Input value={itemForm.unit} onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })} /></div>
            <div><Label>Largura</Label><Input type="number" step="0.01" min="0" value={itemForm.width || ""} onChange={(e) => setItemForm({ ...itemForm, width: parseFloat(e.target.value) || 0 })} /></div>
            <div><Label>Altura</Label><Input type="number" step="0.01" min="0" value={itemForm.height || ""} onChange={(e) => setItemForm({ ...itemForm, height: parseFloat(e.target.value) || 0 })} /></div>
            <div><Label>Quantidade *</Label><Input type="number" min="1" value={itemForm.qty || ""} onChange={(e) => setItemForm({ ...itemForm, qty: parseInt(e.target.value) || 1 })} /></div>
            <div><Label>Preço Unitário *</Label><Input type="number" step="0.01" min="0" value={itemForm.unitPrice || ""} onChange={(e) => setItemForm({ ...itemForm, unitPrice: parseFloat(e.target.value) || 0 })} /></div>
            <div><Label>Obs. do item</Label><Input value={itemForm.notes} onChange={(e) => setItemForm({ ...itemForm, notes: e.target.value })} /></div>
          </div>
          <div className="flex items-center justify-between">
            <Button onClick={addItem} variant="outline"><Plus className="h-4 w-4 mr-2" />Adicionar Item</Button>
            {itemForm.qty > 0 && itemForm.unitPrice > 0 && (
              <span className="text-sm text-muted-foreground">Subtotal: <span className="font-medium text-foreground">{formatCurrency(itemForm.qty * itemForm.unitPrice)}</span></span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Items Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Itens do Orçamento ({items.length})</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead className="hidden sm:table-cell">Medidas</TableHead>
                <TableHead>Qtd</TableHead>
                <TableHead className="hidden sm:table-cell">Preço Unit.</TableHead>
                <TableHead>Total</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    <Package className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p>Nenhum item adicionado</p>
                  </TableCell>
                </TableRow>
              ) : items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{item.materialName}</p>
                      {item.notes && <p className="text-xs text-muted-foreground">{item.notes}</p>}
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-xs">{item.width > 0 && item.height > 0 ? `${item.width} × ${item.height}` : "—"}</TableCell>
                  <TableCell className="tabular-nums">{item.qty} {item.unit}</TableCell>
                  <TableCell className="hidden sm:table-cell tabular-nums">{formatCurrency(item.unitPrice)}</TableCell>
                  <TableCell className="tabular-nums font-medium">{formatCurrency(item.total)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeItem(item.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Discounts */}
      <Card>
        <CardHeader><CardTitle className="text-base">Descontos e Custos</CardTitle></CardHeader>
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
          <div><Label>{discountType === "percent" ? "Desconto (%)" : "Desconto (R$)"}</Label><Input type="number" step="0.01" min="0" value={discountValue || ""} onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)} /></div>
          <div><Label>Frete (R$)</Label><Input type="number" step="0.01" min="0" value={freight || ""} onChange={(e) => setFreight(parseFloat(e.target.value) || 0)} /></div>
          <div><Label>Outros Custos (R$)</Label><Input type="number" step="0.01" min="0" value={otherCosts || ""} onChange={(e) => setOtherCosts(parseFloat(e.target.value) || 0)} /></div>
          <div className="sm:col-span-2"><Label>Formas de Pagamento</Label><Input value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} placeholder="ex: 50% entrada + 50% na entrega" /></div>
          <div className="sm:col-span-2"><Label>Observações Gerais</Label><Textarea value={generalNotes} onChange={(e) => setGeneralNotes(e.target.value)} /></div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4" />Resumo do Orçamento</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal ({items.length} itens)</span><span className="tabular-nums">{formatCurrency(subtotal)}</span></div>
          {totalDiscount > 0 && (
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Desconto {discountType === "percent" ? `(${discountValue}%)` : ""}</span><span className="tabular-nums text-destructive">- {formatCurrency(totalDiscount)}</span></div>
          )}
          {freight > 0 && (
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Frete</span><span className="tabular-nums">+ {formatCurrency(freight)}</span></div>
          )}
          {otherCosts > 0 && (
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Outros custos</span><span className="tabular-nums">+ {formatCurrency(otherCosts)}</span></div>
          )}
          <Separator />
          <div className="flex justify-between text-lg font-bold"><span>TOTAL</span><span className="text-primary tabular-nums">{formatCurrency(total)}</span></div>
        </CardContent>
      </Card>

      {/* Bottom Actions */}
      <div className="flex gap-3 justify-end pb-6">
        <Button variant="outline" onClick={() => navigate("/orcamentos")}>Cancelar</Button>
        <Button variant="outline" onClick={() => handleSave(true)}>Salvar Rascunho</Button>
        <Button onClick={() => handleSave(false)}>Emitir Orçamento</Button>
      </div>
    </div>
  );
}
