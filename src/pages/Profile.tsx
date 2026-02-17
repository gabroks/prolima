import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { mockUser } from "@/data/mock";
import { Camera, Save, Lock } from "lucide-react";
import { toast } from "sonner";
import { getInitials } from "@/lib/formatters";

export default function Profile() {
  const [form, setForm] = useState({ ...mockUser });
  const [passwordForm, setPasswordForm] = useState({ current: "", new: "", confirm: "" });

  const handleSaveProfile = () => {
    if (!form.name || !form.email) { toast.error("Nome e e-mail são obrigatórios"); return; }
    toast.success("Perfil atualizado!");
  };

  const handleChangePassword = () => {
    if (!passwordForm.current || !passwordForm.new) { toast.error("Preencha todos os campos"); return; }
    if (passwordForm.new.length < 6) { toast.error("A nova senha deve ter pelo menos 6 caracteres"); return; }
    if (passwordForm.new !== passwordForm.confirm) { toast.error("As senhas não conferem"); return; }
    setPasswordForm({ current: "", new: "", confirm: "" });
    toast.success("Senha alterada com sucesso!");
  };

  return (
    <div className="space-y-6 max-w-lg">
      <h2 className="text-2xl font-bold">Meu Perfil</h2>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informações Pessoais</CardTitle>
          <CardDescription>Atualize seus dados de perfil.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center">
            <div className="relative group">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                  {getInitials(form.name)}
                </AvatarFallback>
              </Avatar>
              <button className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>

          <div className="grid gap-4">
            <div><Label>Nome Completo</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>E-mail</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Telefone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div><Label>Usuário</Label><Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></div>
            </div>
          </div>

          <Button className="w-full" onClick={handleSaveProfile}><Save className="h-4 w-4 mr-2" />Salvar Perfil</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Lock className="h-4 w-4" />Alterar Senha</CardTitle>
          <CardDescription>Para sua segurança, informe a senha atual.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div><Label>Senha Atual</Label><Input type="password" value={passwordForm.current} onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })} /></div>
          <Separator />
          <div><Label>Nova Senha</Label><Input type="password" value={passwordForm.new} onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })} /></div>
          <div><Label>Confirmar Nova Senha</Label><Input type="password" value={passwordForm.confirm} onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })} /></div>
          <Button variant="outline" className="w-full" onClick={handleChangePassword}>Alterar Senha</Button>
        </CardContent>
      </Card>
    </div>
  );
}
