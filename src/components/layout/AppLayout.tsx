import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Shield, User } from "lucide-react";
import { useUnreadNotificationCount } from "@/hooks/useNotifications";
import { useIsAdmin } from "@/hooks/useAdmin";
import { useCurrentProfile } from "@/hooks/useCurrentProfile";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CommandPalette } from "@/components/CommandPalette";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/formatters";

const routeNames: Record<string, string> = {
  "/": "Dashboard",
  "/clientes": "Clientes",
  "/fornecedores": "Fornecedores",
  "/materiais": "Materiais",
  "/novo-orcamento": "Novo Orçamento",
  "/orcamentos": "Orçamentos",
  "/financeiro": "Financeiro",
  "/despesas": "Despesas",
  "/relatorios": "Relatórios",
  "/configuracoes": "Configurações",
  "/backup": "Backup dos Dados",
  "/perfil": "Perfil",
  "/notificacoes": "Notificações",
};

const routeParents: Record<string, { name: string; path: string }> = {
  "/clientes": { name: "Cadastros", path: "/clientes" },
  "/fornecedores": { name: "Cadastros", path: "/fornecedores" },
  "/materiais": { name: "Cadastros", path: "/materiais" },
  "/novo-orcamento": { name: "Orçamentos", path: "/orcamentos" },
  "/orcamentos": { name: "Orçamentos", path: "/orcamentos" },
  "/financeiro": { name: "Financeiro", path: "/financeiro" },
  "/despesas": { name: "Financeiro", path: "/despesas" },
  "/relatorios": { name: "Financeiro", path: "/relatorios" },
  "/configuracoes": { name: "Sistema", path: "/configuracoes" },
  "/backup": { name: "Sistema", path: "/backup" },
};

function getPageName(pathname: string): string {
  if (routeNames[pathname]) return routeNames[pathname];
  if (pathname.startsWith("/clientes/")) return "Detalhe do Cliente";
  if (pathname.startsWith("/editar-orcamento/")) return "Editar Orçamento";
  return "Página";
}

function getParentRoute(pathname: string): { name: string; path: string } | null {
  if (pathname.startsWith("/clientes/")) return { name: "Clientes", path: "/clientes" };
  if (pathname.startsWith("/editar-orcamento/")) return { name: "Orçamentos", path: "/orcamentos" };
  return routeParents[pathname] || null;
}

export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const pageName = getPageName(location.pathname);
  const parent = getParentRoute(location.pathname);
  const { data: unreadCount = 0 } = useUnreadNotificationCount();
  const { data: isAdmin } = useIsAdmin();
  const { data: profile } = useCurrentProfile();
  const displayName = profile?.name || profile?.email?.split("@")[0] || "";

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 flex flex-col min-w-0">
          <header className="h-14 border-b flex items-center gap-3 px-4 md:px-6 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
            <SidebarTrigger />

            {/* Breadcrumb */}
            <Breadcrumb className="hidden sm:flex">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <button onClick={() => navigate("/")} className="text-xs text-muted-foreground font-medium hover:text-foreground transition-colors">
                    Pro Orçamento
                  </button>
                </BreadcrumbItem>
                {parent && (
                  <>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <button onClick={() => navigate(parent.path)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                        {parent.name}
                      </button>
                    </BreadcrumbItem>
                  </>
                )}
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-sm font-semibold">{pageName}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            {/* Mobile page name */}
            <span className="sm:hidden text-sm font-semibold">{pageName}</span>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Command Palette trigger */}
            <CommandPalette />

            {/* Header actions */}
            <div className="flex items-center gap-1.5">
              {isAdmin && (
                <Badge variant="outline" className="hidden md:inline-flex text-[10px] h-5 px-1.5 gap-1 border-primary/30 text-primary">
                  <Shield className="h-3 w-3" />
                  Admin
                </Badge>
              )}

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 relative"
                    onClick={() => navigate("/notificacoes")}
                  >
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center ring-2 ring-background">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="text-xs">Notificações</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => navigate("/perfil")}
                  >
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                        {displayName ? getInitials(displayName) : <User className="h-3.5 w-3.5" />}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="text-xs">Perfil</TooltipContent>
              </Tooltip>
            </div>
          </header>

          <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto bg-muted/30">
            <div className="animate-fade-in">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
