import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Save, Lock, Eye, EyeOff, Shield, Mail, User, Phone, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getInitials } from "@/lib/formatters";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrentProfile } from "@/hooks/useCurrentProfile";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { getPasswordStrength } from "@/lib/passwordStrength";
import { PasswordStrengthIndicator } from "@/components/PasswordStrengthIndicator";

export default function Profile() {
  const { user } = useAuth();
  const { data: profile, isLoading: loadingProfile } = useCurrentProfile();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const [passwordForm, setPasswordForm] = useState({ new: "", confirm: "" });
  const [showNew, setShowNew] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const strength = useMemo(() => getPasswordStrength(passwordForm.new), [passwordForm.new]);
  const passwordsMatch = passwordForm.new && passwordForm.confirm && passwordForm.new === passwordForm.confirm;

  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setPhone(profile.phone || "");
    }
  }, [profile]);

  const displayName = name || profile?.email?.split("@")[0] || "Usuário";
  const userEmail = user?.email || "";

  const handleSaveProfile = async () => {
    if (!profile) return;
    setSavingProfile(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ name, phone })
        .eq("id", profile.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["current_profile"] });
      toast.success("Perfil atualizado com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao atualizar perfil");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordForm.new) { toast.error("Informe a nova senha"); return; }
    if (passwordForm.new.length < 6) { toast.error("A nova senha deve ter pelo menos 6 caracteres"); return; }
    if (passwordForm.new !== passwordForm.confirm) { toast.error("As senhas não conferem"); return; }

    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: passwordForm.new });
      if (error) throw error;
      setPasswordForm({ new: "", confirm: "" });
      toast.success("Senha alterada com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao alterar senha");
    } finally {
      setSavingPassword(false);
    }
  };

  if (loadingProfile) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h2 className="text-2xl font-bold">Meu Perfil</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Gerencie suas informações e segurança</p>
      </div>

      {/* Profile Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informações Pessoais</CardTitle>
          <CardDescription>Edite seu nome e telefone.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center">
            <Avatar className="h-24 w-24 ring-4 ring-primary/10">
              <AvatarFallback className="bg-primary text-primary-foreground text-3xl font-bold">
                {getInitials(displayName)}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="grid gap-4">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5"><User className="h-3 w-3" />Nome</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome completo"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5"><Phone className="h-3 w-3" />Telefone</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(00) 00000-0000"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5"><Mail className="h-3 w-3" />E-mail</Label>
              <Input value={userEmail} disabled className="bg-muted" />
              <p className="text-[11px] text-muted-foreground">O e-mail não pode ser alterado.</p>
            </div>
          </div>
          <Button className="w-full" onClick={handleSaveProfile} disabled={savingProfile}>
            {savingProfile ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Salvando…</> : <><Save className="h-4 w-4 mr-2" />Salvar Alterações</>}
          </Button>
        </CardContent>
      </Card>

      {/* Change Password Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Lock className="h-4 w-4 text-primary" />Alterar Senha</CardTitle>
          <CardDescription>Defina uma nova senha para sua conta.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
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
            {passwordForm.new.length > 0 && (
              <PasswordStrengthIndicator strength={strength} />
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Confirmar Nova Senha</Label>
            <Input type="password" value={passwordForm.confirm} onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })} />
            {passwordForm.confirm && (
              <p className={`text-xs mt-1 ${passwordsMatch ? "text-primary" : "text-destructive"}`}>
                {passwordsMatch ? "✓ Senhas conferem" : "✗ Senhas não conferem"}
              </p>
            )}
          </div>
          <Button variant="outline" className="w-full" onClick={handleChangePassword} disabled={savingPassword}>
            <Lock className="h-4 w-4 mr-2" />{savingPassword ? "Alterando…" : "Alterar Senha"}
          </Button>
        </CardContent>
      </Card>

      {/* Security Info Card */}
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
