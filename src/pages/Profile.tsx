import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { mockUser } from "@/data/mock";
import { Camera, Save, Lock, Eye, EyeOff, Shield, Clock, Monitor, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { getInitials } from "@/lib/formatters";

function getPasswordStrength(pw: string): { label: string; value: number; color: string } {
  if (pw.length === 0) return { label: "", value: 0, color: "" };
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 2) return { label: "Fraca", value: 25, color: "bg-destructive" };
  if (score <= 3) return { label: "Média", value: 50, color: "bg-[hsl(var(--warning))]" };
  if (score <= 4) return { label: "Boa", value: 75, color: "bg-[hsl(var(--info))]" };
  return { label: "Forte", value: 100, color: "bg-primary" };
}

export default function Profile() {
  const [form, setForm] = useState({ ...mockUser });
  const [passwordForm, setPasswordForm] = useState({ current: "", new: "", confirm: "" });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const strength = useMemo(() => getPasswordStrength(passwordForm.new), [passwordForm.new]);
  const passwordsMatch = passwordForm.new && passwordForm.confirm && passwordForm.new === passwordForm.confirm;

  const handleSaveProfile = () => {
    if (!form.name || !form.email) { toast.error("Nome e e-mail são obrigatórios"); return; }
    setHasChanges(false);
    toast.success("Perfil atualizado!");
  };

  const handleChangePassword = () => {
    if (!passwordForm.current || !passwordForm.new) { toast.error("Preencha todos os campos"); return; }
    if (passwordForm.new.length < 6) { toast.error("A nova senha deve ter pelo menos 6 caracteres"); return; }
    if (passwordForm.new !== passwordForm.confirm) { toast.error("As senhas não conferem"); return; }
    setPasswordForm({ current: "", new: "", confirm: "" });
    toast.success("Senha alterada com sucesso!");
  };

  const updateField = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  return (
    <div className="space-y-6 max-w-lg">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Meu Perfil</h2>
        {hasChanges && (
          <Badge variant="outline" className="text-xs text-primary border-primary/30">
            Alterações pendentes
          </Badge>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informações Pessoais</CardTitle>
          <CardDescription>Atualize seus dados de perfil e foto.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center">
            <div className="relative group">
              <Avatar className="h-24 w-24 ring-4 ring-primary/10">
                <AvatarFallback className="bg-primary text-primary-foreground text-3xl font-bold">
                  {getInitials(form.name)}
                </AvatarFallback>
              </Avatar>
              <button className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="h-5 w-5 text-white" />
              </button>
              <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-primary flex items-center justify-center ring-2 ring-background">
                <Camera className="h-3 w-3 text-primary-foreground" />
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <div>
              <Label>Nome Completo *</Label>
              <Input value={form.name} onChange={(e) => updateField("name", e.target.value)} />
            </div>
            <div>
              <Label>E-mail *</Label>
              <Input type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Telefone</Label>
                <Input value={form.phone} onChange={(e) => updateField("phone", e.target.value)} />
              </div>
              <div>
                <Label>Usuário</Label>
                <Input value={form.username} onChange={(e) => updateField("username", e.target.value)} />
              </div>
            </div>
          </div>

          <Button className="w-full" onClick={handleSaveProfile} disabled={!hasChanges}>
            <Save className="h-4 w-4 mr-2" />Salvar Perfil
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="h-4 w-4 text-primary" />Alterar Senha
          </CardTitle>
          <CardDescription>Para sua segurança, informe a senha atual.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Senha Atual</Label>
            <div className="relative">
              <Input
                type={showCurrent ? "text" : "password"}
                value={passwordForm.current}
                onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Separator />

          <div>
            <Label>Nova Senha</Label>
            <div className="relative">
              <Input
                type={showNew ? "text" : "password"}
                value={passwordForm.new}
                onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {strength.label && (
              <div className="mt-2 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Força da senha</span>
                  <span className={`text-xs font-medium ${
                    strength.value <= 25 ? "text-destructive" :
                    strength.value <= 50 ? "text-[hsl(var(--warning))]" :
                    strength.value <= 75 ? "text-[hsl(var(--info))]" : "text-primary"
                  }`}>{strength.label}</span>
                </div>
                <Progress value={strength.value} className={`h-1.5 [&>div]:${strength.color}`} />
                <ul className="text-[10px] text-muted-foreground space-y-0.5 mt-1">
                  <li className={passwordForm.new.length >= 6 ? "text-primary" : ""}>• Mínimo 6 caracteres</li>
                  <li className={/[A-Z]/.test(passwordForm.new) ? "text-primary" : ""}>• Letra maiúscula</li>
                  <li className={/[0-9]/.test(passwordForm.new) ? "text-primary" : ""}>• Número</li>
                  <li className={/[^A-Za-z0-9]/.test(passwordForm.new) ? "text-primary" : ""}>• Caractere especial</li>
                </ul>
              </div>
            )}
          </div>

          <div>
            <Label>Confirmar Nova Senha</Label>
            <Input
              type="password"
              value={passwordForm.confirm}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
            />
            {passwordForm.confirm && (
              <p className={`text-xs mt-1 ${passwordsMatch ? "text-primary" : "text-destructive"}`}>
                {passwordsMatch ? "✓ Senhas conferem" : "✗ Senhas não conferem"}
              </p>
            )}
          </div>

          <Button variant="outline" className="w-full" onClick={handleChangePassword}>
            <Lock className="h-4 w-4 mr-2" />Alterar Senha
          </Button>
        </CardContent>
      </Card>

      {/* Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />Sessões Ativas
          </CardTitle>
          <CardDescription>Dispositivos conectados à sua conta.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { device: "Chrome — Windows 11", icon: Monitor, current: true, time: "Sessão atual" },
            { device: "Safari — iPhone 15", icon: Smartphone, current: false, time: "Há 2 dias" },
          ].map((s, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                  <s.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">{s.device}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{s.time}</span>
                    {s.current && <Badge variant="outline" className="text-[9px] h-4 px-1 ml-1">Atual</Badge>}
                  </div>
                </div>
              </div>
              {!s.current && (
                <Button variant="ghost" size="sm" className="text-destructive text-xs h-7">
                  Encerrar
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
