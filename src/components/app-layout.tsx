import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  BarChart3,
  BookOpen,
  ChevronDown,
  FileText,
  LogOut,
  Menu,
  Moon,
  Settings,
  SunMedium,
  User,
  Users,
  Zap,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { AppLogo } from "@/components/app-logo";
import { ProtectedRoute } from "@/components/protected-route";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", to: "/dashboard", icon: BarChart3 },
  { label: "Propostas", to: "/propostas", icon: FileText },
  { label: "Clientes", to: "/clientes", icon: Users },
  { label: "Cadastros", to: "/cadastros", icon: BookOpen },
  { label: "Tutorial", to: "/tutorial", icon: HelpCircle },
  { label: "Configurações", to: "/configuracoes", icon: Settings },
] as const;

const registerItems = ["Módulos", "Inversores", "Cidades", "Tarifas"];

type AppLayoutProps = {
  children: ReactNode;
};

export function AppLayout({ children }: AppLayoutProps) {
  const [open, setOpen] = useState(false);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex">
        <SidebarContent />
      </aside>
      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur lg:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Abrir menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 border-sidebar-border bg-sidebar p-0 text-sidebar-foreground">
              <SidebarContent onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
          <AppLogo inverse={false} />
        </header>
        <main>{children}</main>
      </div>
      </div>
    </ProtectedRoute>
  );
}

type SidebarContentProps = {
  onNavigate?: () => void;
};

function SidebarContent({ onNavigate }: SidebarContentProps) {
  const location = useLocation();

  return (
    <div className="flex h-full w-full flex-col p-5">
      <div className="mb-8">
        <AppLogo />
      </div>
      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.to === "/dashboard" ? location.pathname === "/" || location.pathname === "/dashboard" : location.pathname.startsWith(item.to);
          return (
            <div key={item.label}>
              <Button
                variant="sidebar"
                className={cn("h-11 w-full px-3", active && "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground")}
                asChild
              >
                <Link to={item.to} onClick={onNavigate}>
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                  {item.label === "Cadastros" ? <ChevronDown className="ml-auto h-4 w-4" /> : null}
                </Link>
              </Button>
              {item.label === "Cadastros" ? (
                <div className="ml-9 mt-1 flex flex-col gap-1 border-l border-sidebar-border pl-3">
                  {registerItems.map((register) => (
                    <Link
                      key={register}
                      to="/cadastros"
                      onClick={onNavigate}
                      className="rounded-lg px-2 py-1.5 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    >
                      {register}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </nav>
      <UserMenu />
    </div>
  );
}

function UserMenu() {
  const [dark, setDark] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setDark(isDark);
  }, []);

  function handleThemeChange(checked: boolean) {
    setDark(checked);
    document.documentElement.classList.toggle("dark", checked);
  }

  async function handleSignOut() {
    try {
      await signOut();
      toast.success("Sessão encerrada com sucesso.");
      navigate({ to: "/login" });
    } catch {
      toast.error("Não foi possível sair da conta.");
    }
  }

  const userEmail = user?.email ?? "usuário autenticado";
  const initials = userEmail.slice(0, 2).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="mt-5 flex w-full items-center gap-3 rounded-xl border border-sidebar-border bg-sidebar-accent/60 p-3 text-left transition-colors hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring">
          <Avatar className="h-10 w-10 border border-sidebar-border">
            <AvatarFallback className="bg-primary text-primary-foreground font-bold">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-sidebar-foreground">Vendedor</p>
            <p className="truncate text-xs text-sidebar-foreground/65">{userEmail}</p>
          </div>
          <ChevronDown className="h-4 w-4 text-sidebar-foreground/70" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Conta</DropdownMenuLabel>
        <DropdownMenuItem>
          <User className="h-4 w-4" />
          Perfil
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={(event) => event.preventDefault()} className="justify-between">
          <span className="inline-flex items-center gap-2">
            <Moon className="h-4 w-4" />
            Modo escuro
          </span>
          <Switch checked={dark} onCheckedChange={handleThemeChange} aria-label="Alternar modo escuro" />
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={handleSignOut}>
          <LogOut className="h-4 w-4" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function ConstructionPage({ title }: { title: string }) {
  return (
    <AppLayout>
      <div className="min-h-screen">
        <div className="sun-sweep solar-grid border-b bg-surface px-4 py-14 md:px-8">
          <div className="relative max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
              <Zap className="h-4 w-4" />
              Em construção
            </div>
            <h1 className="font-display text-3xl font-black tracking-normal text-foreground md:text-5xl">{title}</h1>
            <p className="mt-3 text-muted-foreground">Esta área já está roteada e será implementada nos próximos passos do SaaS.</p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
