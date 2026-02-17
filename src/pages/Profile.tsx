import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Save, Lock, Eye, EyeOff, Shield, Mail, User } from "lucide-react";
import { toast } from "sonner";
import { getInitials } from "@/lib/formatters";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

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
  const { user } = useAuth();
  const userEmail = user?.email || "";
  const userName = userEmail.split("@")[0] || "Usuário";

  const [passwordForm, setPasswordForm] = useState({ new: "", confirm: "" });
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);

  const strength = useMemo(() => getPasswordStrength(passwordForm.new), [passwordForm.new]);
  const passwordsMatch = passwordForm.new && passwordForm.confirm && passwordForm.new === passwordForm.confirm;

  const handleChangePassword = async () => {
    if (!passwordForm.new) { toast.error("Informe a nova senha"); return; }
    if (passwordForm.new.length < 6) { toast.error("A nova senha deve ter pelo menos 6 caracteres"); return; }
    if (passwordForm.new !== passwordForm.confirm) { toast.error("As senhas não conferem"); return; }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: passwordForm.new });
      if (error) throw error;
      setPasswordForm({ new: "", confirm: "" });
      toast.success("Senha alterada com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao alterar senha");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-lg">
      <div><h2 className="text-2xl font-bold">Meu Perfil</h2><p className="text-sm text-muted-foreground mt-0.5">Gerencie suas informações e segurança</p></div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informações da Conta</CardTitle>
          <CardDescription>Dados vinculados à sua autenticação.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center">
            <Avatar className="h-24 w-24 ring-4 ring-primary/10">
              <AvatarFallback className="bg-primary text-primary-foreground text-3xl font-bold">
                {getInitials(userName)}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="grid gap-4">
            <div>
              <Label className="flex items-center gap-1.5"><User className="h-3 w-3" />Nome</Label>
              <Input value={userName} disabled className="bg-muted" />
            </div>
            <div>
              <Label className="flex items-center gap-1.5"><Mail className="h-3 w-3" />E-mail</Label>
              <Input value={userEmail} disabled className="bg-muted" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Para alterar o e-mail, entre em contato com o administrador.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Lock className="h-4 w-4 text-primary" />Alterar Senha</CardTitle>
          <CardDescription>Defina uma nova senha para sua conta.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Nova Senha</Label>
            <div className="relative">
              <Input
                type={showNew ? "text" : "password"}
                value={passwordForm.new}
                onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
                className="pr-10"
              />
              <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {strength.label && (
              <div className="mt-2 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Força da senha</span>
                  <span className={`text-xs font-medium ${strength.value <= 25 ? "text-destructive" : strength.value <= 50 ? "text-[hsl(var(--warning))]" : strength.value <= 75 ? "text-[hsl(var(--info))]" : "text-primary"}`}>{strength.label}</span>
                </div>
                <Progress value={strength.value} className={`h-1.5 [&>div]:${strength.color}`} />
              </div>
            )}
          </div>
          <div>
            <Label>Confirmar Nova Senha</Label>
            <Input type="password" value={passwordForm.confirm} onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })} />
            {passwordForm.confirm && (
              <p className={`text-xs mt-1 ${passwordsMatch ? "text-primary" : "text-destructive"}`}>
                {passwordsMatch ? "✓ Senhas conferem" : "✗ Senhas não conferem"}
              </p>
            )}
          </div>
          <Button variant="outline" className="w-full" onClick={handleChangePassword} disabled={loading}>
            <Lock className="h-4 w-4 mr-2" />{loading ? "Alterando…" : "Alterar Senha"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4 text-primary" />Informações de Segurança</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">ID da conta</span>
            <span className="font-mono text-xs truncate max-w-[200px]">{user?.id}</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Último login</span>
            <span className="text-xs">{user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString("pt-BR") : "—"}</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Conta criada em</span>
            <span className="text-xs">{user?.created_at ? new Date(user.created_at).toLocaleDateString("pt-BR") : "—"}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
