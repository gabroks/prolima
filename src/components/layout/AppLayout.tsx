import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { useUnreadNotificationCount } from "@/hooks/useNotifications";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

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

            {/* Header actions */}
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 relative"
                    onClick={() => navigate("/notificacoes")}
                  >
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary ring-2 ring-background" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="text-xs">Notificações</TooltipContent>
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
