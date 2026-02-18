import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MaskedInput } from "@/components/ui/masked-input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Save, Lock, Eye, EyeOff, Shield, Mail, User, Phone, Loader2, Clock, Calendar, KeyRound, Building2, AtSign, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { getInitials } from "@/lib/formatters";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrentProfile } from "@/hooks/useCurrentProfile";
import { useIsAdmin } from "@/hooks/useAdmin";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { getPasswordStrength } from "@/lib/passwordStrength";
import { PasswordStrengthIndicator } from "@/components/PasswordStrengthIndicator";
import { differenceInDays, isPast, isToday, format } from "date-fns";

export default function Profile() {
  const { user } = useAuth();
  const { data: profile, isLoading: loadingProfile } = useCurrentProfile();
  const { data: isAdmin } = useIsAdmin();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [username, setUsername] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const [passwordForm, setPasswordForm] = useState({ new: "", confirm: "" });
  const [showNew, setShowNew] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const strength = useMemo(() => getPasswordStrength(passwordForm.new), [passwordForm.new]);
  const passwordsMatch = passwordForm.new && passwordForm.confirm && passwordForm.new === passwordForm.confirm;

  useEffect(() => {
    if (profile) {
      const p = profile as any;
      setName(p.name || "");
      setPhone(p.phone || "");
      setCompanyName(p.company_name || "");
      setCompanyPhone(p.company_phone || "");
      setUsername(p.username || "");
    }
  }, [profile]);

  const displayName = name || profile?.email?.split("@")[0] || "Usuário";
  const userEmail = user?.email || "";
  const p = profile as any;

  const hasProfileChanges = profile && (
    name !== (profile.name || "") ||
    phone !== (profile.phone || "") ||
    companyName !== (p?.company_name || "") ||
    companyPhone !== (p?.company_phone || "") ||
    username !== (p?.username || "")
  );

  const getValidityInfo = () => {
    if (!p?.valid_until) return { label: "Ilimitado", expired: false, unlimited: true };
    const date = new Date(p.valid_until);
    const days = differenceInDays(date, new Date());
    if (isPast(date) && !isToday(date)) return { label: "Expirado", expired: true, unlimited: false };
    return { label: `${days} dia${days !== 1 ? "s" : ""} restante${days !== 1 ? "s" : ""}`, expired: false, unlimited: false };
  };

  const validity = getValidityInfo();

  const handleSaveProfile = async () => {
    if (!profile) return;
    if (!name.trim()) { toast.error("O nome é obrigatório"); return; }
    setSavingProfile(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          name: name.trim(),
          phone,
          company_name: companyName.trim(),
          company_phone: companyPhone,
          username: username.trim().toLowerCase().replace(/[^a-z0-9._-]/g, ""),
        } as any)
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
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Meu Perfil</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Gerencie suas informações e segurança</p>
        </div>
        <div className="flex items-center gap-2">
          {p?.plan_type && (
            <Badge variant="outline" className={`text-[10px] h-5 px-1.5 gap-1 ${
              p.plan_type === "trial" 
                ? "border-yellow-500/40 text-yellow-600 dark:text-yellow-400" 
                : "border-primary/30 text-primary"
            }`}>
              <CreditCard className="h-3 w-3" />
              {p.plan_type === "trial" ? "Trial" : "Premium"}
            </Badge>
          )}
          {isAdmin && (
            <Badge variant="outline" className="text-[10px] h-5 px-1.5 gap-1 border-primary/30 text-primary">
              <Shield className="h-3 w-3" />
              Admin
            </Badge>
          )}
        </div>
      </div>

      {/* Plan validity banner */}
      {p?.plan_type === "trial" && !validity.unlimited && (
        <Card className={`border ${validity.expired ? "border-destructive/40 bg-destructive/5" : "border-yellow-500/30 bg-yellow-500/5"}`}>
          <CardContent className="p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className={`h-4 w-4 ${validity.expired ? "text-destructive" : "text-yellow-600 dark:text-yellow-400"}`} />
              <span className="text-sm font-medium">
                {validity.expired ? "Seu período trial expirou" : `Trial — ${validity.label}`}
              </span>
            </div>
            {p.valid_until && (
              <span className="text-xs text-muted-foreground">
                {validity.expired ? "Expirou em" : "Válido até"} {format(new Date(p.valid_until), "dd/MM/yyyy")}
              </span>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Info Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Informações Pessoais</CardTitle>
            <CardDescription>Edite seus dados pessoais e de empresa.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center">
              <Avatar className="h-24 w-24 ring-4 ring-primary/10">
                <AvatarFallback className="bg-primary text-primary-foreground text-3xl font-bold">
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="profile-name" className="flex items-center gap-1.5"><User className="h-3 w-3" />Nome *</Label>
                <Input
                  id="profile-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome completo"
                  aria-required="true"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="profile-username" className="flex items-center gap-1.5"><AtSign className="h-3 w-3" />Usuário</Label>
                <Input
                  id="profile-username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ""))}
                  placeholder="seu.usuario"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="profile-phone" className="flex items-center gap-1.5"><Phone className="h-3 w-3" />Telefone</Label>
                <MaskedInput
                  id="profile-phone"
                  mask="phone"
                  value={phone}
                  onValueChange={setPhone}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5"><Mail className="h-3 w-3" />E-mail</Label>
                <Input value={userEmail} disabled className="bg-muted" />
              </div>
            </div>

            <Separator />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="company-name" className="flex items-center gap-1.5"><Building2 className="h-3 w-3" />Empresa</Label>
                <Input
                  id="company-name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Nome da empresa"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="company-phone" className="flex items-center gap-1.5"><Phone className="h-3 w-3" />Telefone da Empresa</Label>
                <MaskedInput
                  id="company-phone"
                  mask="phone"
                  value={companyPhone}
                  onValueChange={setCompanyPhone}
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>

            <Button className="w-full" onClick={handleSaveProfile} disabled={savingProfile || !hasProfileChanges}>
              {savingProfile ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Salvando…</>
              ) : (
                <><Save className="h-4 w-4 mr-2" />Salvar Alterações</>
              )}
              {hasProfileChanges && (
                <Badge className="ml-2 h-5 px-1.5 bg-primary-foreground text-primary text-[10px]">Pendente</Badge>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Change Password Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><KeyRound className="h-4 w-4 text-primary" />Alterar Senha</CardTitle>
            <CardDescription>Defina uma nova senha para sua conta.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="new-password">Nova Senha</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNew ? "text" : "password"}
                  value={passwordForm.new}
                  onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
                  className="pr-10"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showNew ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordForm.new.length > 0 && (
                <PasswordStrengthIndicator strength={strength} />
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
              <Input
                id="confirm-password"
                type="password"
                value={passwordForm.confirm}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                autoComplete="new-password"
              />
              {passwordForm.confirm && (
                <p className={`text-xs font-medium ${passwordsMatch ? "text-primary" : "text-destructive"}`}>
                  {passwordsMatch ? "✓ Senhas conferem" : "✗ Senhas não conferem"}
                </p>
              )}
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleChangePassword}
              disabled={savingPassword || !passwordForm.new || (!!passwordForm.confirm && !passwordsMatch)}
            >
              {savingPassword ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Alterando…</>
              ) : (
                <><Lock className="h-4 w-4 mr-2" />Alterar Senha</>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Security Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4 text-primary" />Segurança</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />Último login</span>
              <span className="text-xs font-medium">
                {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString("pt-BR") : "—"}
              </span>
            </div>
            <Separator />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />Conta criada</span>
              <span className="text-xs font-medium">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString("pt-BR") : "—"}
              </span>
            </div>
            <Separator />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />E-mail verificado</span>
              <Badge variant={user?.email_confirmed_at ? "default" : "destructive"} className="text-[10px] h-5">
                {user?.email_confirmed_at ? "Verificado" : "Pendente"}
              </Badge>
            </div>
            {p?.valid_until && (
              <>
                <Separator />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1.5"><CreditCard className="h-3.5 w-3.5" />Validade</span>
                  <span className={`text-xs font-medium ${validity.expired ? "text-destructive" : "text-primary"}`}>
                    {format(new Date(p.valid_until), "dd/MM/yyyy")}
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
