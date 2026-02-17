import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mockCompanySettings } from "@/data/mock";
import { CompanySettings } from "@/types";
import { Upload, Building2, Palette, QrCode, Save } from "lucide-react";
import { toast } from "sonner";

const colorOptions = [
  { name: "Verde", value: "green", hsl: "152 58% 36%" },
  { name: "Azul", value: "blue", hsl: "215 76% 52%" },
  { name: "Laranja", value: "orange", hsl: "38 92% 50%" },
  { name: "Roxo", value: "purple", hsl: "280 55% 50%" },
  { name: "Vermelho", value: "red", hsl: "0 72% 51%" },
  { name: "Teal", value: "teal", hsl: "174 60% 40%" },
  { name: "Rosa", value: "pink", hsl: "330 70% 55%" },
  { name: "Índigo", value: "indigo", hsl: "240 60% 55%" },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<CompanySettings>(mockCompanySettings);

  const update = (field: keyof CompanySettings, value: string) =>
    setSettings(prev => ({ ...prev, [field]: value }));

  const handleSave = () => toast.success("Configurações salvas com sucesso!");

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-2xl font-bold">Configurações</h2>
        <Button onClick={handleSave}><Save className="h-4 w-4 mr-2" />Salvar Alterações</Button>
      </div>

      <Tabs defaultValue="empresa" className="space-y-4">
        <TabsList>
          <TabsTrigger value="empresa">Empresa</TabsTrigger>
          <TabsTrigger value="visual">Visual</TabsTrigger>
          <TabsTrigger value="pagamento">Pagamento</TabsTrigger>
        </TabsList>

        <TabsContent value="empresa" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Building2 className="h-4 w-4" />Dados da Empresa</CardTitle>
              <CardDescription>Informações que aparecem nos orçamentos emitidos.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div><Label>Razão Social</Label><Input value={settings.razaoSocial} onChange={(e) => update("razaoSocial", e.target.value)} /></div>
              <div><Label>Nome Fantasia</Label><Input value={settings.nomeFantasia} onChange={(e) => update("nomeFantasia", e.target.value)} /></div>
              <div><Label>CNPJ</Label><Input value={settings.cnpj} onChange={(e) => update("cnpj", e.target.value)} /></div>
              <div><Label>Inscrição Estadual</Label><Input value={settings.inscricaoEstadual} onChange={(e) => update("inscricaoEstadual", e.target.value)} /></div>
              <div><Label>Telefone</Label><Input value={settings.phone} onChange={(e) => update("phone", e.target.value)} /></div>
              <div><Label>E-mail</Label><Input value={settings.email} onChange={(e) => update("email", e.target.value)} /></div>
              <Separator className="sm:col-span-2" />
              <div className="sm:col-span-2"><Label>Rua / Logradouro</Label><Input value={settings.street} onChange={(e) => update("street", e.target.value)} /></div>
              <div><Label>Bairro</Label><Input value={settings.neighborhood} onChange={(e) => update("neighborhood", e.target.value)} /></div>
              <div><Label>Cidade</Label><Input value={settings.city} onChange={(e) => update("city", e.target.value)} /></div>
              <div><Label>Estado</Label><Input value={settings.state} onChange={(e) => update("state", e.target.value)} maxLength={2} /></div>
              <div><Label>CEP</Label><Input value={settings.cep} onChange={(e) => update("cep", e.target.value)} /></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Logo da Empresa</CardTitle>
              <CardDescription>Será exibida nos orçamentos e documentos.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Clique para fazer upload ou arraste a imagem</p>
                <p className="text-xs text-muted-foreground mt-1">PNG, JPG até 2MB</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="visual">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Palette className="h-4 w-4" />Tema do Sistema</CardTitle>
              <CardDescription>Escolha a cor principal do sistema e dos documentos.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                {colorOptions.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => update("themeColor", color.value)}
                    className={`flex flex-col items-center gap-1.5 p-2 rounded-lg border-2 transition-all ${
                      settings.themeColor === color.value
                        ? "border-primary shadow-md scale-105"
                        : "border-transparent hover:border-border"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full shadow-sm" style={{ backgroundColor: `hsl(${color.hsl})` }} />
                    <span className="text-[10px] font-medium">{color.name}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pagamento">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><QrCode className="h-4 w-4" />QR Code PIX</CardTitle>
              <CardDescription>QR code para pagamentos via PIX nos orçamentos.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                <QrCode className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Clique para fazer upload do QR Code PIX</p>
                <p className="text-xs text-muted-foreground mt-1">PNG, JPG até 1MB</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
