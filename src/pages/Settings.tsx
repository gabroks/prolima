import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { mockCompanySettings } from "@/data/mock";
import { CompanySettings } from "@/types";
import { Upload } from "lucide-react";
import { toast } from "sonner";

const colorOptions = [
  { name: "Verde", value: "green", hsl: "142 64% 32%" },
  { name: "Laranja", value: "orange", hsl: "38 92% 50%" },
  { name: "Azul", value: "blue", hsl: "210 80% 55%" },
  { name: "Roxo", value: "purple", hsl: "270 60% 50%" },
  { name: "Vermelho", value: "red", hsl: "0 84% 60%" },
  { name: "Verde Azulado", value: "teal", hsl: "174 60% 40%" },
  { name: "Rosa", value: "pink", hsl: "330 70% 55%" },
  { name: "Índigo", value: "indigo", hsl: "240 60% 55%" },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<CompanySettings>(mockCompanySettings);

  const handleSave = () => {
    toast.success("Configurações salvas com sucesso!");
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <h2 className="text-2xl font-bold">Configurações</h2>

      <Card>
        <CardHeader><CardTitle className="text-base">Informações da Empresa</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div><Label>Razão Social</Label><Input value={settings.razaoSocial} onChange={(e) => setSettings({ ...settings, razaoSocial: e.target.value })} /></div>
          <div><Label>Nome Fantasia</Label><Input value={settings.nomeFantasia} onChange={(e) => setSettings({ ...settings, nomeFantasia: e.target.value })} /></div>
          <div><Label>Telefone</Label><Input value={settings.phone} onChange={(e) => setSettings({ ...settings, phone: e.target.value })} /></div>
          <div><Label>Email</Label><Input value={settings.email} onChange={(e) => setSettings({ ...settings, email: e.target.value })} /></div>
          <div><Label>CNPJ</Label><Input value={settings.cnpj} onChange={(e) => setSettings({ ...settings, cnpj: e.target.value })} /></div>
          <div><Label>Inscrição Estadual</Label><Input value={settings.inscricaoEstadual} onChange={(e) => setSettings({ ...settings, inscricaoEstadual: e.target.value })} /></div>
          <div className="sm:col-span-2"><Label>Rua</Label><Input value={settings.street} onChange={(e) => setSettings({ ...settings, street: e.target.value })} /></div>
          <div><Label>Bairro</Label><Input value={settings.neighborhood} onChange={(e) => setSettings({ ...settings, neighborhood: e.target.value })} /></div>
          <div><Label>Cidade</Label><Input value={settings.city} onChange={(e) => setSettings({ ...settings, city: e.target.value })} /></div>
          <div><Label>Estado</Label><Input value={settings.state} onChange={(e) => setSettings({ ...settings, state: e.target.value })} /></div>
          <div><Label>CEP</Label><Input value={settings.cep} onChange={(e) => setSettings({ ...settings, cep: e.target.value })} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Logo da Empresa</CardTitle></CardHeader>
        <CardContent>
          <Button variant="outline"><Upload className="h-4 w-4 mr-2" />Fazer upload da logo</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Paleta de Cores do Sistema</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {colorOptions.map((color) => (
              <button
                key={color.value}
                onClick={() => setSettings({ ...settings, themeColor: color.value })}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all ${settings.themeColor === color.value ? "border-primary shadow-md" : "border-transparent hover:border-border"}`}
              >
                <div className="w-8 h-8 rounded-full" style={{ backgroundColor: `hsl(${color.hsl})` }} />
                <span className="text-xs">{color.name}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">QR Code de Pagamento PIX</CardTitle></CardHeader>
        <CardContent>
          <Button variant="outline"><Upload className="h-4 w-4 mr-2" />Fazer upload do QR Code PIX</Button>
        </CardContent>
      </Card>

      <Button onClick={handleSave} className="w-full sm:w-auto">Salvar</Button>
    </div>
  );
}
