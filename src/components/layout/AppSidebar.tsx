import {
  LayoutDashboard, Users, Truck, Package, FilePlus, FileText,
  DollarSign, Receipt, Settings, Database, LogOut, Bell, Pencil,
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

const mainMenuItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Clientes", url: "/clientes", icon: Users },
  { title: "Fornecedores", url: "/fornecedores", icon: Truck },
  { title: "Materiais", url: "/materiais", icon: Package },
  { title: "Novo Orçamento", url: "/novo-orcamento", icon: FilePlus },
  { title: "Orçamentos", url: "/orcamentos", icon: FileText },
  { title: "Financeiro", url: "/financeiro", icon: DollarSign },
  { title: "Despesas", url: "/despesas", icon: Receipt },
  { title: "Configurações", url: "/configuracoes", icon: Settings },
];

const systemItems = [
  { title: "Backup dos Dados", url: "/backup", icon: Database },
];

export function AppSidebar() {
  const location = useLocation();
  const initials = mockUser.name.split(" ").map(n => n[0]).join("").slice(0, 2);

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 bg-sidebar-primary">
            <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">{mockUser.name}</p>
            <p className="text-xs text-sidebar-foreground/60 truncate">{mockUser.email}</p>
          </div>
          <div className="flex gap-1">
            <NavLink to="/notificacoes" className="p-1.5 rounded-md hover:bg-sidebar-accent transition-colors" activeClassName="bg-sidebar-accent">
              <Bell className="h-4 w-4" />
            </NavLink>
            <NavLink to="/perfil" className="p-1.5 rounded-md hover:bg-sidebar-accent transition-colors" activeClassName="bg-sidebar-accent">
              <Pencil className="h-4 w-4" />
            </NavLink>
          </div>
        </div>
        <div className="mt-2 px-1">
          <span className="text-xs text-sidebar-primary font-medium">7 dias restantes</span>
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={
                    item.url === "/" ? location.pathname === "/" : location.pathname.startsWith(item.url)
                  }>
                    <NavLink to={item.url} end={item.url === "/"}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Sistema</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {systemItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location.pathname.startsWith(item.url)}>
                    <NavLink to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <button className="w-full">
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
