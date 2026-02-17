import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Outlet, useLocation } from "react-router-dom";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

const routeNames: Record<string, string> = {
  "/": "Dashboard",
  "/clientes": "Clientes",
  "/fornecedores": "Fornecedores",
  "/materiais": "Materiais",
  "/novo-orcamento": "Novo Orçamento",
  "/orcamentos": "Orçamentos",
  "/financeiro": "Financeiro",
  "/despesas": "Despesas",
  "/configuracoes": "Configurações",
  "/backup": "Backup dos Dados",
  "/perfil": "Perfil",
  "/notificacoes": "Notificações",
};

function getPageName(pathname: string): string {
  if (routeNames[pathname]) return routeNames[pathname];
  if (pathname.startsWith("/clientes/")) return "Detalhe do Cliente";
  return "Página";
}

export function AppLayout() {
  const location = useLocation();
  const pageName = getPageName(location.pathname);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 flex flex-col min-w-0">
          <header className="h-14 border-b flex items-center px-4 md:px-6 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
            <SidebarTrigger />
            <div className="ml-3 flex items-center gap-2">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <span className="text-xs text-muted-foreground font-medium">Pro Orçamento</span>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="text-sm font-semibold">{pageName}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
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
