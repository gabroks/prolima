import { useState } from "react";
import {
  LayoutDashboard, Users, Truck, Package, FilePlus, FileText,
  DollarSign, Receipt, Settings, Database, LogOut, Bell, Pencil,
  ChevronDown, Shield,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarHeader, SidebarFooter, SidebarSeparator,
} from "@/components/ui/sidebar";
import { mockUser } from "@/data/mock";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const cadastroItems = [
  { title: "Clientes", url: "/clientes", icon: Users },
  { title: "Fornecedores", url: "/fornecedores", icon: Truck },
  { title: "Materiais", url: "/materiais", icon: Package },
];

const orcamentoItems = [
  { title: "Novo Orçamento", url: "/novo-orcamento", icon: FilePlus },
  { title: "Orçamentos", url: "/orcamentos", icon: FileText },
];

const financeiroItems = [
  { title: "Financeiro", url: "/financeiro", icon: DollarSign },
  { title: "Despesas", url: "/despesas", icon: Receipt },
];

const systemItems = [
  { title: "Configurações", url: "/configuracoes", icon: Settings },
  { title: "Backup dos Dados", url: "/backup", icon: Database },
];

interface MenuGroupProps {
  label: string;
  items: { title: string; url: string; icon: React.ElementType }[];
  location: ReturnType<typeof useLocation>;
  defaultOpen?: boolean;
}

function MenuGroup({ label, items, location, defaultOpen = false }: MenuGroupProps) {
  const isAnyActive = items.some(item =>
    item.url === "/" ? location.pathname === "/" : location.pathname.startsWith(item.url)
  );

  return (
    <Collapsible defaultOpen={defaultOpen || isAnyActive}>
      <SidebarGroup>
        <CollapsibleTrigger asChild>
          <SidebarGroupLabel className="cursor-pointer hover:text-sidebar-foreground transition-colors group/label">
            <span>{label}</span>
            <ChevronDown className="ml-auto h-3.5 w-3.5 transition-transform group-data-[state=open]/label:rotate-180" />
          </SidebarGroupLabel>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={item.url === "/" ? location.pathname === "/" : location.pathname.startsWith(item.url)}
                  >
                    <NavLink to={item.url} end={item.url === "/"}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
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
  const initials = mockUser.name.split(" ").map(n => n[0]).join("").slice(0, 2);

  return (
    <Sidebar>
      {/* Brand */}
      <SidebarHeader className="px-4 pt-5 pb-3">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="h-9 w-9 rounded-lg bg-sidebar-primary flex items-center justify-center shadow-lg shadow-sidebar-primary/20">
            <Shield className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h2 className="text-base font-bold text-sidebar-foreground tracking-tight">Pro Orçamento</h2>
            <p className="text-[10px] text-sidebar-foreground/40 uppercase tracking-widest font-medium">Gestão inteligente</p>
          </div>
        </div>

        {/* User card */}
        <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent/60 p-2.5 border border-sidebar-border/50">
          <Avatar className="h-9 w-9 ring-2 ring-sidebar-primary/30">
            <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate leading-tight">{mockUser.name.split(" ")[0]}</p>
            <p className="text-[11px] text-sidebar-foreground/50 truncate">{mockUser.email}</p>
          </div>
          <div className="flex gap-0.5">
            <NavLink
              to="/notificacoes"
              className="p-1.5 rounded-md hover:bg-sidebar-accent transition-colors relative"
              activeClassName="bg-sidebar-accent text-sidebar-primary"
            >
              <Bell className="h-3.5 w-3.5" />
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-sidebar-primary animate-pulse" />
            </NavLink>
            <NavLink
              to="/perfil"
              className="p-1.5 rounded-md hover:bg-sidebar-accent transition-colors"
              activeClassName="bg-sidebar-accent text-sidebar-primary"
            >
              <Pencil className="h-3.5 w-3.5" />
            </NavLink>
          </div>
        </div>

        <div className="mt-2 px-0.5">
          <Badge variant="outline" className="text-[10px] border-sidebar-primary/30 text-sidebar-primary bg-sidebar-primary/10 font-medium">
            7 dias restantes — Teste gratuito
          </Badge>
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        {/* Dashboard standalone */}
        <SidebarGroup>
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

        <MenuGroup label="Cadastros" items={cadastroItems} location={location} defaultOpen />
        <MenuGroup label="Orçamentos" items={orcamentoItems} location={location} defaultOpen />
        <MenuGroup label="Financeiro" items={financeiroItems} location={location} />

        <SidebarSeparator />

        <MenuGroup label="Sistema" items={systemItems} location={location} />
      </SidebarContent>

      <SidebarFooter className="pb-4">
        <SidebarSeparator className="mb-2" />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <button className="w-full text-sidebar-foreground/60 hover:text-destructive transition-colors">
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
