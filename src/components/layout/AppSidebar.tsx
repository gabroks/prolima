import {
  LayoutDashboard, Users, Truck, Package, FilePlus, FileText,
  DollarSign, Receipt, Settings, Database, LogOut, Bell, Pencil,
  ChevronRight, Shield, Moon, Sun, BarChart3,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarHeader, SidebarFooter, SidebarSeparator,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";


import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { getInitials } from "@/lib/formatters";
import { useTheme } from "next-themes";
import { useAuth } from "@/contexts/AuthContext";

interface MenuItem {
  title: string;
  url: string;
  icon: React.ElementType;
  badge?: string;
}

const cadastroItems: MenuItem[] = [
  { title: "Clientes", url: "/clientes", icon: Users },
  { title: "Fornecedores", url: "/fornecedores", icon: Truck },
  { title: "Materiais", url: "/materiais", icon: Package },
];

const orcamentoItems: MenuItem[] = [
  { title: "Novo Orçamento", url: "/novo-orcamento", icon: FilePlus },
  { title: "Orçamentos", url: "/orcamentos", icon: FileText },
];

const financeiroItems: MenuItem[] = [
  { title: "Financeiro", url: "/financeiro", icon: DollarSign },
  { title: "Despesas", url: "/despesas", icon: Receipt },
  { title: "Relatórios", url: "/relatorios", icon: BarChart3 },
];

const systemItems: MenuItem[] = [
  { title: "Configurações", url: "/configuracoes", icon: Settings },
  { title: "Backup dos Dados", url: "/backup", icon: Database },
];

function isRouteActive(itemUrl: string, pathname: string) {
  return itemUrl === "/" ? pathname === "/" : pathname.startsWith(itemUrl);
}

function MenuGroup({ label, items, defaultOpen = false }: { label: string; items: MenuItem[]; defaultOpen?: boolean }) {
  const location = useLocation();
  const isAnyActive = items.some(item => isRouteActive(item.url, location.pathname));

  return (
    <Collapsible defaultOpen={defaultOpen || isAnyActive} className="group/collapsible">
      <SidebarGroup className="py-0">
        <CollapsibleTrigger asChild>
          <SidebarGroupLabel className="cursor-pointer hover:text-sidebar-foreground transition-colors select-none">
            <span>{label}</span>
            <ChevronRight className="ml-auto h-3.5 w-3.5 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </SidebarGroupLabel>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isRouteActive(item.url, location.pathname)}>
                    <NavLink to={item.url} end={item.url === "/"}>
                      <item.icon className="h-4 w-4" />
                      <span className="flex-1">{item.title}</span>
                      {item.badge && (
                        <Badge variant="outline" className="text-[9px] h-4 px-1.5 border-sidebar-primary/30 text-sidebar-primary ml-auto">
                          {item.badge}
                        </Badge>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  );
}

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const displayName = user?.email?.split("@")[0] || "Usuário";
  const displayEmail = user?.email || "usuario@email.com";
  const initials = getInitials(displayName);
  const { theme, setTheme } = useTheme();

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  return (
    <Sidebar>
      <SidebarHeader className="px-4 pt-5 pb-3">
        {/* Brand */}
        <div className="flex items-center gap-2.5 mb-4">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-sidebar-primary to-sidebar-primary/70 flex items-center justify-center shadow-lg shadow-sidebar-primary/25">
            <Shield className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-sidebar-foreground tracking-tight leading-tight">Pro Orçamento</h2>
            <p className="text-[10px] text-sidebar-foreground/40 uppercase tracking-[0.15em] font-medium">Gestão inteligente</p>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={toggleTheme}
                className="p-1.5 rounded-md hover:bg-sidebar-accent transition-colors text-sidebar-foreground/50 hover:text-sidebar-foreground"
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs">
              {theme === "dark" ? "Modo claro" : "Modo escuro"}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* User card */}
        <div
          className="flex items-center gap-2.5 rounded-lg bg-sidebar-accent/50 p-2.5 border border-sidebar-border/40 hover:bg-sidebar-accent/70 transition-colors cursor-pointer"
          onClick={() => navigate("/perfil")}
        >
          <Avatar className="h-8 w-8 ring-2 ring-sidebar-primary/25 shrink-0">
            <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-[11px] font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate leading-tight">{displayName}</p>
            <p className="text-[11px] text-sidebar-foreground/45 truncate">{displayEmail}</p>
          </div>
          <div className="flex gap-0.5 shrink-0" onClick={e => e.stopPropagation()}>
            <Tooltip>
              <TooltipTrigger asChild>
                <NavLink
                  to="/notificacoes"
                  className="p-1.5 rounded-md hover:bg-sidebar-accent transition-colors relative"
                  activeClassName="bg-sidebar-accent text-sidebar-primary"
                >
                  <Bell className="h-3.5 w-3.5" />
                  <span className="absolute top-0.5 right-0.5 h-2 w-2 rounded-full bg-sidebar-primary ring-1 ring-sidebar-background animate-pulse" />
                </NavLink>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">Notificações</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <NavLink
                  to="/perfil"
                  className="p-1.5 rounded-md hover:bg-sidebar-accent transition-colors"
                  activeClassName="bg-sidebar-accent text-sidebar-primary"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </NavLink>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">Editar perfil</TooltipContent>
            </Tooltip>
          </div>
        </div>

        <div className="mt-2.5">
          <Badge variant="outline" className="text-[10px] border-sidebar-primary/25 text-sidebar-primary bg-sidebar-primary/8 font-medium px-2 py-0.5">
            7 dias restantes — Teste gratuito
          </Badge>
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent className="px-1">
        {/* Dashboard */}
        <SidebarGroup className="py-1">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location.pathname === "/"}>
                  <NavLink to="/" end>
                    <LayoutDashboard className="h-4 w-4" />
                    <span>Dashboard</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <MenuGroup label="Cadastros" items={cadastroItems} defaultOpen />
        <MenuGroup label="Orçamentos" items={orcamentoItems} defaultOpen />
        <MenuGroup label="Financeiro" items={financeiroItems} />

        <SidebarSeparator className="my-1" />

        <MenuGroup label="Sistema" items={systemItems} />
      </SidebarContent>

      <SidebarFooter className="px-4 pb-4">
        <SidebarSeparator className="mb-2" />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <button
                className="w-full text-sidebar-foreground/50 hover:text-destructive transition-colors"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                <span>Sair do Sistema</span>
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
