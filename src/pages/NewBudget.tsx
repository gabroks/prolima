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
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

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

  // Item form
  const [itemMaterialId, setItemMaterialId] = useState("");
  const [itemUnit, setItemUnit] = useState("");
  const [itemWidth, setItemWidth] = useState(0);
  const [itemHeight, setItemHeight] = useState(0);
  const [itemQty, setItemQty] = useState(1);
  const [itemPrice, setItemPrice] = useState(0);
  const [itemNotes, setItemNotes] = useState("");

  const subtotal = items.reduce((s, i) => s + i.total, 0);
  const totalDiscount = discountType === "percent" ? subtotal * (discountValue / 100) : discountValue;
  const total = subtotal - totalDiscount + freight + otherCosts;

  const addItem = () => {
    const material = mockMaterials.find((m) => m.id === itemMaterialId);
    if (!material) { toast.error("Selecione um material"); return; }
    const itemTotal = itemQty * itemPrice;
    const newItem: BudgetItem = {
      id: Date.now().toString(), materialId: material.id, materialName: material.name,
      unit: itemUnit || material.chargeUnit, width: itemWidth, height: itemHeight,
      qty: itemQty, unitPrice: itemPrice, notes: itemNotes, total: itemTotal,
    };
    setItems([...items, newItem]);
    setItemMaterialId(""); setItemUnit(""); setItemWidth(0); setItemHeight(0);
    setItemQty(1); setItemPrice(0); setItemNotes("");
  };

  const removeItem = (id: string) => setItems(items.filter((i) => i.id !== id));

  const handleSave = (asDraft: boolean) => {
    if (!clientId) { toast.error("Selecione um cliente"); return; }
    if (items.length === 0) { toast.error("Adicione pelo menos um item"); return; }
    toast.success(asDraft ? "Rascunho salvo com sucesso!" : "Orçamento salvo com sucesso!");
    navigate("/orcamentos");
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <h2 className="text-2xl font-bold">Novo Orçamento</h2>

      <Card>
        <CardHeader><CardTitle className="text-base">Informações Gerais</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Cliente *</Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger><SelectValue placeholder="Selecione um cliente" /></SelectTrigger>
              <SelectContent>{mockClients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Data de Validade</Label><Input type="date" value={validityDate} onChange={(e) => setValidityDate(e.target.value)} /></div>
          <div><Label>Previsão de Entrega</Label><Input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} /></div>
          <div className="sm:col-span-2"><Label>Descrição do Serviço</Label><Textarea value={serviceDescription} onChange={(e) => setServiceDescription(e.target.value)} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Adicionar Item</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3 mb-4">
            <div>
              <Label>Material</Label>
              <Select value={itemMaterialId} onValueChange={(v) => { setItemMaterialId(v); const m = mockMaterials.find(x => x.id === v); if (m) { setItemUnit(m.chargeUnit); setItemPrice(m.basePrice); } }}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{mockMaterials.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Unidade</Label><Input value={itemUnit} onChange={(e) => setItemUnit(e.target.value)} /></div>
            <div><Label>Largura</Label><Input type="number" value={itemWidth || ""} onChange={(e) => setItemWidth(parseFloat(e.target.value) || 0)} /></div>
            <div><Label>Altura</Label><Input type="number" value={itemHeight || ""} onChange={(e) => setItemHeight(parseFloat(e.target.value) || 0)} /></div>
            <div><Label>Qtd</Label><Input type="number" value={itemQty || ""} onChange={(e) => setItemQty(parseInt(e.target.value) || 1)} /></div>
            <div><Label>Preço Unit.</Label><Input type="number" value={itemPrice || ""} onChange={(e) => setItemPrice(parseFloat(e.target.value) || 0)} /></div>
          </div>
          <div className="mb-4"><Label>Observações do item</Label><Input value={itemNotes} onChange={(e) => setItemNotes(e.target.value)} /></div>
          <Button onClick={addItem}><Plus className="h-4 w-4 mr-2" />Adicionar</Button>
        </CardContent>
      </Card>

      {items.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material</TableHead>
                  <TableHead>Qtd</TableHead>
                  <TableHead>Preço Unit.</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.materialName}</TableCell>
                    <TableCell>{item.qty}</TableCell>
                    <TableCell>R$ {item.unitPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell>R$ {item.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell><Button variant="ghost" size="icon" onClick={() => removeItem(item.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Descontos e Custos Adicionais</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Tipo de Desconto</Label>
            <Select value={discountType} onValueChange={(v: "value" | "percent") => setDiscountType(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="value">Valor (R$)</SelectItem>
                <SelectItem value="percent">Percentual (%)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Valor do Desconto</Label><Input type="number" value={discountValue || ""} onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)} /></div>
          <div><Label>Frete (R$)</Label><Input type="number" value={freight || ""} onChange={(e) => setFreight(parseFloat(e.target.value) || 0)} /></div>
          <div><Label>Outros Custos (R$)</Label><Input type="number" value={otherCosts || ""} onChange={(e) => setOtherCosts(parseFloat(e.target.value) || 0)} /></div>
          <div className="sm:col-span-2"><Label>Formas de Pagamento</Label><Input value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} placeholder="ex: PIX, cartão, boleto" /></div>
          <div className="sm:col-span-2"><Label>Observações Gerais</Label><Textarea value={generalNotes} onChange={(e) => setGeneralNotes(e.target.value)} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Resumo</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>R$ {subtotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Desconto</span><span className="text-destructive">- R$ {totalDiscount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span></div>
          <Separator />
          <div className="flex justify-between text-lg font-bold"><span>TOTAL</span><span className="text-primary">R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span></div>
        </CardContent>
      </Card>

      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={() => handleSave(true)}>Salvar Rascunho</Button>
        <Button onClick={() => handleSave(false)}>Salvar</Button>
      </div>
    </div>
  );
}
