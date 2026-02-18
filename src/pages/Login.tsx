import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Shield, Eye, EyeOff, Loader2, CheckCircle2, Users, FileText, BarChart3, Lock, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getPasswordStrength } from "@/lib/passwordStrength";
import { PasswordStrengthIndicator } from "@/components/PasswordStrengthIndicator";

const FEATURES = [
  { icon: Users, title: "Gestão de Clientes", desc: "Cadastro completo com histórico" },
  { icon: FileText, title: "Orçamentos Profissionais", desc: "Crie e envie em minutos" },
  { icon: BarChart3, title: "Relatórios Financeiros", desc: "Visão completa do seu negócio" },
  { icon: Lock, title: "Segurança Total", desc: "Dados protegidos e criptografados" },
];

export default function Login() {
  const { user, signIn, signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) { toast.error("Informe seu e-mail"); return; }
    setResetLoading(true);
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
      setResetLoading(false);
    }
  };

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

  const switchMode = () => {
    setIsSignUp(!isSignUp);
    setPassword("");
  };

  if (user) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen flex">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-[45%] bg-gradient-to-br from-primary via-primary/80 to-primary/40 flex-col justify-between p-12 text-primary-foreground">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary-foreground/15 backdrop-blur flex items-center justify-center">
            <Shield className="h-6 w-6" />
          </div>
          <span className="text-xl font-bold tracking-tight">Pro Orçamento</span>
        </div>

        <div className="space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold leading-tight tracking-tight">
              Gerencie seus<br />orçamentos com<br />
              <span className="opacity-80">inteligência.</span>
            </h1>
            <p className="text-base opacity-60 max-w-md leading-relaxed">
              Controle clientes, materiais, fornecedores e finanças em um único sistema.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {FEATURES.map(f => (
              <div key={f.title} className="rounded-xl bg-primary-foreground/8 backdrop-blur-sm border border-primary-foreground/10 p-4 space-y-2">
                <f.icon className="h-5 w-5 opacity-80" />
                <p className="text-sm font-semibold leading-tight">{f.title}</p>
                <p className="text-xs opacity-50 leading-snug">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-sm opacity-30">© {new Date().getFullYear()} Pro Orçamento. Todos os direitos reservados.</p>
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
                    autoFocus
                    aria-required="true"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-sm font-medium">Senha</Label>
                    {!isSignUp && (
                      <button
                        type="button"
                        onClick={() => { setForgotOpen(true); setResetEmail(email); setResetSent(false); }}
                        className="text-xs text-primary hover:underline font-medium"
                        aria-label="Recuperar senha esquecida"
                      >
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
                      aria-required="true"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {isSignUp && password.length > 0 && (
                    <PasswordStrengthIndicator strength={passwordStrength} />
                  )}
                </div>
                <Button type="submit" className="w-full h-11 text-sm font-semibold shadow-md shadow-primary/20 group" disabled={loading}>
                  {loading ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{isSignUp ? "Criando…" : "Entrando…"}</>
                  ) : (
                    <>{isSignUp ? "Criar conta" : "Entrar"}<ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-0.5 transition-transform" /></>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground mt-6">
            {isSignUp ? "Já tem uma conta? " : "Não tem uma conta? "}
            <button onClick={switchMode} className="text-primary font-medium hover:underline">
              {isSignUp ? "Fazer login" : "Criar conta"}
            </button>
          </p>
        </div>
      </div>

      {/* Forgot Password Dialog */}
      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent className="sm:max-w-sm">
          {resetSent ? (
            <div className="text-center space-y-3 py-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-6 w-6 text-primary" />
              </div>
              <DialogHeader>
                <DialogTitle>E-mail enviado!</DialogTitle>
                <DialogDescription>
                  Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
                </DialogDescription>
              </DialogHeader>
              <Button variant="outline" className="w-full" onClick={() => setForgotOpen(false)}>
                Voltar ao Login
              </Button>
            </div>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <DialogHeader>
                <DialogTitle>Recuperar senha</DialogTitle>
                <DialogDescription>
                  Informe seu e-mail para receber o link de recuperação.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <Label htmlFor="reset-email">E-mail</Label>
                <Input
                  id="reset-email"
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="h-11"
                  autoFocus
                />
              </div>
              <Button type="submit" className="w-full h-11 font-semibold" disabled={resetLoading}>
                {resetLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Enviando…</> : "Enviar link de recuperação"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
