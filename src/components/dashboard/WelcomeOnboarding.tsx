import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { UserPlus, FilePlus, Package, Truck, Sparkles, ArrowRight } from "lucide-react";

interface WelcomeOnboardingProps {
  userName: string;
  hasClients: boolean;
  hasMaterials: boolean;
  hasBudgets: boolean;
  hasSuppliers: boolean;
}

const steps = [
  { key: "clients", label: "Cadastre seu primeiro cliente", icon: UserPlus, href: "/clientes", doneLabel: "Clientes cadastrados ✓" },
  { key: "suppliers", label: "Adicione um fornecedor", icon: Truck, href: "/fornecedores", doneLabel: "Fornecedores cadastrados ✓" },
  { key: "materials", label: "Cadastre materiais e preços", icon: Package, href: "/materiais", doneLabel: "Materiais cadastrados ✓" },
  { key: "budgets", label: "Crie seu primeiro orçamento", icon: FilePlus, href: "/novo-orcamento", doneLabel: "Orçamentos criados ✓" },
];

export function WelcomeOnboarding({ userName, hasClients, hasMaterials, hasBudgets, hasSuppliers }: WelcomeOnboardingProps) {
  const navigate = useNavigate();

  const doneMap: Record<string, boolean> = {
    clients: hasClients,
    suppliers: hasSuppliers,
    materials: hasMaterials,
    budgets: hasBudgets,
  };

  const completedCount = Object.values(doneMap).filter(Boolean).length;
  const progress = Math.round((completedCount / steps.length) * 100);

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-primary/5">
      <CardContent className="p-6 sm:p-8">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 rounded-xl bg-primary/10">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold">
              Bem-vindo{userName ? `, ${userName}` : ""}! 👋
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Configure seu sistema em poucos passos para começar a criar orçamentos profissionais.
            </p>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-muted-foreground font-medium">Progresso de configuração</span>
            <span className="font-semibold text-primary">{completedCount}/{steps.length}</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Steps */}
        <div className="grid gap-3 sm:grid-cols-2">
          {steps.map((step) => {
            const done = doneMap[step.key];
            return (
              <button
                key={step.key}
                onClick={() => !done && navigate(step.href)}
                disabled={done}
                className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                  done
                    ? "border-primary/20 bg-primary/5 opacity-70"
                    : "border-border hover:border-primary/40 hover:bg-primary/5 cursor-pointer"
                }`}
              >
                <div className={`p-2 rounded-lg ${done ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                  <step.icon className="h-4 w-4" />
                </div>
                <span className={`text-sm font-medium flex-1 ${done ? "text-primary" : ""}`}>
                  {done ? step.doneLabel : step.label}
                </span>
                {!done && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
