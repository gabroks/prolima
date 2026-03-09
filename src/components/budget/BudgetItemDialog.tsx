import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Ruler, Search } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { MaterialFormDialog } from "@/components/materials/MaterialFormDialog";
import { useCreateMaterial, type MaterialForm, type DbMaterial } from "@/hooks/useMaterials";

export interface ItemForm {
  materialId: string;
  unit: string;
  width: number;
  height: number;
  qty: number;
  unitPrice: number;
  notes: string;
}

export const emptyItemForm: ItemForm = {
  materialId: "",
  unit: "",
  width: 0,
  height: 0,
  qty: 1,
  unitPrice: 0,
  notes: "",
};

export function calcItemTotal(item: { width: number; height: number; qty: number; unitPrice: number; unit: string }): number {
  if (item.unit === "m²" && item.width > 0 && item.height > 0)
    return (item.width / 100) * (item.height / 100) * item.qty * item.unitPrice;
  return item.qty * item.unitPrice;
}

interface BudgetItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemForm: ItemForm;
  setItemForm: (form: ItemForm | ((prev: ItemForm) => ItemForm)) => void;
  materials: DbMaterial[];
  editingItemId: string | null;
  onSave: () => void;
}

const emptyMaterialForm: MaterialForm = {
  name: "",
  category: "",
  chargeUnit: "m²",
  measureUnit: "centímetro",
  basePrice: 0,
  notes: "",
};

export function BudgetItemDialog({
  open,
  onOpenChange,
  itemForm,
  setItemForm,
  materials,
  editingItemId,
  onSave,
}: BudgetItemDialogProps) {
  const [materialSearch, setMaterialSearch] = useState("");
  const [materialDialogOpen, setMaterialDialogOpen] = useState(false);
  const [materialForm, setMaterialForm] = useState<MaterialForm>(emptyMaterialForm);
  const createMaterial = useCreateMaterial();

  const materialCategories = useMemo(
    () => [...new Set(materials.map((m) => m.category))].sort(),
    [materials]
  );

  const filteredMaterials = useMemo(() => {
    const q = materialSearch.toLowerCase().trim();
    if (!q) return materials;
    return materials.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q)
    );
  }, [materials, materialSearch]);

  const selectedMaterial = materials.find((m) => m.id === itemForm.materialId);

  const selectMaterial = (m: DbMaterial) => {
    setItemForm((prev) => ({
      ...prev,
      materialId: m.id,
      unit: m.charge_unit,
      unitPrice: Number(m.base_price),
    }));
    setMaterialSearch("");
  };

  const handleSaveMaterial = () => {
    if (!materialForm.name) return;
    if (!materialForm.basePrice) return;
    createMaterial.mutate(materialForm, {
      onSuccess: (newMaterial) => {
        setMaterialDialogOpen(false);
        setMaterialForm(emptyMaterialForm);
        if (newMaterial) {
          setItemForm((prev) => ({
            ...prev,
            materialId: newMaterial.id,
            unit: newMaterial.charge_unit,
            unitPrice: Number(newMaterial.base_price),
          }));
        }
      },
    });
  };

  const previewArea =
    itemForm.unit === "m²" && itemForm.width > 0 && itemForm.height > 0
      ? (itemForm.width / 100) * (itemForm.height / 100)
      : 0;
  const previewTotal =
    itemForm.qty > 0 && itemForm.unitPrice > 0 ? calcItemTotal(itemForm) : 0;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItemId ? "Editar Item" : "Adicionar Item"}
            </DialogTitle>
            <DialogDescription>
              Selecione o material e preencha as dimensões.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            {/* Material selector with search */}
            <div>
              <Label>Material *</Label>
              {selectedMaterial ? (
                <div className="flex items-center justify-between p-2.5 rounded-lg border border-primary/30 bg-primary/5 mt-1">
                  <div>
                    <p className="font-medium text-sm">{selectedMaterial.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(Number(selectedMaterial.base_price))}/
                      {selectedMaterial.charge_unit} • {selectedMaterial.category}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setItemForm((prev) => ({
                        ...prev,
                        materialId: "",
                        unit: "",
                        unitPrice: 0,
                      }))
                    }
                  >
                    Trocar
                  </Button>
                </div>
              ) : (
                <div className="mt-1 space-y-2">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        placeholder="Buscar material por nome ou categoria…"
                        value={materialSearch}
                        onChange={(e) => setMaterialSearch(e.target.value)}
                        className="pl-8 h-9"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="shrink-0"
                      onClick={() => setMaterialDialogOpen(true)}
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Novo
                    </Button>
                  </div>
                  <div className="max-h-[160px] overflow-y-auto rounded-lg border divide-y">
                    {filteredMaterials.length === 0 ? (
                      <div className="text-center py-6 text-sm text-muted-foreground">
                        <p>Nenhum material encontrado</p>
                        <Button
                          variant="link"
                          size="sm"
                          className="mt-1"
                          onClick={() => setMaterialDialogOpen(true)}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Cadastrar novo material
                        </Button>
                      </div>
                    ) : (
                      filteredMaterials.map((m) => (
                        <button
                          key={m.id}
                          onClick={() => selectMaterial(m)}
                          className="flex items-center justify-between w-full p-2.5 text-left hover:bg-primary/5 transition-colors"
                        >
                          <div>
                            <p className="font-medium text-sm">{m.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {m.category}
                            </p>
                          </div>
                          <span className="text-sm font-semibold tabular-nums text-primary">
                            {formatCurrency(Number(m.base_price))}/{m.charge_unit}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Quantity/Unit/Price row */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Unidade</Label>
                <Input
                  value={itemForm.unit}
                  onChange={(e) =>
                    setItemForm((prev) => ({ ...prev, unit: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label>Quantidade *</Label>
                <Input
                  type="number"
                  min="1"
                  value={itemForm.qty || ""}
                  onChange={(e) =>
                    setItemForm((prev) => ({
                      ...prev,
                      qty: parseInt(e.target.value) || 1,
                    }))
                  }
                />
              </div>
              <div>
                <Label>Preço Unit. *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={itemForm.unitPrice || ""}
                  onChange={(e) =>
                    setItemForm((prev) => ({
                      ...prev,
                      unitPrice: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>
            </div>

            {/* Dimensions */}
            <div className="rounded-lg border p-3 space-y-3">
              <div className="flex items-center gap-2">
                <Ruler className="h-4 w-4 text-primary" />
                <Label className="text-sm font-semibold">Dimensões (cm)</Label>
                {itemForm.unit === "m²" && (
                  <Badge variant="outline" className="text-[10px]">
                    Cálculo por área
                  </Badge>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Largura (cm)</Label>
                  <Input
                    type="number"
                    step="1"
                    min="0"
                    value={itemForm.width || ""}
                    onChange={(e) =>
                      setItemForm((prev) => ({
                        ...prev,
                        width: parseFloat(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label className="text-xs">Altura (cm)</Label>
                  <Input
                    type="number"
                    step="1"
                    min="0"
                    value={itemForm.height || ""}
                    onChange={(e) =>
                      setItemForm((prev) => ({
                        ...prev,
                        height: parseFloat(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
              </div>
              {previewArea > 0 && (
                <p className="text-xs text-muted-foreground">
                  Área:{" "}
                  <span className="font-semibold text-foreground tabular-nums">
                    {previewArea.toFixed(4)} m²
                  </span>
                  {itemForm.qty > 1 && (
                    <>
                      {" "}
                      × {itemForm.qty} ={" "}
                      <span className="font-semibold text-foreground tabular-nums">
                        {(previewArea * itemForm.qty).toFixed(4)} m² total
                      </span>
                    </>
                  )}
                </p>
              )}
            </div>

            {/* Notes */}
            <div>
              <Label>Observações do item</Label>
              <Input
                value={itemForm.notes}
                onChange={(e) =>
                  setItemForm((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder="Detalhes adicionais…"
              />
            </div>

            {/* Preview total */}
            {previewTotal > 0 && (
              <div className="flex items-center justify-between rounded-lg bg-primary/5 border border-primary/20 p-3">
                <span className="text-sm font-medium">Subtotal do item</span>
                <span className="text-lg font-bold text-primary tabular-nums">
                  {formatCurrency(previewTotal)}
                </span>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={onSave}>
              {editingItemId ? "Atualizar" : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MaterialFormDialog
        open={materialDialogOpen}
        onOpenChange={(open) => {
          if (!open) setMaterialDialogOpen(false);
        }}
        form={materialForm}
        onFormChange={setMaterialForm}
        onSave={handleSaveMaterial}
        isEditing={false}
        isPending={createMaterial.isPending}
        categories={materialCategories}
      />
    </>
  );
}
