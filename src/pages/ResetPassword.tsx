import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);

  useEffect(() => {
    // Check for recovery token in URL hash
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setIsRecovery(true);
    }

    // Listen for PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) { toast.error("Informe a nova senha"); return; }
    if (password.length < 6) { toast.error("A senha deve ter no mínimo 6 caracteres"); return; }
    if (password !== confirm) { toast.error("As senhas não conferem"); return; }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccess(true);
      toast.success("Senha alterada com sucesso!");
      setTimeout(() => navigate("/"), 2000);
    } catch (err: any) {
      toast.error(err.message || "Erro ao redefinir senha");
    } finally {
      setLoading(false);
    }
  };

  if (!isRecovery && !success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-muted/40">
        <div className="w-full max-w-sm text-center space-y-4">
          <div className="h-12 w-12 rounded-xl bg-destructive/10 flex items-center justify-center mx-auto">
            <Shield className="h-6 w-6 text-destructive" />
          </div>
          <h2 className="text-xl font-bold">Link inválido</h2>
          <p className="text-sm text-muted-foreground">Este link de recuperação é inválido ou já expirou.</p>
          <Button onClick={() => navigate("/login")} variant="outline">Voltar ao Login</Button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-muted/40">
        <div className="w-full max-w-sm text-center space-y-4">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-xl font-bold">Senha redefinida!</h2>
          <p className="text-sm text-muted-foreground">Você será redirecionado automaticamente…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-muted/40">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2.5 mb-8">
          <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
            <Shield className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold text-primary tracking-tight">Pro Orçamento</span>
        </div>

        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight">Redefinir senha</h2>
          <p className="text-sm text-muted-foreground mt-1">Escolha uma nova senha para sua conta</p>
        </div>

        <Card className="shadow-xl shadow-black/5 border-0">
          <CardContent className="pt-6">
            <form onSubmit={handleReset} className="space-y-5">
              <div className="space-y-2">
                <Label>Nova Senha</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 pr-10"
                    autoComplete="new-password"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Confirmar Nova Senha</Label>
                <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="h-11" autoComplete="new-password" />
                {confirm && (
                  <p className={`text-xs ${password === confirm ? "text-primary" : "text-destructive"}`}>
                    {password === confirm ? "✓ Senhas conferem" : "✗ Senhas não conferem"}
                  </p>
                )}
              </div>
              <Button type="submit" className="w-full h-11 font-semibold shadow-md shadow-primary/20" disabled={loading}>
                {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Redefinindo…</> : "Redefinir Senha"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
