import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Eye, EyeOff, Loader2, ArrowLeft } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function Login() {
  const { user, signIn, signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) { toast.error("Informe seu e-mail"); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setResetSent(true);
      toast.success("E-mail de recuperação enviado!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar e-mail");
    } finally {
      setLoading(false);
    }
  };

  // If already logged in, redirect
  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Preencha todos os campos");
      return;
    }
    if (isSignUp && password.length < 6) {
      toast.error("A senha deve ter no mínimo 6 caracteres");
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await signUp(email, password);
        if (error) {
          toast.error(error.message);
        } else {
          toast.success("Conta criada! Verifique seu e-mail para confirmar o cadastro.");
          setIsSignUp(false);
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes("Invalid login")) {
            toast.error("E-mail ou senha incorretos");
          } else if (error.message.includes("Email not confirmed")) {
            toast.error("Confirme seu e-mail antes de entrar");
          } else {
            toast.error(error.message);
          }
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-[45%] bg-gradient-to-br from-[hsl(var(--primary))] via-[hsl(160,40%,28%)] to-[hsl(160,20%,10%)] flex-col justify-between p-12 text-white">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center">
            <Shield className="h-6 w-6" />
          </div>
          <span className="text-xl font-bold tracking-tight">Pro Orçamento</span>
        </div>

        <div className="space-y-6">
          <h1 className="text-4xl font-bold leading-tight tracking-tight">
            Gerencie seus<br />orçamentos com<br />
            <span className="text-white/80">inteligência.</span>
          </h1>
          <p className="text-lg text-white/60 max-w-md leading-relaxed">
            Controle clientes, materiais, fornecedores e finanças em um único sistema pensado para o seu negócio.
          </p>
        </div>

        <p className="text-sm text-white/30">© {new Date().getFullYear()} Pro Orçamento. Todos os direitos reservados.</p>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-muted/40">
        <div className="w-full max-w-sm">
          {/* Mobile brand */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-primary tracking-tight">Pro Orçamento</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight">
              {isSignUp ? "Criar conta" : "Bem-vindo de volta"}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {isSignUp
                ? "Preencha seus dados para criar uma conta"
                : "Entre com suas credenciais para acessar o sistema"}
            </p>
          </div>

          <Card className="shadow-xl shadow-black/5 border-0">
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="h-11"
                    autoComplete="email"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-sm font-medium">Senha</Label>
                    {!isSignUp && (
                      <button type="button" onClick={() => { setForgotMode(true); setResetEmail(email); }} className="text-xs text-primary hover:underline font-medium">
                        Esqueceu a senha?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-11 pr-10"
                      autoComplete={isSignUp ? "new-password" : "current-password"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                {!isSignUp && (
                  <div className="flex items-center gap-2">
                    <Checkbox id="remember" checked={remember} onCheckedChange={(v) => setRemember(!!v)} />
                    <Label htmlFor="remember" className="text-xs text-muted-foreground cursor-pointer">Lembrar de mim</Label>
                  </div>
                )}
                <Button type="submit" className="w-full h-11 text-sm font-semibold shadow-md shadow-primary/20" disabled={loading}>
                  {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{isSignUp ? "Criando…" : "Entrando…"}</> : isSignUp ? "Criar conta" : "Entrar"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground mt-6">
            {isSignUp ? "Já tem uma conta? " : "Não tem uma conta? "}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-primary font-medium hover:underline"
            >
              {isSignUp ? "Fazer login" : "Criar conta"}
            </button>
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-6">
          <Card className="w-full max-w-sm shadow-2xl border-0">
            <CardContent className="pt-6 space-y-5">
              {resetSent ? (
                <div className="text-center space-y-3 py-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold">E-mail enviado!</h3>
                  <p className="text-sm text-muted-foreground">Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.</p>
                  <Button variant="outline" className="w-full" onClick={() => { setForgotMode(false); setResetSent(false); }}>Voltar ao Login</Button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div>
                    <h3 className="text-lg font-bold">Recuperar senha</h3>
                    <p className="text-sm text-muted-foreground mt-1">Informe seu e-mail para receber o link de recuperação.</p>
                  </div>
                  <div className="space-y-2">
                    <Label>E-mail</Label>
                    <Input type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} placeholder="seu@email.com" className="h-11" autoFocus />
                  </div>
                  <Button type="submit" className="w-full h-11 font-semibold" disabled={loading}>
                    {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Enviando…</> : "Enviar link de recuperação"}
                  </Button>
                  <Button type="button" variant="ghost" className="w-full" onClick={() => setForgotMode(false)}>
                    <ArrowLeft className="h-4 w-4 mr-2" />Voltar ao login
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
