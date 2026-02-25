import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard, Users, Truck, Package, FilePlus, FileText,
  DollarSign, Receipt, Settings, Database, BarChart3, Bell, User, Search,
  Plus, Zap,
} from "lucide-react";
import { useClients } from "@/hooks/useClients";
import { useBudgets } from "@/hooks/useBudgets";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useMaterials } from "@/hooks/useMaterials";
import { formatCurrency } from "@/lib/formatters";

interface NavItem {
  label: string;
  icon: React.ElementType;
  path: string;
  group: string;
  keywords?: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/", group: "Navegação", keywords: "início home painel" },
  { label: "Clientes", icon: Users, path: "/clientes", group: "Cadastros", keywords: "cliente cadastro" },
  { label: "Fornecedores", icon: Truck, path: "/fornecedores", group: "Cadastros", keywords: "fornecedor cadastro" },
  { label: "Materiais", icon: Package, path: "/materiais", group: "Cadastros", keywords: "material produto item" },
  { label: "Novo Orçamento", icon: FilePlus, path: "/novo-orcamento", group: "Orçamentos", keywords: "criar novo orçamento" },
  { label: "Orçamentos", icon: FileText, path: "/orcamentos", group: "Orçamentos", keywords: "lista orçamento" },
  { label: "Financeiro", icon: DollarSign, path: "/financeiro", group: "Financeiro", keywords: "pagamento receita" },
  { label: "Despesas", icon: Receipt, path: "/despesas", group: "Financeiro", keywords: "gasto custo" },
  { label: "Relatórios", icon: BarChart3, path: "/relatorios", group: "Financeiro", keywords: "relatório gráfico análise" },
  { label: "Configurações", icon: Settings, path: "/configuracoes", group: "Sistema", keywords: "config preferência empresa" },
  { label: "Backup", icon: Database, path: "/backup", group: "Sistema", keywords: "backup exportar dados importar" },
  { label: "Notificações", icon: Bell, path: "/notificacoes", group: "Sistema", keywords: "alerta aviso" },
  { label: "Perfil", icon: User, path: "/perfil", group: "Sistema", keywords: "conta usuário perfil senha" },
];

interface QuickAction {
  label: string;
  icon: React.ElementType;
  path: string;
  keywords: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { label: "Novo Orçamento", icon: FilePlus, path: "/novo-orcamento", keywords: "criar orçamento novo" },
  { label: "Novo Cliente", icon: Users, path: "/clientes?new=1", keywords: "criar cadastrar cliente" },
  { label: "Novo Fornecedor", icon: Truck, path: "/fornecedores?new=1", keywords: "criar cadastrar fornecedor" },
  { label: "Novo Material", icon: Package, path: "/materiais?new=1", keywords: "criar cadastrar material" },
  { label: "Nova Despesa", icon: Receipt, path: "/despesas?new=1", keywords: "criar registrar despesa gasto" },
  { label: "Novo Pagamento", icon: DollarSign, path: "/financeiro?new=1", keywords: "criar registrar pagamento receita" },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { data: clients = [] } = useClients();
  const { data: budgets = [] } = useBudgets();
  const { data: suppliers = [] } = useSuppliers();
  const { data: materials = [] } = useMaterials();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(prev => !prev);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSelect = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  const groups = useMemo(() => {
    const map = new Map<string, NavItem[]>();
    NAV_ITEMS.forEach(item => {
      const arr = map.get(item.group) || [];
      arr.push(item);
      map.set(item.group, arr);
    });
    return map;
  }, []);

  const recentClients = clients.slice(0, 5);
  const recentBudgets = budgets.slice(0, 5);
  const recentSuppliers = suppliers.filter(s => s.active).slice(0, 5);
  const recentMaterials = materials.slice(0, 5);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="hidden md:flex items-center gap-2 h-8 px-3 rounded-md border border-input bg-background text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
      >
        <Search className="h-3.5 w-3.5" />
        <span>Buscar...</span>
        <kbd className="ml-2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      {/* Mobile trigger */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden flex items-center justify-center h-9 w-9 rounded-md hover:bg-accent transition-colors"
      >
        <Search className="h-4 w-4 text-muted-foreground" />
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Buscar página, cliente, fornecedor, material ou ação..." />
        <CommandList>
          <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>

          {/* Quick Actions */}
          <CommandGroup heading="Ações rápidas">
            {QUICK_ACTIONS.map(action => (
              <CommandItem
                key={action.path}
                value={`ação ${action.label} ${action.keywords}`}
                onSelect={() => handleSelect(action.path)}
              >
                <div className="mr-2 h-5 w-5 rounded bg-primary/10 flex items-center justify-center shrink-0">
                  <Plus className="h-3 w-3 text-primary" />
                </div>
                <span>{action.label}</span>
                <Badge variant="outline" className="ml-auto text-[9px] h-4 px-1.5">Criar</Badge>
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          {Array.from(groups.entries()).map(([group, items]) => (
            <CommandGroup key={group} heading={group}>
              {items.map(item => (
                <CommandItem
                  key={item.path}
                  value={`${item.label} ${item.keywords || ""}`}
                  onSelect={() => handleSelect(item.path)}
                >
                  <item.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{item.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          ))}

          {recentClients.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading={`Clientes recentes (${clients.length})`}>
                {recentClients.map(c => (
                  <CommandItem
                    key={c.id}
                    value={`cliente ${c.name} ${c.document || ""} ${c.city || ""}`}
                    onSelect={() => handleSelect(`/clientes/${c.id}`)}
                  >
                    <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="flex-1">{c.name}</span>
                    {c.city && <span className="text-xs text-muted-foreground">{c.city}</span>}
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {recentBudgets.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading={`Orçamentos recentes (${budgets.length})`}>
                {recentBudgets.map(b => (
                  <CommandItem
                    key={b.id}
                    value={`orçamento ${b.number} ${b.client_name} ${b.status}`}
                    onSelect={() => handleSelect(`/editar-orcamento/${b.id}`)}
                  >
                    <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="flex-1">#{b.number} — {b.client_name}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">{formatCurrency(Number(b.total))}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {recentSuppliers.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading={`Fornecedores (${suppliers.filter(s => s.active).length})`}>
                {recentSuppliers.map(s => (
                  <CommandItem
                    key={s.id}
                    value={`fornecedor ${s.name} ${s.city || ""} ${s.document || ""}`}
                    onSelect={() => handleSelect("/fornecedores")}
                  >
                    <Truck className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="flex-1">{s.name}</span>
                    {s.city && <span className="text-xs text-muted-foreground">{s.city}</span>}
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {recentMaterials.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading={`Materiais (${materials.length})`}>
                {recentMaterials.map(m => (
                  <CommandItem
                    key={m.id}
                    value={`material ${m.name} ${m.category} ${m.charge_unit}`}
                    onSelect={() => handleSelect("/materiais")}
                  >
                    <Package className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="flex-1">{m.name}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">{formatCurrency(m.base_price)}/{m.charge_unit}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
