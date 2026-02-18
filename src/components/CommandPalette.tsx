import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator,
} from "@/components/ui/command";
import {
  LayoutDashboard, Users, Truck, Package, FilePlus, FileText,
  DollarSign, Receipt, Settings, Database, BarChart3, Bell, User, Search,
} from "lucide-react";
import { useClients } from "@/hooks/useClients";
import { useBudgets } from "@/hooks/useBudgets";

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
  { label: "Backup", icon: Database, path: "/backup", group: "Sistema", keywords: "backup exportar dados" },
  { label: "Notificações", icon: Bell, path: "/notificacoes", group: "Sistema", keywords: "alerta aviso" },
  { label: "Perfil", icon: User, path: "/perfil", group: "Sistema", keywords: "conta usuário perfil" },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { data: clients = [] } = useClients();
  const { data: budgets = [] } = useBudgets();

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

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Buscar página, cliente ou orçamento..." />
        <CommandList>
          <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>

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
              <CommandGroup heading="Clientes recentes">
                {recentClients.map(c => (
                  <CommandItem
                    key={c.id}
                    value={`cliente ${c.name} ${c.document || ""}`}
                    onSelect={() => handleSelect(`/clientes/${c.id}`)}
                  >
                    <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>{c.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {recentBudgets.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Orçamentos recentes">
                {recentBudgets.map(b => (
                  <CommandItem
                    key={b.id}
                    value={`orçamento ${b.number} ${b.client_name}`}
                    onSelect={() => handleSelect(`/editar-orcamento/${b.id}`)}
                  >
                    <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>#{b.number} — {b.client_name}</span>
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
