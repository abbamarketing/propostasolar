import { Link } from "@tanstack/react-router";
import { BarChart3, FileText, Search, Settings, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

const pages = [
  { label: "Dashboard", to: "/dashboard", icon: BarChart3 },
  { label: "Propostas", to: "/propostas", icon: FileText },
  { label: "Nova proposta", to: "/propostas/nova", icon: FileText },
  { label: "Clientes", to: "/clientes", icon: Users },
  { label: "Configurações", to: "/configuracoes", icon: Settings },
] as const;

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if ((event.key === "k" || event.key === "K") && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);
  return <CommandDialog open={open} onOpenChange={setOpen}><CommandInput placeholder="Buscar no app..." /><CommandList><CommandEmpty>Nenhum resultado.</CommandEmpty><CommandGroup heading="Navegação">{pages.map((page) => { const Icon = page.icon; return <CommandItem key={page.to} onSelect={() => setOpen(false)} asChild><Link to={page.to as any}><Icon className="mr-2 h-4 w-4" />{page.label}</Link></CommandItem>; })}</CommandGroup><CommandGroup heading="Atalho"><CommandItem><Search className="mr-2 h-4 w-4" />Ctrl+K abre esta busca</CommandItem></CommandGroup></CommandList></CommandDialog>;
}
