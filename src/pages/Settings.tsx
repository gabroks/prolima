import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MaskedInput } from "@/components/ui/masked-input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useCompanySettings, useUpdateCompanySettings } from "@/hooks/useCompanySettings";
import { useIsAdmin } from "@/hooks/useAdmin";
import {
  Upload, Building2, Palette, QrCode, Save, Check,
  FileText, Bell, Shield, Printer, Globe, Phone, Mail, MapPin,
} from "lucide-react";
import { FileUpload } from "@/components/settings/FileUpload";


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

const STATES = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

export default function SettingsPage() {
  const { data: dbSettings, isLoading } = useCompanySettings();
  const updateSettings = useUpdateCompanySettings();
  const { data: isAdmin = false } = useIsAdmin();

  const [localSettings, setLocalSettings] = useState<Record<string, any> | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const settings = localSettings || (dbSettings ? {
    razaoSocial: dbSettings.razao_social,
    nomeFantasia: dbSettings.nome_fantasia,
    phone: dbSettings.phone,
    email: dbSettings.email,
    cnpj: dbSettings.cnpj,
    inscricaoEstadual: dbSettings.inscricao_estadual,
    street: dbSettings.street,
    neighborhood: dbSettings.neighborhood,
    city: dbSettings.city,
    state: dbSettings.state,
    cep: dbSettings.cep,
    themeColor: dbSettings.theme_color,
    logo: dbSettings.logo || "",
    pixQrCode: dbSettings.pix_qr_code || "",
    docShowLogo: dbSettings.doc_show_logo,
    docShowPhone: dbSettings.doc_show_phone,
    docShowAddress: dbSettings.doc_show_address,
    docFooterText: dbSettings.doc_footer_text,
    docValidityDays: String(dbSettings.doc_validity_days),
    notifBudgetApproved: dbSettings.notif_budget_approved,
    notifPaymentReceived: dbSettings.notif_payment_received,
    notifBudgetExpiring: dbSettings.notif_budget_expiring,
    notifWeeklyReport: dbSettings.notif_weekly_report,
  } : null);

  const update = (field: string, value: string | boolean | number) => {
    setLocalSettings(prev => ({ ...(prev || settings || {}), [field]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    if (!dbSettings || !settings) return;
    updateSettings.mutate({
      id: dbSettings.id,
      data: {
        razao_social: settings.razaoSocial,
        nome_fantasia: settings.nomeFantasia,
        phone: settings.phone,
        email: settings.email,
        cnpj: settings.cnpj,
        inscricao_estadual: settings.inscricaoEstadual,
        street: settings.street,
        neighborhood: settings.neighborhood,
        city: settings.city,
        state: settings.state,
        cep: settings.cep,
        theme_color: settings.themeColor,
        logo: settings.logo || null,
        pix_qr_code: settings.pixQrCode || null,
        doc_show_logo: settings.docShowLogo,
        doc_show_phone: settings.docShowPhone,
        doc_show_address: settings.docShowAddress,
        doc_footer_text: settings.docFooterText,
        doc_validity_days: parseInt(settings.docValidityDays) || 15,
        notif_budget_approved: settings.notifBudgetApproved,
        notif_payment_received: settings.notifPaymentReceived,
        notif_budget_expiring: settings.notifBudgetExpiring,
        notif_weekly_report: settings.notifWeeklyReport,
      },
    }, { onSuccess: () => setHasChanges(false) });
  };

  if (isLoading || !settings) return <div className="space-y-6"><Skeleton className="h-8 w-48" /><Skeleton className="h-96" /></div>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold">Configurações</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Gerencie as preferências do sistema e da empresa</p>
        </div>
        <Button onClick={handleSave} disabled={!hasChanges || updateSettings.isPending} className="shadow-md shadow-primary/20">
          <Save className="h-4 w-4 mr-2" />Salvar Alterações
          {hasChanges && <Badge className="ml-2 h-5 px-1.5 bg-primary-foreground text-primary text-[10px]">Pendente</Badge>}
        </Button>
      </div>

      <Tabs defaultValue="empresa" className="space-y-4">
        <TabsList className={`grid w-full ${isAdmin ? "grid-cols-5" : "grid-cols-4"}`}>
          <TabsTrigger value="empresa" className="text-xs sm:text-sm"><Building2 className="h-3.5 w-3.5 mr-1.5 hidden sm:inline" />Empresa</TabsTrigger>
          <TabsTrigger value="documentos" className="text-xs sm:text-sm"><FileText className="h-3.5 w-3.5 mr-1.5 hidden sm:inline" />Documentos</TabsTrigger>
          <TabsTrigger value="visual" className="text-xs sm:text-sm"><Palette className="h-3.5 w-3.5 mr-1.5 hidden sm:inline" />Visual</TabsTrigger>
          <TabsTrigger value="notificacoes" className="text-xs sm:text-sm"><Bell className="h-3.5 w-3.5 mr-1.5 hidden sm:inline" />Alertas</TabsTrigger>
          {isAdmin && <TabsTrigger value="admin" className="text-xs sm:text-sm"><Shield className="h-3.5 w-3.5 mr-1.5 hidden sm:inline" />Admin</TabsTrigger>}
        </TabsList>

        <TabsContent value="empresa" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Building2 className="h-4 w-4 text-primary" />Dados da Empresa</CardTitle>
              <CardDescription>Informações que aparecem nos orçamentos e documentos emitidos.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div><Label>Razão Social *</Label><Input value={settings.razaoSocial} onChange={(e) => update("razaoSocial", e.target.value)} /></div>
              <div><Label>Nome Fantasia *</Label><Input value={settings.nomeFantasia} onChange={(e) => update("nomeFantasia", e.target.value)} /></div>
              <div><Label>CNPJ</Label><MaskedInput mask="cnpj" value={settings.cnpj} onValueChange={(v) => update("cnpj", v)} placeholder="00.000.000/0001-00" /></div>
              <div><Label>Inscrição Estadual</Label><Input value={settings.inscricaoEstadual} onChange={(e) => update("inscricaoEstadual", e.target.value)} /></div>
              <div><Label className="flex items-center gap-1.5"><Phone className="h-3 w-3" />Telefone</Label><MaskedInput mask="phone" value={settings.phone} onValueChange={(v) => update("phone", v)} placeholder="(00) 00000-0000" /></div>
              <div><Label className="flex items-center gap-1.5"><Mail className="h-3 w-3" />E-mail</Label><Input value={settings.email} onChange={(e) => update("email", e.target.value)} placeholder="contato@empresa.com" /></div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" />Endereço</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2"><Label>Rua / Logradouro</Label><Input value={settings.street} onChange={(e) => update("street", e.target.value)} placeholder="Rua, número, complemento" /></div>
              <div><Label>Bairro</Label><Input value={settings.neighborhood} onChange={(e) => update("neighborhood", e.target.value)} /></div>
              <div><Label>Cidade</Label><Input value={settings.city} onChange={(e) => update("city", e.target.value)} /></div>
              <div><Label>Estado</Label>
                <Select value={settings.state} onValueChange={(v) => update("state", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>CEP</Label><MaskedInput mask="cep" value={settings.cep} onValueChange={(v) => update("cep", v)} placeholder="00000-000" /></div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Logo da Empresa</CardTitle><CardDescription>Será exibida no cabeçalho dos orçamentos e documentos.</CardDescription></CardHeader>
            <CardContent>
              <FileUpload
                currentUrl={settings.logo || null}
                bucket="company-assets"
                path="logo"
                label="Clique para fazer upload ou arraste a imagem"
                hint="PNG, JPG ou SVG — até 2MB — recomendado 400×120px"
                accept="image/png,image/jpeg,image/svg+xml"
                maxSizeMB={2}
                onUploaded={(url) => update("logo", url)}
                onRemoved={() => update("logo", "")}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documentos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Printer className="h-4 w-4 text-primary" />Configurações de Orçamento</CardTitle>
              <CardDescription>Defina o que aparece nos orçamentos gerados.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div><Label>Validade padrão (dias)</Label><Input type="number" min="1" max="90" value={settings.docValidityDays} onChange={(e) => update("docValidityDays", e.target.value)} /></div>
              </div>
              <Separator />
              <div className="space-y-4">
                <h4 className="text-sm font-semibold">Exibir no cabeçalho</h4>
                {[
                  { label: "Logo da empresa", desc: "Mostra a logo no topo do documento", checked: settings.docShowLogo, field: "docShowLogo" },
                  { label: "Telefone de contato", desc: "Exibe o telefone da empresa", checked: settings.docShowPhone, field: "docShowPhone" },
                  { label: "Endereço completo", desc: "Mostra o endereço no cabeçalho", checked: settings.docShowAddress, field: "docShowAddress" },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between rounded-lg border p-3">
                    <div><p className="text-sm font-medium">{item.label}</p><p className="text-xs text-muted-foreground">{item.desc}</p></div>
                    <Switch checked={item.checked} onCheckedChange={(v) => update(item.field, v)} />
                  </div>
                ))}
              </div>
              <Separator />
              <div>
                <Label>Texto do rodapé</Label>
                <Textarea value={settings.docFooterText} onChange={(e) => update("docFooterText", e.target.value)} rows={3} placeholder="Texto exibido no rodapé dos orçamentos…" />
                <p className="text-xs text-muted-foreground mt-1">Este texto aparece ao final de cada orçamento emitido.</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Prévia do Cabeçalho</CardTitle><CardDescription>Como ficará o topo dos seus orçamentos.</CardDescription></CardHeader>
            <CardContent>
              <div className="border rounded-lg p-5 bg-background space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    {settings.docShowLogo && (settings.logo ? <img src={settings.logo} alt="Logo" className="h-8 max-w-[120px] object-contain" /> : <div className="h-8 w-24 rounded bg-muted flex items-center justify-center text-[10px] text-muted-foreground">LOGO</div>)}
                    <p className="font-bold text-sm">{settings.nomeFantasia || settings.razaoSocial}</p>
                    <p className="text-[11px] text-muted-foreground">{settings.razaoSocial}</p>
                    <p className="text-[11px] text-muted-foreground font-mono">{settings.cnpj}</p>
                  </div>
                  <div className="text-right text-[11px] text-muted-foreground space-y-0.5">
                    {settings.docShowPhone && <p>{settings.phone}</p>}
                    <p>{settings.email}</p>
                    {settings.docShowAddress && <p>{settings.street}, {settings.neighborhood}<br />{settings.city} - {settings.state}, {settings.cep}</p>}
                  </div>
                </div>
                <Separator />
                <div className="flex justify-between text-[11px]">
                  <span className="font-semibold">ORÇAMENTO Nº ORC-001</span>
                  <span className="text-muted-foreground">Válido por {settings.docValidityDays} dias</span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><QrCode className="h-4 w-4 text-primary" />QR Code PIX</CardTitle>
              <CardDescription>QR code exibido nos orçamentos para pagamento via PIX.</CardDescription>
            </CardHeader>
            <CardContent>
              <FileUpload
                currentUrl={settings.pixQrCode || null}
                bucket="company-assets"
                path="pix-qr-code"
                label="Clique para fazer upload do QR Code PIX"
                hint="PNG, JPG — até 1MB"
                accept="image/png,image/jpeg"
                maxSizeMB={1}
                onUploaded={(url) => update("pixQrCode", url)}
                onRemoved={() => update("pixQrCode", "")}
                previewClassName="h-24 w-24"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="visual" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Palette className="h-4 w-4 text-primary" />Cor Principal</CardTitle>
              <CardDescription>Cor usada nos documentos e detalhes do sistema.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                {colorOptions.map((color) => (
                  <button key={color.value} onClick={() => update("themeColor", color.value)}
                    className={`flex flex-col items-center gap-1.5 p-2.5 rounded-lg border-2 transition-all ${settings.themeColor === color.value ? "border-foreground shadow-md scale-105" : "border-transparent hover:border-border"}`}>
                    <div className="w-9 h-9 rounded-full shadow-sm relative" style={{ backgroundColor: `hsl(${color.hsl})` }}>
                      {settings.themeColor === color.value && <div className="absolute inset-0 flex items-center justify-center"><Check className="h-4 w-4 text-white drop-shadow" /></div>}
                    </div>
                    <span className="text-[10px] font-medium">{color.name}</span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-4">A cor selecionada será aplicada nos documentos gerados (orçamentos, relatórios). O tema do sistema pode ser alternado entre claro/escuro na sidebar.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Prévia da Cor</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {["Botão primário", "Badge status", "Cabeçalho doc"].map((label, i) => {
                  const selectedColor = colorOptions.find(c => c.value === settings.themeColor);
                  const hsl = selectedColor?.hsl || "152 58% 36%";
                  return (
                    <div key={label} className="rounded-lg border p-4 flex flex-col items-center gap-2">
                      {i === 0 && <div className="px-4 py-2 rounded-md text-white text-xs font-semibold" style={{ backgroundColor: `hsl(${hsl})` }}>Emitir Orçamento</div>}
                      {i === 1 && <div className="px-2.5 py-0.5 rounded-full text-white text-[10px] font-semibold" style={{ backgroundColor: `hsl(${hsl})` }}>Aprovado</div>}
                      {i === 2 && <div className="w-full h-2 rounded-full" style={{ backgroundColor: `hsl(${hsl})` }} />}
                      <span className="text-[10px] text-muted-foreground">{label}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notificacoes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Bell className="h-4 w-4 text-primary" />Preferências de Notificação</CardTitle>
              <CardDescription>Escolha quais alertas deseja receber.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: "Orçamento aprovado", desc: "Notificar quando um cliente aprovar um orçamento", checked: settings.notifBudgetApproved, field: "notifBudgetApproved", icon: FileText },
                { label: "Pagamento recebido", desc: "Notificar ao registrar um novo pagamento", checked: settings.notifPaymentReceived, field: "notifPaymentReceived", icon: Shield },
                { label: "Orçamento expirando", desc: "Alertar quando um orçamento estiver próximo da validade", checked: settings.notifBudgetExpiring, field: "notifBudgetExpiring", icon: Bell },
                { label: "Relatório semanal", desc: "Enviar resumo semanal de atividades por e-mail", checked: settings.notifWeeklyReport, field: "notifWeeklyReport", icon: Globe },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center"><item.icon className="h-4 w-4 text-primary" /></div>
                    <div><p className="text-sm font-medium">{item.label}</p><p className="text-xs text-muted-foreground">{item.desc}</p></div>
                  </div>
                  <Switch checked={item.checked} onCheckedChange={(v) => update(item.field, v)} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="admin" className="space-y-4">
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-4 flex items-center gap-3">
                <Shield className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-semibold">Painel Administrativo</p>
                  <p className="text-xs text-muted-foreground">Configurações avançadas visíveis apenas para administradores.</p>
                </div>
                <Badge className="ml-auto">Admin</Badge>
              </CardContent>
            </Card>
            {/* Admin content here */}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
